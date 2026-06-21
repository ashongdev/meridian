import { Pool } from "pg";
import { chunkText } from "./chunk";
import { embedBatch } from "./embed";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { materials } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

// The vector store (material_chunks, pgvector) lives in a separate Postgres instance
// (Supabase) from the main app DB (materials, courses, etc. — Aurora DSQL). Status
// updates and title lookups on `materials` must go through ensureDb()/db, not this pool.
function getPool(): Pool {
  const url = process.env.VECTOR_DB_URL;
  if (!url) throw new Error("VECTOR_DB_URL required for vector storage");
  return new Pool({ connectionString: url, max: 2 });
}

// A crashed/interrupted run can leave a row wedged in "processing" forever since
// nothing else flips it to "failed" — treat it as abandoned past this age.
export const STALE_PROCESSING_MS = 10 * 60 * 1000;

async function setEmbeddingStatus(materialId: string, status: "processing" | "done" | "failed") {
  await ensureDb();
  await db.update(materials)
    .set({ embeddingStatus: status, updatedAt: new Date() })
    .where(eq(materials.id, materialId));
}

function resolveGDriveUrl(fileUrl: string): string | null {
  const match = fileUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : null;
}

async function extractText(
  fileUrl: string,
  mimeType?: string | null,
  fileBuffer?: Buffer,
): Promise<string> {
  let rawBuf: Uint8Array;
  let mime = (mimeType && mimeType.trim()) ? mimeType : "";

  if (fileBuffer) {
    // Buffer supplied directly from upload — no fetch needed
    rawBuf = new Uint8Array(fileBuffer);
    if (!mime) {
      // Detect PDF by magic bytes
      const magic = String.fromCharCode(rawBuf[0], rawBuf[1], rawBuf[2], rawBuf[3]);
      mime = magic === "%PDF" ? "application/pdf" : "text/plain";
    }
  } else {
    let url = resolveGDriveUrl(fileUrl) ?? fileUrl;
    let res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Failed to fetch material: ${res.status}`);

    // Google Drive returns an HTML "virus scan" page for large files.
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html") || contentType.includes("application/binary")) {
      const html = await res.text();
      if (html.includes("Google Drive - Virus scan warning") || html.includes("uc-download-link")) {
        const actionMatch = html.match(/action="([^"]+)"/);
        const params: Record<string, string> = {};
        for (const m of html.matchAll(/<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/g)) {
          params[m[1]] = m[2];
        }
        if (actionMatch) {
          const qs = new URLSearchParams(params).toString();
          url = `${actionMatch[1]}?${qs}`;
          res = await fetch(url, { redirect: "follow" });
          if (!res.ok) throw new Error(`Google Drive confirmed download failed: ${res.status}`);
        }
      } else if (html.trim().startsWith("<")) {
        throw new Error("URL returned an HTML page. Use a direct download link or upload the file from your device.");
      }
    }

    const serverContentType = res.headers.get("content-type") ?? "";
    if (!mime) mime = serverContentType;
    rawBuf = new Uint8Array(await res.arrayBuffer());
  }

  if (mime.includes("pdf")) {
    const magic = String.fromCharCode(rawBuf[0], rawBuf[1], rawBuf[2], rawBuf[3]);
    if (magic !== "%PDF") {
      throw new Error(
        `Content is not a PDF (got "${magic.trim() || "binary data"}"). ` +
        `Make sure you upload a PDF file, not a ZIP or other format.`
      );
    }

    const MAX_PAGES = 300;
    // pdfjs accumulates document-level caches (fonts, etc.) across getPage() calls
    // that page.cleanup() alone doesn't release — periodic doc.cleanup() keeps
    // memory bounded on long PDFs that would otherwise OOM the process.
    const CLEANUP_EVERY = 20;

    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    // pdfjs v5 needs a real worker URL — empty string causes "fake worker" setup to fail
    pdfjs.GlobalWorkerOptions.workerSrc =
      "file://" + process.cwd() + "/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs";
    const doc = await pdfjs.getDocument({ data: rawBuf, verbosity: 0 }).promise;
    const pageCount = Math.min(doc.numPages, MAX_PAGES);
    if (doc.numPages > MAX_PAGES) {
      console.warn(`[ingest] PDF has ${doc.numPages} pages — truncating to first ${MAX_PAGES}`);
    }
    const pages: string[] = [];
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as Array<{ str?: string }>)
        .map((item) => item.str ?? "")
        .join(" ");
      pages.push(pageText);
      page.cleanup();
      if (i % CLEANUP_EVERY === 0) await doc.cleanup();
    }
    await doc.destroy();
    return pages.join("\n");
  }

  // Plain text / markdown / anything else
  return new TextDecoder().decode(rawBuf);
}

export async function ingestMaterial(material: {
  id:       string;
  courseId: string;
  fileUrl:  string;
  mimeType: string | null;
  buffer?:  Buffer;
}): Promise<{ chunks: number; skipped: boolean }> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await setEmbeddingStatus(material.id, "processing");

    // Check if already ingested (idempotent)
    const { rows: existing } = await client.query(
      `SELECT COUNT(*) AS n FROM material_chunks WHERE material_id = $1`,
      [material.id]
    );
    if (Number(existing[0].n) > 0) {
      await setEmbeddingStatus(material.id, "done");
      return { chunks: Number(existing[0].n), skipped: true };
    }

    const rawText = await extractText(material.fileUrl, material.mimeType, material.buffer);
    const chunks  = chunkText(rawText);

    if (chunks.length === 0) {
      await setEmbeddingStatus(material.id, "done");
      return { chunks: 0, skipped: false };
    }

    // Embed all chunks (batched)
    const embeddings = await embedBatch(chunks);

    // Insert all chunks in a single transaction
    await client.query("BEGIN");
    for (let i = 0; i < chunks.length; i++) {
      const vec = `[${embeddings[i].join(",")}]`;
      await client.query(
        `INSERT INTO material_chunks (material_id, course_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
        [material.id, material.courseId, i, chunks[i], vec]
      );
    }
    await client.query("COMMIT");

    await setEmbeddingStatus(material.id, "done");

    return { chunks: chunks.length, skipped: false };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    await setEmbeddingStatus(material.id, "failed").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

export async function searchChunks(
  courseId: string,
  queryEmbedding: number[],
  limit = 5
): Promise<Array<{ content: string; materialId: string; materialTitle: string; similarity: number }>> {
  const pool   = getPool();
  const client = await pool.connect();

  let rows: Array<{ content: string; materialId: string; similarity: number }>;
  try {
    const vec = `[${queryEmbedding.join(",")}]`;
    ({ rows } = await client.query(
      `SELECT
         mc.content,
         mc.material_id   AS "materialId",
         1 - (mc.embedding <=> $1::vector) AS similarity
       FROM material_chunks mc
       WHERE mc.course_id = $2
         AND mc.embedding IS NOT NULL
       ORDER BY mc.embedding <=> $1::vector
       LIMIT $3`,
      [vec, courseId, limit]
    ));
  } finally {
    client.release();
    await pool.end();
  }

  if (rows.length === 0) return [];

  // Titles live in Aurora DSQL, not the pgvector store — fetch separately.
  await ensureDb();
  const materialIds = [...new Set(rows.map((r) => r.materialId))];
  const titleRows = await db
    .select({ id: materials.id, title: materials.title })
    .from(materials)
    .where(inArray(materials.id, materialIds));
  const titleById = new Map(titleRows.map((m) => [m.id, m.title]));

  return rows.map((r) => ({
    ...r,
    materialTitle: titleById.get(r.materialId) ?? "Untitled",
  }));
}

import { Pool } from "pg";
import { ingestMaterial } from "../src/lib/ai/ingest";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const pool = new Pool({ connectionString: url, max: 1 });

async function main() {
  const { rows } = await pool.query<{
    id: string; course_id: string; file_url: string; mime_type: string | null; title: string;
  }>(
    `SELECT id, course_id, file_url, mime_type, title
     FROM materials
     WHERE embedding_status IN ('pending', 'failed')
     ORDER BY created_at`
  );

  if (rows.length === 0) {
    console.log("No materials need ingesting.");
    return;
  }

  for (const m of rows) {
    console.log(`\nIngesting "${m.title}" (${m.id})...`);
    try {
      const result = await ingestMaterial({
        id:       m.id,
        courseId: m.course_id,
        fileUrl:  m.file_url,
        mimeType: m.mime_type,
      });
      console.log(`  Done: ${result.chunks} chunks (skipped=${result.skipped})`);
    } catch (err) {
      console.error(`  Failed:`, err);
    }
  }
}

main().finally(() => pool.end());

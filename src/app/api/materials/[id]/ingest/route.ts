import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { materials } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ingestMaterial, STALE_PROCESSING_MS } from "@/lib/ai/ingest";

// POST /api/materials/[id]/ingest
// Triggered fire-and-forget after upload, or manually by enrolled users.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [material] = await db
      .select({ id: materials.id, courseId: materials.courseId, fileUrl: materials.fileUrl, mimeType: materials.mimeType, embeddingStatus: materials.embeddingStatus, updatedAt: materials.updatedAt })
      .from(materials)
      .where(eq(materials.id, id))
      .limit(1);

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // A crashed/interrupted run can leave a row wedged in "processing" forever —
    // treat it as abandoned (and retryable) past STALE_PROCESSING_MS.
    const isStale = Date.now() - material.updatedAt.getTime() > STALE_PROCESSING_MS;
    if (material.embeddingStatus === "processing" && !isStale) {
      return NextResponse.json({ message: "Already processing" }, { status: 202 });
    }

    // Run ingestion (can be slow — caller should fire-and-forget)
    const result = await ingestMaterial({
      id:       material.id,
      courseId: material.courseId,
      fileUrl:  material.fileUrl,
      mimeType: material.mimeType,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[POST /api/materials/[id]/ingest]", err);
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}

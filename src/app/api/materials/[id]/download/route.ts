import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/aurora-dsql";
import { materials, courseMemberships } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/materials/[id]/download — enrollment check then redirect to file
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  try {
    const [material] = await db
      .select({ id: materials.id, courseId: materials.courseId, fileUrl: materials.fileUrl })
      .from(materials)
      .where(eq(materials.id, id))
      .limit(1);

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Verify enrollment
    const [membership] = await db.select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, material.courseId)))
      .limit(1);
    if (!membership) {
      return NextResponse.json({ error: "You must be enrolled to download materials" }, { status: 403 });
    }

    // Increment download count (fire-and-forget)
    db.update(materials)
      .set({ downloadCount: sql`${materials.downloadCount} + 1` })
      .where(eq(materials.id, id))
      .catch(() => {});

    return NextResponse.redirect(material.fileUrl);
  } catch {
    return NextResponse.json({ error: "Failed to process download" }, { status: 500 });
  }
}

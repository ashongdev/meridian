import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/aurora-dsql";
import { courses, courseMemberships, materials, users } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MATERIAL_TYPES = ["past_exam", "notes", "syllabus", "textbook_chapter", "other"] as const;

const createSchema = z.object({
  courseId:     z.string().uuid(),
  title:        z.string().min(1).max(200),
  type:         z.enum(MATERIAL_TYPES),
  academicYear: z.string().max(20).optional(),
  isAnonymous:  z.boolean().default(false),
  // Either a URL (for link-based upload) or file will come via FormData
  fileUrl:      z.string().url().optional(),
});

// GET /api/materials?courseId=&type=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const courseId = searchParams.get("courseId");
  const type     = searchParams.get("type");

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  const filters = [
    eq(materials.courseId, courseId),
    type && MATERIAL_TYPES.includes(type as typeof MATERIAL_TYPES[number])
      ? eq(materials.type, type)
      : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  try {
    const rows = await db
      .select({
        id:            materials.id,
        title:         materials.title,
        type:          materials.type,
        academicYear:  materials.academicYear,
        isVerified:    materials.isVerified,
        isAnonymous:   materials.isAnonymous,
        upvoteCount:   materials.upvoteCount,
        downloadCount: materials.downloadCount,
        fileSize:      materials.fileSize,
        mimeType:      materials.mimeType,
        createdAt:     materials.createdAt,
        uploaderId:    materials.uploaderId,
        uploaderName:  users.name,
      })
      .from(materials)
      .leftJoin(users, and(eq(users.id, materials.uploaderId), eq(materials.isAnonymous, false)))
      .where(and(...filters))
      .orderBy(desc(materials.createdAt))
      .limit(50);

    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

// POST /api/materials — upload a material (supports JSON with fileUrl or multipart)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const contentType = req.headers.get("content-type") ?? "";

  let fileUrl: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let mimeType: string | undefined;
  let sha256: string | undefined;
  let meta: z.infer<typeof createSchema>;

  if (contentType.includes("multipart/form-data")) {
    // File upload path
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    const rawMeta = {
      courseId:     formData.get("courseId"),
      title:        formData.get("title"),
      type:         formData.get("type"),
      academicYear: formData.get("academicYear") ?? undefined,
      isAnonymous:  formData.get("isAnonymous") === "true",
    };
    const parsed = createSchema.safeParse(rawMeta);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    meta = parsed.data;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      sha256   = createHash("sha256").update(buffer).digest("hex");
      fileSize = buffer.length;
      mimeType = file.type;
      fileName = file.name;

      // Check SHA-256 duplicate within course
      const [dup] = await db.select({ id: materials.id })
        .from(materials)
        .where(and(eq(materials.courseId, meta.courseId), eq(materials.sha256, sha256)))
        .limit(1);
      if (dup) {
        return NextResponse.json({ error: "This file already exists in this course", materialId: dup.id }, { status: 409 });
      }

      // Upload to Vercel Blob if token is configured
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (blobToken) {
        try {
          const { put } = await import("@vercel/blob");
          const blob = await put(`materials/${meta.courseId}/${sha256}/${fileName}`, buffer, {
            access: "public",
            token:  blobToken,
          });
          fileUrl = blob.url;
        } catch {
          return NextResponse.json({ error: "File storage unavailable" }, { status: 503 });
        }
      } else {
        return NextResponse.json(
          { error: "File upload not configured. Set BLOB_READ_WRITE_TOKEN or use fileUrl field." },
          { status: 503 }
        );
      }
    }
  } else {
    // JSON path — caller provides a fileUrl directly
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    meta    = parsed.data;
    fileUrl = parsed.data.fileUrl;
  }

  if (!fileUrl) {
    return NextResponse.json({ error: "fileUrl or file is required" }, { status: 400 });
  }

  try {
    // Verify enrollment
    const [membership] = await db.select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, meta.courseId)))
      .limit(1);
    if (!membership) {
      return NextResponse.json({ error: "You must be enrolled to upload materials" }, { status: 403 });
    }

    const [material] = await db.insert(materials)
      .values({
        courseId:     meta.courseId,
        uploaderId:   userId,
        title:        meta.title,
        type:         meta.type,
        fileUrl,
        fileSize,
        mimeType,
        sha256,
        academicYear: meta.academicYear,
        isAnonymous:  meta.isAnonymous,
      })
      .returning();

    // Increment course material count and award karma
    await Promise.all([
      db.update(courses)
        .set({ materialCount: sql`${courses.materialCount} + 1` })
        .where(eq(courses.id, meta.courseId)),
      db.update(users)
        .set({ karmaScore: sql`${users.karmaScore} + 10` })
        .where(eq(users.id, userId)),
    ]);

    return NextResponse.json({ data: material }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save material" }, { status: 500 });
  }
}

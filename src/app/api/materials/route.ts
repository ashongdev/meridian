import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { courses, courseMemberships, materials, users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MATERIAL_TYPES = ["past_exam", "notes", "syllabus", "textbook_chapter", "other"] as const;
const MAX_LIMIT = 30;

const createSchema = z.object({
  courseId:     z.string().uuid(),
  title:        z.string().min(1).max(200),
  type:         z.enum(MATERIAL_TYPES),
  academicYear: z.string().max(20).optional(),
  isAnonymous:  z.boolean().default(false),
  fileUrl:      z.string().url().optional(),
});

/**
 * GET /api/materials?courseId=&type=&cursor=&limit=
 *
 * Cursor-based pagination on createdAt DESC.
 * Returns metadata only — no file content ever in the response (Rule 4).
 */
export async function GET(req: NextRequest) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const courseId = searchParams.get("courseId");
  const type     = searchParams.get("type");
  const cursor   = searchParams.get("cursor");
  const limit    = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit") ?? "20")));

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  const typeFilter = type && MATERIAL_TYPES.includes(type as typeof MATERIAL_TYPES[number])
    ? eq(materials.type, type)
    : undefined;

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
        uploaderName:  users.name,
      })
      .from(materials)
      .leftJoin(users, and(eq(users.id, materials.uploaderId), eq(materials.isAnonymous, false)))
      .where(and(
        eq(materials.courseId, courseId),
        typeFilter,
        cursor ? lt(materials.createdAt, new Date(cursor)) : undefined,
      ))
      .orderBy(desc(materials.createdAt))
      .limit(limit + 1);

    const hasMore    = rows.length > limit;
    const pageItems  = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({ data: pageItems, meta: { nextCursor, hasMore } });
  } catch (err) {
    console.error("[GET /api/materials]", err);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

/**
 * POST /api/materials
 * Auth + enrollment required. Awards +10 karma as a background side-effect.
 * Supports multipart (file) or JSON (fileUrl). Never returns file content.
 */
export async function POST(req: NextRequest) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { limited, retryAfter } = rateLimit(`upload:${userId}`, 5, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many uploads — try again later" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const contentType = req.headers.get("content-type") ?? "";

  let fileUrl: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let mimeType: string | undefined;
  let sha256: string | undefined;
  let meta: z.infer<typeof createSchema>;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;

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

      // SHA-256 duplicate check within course
      const [dup] = await db.select({ id: materials.id })
        .from(materials)
        .where(and(eq(materials.courseId, meta.courseId), eq(materials.sha256, sha256)))
        .limit(1);
      if (dup) {
        return NextResponse.json({ error: "This file already exists in this course", materialId: dup.id }, { status: 409 });
      }

      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (!blobToken) {
        return NextResponse.json(
          { error: "File upload unavailable. Use fileUrl field to link an existing file." },
          { status: 503 }
        );
      }
      try {
        const { put } = await import("@vercel/blob");
        const blob = await put(`materials/${meta.courseId}/${sha256}/${fileName}`, buffer, {
          access: "public",
          token:  blobToken,
        });
        fileUrl = blob.url;
      } catch (err) {
        console.error("[POST /api/materials] blob upload failed:", err);
        return NextResponse.json({ error: "File storage unavailable" }, { status: 503 });
      }
    }
  } else {
    const body   = await req.json().catch(() => null);
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

    // Side effects fire-and-forget — do not block the response
    Promise.all([
      db.update(courses)
        .set({ materialCount: sql`${courses.materialCount} + 1` })
        .where(eq(courses.id, meta.courseId)),
      db.update(users)
        .set({ karmaScore: sql`${users.karmaScore} + 10` })
        .where(eq(users.id, userId)),
    ]).catch((err) => console.error("[POST /api/materials] side-effects failed:", err));

    return NextResponse.json({ data: material }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/materials]", err);
    return NextResponse.json({ error: "Failed to save material" }, { status: 500 });
  }
}

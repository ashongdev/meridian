import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { studyGroups, studyGroupMembers, courseMemberships, users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  courseId:    z.string().uuid(),
  name:        z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  maxSize:     z.number().int().min(2).max(50).default(8),
  scheduledAt: z.string().datetime().optional(),
});

// GET /api/study-groups?courseId=
export async function GET(req: NextRequest) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  try {
    const groups = await db
      .select({
        id: studyGroups.id, name: studyGroups.name, description: studyGroups.description,
        maxSize: studyGroups.maxSize, memberCount: studyGroups.memberCount,
        scheduledAt: studyGroups.scheduledAt, createdAt: studyGroups.createdAt,
        createdBy: studyGroups.createdBy, creatorName: users.name,
      })
      .from(studyGroups)
      .leftJoin(users, eq(users.id, studyGroups.createdBy))
      .where(eq(studyGroups.courseId, courseId))
      .orderBy(desc(studyGroups.createdAt));

    return NextResponse.json({ data: groups });
  } catch (err) {
    console.error("[GET /api/study-groups]", err);
    return NextResponse.json({ error: "Failed to fetch study groups" }, { status: 500 });
  }
}

/**
 * POST /api/study-groups
 * Auth required. Must be enrolled in the course. Creator is auto-added as the first member.
 */
export async function POST(req: NextRequest) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { limited, retryAfter } = rateLimit(`group-create:${userId}`, 5, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const body   = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const { courseId, name, description, maxSize, scheduledAt } = parsed.data;

  try {
    const [membership] = await db
      .select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, courseId)))
      .limit(1);
    if (!membership) {
      return NextResponse.json({ error: "You must be enrolled to create a study group" }, { status: 403 });
    }

    const [group] = await db.insert(studyGroups)
      .values({
        courseId,
        createdBy: userId,
        name,
        description,
        maxSize,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      })
      .returning();

    await db.insert(studyGroupMembers).values({ groupId: group.id, userId, role: "admin" });

    return NextResponse.json(
      { data: { ...group, creatorName: session.user.name ?? null } },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/study-groups]", err);
    return NextResponse.json({ error: "Failed to create study group" }, { status: 500 });
  }
}

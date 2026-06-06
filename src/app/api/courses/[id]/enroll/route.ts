import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { courses, courseMemberships } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// POST /api/courses/[id]/enroll — join a course
export async function POST(_req: NextRequest, { params }: Params) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { limited, retryAfter } = rateLimit(`enroll:${userId}`, 10, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const { id: courseId } = await params;

  try {
    const [course] = await db.select({ id: courses.id })
      .from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const [existing] = await db.select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, courseId)))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    await db.insert(courseMemberships).values({ userId, courseId, role: "member" });

    // Fire-and-forget — do not block response on counter update
    db.update(courses)
      .set({ memberCount: sql`${courses.memberCount} + 1` })
      .where(eq(courses.id, courseId))
      .catch((err) => console.error("[POST /enroll] memberCount increment failed:", err));

    return NextResponse.json({ data: { enrolled: true } }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/courses/[id]/enroll]", err);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/enroll — leave a course
export async function DELETE(_req: NextRequest, { params }: Params) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const userId = session.user.id;

  try {
    const [existing] = await db.select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, courseId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 404 });
    }

    await db.delete(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, courseId)));

    // Fire-and-forget
    db.update(courses)
      .set({ memberCount: sql`greatest(${courses.memberCount} - 1, 0)` })
      .where(eq(courses.id, courseId))
      .catch((err) => console.error("[DELETE /enroll] memberCount decrement failed:", err));

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/courses/[id]/enroll]", err);
    return NextResponse.json({ error: "Failed to leave course" }, { status: 500 });
  }
}

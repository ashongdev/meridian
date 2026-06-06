import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/aurora-dsql";
import { courses, courseMemberships } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// POST /api/courses/[id]/enroll — join a course
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const userId = session.user.id;

  try {
    // Check course exists
    const [course] = await db.select({ id: courses.id })
      .from(courses).where(eq(courses.id, courseId)).limit(1);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check not already enrolled
    const [existing] = await db.select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, courseId)))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    await db.insert(courseMemberships).values({ userId, courseId, role: "member" });

    // Increment member count
    await db.update(courses)
      .set({ memberCount: sql`${courses.memberCount} + 1` })
      .where(eq(courses.id, courseId));

    return NextResponse.json({ data: { enrolled: true } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}

// DELETE /api/courses/[id]/enroll — leave a course
export async function DELETE(_req: NextRequest, { params }: Params) {
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

    await db.update(courses)
      .set({ memberCount: sql`greatest(${courses.memberCount} - 1, 0)` })
      .where(eq(courses.id, courseId));

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to leave course" }, { status: 500 });
  }
}

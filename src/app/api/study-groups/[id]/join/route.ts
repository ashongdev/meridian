import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { studyGroups, studyGroupMembers, courseMemberships } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { writeNotification } from "@/lib/db/presence";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// POST /api/study-groups/[id]/join — join a study group
export async function POST(_req: NextRequest, { params }: Params) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { limited, retryAfter } = rateLimit(`group-join:${userId}`, 20, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const { id: groupId } = await params;

  try {
    const [group] = await db
      .select({
        id: studyGroups.id, courseId: studyGroups.courseId, name: studyGroups.name,
        createdBy: studyGroups.createdBy, maxSize: studyGroups.maxSize, memberCount: studyGroups.memberCount,
      })
      .from(studyGroups)
      .where(eq(studyGroups.id, groupId))
      .limit(1);
    if (!group) {
      return NextResponse.json({ error: "Study group not found" }, { status: 404 });
    }

    const [enrolled] = await db
      .select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, group.courseId)))
      .limit(1);
    if (!enrolled) {
      return NextResponse.json({ error: "You must be enrolled in the course to join" }, { status: 403 });
    }

    const [existing] = await db
      .select({ id: studyGroupMembers.id })
      .from(studyGroupMembers)
      .where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, userId)))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    if (group.memberCount >= group.maxSize) {
      return NextResponse.json({ error: "This group is full" }, { status: 409 });
    }

    await db.insert(studyGroupMembers).values({ groupId, userId, role: "member" });
    await db.update(studyGroups)
      .set({ memberCount: sql`${studyGroups.memberCount} + 1` })
      .where(eq(studyGroups.id, groupId));

    // Fire-and-forget — notify the group creator someone joined (skip self-notify)
    if (group.createdBy !== userId) {
      writeNotification(group.createdBy, {
        type: "group_join",
        groupId,
        groupName: group.name,
        actorUserId: userId,
        actorName: session.user.name ?? "Someone",
      }).catch((err) => console.error("[POST /join] notification write failed:", err));
    }

    return NextResponse.json(
      { data: { joined: true, memberCount: group.memberCount + 1 } },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/study-groups/[id]/join]", err);
    return NextResponse.json({ error: "Failed to join study group" }, { status: 500 });
  }
}

// DELETE /api/study-groups/[id]/join — leave a study group
export async function DELETE(_req: NextRequest, { params }: Params) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: groupId } = await params;

  try {
    const [existing] = await db
      .select({ id: studyGroupMembers.id })
      .from(studyGroupMembers)
      .where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, userId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not a member" }, { status: 404 });
    }

    await db.delete(studyGroupMembers).where(eq(studyGroupMembers.id, existing.id));

    const [group] = await db.update(studyGroups)
      .set({ memberCount: sql`greatest(${studyGroups.memberCount} - 1, 0)` })
      .where(eq(studyGroups.id, groupId))
      .returning({ memberCount: studyGroups.memberCount });

    // Clean up groups left with no members
    if (group && group.memberCount === 0) {
      await db.delete(studyGroups).where(eq(studyGroups.id, groupId));
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/study-groups/[id]/join]", err);
    return NextResponse.json({ error: "Failed to leave study group" }, { status: 500 });
  }
}

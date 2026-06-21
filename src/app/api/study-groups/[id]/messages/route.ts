import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { studyGroupMembers, studyGroups, groupMessages } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { mentionsAiTutor, replyToAiMention } from "@/lib/ai/group-mention";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({
  content: z.string().min(1).max(2000),
});

// POST /api/study-groups/[id]/messages — send a chat message. Must be a group member.
export async function POST(req: NextRequest, { params }: Params) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { limited, retryAfter } = rateLimit(`group-message:${userId}`, 30, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const { id: groupId } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const [membership] = await db
      .select({ id: studyGroupMembers.id, courseId: studyGroups.courseId })
      .from(studyGroupMembers)
      .innerJoin(studyGroups, eq(studyGroups.id, studyGroupMembers.groupId))
      .where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, userId)))
      .limit(1);
    if (!membership) {
      return NextResponse.json({ error: "You must be a member of this group to send messages" }, { status: 403 });
    }

    const [message] = await db.insert(groupMessages)
      .values({ groupId, userId, content: parsed.data.content })
      .returning();

    if (mentionsAiTutor(parsed.data.content)) {
      replyToAiMention({
        groupId,
        courseId: membership.courseId,
        mentionerUserId: userId,
        isPro: session.user.isPro ?? false,
        content: parsed.data.content,
      }).catch((err) => console.error("[POST /messages] AI mention reply failed:", err));
    }

    return NextResponse.json(
      { data: { ...message, userName: session.user.name ?? null, userAvatar: session.user.image ?? null } },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/study-groups/[id]/messages]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

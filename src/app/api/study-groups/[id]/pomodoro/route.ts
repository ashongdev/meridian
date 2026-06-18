import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { studyGroupMembers } from "@/lib/db/schema";
import { queryGroupLiveState, writePomodoroState } from "@/lib/db/presence";
import { rateLimit } from "@/lib/rate-limit";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const DEFAULT_DURATION_SEC = 25 * 60;

const controlSchema = z.object({
  action:      z.enum(["start", "pause", "reset"]),
  durationSec: z.number().int().min(60).max(7200).optional(),
});

// POST /api/study-groups/[id]/pomodoro — start/pause/reset the group's shared timer.
// Last write wins — no locking. Must be a group member.
export async function POST(req: NextRequest, { params }: Params) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { limited, retryAfter } = rateLimit(`group-pomodoro:${userId}`, 10, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const { id: groupId } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = controlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  const { action, durationSec } = parsed.data;

  try {
    const [membership] = await db
      .select({ id: studyGroupMembers.id })
      .from(studyGroupMembers)
      .where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, userId)))
      .limit(1);
    if (!membership) {
      return NextResponse.json({ error: "You must be a member of this group" }, { status: 403 });
    }

    const { pomodoro: current } = await queryGroupLiveState(groupId);

    let next;
    if (action === "start") {
      const now = new Date();
      // Resume from where it was paused unless the caller explicitly chose a new duration
      const resuming = !durationSec && current?.status === "paused" && current.pausedRemainingSec != null;
      const remainingSec = resuming ? current!.pausedRemainingSec! : (durationSec ?? current?.durationSec ?? DEFAULT_DURATION_SEC);
      next = {
        status: "running" as const,
        durationSec: resuming ? current!.durationSec : remainingSec,
        startedAt: now.toISOString(),
        endsAt: new Date(now.getTime() + remainingSec * 1000).toISOString(),
        pausedRemainingSec: null,
        startedBy: userId,
      };
    } else if (action === "pause") {
      if (!current || current.status !== "running" || !current.endsAt) {
        return NextResponse.json({ error: "No running timer to pause" }, { status: 409 });
      }
      const remainingSec = Math.max(0, Math.round((new Date(current.endsAt).getTime() - Date.now()) / 1000));
      next = {
        status: "paused" as const,
        durationSec: current.durationSec,
        startedAt: current.startedAt,
        endsAt: null,
        pausedRemainingSec: remainingSec,
        startedBy: current.startedBy,
      };
    } else {
      next = {
        status: "idle" as const,
        durationSec: current?.durationSec ?? DEFAULT_DURATION_SEC,
        startedAt: null,
        endsAt: null,
        pausedRemainingSec: null,
        startedBy: null,
      };
    }

    const state = await writePomodoroState(groupId, next);
    return NextResponse.json({ data: state });
  } catch (err) {
    console.error("[POST /api/study-groups/[id]/pomodoro]", err);
    return NextResponse.json({ error: "Failed to update timer" }, { status: 500 });
  }
}

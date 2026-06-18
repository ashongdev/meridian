import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { studyGroupMembers, groupMessages, users } from "@/lib/db/schema";
import { queryGroupLiveState, writePresenceHeartbeat } from "@/lib/db/presence";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

const POLL_INTERVAL_MS = 2_500;
const INITIAL_MESSAGE_COUNT = 30;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatMessage = {
  id: string; groupId: string; userId: string;
  userName: string | null; userAvatar: string | null;
  content: string; createdAt: Date;
};

async function fetchRecentMessages(groupId: string): Promise<ChatMessage[]> {
  const rows = await db
    .select({
      id: groupMessages.id, groupId: groupMessages.groupId, userId: groupMessages.userId,
      content: groupMessages.content, createdAt: groupMessages.createdAt,
      userName: users.name, userAvatar: users.avatarUrl,
    })
    .from(groupMessages)
    .leftJoin(users, eq(users.id, groupMessages.userId))
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(desc(groupMessages.createdAt))
    .limit(INITIAL_MESSAGE_COUNT);
  return rows.reverse();
}

async function fetchNewMessages(groupId: string, since: Date): Promise<ChatMessage[]> {
  return db
    .select({
      id: groupMessages.id, groupId: groupMessages.groupId, userId: groupMessages.userId,
      content: groupMessages.content, createdAt: groupMessages.createdAt,
      userName: users.name, userAvatar: users.avatarUrl,
    })
    .from(groupMessages)
    .leftJoin(users, eq(users.id, groupMessages.userId))
    .where(and(eq(groupMessages.groupId, groupId), gt(groupMessages.createdAt, since)))
    .orderBy(asc(groupMessages.createdAt))
    .limit(50);
}

// GET /api/study-groups/[id]/live — SSE stream: presence + Pomodoro state + new chat messages
export async function GET(req: NextRequest, { params }: Params) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const user = { id: session.user.id, name: session.user.name ?? null, image: session.user.image ?? null };

  const { id: groupId } = await params;

  const [membership] = await db
    .select({ id: studyGroupMembers.id })
    .from(studyGroupMembers)
    .where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, user.id)))
    .limit(1);
  if (!membership) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller already closed (client disconnected mid-write) — ignore
        }
      };

      let lastPresenceSnapshot = "";
      let lastPomodoroUpdatedAt: string | null = null;
      let lastMessageAt = new Date(0);

      try {
        await writePresenceHeartbeat(groupId, user);

        const [{ presence, pomodoro }, recentMessages] = await Promise.all([
          queryGroupLiveState(groupId),
          fetchRecentMessages(groupId),
        ]);

        send("presence", presence);
        lastPresenceSnapshot = JSON.stringify(presence);

        if (pomodoro) {
          send("pomodoro", pomodoro);
          lastPomodoroUpdatedAt = pomodoro.updatedAt;
        }

        for (const m of recentMessages) send("message", m);
        if (recentMessages.length > 0) {
          lastMessageAt = recentMessages[recentMessages.length - 1].createdAt;
        }
      } catch (err) {
        console.error("[GET /api/study-groups/[id]/live] initial load failed:", err);
      }

      const tick = async () => {
        if (closed) return;
        try {
          await writePresenceHeartbeat(groupId, user);

          const [{ presence, pomodoro }, newMessages] = await Promise.all([
            queryGroupLiveState(groupId),
            fetchNewMessages(groupId, lastMessageAt),
          ]);

          const presenceSnapshot = JSON.stringify(presence);
          if (presenceSnapshot !== lastPresenceSnapshot) {
            send("presence", presence);
            lastPresenceSnapshot = presenceSnapshot;
          }

          if (pomodoro && pomodoro.updatedAt !== lastPomodoroUpdatedAt) {
            send("pomodoro", pomodoro);
            lastPomodoroUpdatedAt = pomodoro.updatedAt;
          }

          if (newMessages.length > 0) {
            for (const m of newMessages) send("message", m);
            lastMessageAt = newMessages[newMessages.length - 1].createdAt;
          }
        } catch (err) {
          console.error("[GET /api/study-groups/[id]/live] poll tick failed:", err);
        }
      };

      interval = setInterval(tick, POLL_INTERVAL_MS);

      req.signal.addEventListener("abort", () => {
        closed = true;
        if (interval) clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

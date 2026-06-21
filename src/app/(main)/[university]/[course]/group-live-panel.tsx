"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";

type PresenceUser = {
  userId: string; userName: string | null; userAvatar: string | null; lastSeenAt: string;
};

type PomodoroState = {
  status: "idle" | "running" | "paused";
  durationSec: number;
  startedAt: string | null;
  endsAt: string | null;
  pausedRemainingSec: number | null;
  startedBy: string | null;
  updatedAt: string;
};

type Message = {
  id: string; groupId: string; userId: string;
  userName: string | null; userAvatar: string | null;
  content: string; createdAt: string;
};

const DURATION_OPTIONS = [
  { label: "15 min", sec: 15 * 60 },
  { label: "25 min", sec: 25 * 60 },
  { label: "45 min", sec: 45 * 60 },
  { label: "60 min", sec: 60 * 60 },
];

function formatClock(totalSec: number) {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Avatar({ name, url, isAi, size = "w-8 h-8" }: { name: string | null; url: string | null; isAi?: boolean; size?: string }) {
  if (isAi) {
    return (
      <div className={`${size} rounded-full bg-teal/15 border border-teal/30 flex items-center justify-center shrink-0`}>
        <span className="text-teal text-xs">◎</span>
      </div>
    );
  }
  return (
    <div className={`${size} rounded-full bg-surface-3 border border-border flex items-center justify-center overflow-hidden shrink-0`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-ink-2 text-xs font-bold">{(name ?? "?")[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}

export function GroupLivePanel({
  groupId,
  groupName,
  currentUserId,
  onClose,
}: {
  groupId: string;
  groupName: string;
  currentUserId?: string;
  onClose?: () => void;
}) {
  const [presence, setPresence]   = useState<PresenceUser[]>([]);
  const [pomodoro, setPomodoro]   = useState<PomodoroState | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [draft, setDraft]         = useState("");
  const [sending, setSending]     = useState(false);
  const [duration, setDuration]   = useState(DURATION_OPTIONS[1].sec);
  const [runningDisplaySec, setRunningDisplaySec] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/api/study-groups/${groupId}/live`);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener("presence", (e) => setPresence(JSON.parse(e.data)));
    es.addEventListener("pomodoro", (e) => setPomodoro(JSON.parse(e.data)));
    es.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data) as Message;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => es.close();
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ticking interval only runs while the timer is actually running — this is a
  // legitimate subscription to an external clock, not a derived-value effect.
  useEffect(() => {
    if (pomodoro?.status !== "running" || !pomodoro.endsAt) return;
    const endsAt = pomodoro.endsAt;
    const tick = () => {
      const remaining = Math.round((new Date(endsAt).getTime() - Date.now()) / 1000);
      setRunningDisplaySec(Math.max(0, remaining));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pomodoro]);

  // Idle/paused values are fully derived from existing state — no effect needed
  const displaySec =
    pomodoro?.status === "running" ? runningDisplaySec :
    pomodoro?.status === "paused"  ? (pomodoro.pausedRemainingSec ?? 0) :
    duration;

  async function controlPomodoro(action: "start" | "pause" | "reset") {
    // Omit durationSec when resuming from a pause so the server keeps the remaining time
    const isResume = action === "start" && pomodoro?.status === "paused";
    await fetch(`/api/study-groups/${groupId}/pomodoro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(action === "start" && !isResume ? { durationSec: duration } : {}) }),
    });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/study-groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setMessages((prev) => [...prev, data]);
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  }

  const isRunning = pomodoro?.status === "running";
  const isPaused  = pomodoro?.status === "paused";
  const almostUp  = isRunning && displaySec <= 60;

  return (
    <div className="bg-surface-2 border border-border rounded-xl flex flex-col h-full overflow-hidden">

      {/* ── Header: group name, presence, close ─────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? "bg-teal" : "bg-coral"}`} />
          <h3 className="font-display font-semibold text-ink text-sm truncate">{groupName}</h3>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center -space-x-2">
            {presence.length === 0 ? (
              <span className="text-xs font-body text-ink-3">Just you</span>
            ) : (
              presence.slice(0, 5).map((p) => (
                <div key={p.userId} title={p.userName ?? "Student"} className="border-2 border-surface-2 rounded-full">
                  <Avatar name={p.userName} url={p.userAvatar} size="w-7 h-7" />
                </div>
              ))
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-ink-3 hover:text-ink transition-colors text-lg leading-none px-1"
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Pomodoro bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-2.5 border-b border-border bg-surface-3 shrink-0">
        <div className="flex items-center gap-3">
          <span
            className={`font-display font-extrabold text-xl tabular-nums ${
              almostUp ? "text-amber" : isRunning ? "text-teal" : isPaused ? "text-coral" : "text-ink"
            }`}
          >
            {formatClock(displaySec)}
          </span>
          {!pomodoro || pomodoro.status === "idle" ? (
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-surface-2 border border-border rounded px-2 py-1 text-ink text-xs focus:outline-none focus:border-teal/50"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.sec} value={d.sec}>{d.label}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-body text-ink-3">
              {isRunning ? "Focus session running" : "Paused"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isRunning && (
            <button
              onClick={() => controlPomodoro("start")}
              className="text-xs font-display font-bold px-3 py-1.5 rounded-full bg-teal text-paper hover:bg-teal-dim transition-colors"
            >
              {isPaused ? "Resume" : "Start"}
            </button>
          )}
          {isRunning && (
            <button
              onClick={() => controlPomodoro("pause")}
              className="text-xs font-display font-bold px-3 py-1.5 rounded-full border border-border text-ink-2 hover:border-coral/40 hover:text-coral transition-colors"
            >
              Pause
            </button>
          )}
          {pomodoro && pomodoro.status !== "idle" && (
            <button
              onClick={() => controlPomodoro("reset")}
              className="text-xs font-body text-ink-3 hover:text-ink transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Chat — fills all remaining space ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm font-body text-ink-3 text-center">No messages yet — say hi, or try <span className="text-teal">@AI</span> to ask the tutor.</p>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.userId === currentUserId;
          const isAi = m.userName === "AI Tutor";
          return (
            <div key={m.id} className={`flex gap-2 ${isMe && !isAi ? "justify-end" : "justify-start"}`}>
              {(!isMe || isAi) && <Avatar name={m.userName} url={m.userAvatar} isAi={isAi} />}
              <div className={`flex flex-col ${isMe && !isAi ? "items-end" : "items-start"} max-w-[65%]`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm font-body ${
                    isAi
                      ? "bg-teal/10 border border-teal/30 text-ink rounded-tl-sm"
                      : isMe ? "bg-teal text-paper rounded-tr-sm" : "bg-surface-3 border border-border text-ink rounded-tl-sm"
                  }`}
                >
                  {(!isMe || isAi) && (
                    <p className={`text-xs font-body font-semibold mb-1 ${isAi ? "text-teal" : "text-ink-2"}`}>
                      {m.userName ?? "Anonymous"}
                    </p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
                <span className="text-xs font-body text-ink-3 mt-1 px-1">
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                </span>
              </div>
              {isMe && !isAi && <Avatar name={m.userName} url={m.userAvatar} />}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ─────────────────────────────────────────────────────── */}
      <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 border-t border-border shrink-0">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the group… (try @AI to ask the tutor)"
          maxLength={2000}
          className="flex-1 bg-surface border border-border text-ink text-sm font-body px-4 py-3 rounded-full focus:outline-none focus:border-teal/60 placeholder:text-ink-3"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="bg-teal text-paper font-display font-bold text-sm w-11 h-11 rounded-full hover:bg-teal-dim transition-colors disabled:opacity-40 shrink-0 flex items-center justify-center"
          title="Send"
        >
          {sending ? "…" : "→"}
        </button>
      </form>
    </div>
  );
}

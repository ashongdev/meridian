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

export function GroupLivePanel({ groupId, currentUserId }: { groupId: string; currentUserId?: string }) {
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
    <div className="mt-3 bg-surface-2 border border-border rounded-xl p-4">

      {/* ── Presence ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-teal" : "bg-coral"}`} />
          <span className="text-xs font-body text-ink-3">
            {connected ? "Live" : "Reconnecting…"}
          </span>
        </div>
        <div className="flex items-center -space-x-1.5">
          {presence.length === 0 ? (
            <span className="text-xs font-body text-ink-3">No one else here yet</span>
          ) : (
            presence.map((p) => (
              <div
                key={p.userId}
                title={p.userName ?? "Student"}
                className="w-6 h-6 rounded-full border-2 border-surface-2 bg-teal/15 flex items-center justify-center overflow-hidden"
              >
                {p.userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-teal text-xs font-bold">
                    {(p.userName ?? "?")[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Pomodoro ─────────────────────────────────────────────────────── */}
      <div className="bg-surface-3 border border-border rounded-lg p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`font-display font-extrabold text-2xl tabular-nums ${
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

      {/* ── Chat ─────────────────────────────────────────────────────────── */}
      <div className="bg-surface-3 border border-border rounded-lg flex flex-col h-64">
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-xs font-body text-ink-3 text-center mt-8">No messages yet — say hi.</p>
          )}
          {messages.map((m) => {
            const isMe = m.userId === currentUserId;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm font-body ${
                    isMe ? "bg-teal/15 text-ink" : "bg-surface-2 text-ink-2"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-body font-semibold text-teal mb-0.5">
                      {m.userName ?? "Anonymous"}
                    </p>
                  )}
                  <p className="leading-relaxed">{m.content}</p>
                </div>
                <span className="text-xs font-body text-ink-3 mt-0.5">
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className="flex items-center gap-2 p-2 border-t border-border">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message the group…"
            maxLength={2000}
            className="flex-1 bg-transparent text-ink text-sm font-body px-2 py-1.5 focus:outline-none placeholder:text-ink-3"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="text-xs font-display font-bold px-3 py-1.5 rounded-full bg-teal text-paper hover:bg-teal-dim transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

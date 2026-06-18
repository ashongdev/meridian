"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  pk: string; sk: string;
  type: string; groupId: string; groupName: string;
  actorUserId: string; actorName: string;
  read: boolean; createdAt: string;
};

const POLL_INTERVAL_MS = 35_000;

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]                   = useState(false);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const { data, meta } = await res.json();
      setNotifications(data);
      setUnreadCount(meta.unreadCount);
    } catch {
      // ignore — next poll will retry
    }
  }

  useEffect(() => {
    // setState only happens after the awaited fetch resolves, not synchronously —
    // standard fetch-on-mount pattern, not the cascading-render case this rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  async function markRead(sk: string) {
    setNotifications((ns) => ns.map((n) => (n.sk === sk ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sk }),
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
        title="Notifications"
      >
        <span className="text-base leading-none">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coral" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-full mb-2 w-72 bg-surface border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-xs font-display font-semibold text-ink uppercase tracking-widest">
                Notifications
              </p>
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs font-body text-ink-3 text-center py-6">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <button
                    key={n.sk}
                    onClick={() => !n.read && markRead(n.sk)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-surface-2 ${
                      n.read ? "" : "bg-teal/5"
                    }`}
                  >
                    <p className="text-xs font-body text-ink leading-relaxed">
                      <span className="font-semibold">{n.actorName}</span> joined{" "}
                      <span className="font-semibold">{n.groupName}</span>
                    </p>
                    <p className="text-xs font-body text-ink-3 mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

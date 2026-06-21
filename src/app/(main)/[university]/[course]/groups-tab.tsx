"use client";

import { useState } from "react";
import { formatDistanceToNow, isFuture } from "date-fns";
import { GroupLivePanel } from "./group-live-panel";

type Group = {
  id: string; name: string; description: string | null;
  maxSize: number; memberCount: number; scheduledAt: Date | null;
  createdAt: Date; createdBy: string; creatorName: string | null;
};

export function GroupsTab({
  courseId,
  isEnrolled,
  userId,
  initialGroups,
  initialMemberGroupIds,
  initialOpenGroupId,
}: {
  courseId: string;
  isEnrolled: boolean;
  userId?: string;
  initialGroups: Group[];
  initialMemberGroupIds: string[];
  initialOpenGroupId?: string;
}) {
  const [groups, setGroups]   = useState<Group[]>(initialGroups);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(initialMemberGroupIds));
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId]   = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  // Only auto-open if the deep-linked group is one you're actually a member of —
  // otherwise the live panel would just 403 against the SSE route.
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(
    initialOpenGroupId && initialMemberGroupIds.includes(initialOpenGroupId) ? initialOpenGroupId : null,
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxSize, setMaxSize] = useState(8);
  const [scheduledAt, setScheduledAt] = useState("");

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/study-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          name,
          description: description || undefined,
          maxSize,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create group");
        return;
      }
      setGroups((gs) => [json.data, ...gs]);
      setMemberIds((s) => new Set(s).add(json.data.id));
      setName(""); setDescription(""); setMaxSize(8); setScheduledAt(""); setCreating(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function joinGroup(groupId: string) {
    setBusyId(groupId);
    try {
      const res = await fetch(`/api/study-groups/${groupId}/join`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setGroups((gs) => gs.map((g) => g.id === groupId ? { ...g, memberCount: json.data.memberCount } : g));
        setMemberIds((s) => new Set(s).add(groupId));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function leaveGroup(groupId: string) {
    setBusyId(groupId);
    try {
      const res = await fetch(`/api/study-groups/${groupId}/join`, { method: "DELETE" });
      if (res.ok) {
        setMemberIds((s) => { const n = new Set(s); n.delete(groupId); return n; });
        setGroups((gs) =>
          gs
            .map((g) => g.id === groupId ? { ...g, memberCount: Math.max(g.memberCount - 1, 0) } : g)
            .filter((g) => g.id !== groupId || g.memberCount > 0)
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  const expandedGroup = groups.find((g) => g.id === expandedGroupId) ?? null;

  return (
    <div className={expandedGroup ? "flex gap-6 items-start" : ""}>
    <div className={expandedGroup ? "hidden md:block w-full md:w-80 shrink-0 md:h-[calc(100vh-260px)] md:overflow-y-auto md:pr-1" : "max-w-2xl"}>

      {/* ── Create group ─────────────────────────────────────────────────── */}
      {isEnrolled && (
        <div className="mb-8">
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="w-full text-left bg-surface border border-border hover:border-teal/30 rounded-xl px-4 py-3 text-sm font-body text-ink-3 hover:text-ink-2 transition-all"
            >
              Start a study group…
            </button>
          ) : (
            <form onSubmit={createGroup} className="bg-surface border border-teal/30 rounded-xl p-5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                required
                maxLength={100}
                className="w-full bg-transparent border-b border-border text-ink text-sm font-body pb-2 mb-3 focus:outline-none focus:border-teal/50 placeholder:text-ink-3"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will you be studying? (optional)"
                rows={3}
                className="w-full bg-transparent text-ink text-sm font-body resize-none focus:outline-none placeholder:text-ink-3 mb-3"
              />
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-xs font-body text-ink-3">
                  Max size
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={maxSize}
                    onChange={(e) => setMaxSize(Number(e.target.value))}
                    className="w-16 bg-surface-2 border border-border rounded px-2 py-1 text-ink text-xs focus:outline-none focus:border-teal/50"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-body text-ink-3">
                  Scheduled for
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="bg-surface-2 border border-border rounded px-2 py-1 text-ink text-xs focus:outline-none focus:border-teal/50"
                  />
                </label>
              </div>

              {error && <p className="text-xs font-body text-coral mt-3">{error}</p>}

              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="text-xs font-body text-ink-3 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="bg-teal text-paper text-xs font-display font-bold px-4 py-2 rounded-full hover:bg-teal-dim transition-colors disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Create group"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Group list ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {groups.map((g) => {
          const isMember  = memberIds.has(g.id);
          const isCreator = g.createdBy === userId;
          const isFull    = g.memberCount >= g.maxSize;
          const scheduled = g.scheduledAt ? new Date(g.scheduledAt) : null;
          const isOpen    = expandedGroupId === g.id;

          return (
            <article
              key={g.id}
              className={`bg-surface border rounded-xl transition-colors ${expandedGroup ? "p-4" : "p-5"} ${
                isOpen ? "border-teal/40" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-semibold text-ink text-base">{g.name}</h3>
                    {isCreator && !expandedGroup && (
                      <span className="text-xs font-body text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                        You created this
                      </span>
                    )}
                  </div>
                  {g.description && !expandedGroup && (
                    <p className="font-body text-ink-2 text-sm leading-relaxed mb-2">{g.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs font-body text-ink-3 flex-wrap">
                    <span>{g.memberCount}/{g.maxSize} members</span>
                    {!expandedGroup && (
                      <>
                        <span>·</span>
                        <span>by {g.creatorName ?? "Anonymous"}</span>
                      </>
                    )}
                    {scheduled && !expandedGroup && (
                      <>
                        <span>·</span>
                        <span className={isFuture(scheduled) ? "text-amber" : ""}>
                          {isFuture(scheduled) ? "Meets " : "Met "}
                          {formatDistanceToNow(scheduled, { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isMember && (
                    <button
                      onClick={() => setExpandedGroupId(isOpen ? null : g.id)}
                      className={`text-xs font-display font-bold px-4 py-2 rounded-full border transition-colors ${
                        isOpen
                          ? "bg-teal/10 border-teal/40 text-teal"
                          : "border-teal/30 text-teal hover:bg-teal/10"
                      }`}
                    >
                      {isOpen ? "Close" : "Open"}
                    </button>
                  )}
                  {isEnrolled && !isCreator && !expandedGroup && (
                    isMember ? (
                      <button
                        onClick={() => leaveGroup(g.id)}
                        disabled={busyId === g.id}
                        className="text-xs font-display font-bold px-4 py-2 rounded-full border border-border text-ink-2 hover:border-coral/40 hover:text-coral transition-colors disabled:opacity-50"
                      >
                        {busyId === g.id ? "…" : "Leave"}
                      </button>
                    ) : (
                      <button
                        onClick={() => joinGroup(g.id)}
                        disabled={busyId === g.id || isFull}
                        className="text-xs font-display font-bold px-4 py-2 rounded-full bg-teal text-paper hover:bg-teal-dim transition-colors disabled:opacity-50"
                      >
                        {busyId === g.id ? "…" : isFull ? "Full" : "Join"}
                      </button>
                    )
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {groups.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif italic text-ink-2 text-lg mb-2">
              &ldquo;No study groups yet. Be the first to start one.&rdquo;
            </p>
            {!isEnrolled && (
              <p className="text-xs font-body text-ink-3">Join this course to create a group.</p>
            )}
          </div>
        )}
      </div>
    </div>

    {expandedGroup && (
      <div className="flex-1 min-w-0 h-[calc(100vh-260px)]">
        <GroupLivePanel
          groupId={expandedGroup.id}
          groupName={expandedGroup.name}
          currentUserId={userId}
          onClose={() => setExpandedGroupId(null)}
        />
      </div>
    )}
    </div>
  );
}

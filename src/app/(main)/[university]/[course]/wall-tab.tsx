"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

type Post = {
  id: string; type: string; title: string | null; content: string;
  isPinned: boolean; upvoteCount: number; commentCount: number;
  createdAt: Date; authorId: string | null;
  authorName: string | null; authorAvatar: string | null;
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  question:     { label: "Question",     color: "text-amber bg-amber/10" },
  discussion:   { label: "Discussion",   color: "text-teal bg-teal/10" },
  resource:     { label: "Resource",     color: "text-coral bg-coral/10" },
  announcement: { label: "Announcement", color: "text-ink-2 bg-surface-3" },
};

export function WallTab({
  courseId,
  isEnrolled,
  initialPosts,
}: {
  courseId:     string;
  isEnrolled:   boolean;
  initialPosts: Post[];
}) {
  const [posts, setPosts]     = useState<Post[]>(initialPosts);
  const [voted, setVoted]     = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [type, setType]       = useState("discussion");
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, type, title: title || undefined, content }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setPosts([data, ...posts]);
        setTitle(""); setContent(""); setCreating(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(postId: string) {
    const res = await fetch(`/api/posts/${postId}/vote`, { method: "POST" });
    if (res.ok) {
      const { data } = await res.json();
      setPosts((ps) => ps.map((p) => p.id === postId ? { ...p, upvoteCount: data.count } : p));
      setVoted((s) => {
        const n = new Set(s);
        data.voted ? n.add(postId) : n.delete(postId);
        return n;
      });
    }
  }

  return (
    <div className="max-w-2xl">

      {/* ── Create post ─────────────────────────────────────────────────── */}
      {isEnrolled && (
        <div className="mb-8">
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="w-full text-left bg-surface border border-border hover:border-teal/30 rounded-xl px-4 py-3 text-sm font-body text-ink-3 hover:text-ink-2 transition-all"
            >
              Share something with your classmates…
            </button>
          ) : (
            <form onSubmit={submitPost} className="bg-surface border border-teal/30 rounded-xl p-5">
              {/* Type selector */}
              <div className="flex gap-2 mb-4">
                {Object.entries(TYPE_LABELS).filter(([k]) => k !== "announcement").map(([k, v]) => (
                  <button
                    key={k} type="button" onClick={() => setType(k)}
                    className={`text-xs font-body px-3 py-1 rounded-full transition-colors ${
                      type === k ? `${v.color} font-semibold` : "text-ink-3 bg-surface-2 hover:text-ink"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {(type === "resource" || type === "discussion") && (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full bg-transparent border-b border-border text-ink text-sm font-body pb-2 mb-3 focus:outline-none focus:border-teal/50 placeholder:text-ink-3"
                />
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={type === "question" ? "What are you stuck on?" : "What's on your mind?"}
                rows={4}
                required
                className="w-full bg-transparent text-ink text-sm font-body resize-none focus:outline-none placeholder:text-ink-3"
              />

              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-border">
                <button
                  type="button" onClick={() => setCreating(false)}
                  className="text-xs font-body text-ink-3 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting || !content.trim()}
                  className="bg-teal text-paper text-xs font-display font-bold px-4 py-2 rounded-full hover:bg-teal-dim transition-colors disabled:opacity-50"
                >
                  {submitting ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Post list ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {posts.map((p) => {
          const meta = TYPE_LABELS[p.type] ?? TYPE_LABELS.discussion;
          const isVoted = voted.has(p.id);
          return (
            <article key={p.id} className={`bg-surface border rounded-xl p-5 transition-colors ${
              p.isPinned ? "border-teal/30" : "border-border"
            }`}>
              <div className="flex items-start gap-3">

                {/* Vote button */}
                <button
                  onClick={() => isEnrolled && vote(p.id)}
                  disabled={!isEnrolled}
                  className={`flex flex-col items-center gap-0.5 pt-0.5 min-w-[36px] transition-colors ${
                    isVoted ? "text-teal" : "text-ink-3 hover:text-ink"
                  } disabled:cursor-default`}
                >
                  <span className="text-sm leading-none">▲</span>
                  <span className="text-xs font-body font-semibold">{p.upvoteCount}</span>
                </button>

                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {p.isPinned && (
                      <span className="text-xs font-body text-teal">📌 Pinned</span>
                    )}
                    <span className={`text-xs font-body px-2 py-0.5 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs font-body text-ink-3">
                      {p.authorName ?? "Anonymous"}
                    </span>
                    <span className="text-xs font-body text-ink-3">·</span>
                    <span className="text-xs font-body text-ink-3">
                      {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {p.title && (
                    <h3 className="font-display font-semibold text-ink text-base leading-snug mb-1">
                      {p.title}
                    </h3>
                  )}
                  <p className="font-body text-ink-2 text-sm leading-relaxed line-clamp-4">
                    {p.content}
                  </p>

                  <div className="flex items-center gap-3 mt-3 text-xs font-body text-ink-3">
                    <span>{p.commentCount} comment{p.commentCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif italic text-ink-2 text-lg mb-2">
              &ldquo;Be the first to start a discussion.&rdquo;
            </p>
            {!isEnrolled && (
              <p className="text-xs font-body text-ink-3">Join this course to post.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

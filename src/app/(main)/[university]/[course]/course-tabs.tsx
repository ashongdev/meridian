"use client";

import { useState, useCallback } from "react";
import { WallTab } from "./wall-tab";
import { PapersTab } from "./papers-tab";
import { AiTab } from "./ai-tab";

type Post = {
  id: string; type: string; title: string | null; content: string;
  isPinned: boolean; upvoteCount: number; commentCount: number;
  createdAt: Date; authorId: string | null;
  authorName: string | null; authorAvatar: string | null;
};

type Material = {
  id: string; title: string; type: string; academicYear: string | null;
  isVerified: boolean; isAnonymous: boolean; upvoteCount: number;
  downloadCount: number; fileSize: number | null; createdAt: Date;
  uploaderName: string | null;
};

type Props = {
  uniSlug: string;
  courseSlug: string;
  courseId: string;
  courseCode: string;
  isEnrolled: boolean;
  initialTab: string;
  wallPosts: Post[];
  papersList: Material[];
};

const TABS = [
  { id: "wall",   label: "Wall",     glyph: "◈" },
  { id: "papers", label: "Papers",   glyph: "⊟" },
  { id: "groups", label: "Groups",   glyph: "⬡" },
  { id: "ai",     label: "AI Tutor", glyph: "◎" },
];

export function CourseTabs({
  uniSlug, courseSlug, courseId, courseCode, isEnrolled, initialTab, wallPosts, papersList,
}: Props) {
  const [activeTab, setActiveTab] = useState(initialTab || "wall");

  const switchTab = useCallback((id: string) => {
    setActiveTab(id);
    // Update URL without triggering a server re-render
    const url = `/${uniSlug}/${courseSlug}?tab=${id}`;
    window.history.replaceState(null, "", url);
  }, [uniSlug, courseSlug]);

  return (
    <>
      {/* ── Tabs ── */}
      <div className="flex gap-1 mt-6 -mb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-body font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-teal text-teal"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <span>{t.glyph}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="px-6 sm:px-10 py-8">
        {activeTab === "wall" && (
          <WallTab courseId={courseId} isEnrolled={isEnrolled} initialPosts={wallPosts} />
        )}
        {activeTab === "papers" && (
          <PapersTab courseId={courseId} isEnrolled={isEnrolled} initialMaterials={papersList} />
        )}
        {activeTab === "groups" && <ComingSoon />}
        {activeTab === "ai" && (
          <AiTab courseId={courseId} courseCode={courseCode} isEnrolled={isEnrolled} />
        )}
      </div>
    </>
  );
}

function ComingSoon() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
        <span className="text-teal text-xl">⧖</span>
      </div>
      <h3 className="font-display font-bold text-ink text-lg mb-2">Study Groups</h3>
      <p className="font-body text-ink-2 text-sm leading-relaxed">
        Form small groups, share a Pomodoro timer, and schedule sessions — coming in the next update.
      </p>
    </div>
  );
}

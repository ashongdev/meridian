"use client";

import { useState, useCallback } from "react";
import type { UIMessage } from "ai";
import { WallTab } from "./wall-tab";
import { PapersTab } from "./papers-tab";
import { AiTab } from "./ai-tab";
import { GroupsTab } from "./groups-tab";

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

type Group = {
  id: string; name: string; description: string | null;
  maxSize: number; memberCount: number; scheduledAt: Date | null;
  createdAt: Date; createdBy: string; creatorName: string | null;
};

type Props = {
  uniSlug: string;
  courseSlug: string;
  courseId: string;
  courseCode: string;
  isEnrolled: boolean;
  initialTab: string;
  userId?: string;
  wallPosts: Post[];
  papersList: Material[];
  studyGroups: Group[];
  memberGroupIds: string[];
  aiInitialMessages?: UIMessage[];
};

const TABS = [
  { id: "wall",   label: "Wall",     glyph: "◈" },
  { id: "papers", label: "Papers",   glyph: "⊟" },
  { id: "groups", label: "Groups",   glyph: "⬡" },
  { id: "ai",     label: "AI Tutor", glyph: "◎" },
];

export function CourseTabs({
  uniSlug, courseSlug, courseId, courseCode, isEnrolled, initialTab, userId,
  wallPosts, papersList, studyGroups, memberGroupIds, aiInitialMessages,
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
      <div className="bg-surface border-b border-border px-6 sm:px-10">
        <div className="flex gap-1 -mb-px">
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
      </div>

      {/* ── Tab content ── */}
      <div className="px-6 sm:px-10 py-8">
        {activeTab === "wall" && (
          <WallTab courseId={courseId} isEnrolled={isEnrolled} initialPosts={wallPosts} />
        )}
        {activeTab === "papers" && (
          <PapersTab courseId={courseId} isEnrolled={isEnrolled} initialMaterials={papersList} />
        )}
        {activeTab === "groups" && (
          <GroupsTab
            courseId={courseId}
            isEnrolled={isEnrolled}
            userId={userId}
            initialGroups={studyGroups}
            initialMemberGroupIds={memberGroupIds}
          />
        )}
        {activeTab === "ai" && (
          <AiTab
            courseId={courseId}
            courseCode={courseCode}
            isEnrolled={isEnrolled}
            initialMessages={aiInitialMessages}
          />
        )}
      </div>
    </>
  );
}

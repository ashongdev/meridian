"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StarDot } from "@/components/ui/academic-accents";

type University = { id: string; name: string; slug: string; country: string };
type Course = {
  id: string; code: string; slug: string; title: string;
  memberCount: number; materialCount: number;
  universityId: string; uniName: string; uniSlug: string;
};

/* ── Debounced fetch with AbortController ─────────────────────────────────── */
function useDebouncedFetch<T>(
  buildUrl: (q: string) => string,
  onResult: (data: T[]) => void,
  delay = 350
) {
  const timerRef  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef  = useRef<AbortController | null>(null);

  return useCallback(
    (q: string) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        try {
          const res  = await fetch(buildUrl(q), { signal: abortRef.current.signal });
          const json = await res.json();
          onResult(json.data ?? []);
        } catch (e) {
          if ((e as Error).name !== "AbortError") console.error(e);
        }
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buildUrl, onResult, delay]
  );
}

export default function ExplorePage() {
  const [unis, setUnis]               = useState<University[]>([]);
  const [courses, setCourses]         = useState<Course[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [uniQ, setUniQ]               = useState("");
  const [courseQ, setCourseQ]         = useState("");
  const [enrolling, setEnrolling]     = useState<string | null>(null);
  const [enrolled, setEnrolled]       = useState<Set<string>>(new Set());

  const searchUnis = useDebouncedFetch<University>(
    (q) => `/api/universities?q=${encodeURIComponent(q)}&limit=30`,
    setUnis
  );

  const searchCourses = useDebouncedFetch<Course>(
    (q) => {
      const p = new URLSearchParams({ limit: "20" });
      if (selectedUni) p.set("universityId", selectedUni.id);
      if (q) p.set("q", q);
      return `/api/courses?${p}`;
    },
    setCourses
  );

  // Initial loads
  useEffect(() => { searchUnis(""); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { searchCourses(""); }, [selectedUni]); // eslint-disable-line react-hooks/exhaustive-deps

  async function enroll(courseId: string) {
    setEnrolling(courseId);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
      if (res.ok || res.status === 409) {
        setEnrolled((s) => new Set([...s, courseId]));
      }
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <div className="min-h-screen px-6 sm:px-10 pt-10 pb-20">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="chapter-label mb-3">Explore</div>
        <h1 className="font-display font-extrabold text-ink leading-none"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)", letterSpacing: "-0.03em" }}>
          Find your<br />
          <span className="text-teal">community.</span>
        </h1>
        <p className="font-body text-ink-2 text-sm mt-3 max-w-md">
          Browse universities and join the courses you&apos;re taking. Your classmates are already here.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

        {/* ── University column ──────────────────────────────────────────────── */}
        <div>
          <div className="chapter-label mb-4">Universities</div>
          <input
            type="search"
            value={uniQ}
            onChange={(e) => { setUniQ(e.target.value); searchUnis(e.target.value); }}
            placeholder="Search universities…"
            className="w-full bg-surface border border-border text-ink text-sm font-body px-3 py-2 rounded-lg mb-4 focus:outline-none focus:border-teal/60 placeholder:text-ink-3"
          />

          <div className="space-y-1">
            <button
              onClick={() => setSelectedUni(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-body transition-colors ${
                !selectedUni ? "bg-teal/10 text-teal" : "text-ink-2 hover:text-ink hover:bg-surface-2"
              }`}
            >
              All universities
            </button>

            {unis.map((u) => (
              <button key={u.id} onClick={() => { setSelectedUni(u); setCourseQ(""); }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedUni?.id === u.id
                    ? "bg-teal/10 text-teal"
                    : "text-ink-2 hover:text-ink hover:bg-surface-2"
                }`}
              >
                <p className="text-xs font-body font-medium">{u.name}</p>
                <p className="text-xs font-body text-ink-3">{u.country}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Courses column ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="chapter-label">{selectedUni ? selectedUni.name : "All Courses"}</div>
            <span className="text-xs font-body text-ink-3">{courses.length} courses</span>
          </div>

          <input
            type="search"
            value={courseQ}
            onChange={(e) => { setCourseQ(e.target.value); searchCourses(e.target.value); }}
            placeholder={selectedUni ? `Search ${selectedUni.name} courses…` : "Pick a university to search courses"}
            className="w-full bg-surface border border-border text-ink text-sm font-body px-3 py-2 rounded-lg mb-5 focus:outline-none focus:border-teal/60 placeholder:text-ink-3"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {courses.map((c, i) => {
              const isEnrolled = enrolled.has(c.id);
              const tilts = ["", "sm:translate-y-1", "sm:-translate-y-1"];
              return (
                <div key={c.id}
                  className={`group relative bg-surface border border-border rounded-xl p-4 transition-all hover:border-teal/30 ${tilts[i % tilts.length]}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-teal bg-teal/10 px-2 py-0.5 rounded">{c.code}</span>
                    <span className="text-xs font-body text-ink-3">{c.uniName}</span>
                  </div>
                  <p className="font-display font-semibold text-ink text-sm leading-snug line-clamp-2 mb-3">{c.title}</p>
                  <div className="flex items-center gap-3 text-xs font-body text-ink-3 mb-4">
                    <span className="flex items-center gap-1">
                      <StarDot className="w-2.5 h-2.5 text-teal" />
                      {c.memberCount.toLocaleString()} members
                    </span>
                    <span>{c.materialCount} files</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/${c.uniSlug}/${c.slug}`}
                      className="flex-1 text-center text-xs font-body text-ink-2 border border-border hover:border-teal/40 hover:text-teal px-3 py-1.5 rounded-lg transition-colors">
                      View
                    </Link>
                    <button
                      onClick={() => enroll(c.id)}
                      disabled={isEnrolled || enrolling === c.id}
                      className={`flex-1 text-xs font-body font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        isEnrolled
                          ? "bg-teal/10 text-teal border border-teal/30 cursor-default"
                          : "bg-teal text-paper hover:bg-teal-dim disabled:opacity-50"
                      }`}
                    >
                      {isEnrolled ? "Joined ✓" : enrolling === c.id ? "…" : "Join"}
                    </button>
                  </div>
                </div>
              );
            })}

            {courses.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <p className="font-serif italic text-ink-2 text-lg mb-2">&ldquo;No courses found.&rdquo;</p>
                <p className="text-xs font-body text-ink-3">
                  {selectedUni ? "Try a different search term." : "Select a university to browse its courses."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type University = { id: string; name: string; slug: string; country: string };
type Course = {
  id: string; code: string; slug: string; title: string;
  memberCount: number; uniName: string; uniSlug: string;
};

const STEPS = ["Pick your university", "Join your courses", "You&apos;re in"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]               = useState(0);
  const [unis, setUnis]               = useState<University[]>([]);
  const [courses, setCourses]         = useState<Course[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [joined, setJoined]           = useState<Set<string>>(new Set());
  const [uniQ, setUniQ]               = useState("");
  const [courseQ, setCourseQ]         = useState("");
  const [saving, setSaving]           = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    fetch("/api/universities?limit=30").then((r) => r.json()).then((j) => setUnis(j.data ?? []));
  }, []);

  function onUniSearch(q: string) {
    setUniQ(q);
    clearTimeout(debounce.current!);
    debounce.current = setTimeout(() => {
      fetch(`/api/universities?q=${encodeURIComponent(q)}&limit=30`)
        .then((r) => r.json()).then((j) => setUnis(j.data ?? []));
    }, 300);
  }

  async function selectUniversity(u: University) {
    setSelectedUni(u);
    const res = await fetch(`/api/courses?universityId=${u.id}&limit=30`);
    const json = await res.json();
    setCourses(json.data ?? []);
    setStep(1);
  }

  async function toggleJoin(courseId: string) {
    const isJoined = joined.has(courseId);
    if (isJoined) {
      setJoined((s) => { const n = new Set(s); n.delete(courseId); return n; });
      await fetch(`/api/courses/${courseId}/enroll`, { method: "DELETE" }).catch(() => {});
    } else {
      setJoined((s) => new Set([...s, courseId]));
      await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" }).catch(() => {});
    }
  }

  async function finish() {
    setSaving(true);
    try {
      if (selectedUni) {
        await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ universityId: selectedUni.id }),
        });
      }
      setStep(2);
      setTimeout(() => router.push("/dashboard"), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-6 pt-16 pb-20">
      <div className="w-full max-w-xl">

        {/* ── Progress ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step  ? "bg-teal text-paper" :
                i === step ? "bg-teal/20 text-teal border border-teal/40" :
                "bg-surface-2 text-ink-3 border border-border"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-px w-12 transition-all ${i < step ? "bg-teal/50" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0: Pick University ──────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <div className="chapter-label mb-3">Step 1 of 2</div>
            <h1 className="font-display font-extrabold text-ink mb-2"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}>
              Where do you study?
            </h1>
            <p className="font-body text-ink-2 text-sm mb-8">
              We&apos;ll show you courses and classmates from your institution.
            </p>

            <input
              type="search"
              value={uniQ}
              onChange={(e) => onUniSearch(e.target.value)}
              placeholder="Search your university…"
              className="w-full bg-surface border border-border text-ink text-sm font-body px-4 py-3 rounded-xl mb-4 focus:outline-none focus:border-teal/60 placeholder:text-ink-3"
              autoFocus
            />

            <div className="space-y-2">
              {unis.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUniversity(u)}
                  className="w-full text-left bg-surface hover:bg-surface-2 border border-border hover:border-teal/30 rounded-xl px-4 py-3 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body font-medium text-ink text-sm group-hover:text-teal transition-colors">
                        {u.name}
                      </p>
                      <p className="font-body text-ink-3 text-xs mt-0.5">{u.country}</p>
                    </div>
                    <span className="text-ink-3 group-hover:text-teal transition-colors text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-8 text-xs font-body text-ink-3 hover:text-ink-2 transition-colors underline"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* ── Step 1: Join Courses ─────────────────────────────────────────── */}
        {step === 1 && selectedUni && (
          <div>
            <div className="chapter-label mb-3">Step 2 of 2</div>
            <h1 className="font-display font-extrabold text-ink mb-1"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}>
              Your courses at<br />
              <span className="text-teal">{selectedUni.name}</span>
            </h1>
            <p className="font-body text-ink-2 text-sm mb-6">
              Join the ones you&apos;re taking. You can always add more later.
            </p>

            <input
              type="search"
              value={courseQ}
              onChange={(e) => {
                setCourseQ(e.target.value);
                clearTimeout(debounce.current!);
                debounce.current = setTimeout(() => {
                  fetch(`/api/courses?universityId=${selectedUni.id}&q=${encodeURIComponent(e.target.value)}&limit=30`)
                    .then((r) => r.json()).then((j) => setCourses(j.data ?? []));
                }, 300);
              }}
              placeholder="Search courses…"
              className="w-full bg-surface border border-border text-ink text-sm font-body px-4 py-3 rounded-xl mb-4 focus:outline-none focus:border-teal/60 placeholder:text-ink-3"
            />

            <div className="space-y-2 mb-8">
              {courses.map((c) => {
                const isJoined = joined.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleJoin(c.id)}
                    className={`w-full text-left border rounded-xl px-4 py-3 transition-all ${
                      isJoined
                        ? "bg-teal/10 border-teal/40"
                        : "bg-surface border-border hover:border-teal/30 hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          isJoined ? "bg-teal/20 text-teal" : "bg-surface-3 text-ink-2"
                        }`}>
                          {c.code}
                        </span>
                        <p className={`font-body text-sm transition-colors ${isJoined ? "text-teal" : "text-ink"}`}>
                          {c.title}
                        </p>
                      </div>
                      <span className={`text-lg transition-colors ${isJoined ? "text-teal" : "text-ink-3"}`}>
                        {isJoined ? "✓" : "+"}
                      </span>
                    </div>
                  </button>
                );
              })}

              {courses.length === 0 && (
                <p className="text-xs font-body text-ink-3 py-4 text-center">
                  No courses found — try adjusting your search.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-5 py-2.5 text-sm font-body text-ink-2 border border-border hover:border-teal/30 rounded-full transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 bg-teal text-paper font-display font-bold text-sm px-6 py-2.5 rounded-full hover:bg-teal-dim transition-colors disabled:opacity-60"
                style={{ boxShadow: "0 0 0 1px rgba(14,200,181,0.4), 0 8px 24px -4px rgba(14,200,181,0.25)" }}
              >
                {saving ? "Saving…" : joined.size > 0
                  ? `Join ${joined.size} course${joined.size !== 1 ? "s" : ""} →`
                  : "Continue without joining →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Done ─────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-full bg-teal/15 border border-teal/30 flex items-center justify-center mx-auto mb-6"
              style={{ boxShadow: "0 0 40px -8px rgba(14,200,181,0.4)" }}
            >
              <span className="text-teal text-2xl">✓</span>
            </div>
            <h2 className="font-display font-extrabold text-ink text-2xl mb-2">You&apos;re in.</h2>
            <p className="font-body text-ink-2 text-sm">Taking you to your dashboard…</p>
          </div>
        )}
      </div>
    </div>
  );
}

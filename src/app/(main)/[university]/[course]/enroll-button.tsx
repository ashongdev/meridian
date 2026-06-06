"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EnrollButtonClient({
  courseId,
  initialEnrolled,
}: {
  courseId: string;
  initialEnrolled: boolean;
}) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [loading, setLoading]   = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (enrolled) {
        await fetch(`/api/courses/${courseId}/enroll`, { method: "DELETE" });
        setEnrolled(false);
      } else {
        await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
        setEnrolled(true);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`shrink-0 text-sm font-display font-bold px-5 py-2.5 rounded-full transition-all disabled:opacity-60 ${
        enrolled
          ? "bg-surface-2 text-ink-2 border border-border hover:border-coral/40 hover:text-coral"
          : "bg-teal text-paper hover:bg-teal-dim"
      }`}
      style={enrolled ? undefined : {
        boxShadow: "0 0 0 1px rgba(14,200,181,0.4), 0 8px 24px -4px rgba(14,200,181,0.2)"
      }}
    >
      {loading ? "…" : enrolled ? "Leave course" : "Join course →"}
    </button>
  );
}

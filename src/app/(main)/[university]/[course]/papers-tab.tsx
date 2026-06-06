"use client";

import { useState } from "react";

type Material = {
  id: string; title: string; type: string; academicYear: string | null;
  isVerified: boolean; isAnonymous: boolean; upvoteCount: number;
  downloadCount: number; fileSize: number | null; createdAt: Date;
  uploaderName: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  past_exam:        "Past Exam",
  notes:            "Notes",
  syllabus:         "Syllabus",
  textbook_chapter: "Textbook",
  other:            "Other",
};

const TYPE_FILTERS = ["all", ...Object.keys(TYPE_LABELS)] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PapersTab({
  courseId,
  isEnrolled,
  initialMaterials,
}: {
  courseId:         string;
  isEnrolled:       boolean;
  initialMaterials: Material[];
}) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [filter, setFilter]       = useState("all");
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm]   = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle]   = useState("");
  const [uploadType, setUploadType]     = useState("past_exam");
  const [uploadYear, setUploadYear]     = useState("");
  const [uploadAnon, setUploadAnon]     = useState(false);
  const [uploadUrl, setUploadUrl]       = useState("");

  const filtered = filter === "all"
    ? materials
    : materials.filter((m) => m.type === filter);

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title:        uploadTitle,
          type:         uploadType,
          academicYear: uploadYear || undefined,
          isAnonymous:  uploadAnon,
          fileUrl:      uploadUrl,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setMaterials([data, ...materials]);
        setShowForm(false);
        setUploadTitle(""); setUploadUrl(""); setUploadYear("");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl">

      {/* ── Upload form ─────────────────────────────────────────────────── */}
      {isEnrolled && (
        <div className="mb-8">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-sm font-body text-ink-2 bg-surface border border-dashed border-border hover:border-teal/40 hover:text-teal px-4 py-3 rounded-xl transition-all w-full"
            >
              <span className="text-lg leading-none text-teal">+</span>
              Upload a past exam or notes
              <span className="ml-auto text-xs font-body text-teal">+10 karma</span>
            </button>
          ) : (
            <form onSubmit={submitUpload} className="bg-surface border border-teal/30 rounded-xl p-5 space-y-4">
              <div className="chapter-label">Upload material</div>

              <input
                value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Title (e.g. 2023 Final Exam)"
                required
                className="w-full bg-surface-2 border border-border text-ink text-sm font-body px-3 py-2.5 rounded-lg focus:outline-none focus:border-teal/50 placeholder:text-ink-3"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-body text-ink-3 block mb-1">Type</label>
                  <select
                    value={uploadType} onChange={(e) => setUploadType(e.target.value)}
                    className="w-full bg-surface-2 border border-border text-ink text-sm font-body px-3 py-2 rounded-lg focus:outline-none focus:border-teal/50"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-body text-ink-3 block mb-1">Academic year</label>
                  <input
                    value={uploadYear} onChange={(e) => setUploadYear(e.target.value)}
                    placeholder="e.g. 2023/24"
                    className="w-full bg-surface-2 border border-border text-ink text-sm font-body px-3 py-2 rounded-lg focus:outline-none focus:border-teal/50 placeholder:text-ink-3"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-body text-ink-3 block mb-1">File URL</label>
                <input
                  value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://drive.google.com/…"
                  type="url" required
                  className="w-full bg-surface-2 border border-border text-ink text-sm font-body px-3 py-2 rounded-lg focus:outline-none focus:border-teal/50 placeholder:text-ink-3"
                />
                <p className="text-xs font-body text-ink-3 mt-1">
                  Paste a public link (Google Drive, Dropbox, etc.)
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={uploadAnon} onChange={(e) => setUploadAnon(e.target.checked)}
                  className="accent-teal" />
                <span className="text-xs font-body text-ink-2">Upload anonymously</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-xs font-body text-ink-3 hover:text-ink transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
                  className="bg-teal text-paper text-xs font-display font-bold px-4 py-2 rounded-full hover:bg-teal-dim transition-colors disabled:opacity-50">
                  {uploading ? "Uploading…" : "Upload (+10 karma)"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-body px-3 py-1 rounded-full transition-colors ${
              filter === f
                ? "bg-teal/15 text-teal border border-teal/30"
                : "text-ink-3 border border-border hover:text-ink"
            }`}
          >
            {f === "all" ? "All" : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {/* ── Materials list ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((m) => (
          <div key={m.id}
            className="bg-surface border border-border hover:border-teal/30 rounded-xl p-4 transition-all group flex items-start gap-4">

            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0 text-sm">
              {m.type === "past_exam" ? "📄" : m.type === "notes" ? "📝" : m.type === "syllabus" ? "📋" : "📚"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1 flex-wrap">
                <span className="text-xs font-body text-ink-3 bg-surface-2 px-2 py-0.5 rounded">
                  {TYPE_LABELS[m.type] ?? m.type}
                </span>
                {m.academicYear && (
                  <span className="text-xs font-body text-ink-3">{m.academicYear}</span>
                )}
                {m.isVerified && (
                  <span className="text-xs font-body text-teal">✓ Verified</span>
                )}
              </div>
              <p className="font-body font-medium text-ink text-sm group-hover:text-teal transition-colors leading-snug">
                {m.title}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs font-body text-ink-3">
                <span>{m.isAnonymous ? "Anonymous" : m.uploaderName ?? "Unknown"}</span>
                <span>·</span>
                <span>▲ {m.upvoteCount}</span>
                <span>↓ {m.downloadCount}</span>
                {m.fileSize && <span>{formatBytes(m.fileSize)}</span>}
              </div>
            </div>

            <a
              href={`/api/materials/${m.id}/download`}
              className="shrink-0 text-xs font-body text-teal bg-teal/10 hover:bg-teal/20 border border-teal/25 px-3 py-1.5 rounded-lg transition-colors"
            >
              Download
            </a>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif italic text-ink-2 text-lg mb-2">
              &ldquo;No materials yet.&rdquo;
            </p>
            {isEnrolled
              ? <p className="text-xs font-body text-ink-3">Be the first to upload a past exam or notes.</p>
              : <p className="text-xs font-body text-ink-3">Join this course to view and upload materials.</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}

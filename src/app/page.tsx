import Link from "next/link";
import { Marquee } from "@/components/ui/marquee";
import { FloatingCta } from "@/components/ui/floating-cta";
import {
  TealUnderline,
  CircleAccent,
  ArrowAccent,
  StarDot,
  SquiggleDivider,
  NoteLines,
} from "@/components/ui/academic-accents";

const UNIVERSITIES = [
  "University of Ghana",
  "Ashesi University",
  "University of Cape Town",
  "Makerere University",
  "University of Lagos",
  "Stellenbosch University",
  "University of Nairobi",
  "KNUST",
  "University of Ibadan",
  "American University Cairo",
  "University of Pretoria",
  "Addis Ababa University",
];

const COURSES = [
  "UGCS 301 — Data Structures",
  "ECON 202 — Macroeconomics",
  "CHEM 114 — Organic Chemistry",
  "LAW 301 — Constitutional Law",
  "MED 401 — Anatomy I",
  "EE 221 — Circuit Theory",
  "BUS 310 — Financial Accounting",
  "CS 471 — Algorithms",
  "MATH 203 — Linear Algebra",
  "PHY 112 — Mechanics",
];

export default function LandingPage() {
  return (
    <div className="relative bg-paper text-ink overflow-x-hidden">

      {/* ── Invisible nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md bg-teal flex items-center justify-center"
            style={{ boxShadow: "0 0 12px -2px rgba(14,200,181,0.5)" }}
          >
            <span className="text-paper font-display font-bold text-xs">M</span>
          </div>
          <span className="font-display font-bold text-ink tracking-tight text-sm">Meridian</span>
        </div>
        <Link
          href="/login"
          className="text-xs font-body text-ink-2 hover:text-teal transition-colors tracking-widest uppercase"
        >
          Sign in
        </Link>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 01 — HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-end pb-16 pt-28 px-6 sm:px-10 lg:px-16">

        {/* Atmospheric radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(14,200,181,0.05) 0%, transparent 70%), " +
              "radial-gradient(ellipse 60% 50% at 20% 70%, rgba(238,160,32,0.03) 0%, transparent 60%)",
          }}
        />

        {/* Note paper — decorative, top-right */}
        <div className="absolute top-24 right-6 sm:right-16 opacity-[0.07] rotate-6 hidden sm:block">
          <NoteLines className="w-32 h-20 text-ink" />
        </div>

        {/* Chapter label */}
        <div className="chapter-label mb-8">Chapter 01 — Your university, decoded</div>

        {/* Headline block */}
        <div className="relative max-w-5xl">
          <h1
            className="font-display font-extrabold leading-none tracking-tighter text-ink"
            style={{ fontSize: "clamp(3rem, 9.5vw, 8rem)" }}
          >
            Study like<br />
            <span className="relative inline-block text-teal">
              your life
              <TealUnderline className="absolute -bottom-2 left-0 w-full text-teal" />
            </span>
            <br />
            depends on it.
          </h1>

          {/* Pull quote — floats right on desktop */}
          <div className="mt-10 sm:mt-0 sm:absolute sm:bottom-2 sm:right-0 sm:w-72 sm:text-right">
            <p className="font-body text-ink-2 text-sm leading-relaxed max-w-xs">
              Because for most of us, it does. Course communities, verified past exams,
              and an AI tutor that actually knows your syllabus.
            </p>
            <div className="mt-5 flex gap-3 sm:justify-end">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-teal text-paper font-display font-bold text-sm px-5 py-2.5 rounded-full hover:bg-teal-dim transition-colors"
                style={{ boxShadow: "0 0 0 1px rgba(14,200,181,0.4), 0 8px 24px -4px rgba(14,200,181,0.3)" }}
              >
                Join your course →
              </Link>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-14 sm:mt-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["#A67C52", "#5C8A6B", "#7B5EA7", "#D4826A"].map((c, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-paper"
                style={{ background: c }}
              />
            ))}
          </div>
          <p className="text-xs text-ink-3 font-body">
            <span className="text-teal font-semibold">1,240+</span> students studying right now
          </p>
          <StarDot className="w-3 h-3 text-amber ml-1 opacity-70" />
        </div>
      </section>

      {/* ── Marquee 1 — Universities ───────────────────────────────────────── */}
      <section className="py-5 border-y border-border overflow-hidden">
        <Marquee items={UNIVERSITIES} className="text-sm" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 02 — THE PROBLEM
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="chapter-label mb-10">Chapter 02 — The problem with your group chat</div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Pull quote */}
          <div>
            <blockquote
              className="font-serif italic text-ink"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)", lineHeight: 1.2, letterSpacing: "-0.015em" }}
            >
              "The past paper is in the group chat. Scroll up.
              <br />Which group?
              <span className="not-italic text-teal"> Which 2023 one?"</span>
            </blockquote>
            <p className="mt-6 text-ink-3 font-body text-sm max-w-sm leading-relaxed">
              Every student in Africa has lived this. The knowledge exists — it&apos;s just scattered across
              six WhatsApp groups, three Google Drive folders, and your senior&apos;s phone.
            </p>
          </div>

          {/* WhatsApp chaos collage */}
          <div className="relative h-80 lg:h-96">
            <ChatBubble
              text="Anyone have the 2022 finals? 👀"
              time="09:14"
              className="absolute top-0 left-0 w-64 tilt-2 collage-card"
              style={{ zIndex: 3 }}
            />
            <ChatBubble
              text="Try the ECE 301 group, I think Kwame uploaded it"
              time="09:17"
              received
              className="absolute top-14 right-2 sm:right-8 w-60 tilt-1 collage-card"
              style={{ zIndex: 4 }}
            />
            <ChatBubble
              text="Group full 😭 which one is the active group now?"
              time="09:23"
              className="absolute bottom-16 left-6 w-64 tilt-3 collage-card"
              style={{ zIndex: 2 }}
            />
            {/* Scattered files card */}
            <div
              className="absolute bottom-4 right-0 bg-surface-2 border border-border rounded-xl p-4 w-52 tilt-1 collage-card"
              style={{ zIndex: 5 }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2 h-2 rounded-full bg-coral" />
                <span className="text-xs text-ink-3 font-body">4 unread files</span>
              </div>
              <div className="space-y-2">
                {["ECE301_2023.pdf", "unknown_scan.jpg", "final (3).pdf"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-base leading-none">📄</span>
                    <span className="text-xs text-ink-2 font-body truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <CircleAccent className="absolute -top-4 -right-4 w-20 h-20 text-border opacity-40" />
          </div>
        </div>
      </section>

      <SquiggleDivider className="text-border opacity-20" />

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 03 — COURSE COMMUNITIES
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="chapter-label mb-10">Chapter 03 — Every course. One place.</div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <h2
              className="font-display font-extrabold text-ink leading-none mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.025em" }}
            >
              Your course has a community now.
            </h2>
            <p className="font-body text-ink-2 text-sm leading-relaxed max-w-sm">
              Every course at every university gets its own hub. Wall, materials, study groups, AI tutor.
              Organized by course code. No noise from other courses.
            </p>
          </div>

          {/* Stacked course cards */}
          <div className="lg:col-span-7 relative h-72">
            <CourseCard
              code="CS 471"
              title="Algorithms & Complexity"
              members={84}
              materials={23}
              className="absolute top-0 left-0 w-64 tilt-2 collage-card"
              style={{ zIndex: 3 }}
            />
            <CourseCard
              code="ECON 202"
              title="Macroeconomics I"
              members={127}
              materials={41}
              className="absolute top-10 left-28 w-64 tilt-3 collage-card"
              style={{ zIndex: 2 }}
            />
            <CourseCard
              code="MED 401"
              title="Anatomy & Physiology"
              members={56}
              materials={18}
              className="absolute bottom-0 right-0 w-64 tilt-1 collage-card"
              style={{ zIndex: 4 }}
            />
            <ArrowAccent className="absolute top-20 right-14 w-12 h-8 text-teal opacity-40 -rotate-12" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 04 — PAST PAPERS (diagonal cut surface)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="py-24 px-6 sm:px-10 lg:px-16 diagonal-cut"
        style={{ background: "var(--surface)" }}
      >
        <div className="chapter-label mb-10">Chapter 04 — The past paper problem, solved</div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Pinboard collage */}
          <div className="relative h-80 order-2 lg:order-1">
            <MaterialPin
              title="2023 Final Exam"
              type="past_exam"
              year="2023"
              downloads={312}
              className="absolute top-0 left-0 w-52 tilt-2 collage-card"
            />
            <MaterialPin
              title="Week 8 Lecture Notes"
              type="notes"
              year="2024"
              downloads={89}
              className="absolute top-8 right-6 w-52 tilt-3 collage-card"
            />
            <MaterialPin
              title="Course Syllabus"
              type="syllabus"
              year="2024"
              downloads={203}
              className="absolute bottom-6 left-12 w-52 tilt-1 collage-card"
            />
            <div className="absolute bottom-0 right-4 text-ink-3 opacity-10">
              <NoteLines className="w-28 h-16" />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2
              className="font-display font-extrabold text-ink leading-none mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.025em" }}
            >
              Every past exam.<br />
              <span className="text-teal">Searchable.</span><br />
              Verified.
            </h2>
            <p className="font-body text-ink-2 text-sm leading-relaxed max-w-sm mb-6">
              Students upload materials they used to pass. Juniors inherit years of course intelligence.
              The senior who graduated three years ago is still helping you.
            </p>
            <div className="flex items-center gap-2 text-xs text-ink-3 font-body">
              <StarDot className="w-3 h-3 text-amber" />
              <span>+10 karma for every verified upload</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 05 — AI TUTOR (diagonal cut top, back to paper)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="py-24 px-6 sm:px-10 lg:px-16 diagonal-cut-top"
        style={{ background: "var(--paper)" }}
      >
        <div className="chapter-label mb-10">Chapter 05 — Ask the AI that passed the course</div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <h2
              className="font-display font-extrabold text-ink leading-none mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.025em" }}
            >
              Not ChatGPT.<br />
              <span className="relative">
                Your tutor.
                <CircleAccent className="absolute -inset-4 w-full h-full text-teal opacity-20" />
              </span>
            </h2>
            <p className="font-body text-ink-2 text-sm leading-relaxed max-w-sm">
              Upload your past exams, lecture notes, and syllabus. Ask anything.
              Get answers grounded in{" "}
              <em className="not-italic text-ink font-medium">your actual course material</em> —
              not generic internet knowledge.
            </p>
          </div>

          {/* AI chat mockup */}
          <div className="lg:col-span-7">
            <div
              className="bg-surface-2 border border-border rounded-2xl p-5 max-w-lg"
              style={{ boxShadow: "0 0 60px -10px rgba(14,200,181,0.1)" }}
            >
              {/* Chat header */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <div className="w-6 h-6 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
                  <span className="text-teal text-xs font-bold">M</span>
                </div>
                <span className="text-xs font-display font-semibold text-teal">Meridian AI · CS 471</span>
                <span className="ml-auto text-xs text-ink-3 font-body">23 materials indexed</span>
              </div>
              {/* Messages */}
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-surface-3 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
                    <p className="text-sm text-ink font-body leading-relaxed">
                      What&apos;s the difference between NP and NP-complete from the 2022 exam?
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-teal text-xs">M</span>
                  </div>
                  <div className="bg-surface-3 border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-xs">
                    <p className="text-sm text-ink-2 font-body leading-relaxed">
                      Based on your 2022 final, Prof. Mensah tested this in Q3b.
                      NP is the class of problems{" "}
                      <span className="text-ink">verifiable in polynomial time</span>, while NP-complete
                      are the hardest problems in NP…
                    </p>
                    <div className="mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-teal font-body">📄 Source: 2022 Final, Q3b</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee 2 — Courses ────────────────────────────────────────────── */}
      <section className="py-5 border-y border-border overflow-hidden bg-surface">
        <Marquee items={COURSES} reverse separator="—" className="text-sm" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER 06 — STATS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 sm:px-10 lg:px-16">
        <div className="chapter-label mb-12">Chapter 06 — Growing every week</div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { num: "2,400+", label: "Students" },
            { num: "18",     label: "Universities" },
            { num: "40,000+", label: "Materials" },
            { num: "7",      label: "Countries" },
          ].map(({ num, label }) => (
            <div key={label} className="border-t border-border pt-4">
              <div
                className="font-display font-extrabold text-ink"
                style={{ fontSize: "clamp(1.8rem, 4vw, 3.2rem)", lineHeight: 1 }}
              >
                {num}
              </div>
              <div className="text-xs text-ink-3 mt-2 uppercase tracking-widest font-body">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="py-32 px-6 sm:px-10 lg:px-16 relative overflow-hidden"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(14,200,181,0.07) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="chapter-label mb-8">Final chapter — Where do you study?</div>
          <h2
            className="font-display font-extrabold text-ink leading-none mb-8"
            style={{ fontSize: "clamp(2.2rem, 6vw, 5rem)", letterSpacing: "-0.025em" }}
          >
            Your course community is waiting.
          </h2>
          <p className="font-body text-ink-2 text-sm mb-4 leading-relaxed">
            Judges: use code{" "}
            <span className="font-mono text-teal bg-teal/10 px-2 py-0.5 rounded text-xs">
              MERIDIAN-JUDGE
            </span>{" "}
            after signup for full Pro access.
          </p>
          <p className="font-body text-ink-3 text-xs mb-10">First 24 hours are always free — no code needed.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 bg-teal text-paper font-display font-bold text-base px-8 py-4 rounded-full hover:bg-teal-dim transition-all"
            style={{
              boxShadow: "0 0 0 1px rgba(14,200,181,0.4), 0 16px 48px -8px rgba(14,200,181,0.4)",
            }}
          >
            Join your course
            <span className="text-lg">→</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="px-6 sm:px-10 py-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-teal flex items-center justify-center">
            <span className="text-paper font-bold text-xs">M</span>
          </div>
          <span className="font-display font-semibold text-ink-2 text-sm">Meridian</span>
        </div>
        <p className="text-xs text-ink-3 font-body">
          Built on Aurora DSQL · DynamoDB · pgvector · Vercel · Track 3 — Million-scale
        </p>
      </footer>

      {/* Floating CTA */}
      <FloatingCta href="/register" label="Join your course" subLabel="Free for students" />
    </div>
  );
}

/* ── Local primitives ─────────────────────────────────────────────────────── */

function ChatBubble({
  text,
  time,
  received = false,
  className = "",
  style,
}: {
  text: string;
  time: string;
  received?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-surface-2 border border-border rounded-2xl p-3.5 shadow-lg ${className}`}
      style={style}
    >
      <p className="text-sm text-ink font-body leading-snug">{text}</p>
      <p className={`text-xs mt-1.5 font-body ${received ? "text-teal" : "text-ink-3"}`}>
        {time} {received ? "✓✓" : ""}
      </p>
    </div>
  );
}

function CourseCard({
  code,
  title,
  members,
  materials,
  className = "",
  style,
}: {
  code: string;
  title: string;
  members: number;
  materials: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-surface-2 border border-border rounded-xl p-4 shadow-lg ${className}`} style={style}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-mono text-teal bg-teal/10 px-2 py-0.5 rounded">{code}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
      </div>
      <p className="text-sm font-display font-semibold text-ink mb-3 leading-snug">{title}</p>
      <div className="flex items-center gap-3 text-xs text-ink-3 font-body">
        <span>{members} members</span>
        <span>·</span>
        <span>{materials} materials</span>
      </div>
    </div>
  );
}

function MaterialPin({
  title,
  type,
  year,
  downloads,
  className = "",
}: {
  title: string;
  type: string;
  year: string;
  downloads: number;
  className?: string;
}) {
  const icons: Record<string, string> = {
    past_exam: "📝",
    notes: "📒",
    syllabus: "📋",
  };
  return (
    <div className={`bg-surface-2 border border-border rounded-xl p-4 shadow-lg ${className}`}>
      <div className="text-xl mb-2">{icons[type] ?? "📄"}</div>
      <p className="text-sm font-display font-semibold text-ink mb-1 leading-snug">{title}</p>
      <p className="text-xs text-ink-3 font-body">
        {year} · {downloads} downloads
      </p>
    </div>
  );
}

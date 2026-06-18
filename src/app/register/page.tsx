import { signIn } from "@/lib/auth/config";
import Link from "next/link";
import { StarDot, ArrowAccent, CircleAccent } from "@/components/ui/academic-accents";

const STEP_LABELS = ["Sign in", "Your university", "Your courses"];

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col lg:flex-row overflow-hidden">

      {/* ── Left panel — editorial, desktop only ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-surface overflow-hidden flex-col justify-between p-12">

        {/* Atmospheric glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 20% 30%, rgba(238,160,32,0.05) 0%, transparent 65%), " +
              "radial-gradient(ellipse 70% 60% at 80% 70%, rgba(14,200,181,0.06) 0%, transparent 60%)",
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5 z-10">
          <div
            className="w-7 h-7 rounded-md bg-teal flex items-center justify-center"
            style={{ boxShadow: "0 0 16px -2px rgba(14,200,181,0.6)" }}
          >
            <span className="text-paper font-display font-bold text-sm">M</span>
          </div>
          <span className="font-display font-bold text-ink tracking-tight">Meridian</span>
        </div>

        {/* Central message */}
        <div className="relative z-10">
          <div className="chapter-label mb-6">What Meridian gives you</div>

          {/* Feature list as editorial cards */}
          <div className="space-y-4">
            {[
              {
                glyph: "◈",
                color: "text-teal",
                bg: "bg-teal/10",
                title: "Your course community",
                body: "Every course gets its own hub — wall, past papers, study groups.",
              },
              {
                glyph: "📝",
                color: "text-amber",
                bg: "bg-amber/10",
                title: "Verified past exams",
                body: "Uploaded and vouched for by students who passed the course.",
              },
              {
                glyph: "✦",
                color: "text-teal",
                bg: "bg-teal/10",
                title: "AI tutor for your syllabus",
                body: "Ask questions. Get answers from your actual course materials.",
              },
            ].map(({ glyph, color, bg, title, body }) => (
              <div key={title} className="flex items-start gap-4 group">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className={`${color} text-base leading-none`}>{glyph}</span>
                </div>
                <div>
                  <p className="font-display font-semibold text-ink text-sm mb-0.5">{title}</p>
                  <p className="font-body text-ink-3 text-xs leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative accents */}
          <div className="mt-10 relative h-8">
            <ArrowAccent className="absolute left-0 w-10 h-6 text-teal opacity-30" />
            <CircleAccent className="absolute right-4 -top-2 w-12 h-12 text-amber opacity-15" />
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-2">
              {["#A67C52", "#5C8A6B", "#7B5EA7", "#D4826A"].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-surface" style={{ background: c }} />
              ))}
            </div>
            <p className="text-xs text-ink-3 font-body">
              <span className="text-teal font-semibold">1,240+</span> students already studying
            </p>
            <StarDot className="w-2.5 h-2.5 text-amber opacity-60" />
          </div>
        </div>

        {/* Footnote */}
        <div className="relative z-10">
          <p className="text-xs text-ink-3 font-body">Track 3 · Million-scale · Aurora DSQL · DynamoDB</p>
        </div>
      </div>

      {/* ── Right panel — onboarding ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-16 relative min-h-screen lg:min-h-0">

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-teal flex items-center justify-center">
            <span className="text-paper font-display font-bold text-xs">M</span>
          </div>
          <span className="font-display font-bold text-ink tracking-tight text-sm">Meridian</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-10">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 text-xs font-body ${
                    i === 0 ? "text-teal" : "text-ink-3"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0
                        ? "bg-teal text-paper"
                        : "bg-surface-3 border border-border text-ink-3"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="w-6 h-px bg-border" />
                )}
              </div>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-10">
            <div className="chapter-label mb-4">Step 1 of 3 — Create your account</div>
            <h1
              className="font-display font-extrabold text-ink leading-none mb-3"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.025em" }}
            >
              Your course
              <br />
              community
              <br />
              <span className="text-teal">is waiting.</span>
            </h1>
            <p className="font-body text-ink-3 text-sm leading-relaxed">
              Join thousands of students sharing past exams, notes, and AI-powered insights —
              organized by university and course code.
            </p>
          </div>

          {/* 24h trial callout */}
          <div className="flex items-start gap-3 bg-teal/8 border border-teal/20 rounded-xl p-4 mb-8">
            <StarDot className="w-4 h-4 text-teal mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-display font-semibold text-teal mb-0.5">
                Free Pro trial — 24 hours
              </p>
              <p className="text-xs font-body text-ink-3 leading-relaxed">
                Full AI tutor access, unlimited uploads, all course materials — on us.
              </p>
            </div>
          </div>

          {/* Google sign-up — server action avoids client-side CSRF token dance */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-teal text-paper rounded-xl px-5 py-4 transition-all font-body font-semibold text-sm hover:bg-teal-dim group"
            style={{
              boxShadow: "0 0 0 1px rgba(14,200,181,0.4), 0 8px 24px -4px rgba(14,200,181,0.35)",
            }}
          >
            <GoogleIcon className="w-5 h-5 shrink-0" />
            <span>Continue with Google</span>
            <span className="ml-auto group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-3 font-body">Already have an account?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 border border-border hover:border-border-2 text-ink-2 hover:text-ink rounded-xl px-5 py-3.5 transition-all font-body text-sm"
          >
            Sign in instead
          </Link>

          {/* Fine print */}
          <p className="text-center text-xs text-ink-3 font-body mt-8 leading-relaxed">
            By continuing, you agree to Meridian&apos;s{" "}
            <span className="text-ink-2 underline underline-offset-2 cursor-pointer">terms</span> and{" "}
            <span className="text-ink-2 underline underline-offset-2 cursor-pointer">privacy policy</span>.
            <br />
            Judges: use code{" "}
            <span className="font-mono text-teal bg-teal/10 px-1.5 py-0.5 rounded text-xs">MERIDIAN-JUDGE</span>
            {" "}after signup.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

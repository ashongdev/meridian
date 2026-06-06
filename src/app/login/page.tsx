"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { NoteLines, StarDot, TealUnderline } from "@/components/ui/academic-accents";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col lg:flex-row overflow-hidden">

      {/* ── Left panel — editorial, desktop only ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-surface overflow-hidden flex-col justify-between p-12">

        {/* Atmospheric glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% 40%, rgba(14,200,181,0.06) 0%, transparent 65%), " +
              "radial-gradient(ellipse 50% 50% at 80% 80%, rgba(238,160,32,0.04) 0%, transparent 60%)",
          }}
        />

        {/* Decorative note paper — top right */}
        <div className="absolute top-16 right-12 opacity-[0.06] rotate-12">
          <NoteLines className="w-40 h-28 text-ink" />
        </div>
        <div className="absolute bottom-20 left-12 opacity-[0.05] -rotate-6">
          <NoteLines className="w-32 h-20 text-ink" />
        </div>

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

        {/* Editorial pull quote */}
        <div className="relative z-10 max-w-md">
          {/* Stacked card collage */}
          <div className="relative h-40 mb-12">
            <div className="absolute top-0 left-0 w-56 bg-surface-2 border border-border rounded-xl p-4 -rotate-2 shadow-lg">
              <div className="text-xs font-mono text-teal bg-teal/10 px-2 py-0.5 rounded inline-block mb-2">CS 471</div>
              <p className="text-sm font-display font-semibold text-ink">Algorithms & Complexity</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-ink-3 font-body">
                <div className="w-1.5 h-1.5 rounded-full bg-teal" />
                <span>84 members online</span>
              </div>
            </div>
            <div className="absolute top-6 left-36 w-52 bg-surface-3 border border-border-2 rounded-xl p-4 rotate-1 shadow-lg">
              <div className="text-xl mb-1">📝</div>
              <p className="text-sm font-display font-semibold text-ink">2023 Final Exam</p>
              <p className="text-xs text-ink-3 font-body mt-1">312 downloads · Verified</p>
            </div>
          </div>

          <blockquote
            className="font-serif italic text-ink leading-snug mb-6"
            style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", letterSpacing: "-0.01em" }}
          >
            "The notes you upload today will help someone pass their exam three years from now."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#A67C52", "#5C8A6B", "#7B5EA7"].map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-surface" style={{ background: c }} />
              ))}
            </div>
            <p className="text-xs text-ink-3 font-body">
              <span className="text-teal font-semibold">40,000+</span> materials shared
            </p>
            <StarDot className="w-3 h-3 text-amber opacity-60" />
          </div>
        </div>

        {/* Bottom footnote */}
        <div className="relative z-10">
          <p className="text-xs text-ink-3 font-body">
            Built on Aurora DSQL · DynamoDB · Vercel
          </p>
        </div>
      </div>

      {/* ── Right panel — auth ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-16 relative min-h-screen lg:min-h-0">

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-teal flex items-center justify-center">
            <span className="text-paper font-display font-bold text-xs">M</span>
          </div>
          <span className="font-display font-bold text-ink tracking-tight text-sm">Meridian</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-10">
            <div className="chapter-label mb-4">Welcome back</div>
            <h1
              className="font-display font-extrabold text-ink leading-none mb-3"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.025em" }}
            >
              Back to your
              <br />
              <span className="relative inline-block text-teal">
                course hub.
                <TealUnderline className="absolute -bottom-1 left-0 w-full text-teal" />
              </span>
            </h1>
            <p className="font-body text-ink-3 text-sm leading-relaxed">
              Sign in to access your courses, materials, and AI tutor.
            </p>
          </div>

          {/* Google sign-in */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-surface-2 border border-border-2 hover:border-teal/40 hover:bg-surface-3 text-ink rounded-xl px-5 py-4 transition-all font-body font-medium text-sm group"
            style={{ boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}
          >
            <GoogleIcon className="w-5 h-5 shrink-0" />
            <span>Continue with Google</span>
            <span className="ml-auto text-ink-3 group-hover:text-teal transition-colors">→</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-3 font-body">New to Meridian?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register CTA */}
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 border border-border hover:border-border-2 text-ink-2 hover:text-ink rounded-xl px-5 py-3.5 transition-all font-body text-sm"
          >
            Create your account
          </Link>

          {/* Fine print */}
          <p className="text-center text-xs text-ink-3 font-body mt-8 leading-relaxed">
            By continuing, you agree to Meridian&apos;s{" "}
            <span className="text-ink-2 underline underline-offset-2 cursor-pointer">terms</span> and{" "}
            <span className="text-ink-2 underline underline-offset-2 cursor-pointer">privacy policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

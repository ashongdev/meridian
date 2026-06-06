import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/aurora-dsql";
import { courses, universities, courseMemberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { StarDot, ArrowAccent } from "@/components/ui/academic-accents";

type EnrolledCourse = {
  id: string;
  code: string;
  slug: string;
  title: string;
  memberCount: number;
  materialCount: number;
  uniSlug: string;
  uniName: string;
};

async function getEnrolledCourses(userId: string): Promise<EnrolledCourse[]> {
  try {
    const rows = await db
      .select({
        id: courses.id,
        code: courses.code,
        slug: courses.slug,
        title: courses.title,
        memberCount: courses.memberCount,
        materialCount: courses.materialCount,
        uniSlug: universities.slug,
        uniName: universities.name,
      })
      .from(courseMemberships)
      .innerJoin(courses, eq(courses.id, courseMemberships.courseId))
      .innerJoin(universities, eq(universities.id, courses.universityId))
      .where(eq(courseMemberships.userId, userId))
      .limit(20);
    return rows;
  } catch {
    return [];
  }
}

async function getKarma(userId: string): Promise<number> {
  try {
    const [u] = await db
      .select({ karmaScore: users.karmaScore })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return u?.karmaScore ?? 0;
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Student";
  const userId = session?.user?.id;

  const [enrolled, karma] = userId
    ? await Promise.all([getEnrolledCourses(userId), getKarma(userId)])
    : [[], 0];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen px-6 sm:px-10 pt-10 pb-16">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-12">
        <div className="chapter-label mb-4">{greeting}</div>
        <h1
          className="font-display font-extrabold text-ink leading-none"
          style={{ fontSize: "clamp(2.4rem, 6vw, 5rem)", letterSpacing: "-0.03em" }}
        >
          {firstName}.
        </h1>

        {/* Stats strip */}
        {userId && (
          <div className="flex items-center gap-5 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-body text-ink-3">
              <StarDot className="w-3 h-3 text-amber" />
              <span>
                <span className="text-ink font-semibold">{karma}</span> karma
              </span>
            </div>
            <div className="text-xs font-body text-ink-3">
              <span className="text-ink font-semibold">{enrolled.length}</span> course
              {enrolled.length !== 1 ? "s" : ""}
            </div>
            {session?.user?.isPro && (
              <span className="text-xs font-body text-teal bg-teal/10 border border-teal/20 px-2 py-0.5 rounded-full">
                Pro ✦
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Course list / empty state ───────────────────────────────────────── */}
      {enrolled.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-ink text-sm uppercase tracking-widest">
              Your courses
            </h2>
            <Link
              href="/explore"
              className="text-xs font-body text-ink-3 hover:text-teal transition-colors"
            >
              Explore more →
            </Link>
          </div>

          {/* Staggered course grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((c, i) => (
              <CourseRow key={c.id} course={c} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Course card ─────────────────────────────────────────────────────────── */
function CourseRow({ course, index }: { course: EnrolledCourse; index: number }) {
  const tilts = ["", "sm:translate-y-2", "sm:-translate-y-1", "sm:translate-y-3"];
  const tilt = tilts[index % tilts.length];

  return (
    <Link
      href={`/${course.uniSlug}/${course.slug}`}
      className={`group relative bg-surface border border-border hover:border-teal/40 rounded-xl p-5 transition-all hover:-translate-y-0.5 ${tilt}`}
      style={{ boxShadow: "0 0 0 1px transparent" }}
    >
      {/* Active dot */}
      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-teal opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />

      {/* Course code */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono text-teal bg-teal/10 px-2 py-0.5 rounded">
          {course.code}
        </span>
        <span className="text-xs font-body text-ink-3 truncate">{course.uniName}</span>
      </div>

      {/* Title */}
      <p className="font-display font-semibold text-ink text-sm group-hover:text-teal transition-colors leading-snug line-clamp-2 mb-4">
        {course.title}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs font-body text-ink-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal/60" />
          {course.memberCount} members
        </span>
        <span>{course.materialCount} materials</span>
      </div>
    </Link>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="max-w-lg">
      <div className="border border-dashed border-border rounded-2xl p-10 text-center relative overflow-hidden">
        {/* Ghost course cards */}
        <div className="absolute -top-6 -left-4 w-40 h-20 bg-surface-2 border border-border rounded-xl opacity-20 -rotate-6" />
        <div className="absolute -bottom-4 -right-4 w-36 h-16 bg-surface-2 border border-border rounded-xl opacity-15 rotate-3" />

        <div className="relative z-10">
          <blockquote className="font-serif italic text-ink-2 text-xl mb-4 leading-snug">
            "Your course community is one search away."
          </blockquote>
          <p className="text-xs font-body text-ink-3 mb-8 leading-relaxed">
            Find your university, search for your course code, and join thousands of
            students who already share past papers and AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-teal text-paper font-display font-bold text-sm px-5 py-2.5 rounded-full hover:bg-teal-dim transition-colors"
              style={{ boxShadow: "0 0 0 1px rgba(14,200,181,0.4), 0 8px 24px -4px rgba(14,200,181,0.25)" }}
            >
              Find your courses →
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-ink-3 font-body">
              <ArrowAccent className="w-8 h-5 text-teal opacity-40 rotate-12" />
              <span>18 universities, 200+ courses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

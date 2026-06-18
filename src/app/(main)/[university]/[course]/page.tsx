import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { courses, universities, courseMemberships, posts, materials, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CourseTabs } from "./course-tabs";

type Props = {
  params:       Promise<{ university: string; course: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function CourseHubPage({ params, searchParams }: Props) {
  const { university: uniSlug, course: courseSlug } = await params;
  const { tab = "wall" } = await searchParams;

  await ensureDb();

  // auth() and the course lookup are independent — run them in parallel
  const [session, [row]] = await Promise.all([
    auth(),
    db
      .select({
        id:            courses.id,
        code:          courses.code,
        title:         courses.title,
        description:   courses.description,
        yearLevel:     courses.yearLevel,
        memberCount:   courses.memberCount,
        materialCount: courses.materialCount,
        uniId:         universities.id,
        uniName:       universities.name,
        uniSlug:       universities.slug,
      })
      .from(courses)
      .innerJoin(universities, eq(universities.id, courses.universityId))
      .where(and(eq(universities.slug, uniSlug), eq(courses.slug, courseSlug)))
      .limit(1),
  ]);

  if (!row) notFound();

  const userId = session?.user?.id;

  // Fetch all tab data in parallel on first load — tab switches are client-side after this
  const [enrollmentRow, wallPosts, papersList] = await Promise.all([
    userId
      ? db.select({ id: courseMemberships.id })
          .from(courseMemberships)
          .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, row.id)))
          .limit(1)
      : Promise.resolve([]),

    db.select({
        id: posts.id, type: posts.type, title: posts.title,
        content: posts.content, isPinned: posts.isPinned,
        upvoteCount: posts.upvoteCount, commentCount: posts.commentCount,
        createdAt: posts.createdAt, authorId: posts.authorId,
        authorName: users.name, authorAvatar: users.avatarUrl,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .where(eq(posts.courseId, row.id))
      .orderBy(desc(posts.isPinned), desc(posts.createdAt))
      .limit(30),

    db.select({
        id: materials.id, title: materials.title, type: materials.type,
        academicYear: materials.academicYear, isVerified: materials.isVerified,
        upvoteCount: materials.upvoteCount, downloadCount: materials.downloadCount,
        fileSize: materials.fileSize, createdAt: materials.createdAt,
        uploaderName: users.name, isAnonymous: materials.isAnonymous,
      })
      .from(materials)
      .leftJoin(users, and(eq(users.id, materials.uploaderId), eq(materials.isAnonymous, false)))
      .where(eq(materials.courseId, row.id))
      .orderBy(desc(materials.createdAt))
      .limit(50),
  ]);

  const isEnrolled = enrollmentRow.length > 0;

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-border px-6 sm:px-10 pt-10 pb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Link
                href={`/explore`}
                className="text-xs font-body text-ink-3 hover:text-teal transition-colors"
              >
                Explore
              </Link>
              <span className="text-ink-3 text-xs">›</span>
              <span className="text-xs font-body text-ink-3">{row.uniName}</span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-teal bg-teal/10 px-2 py-0.5 rounded">
                {row.code}
              </span>
              {row.yearLevel && (
                <span className="text-xs font-body text-ink-3">Year {row.yearLevel}</span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-ink leading-tight"
              style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)", letterSpacing: "-0.025em" }}>
              {row.title}
            </h1>
            {row.description && (
              <p className="font-body text-ink-2 text-sm mt-1 max-w-xl">{row.description}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs font-body text-ink-3">
              <span><span className="text-ink font-semibold">{row.memberCount.toLocaleString()}</span> members</span>
              <span><span className="text-ink font-semibold">{row.materialCount}</span> materials</span>
            </div>
          </div>

          <EnrollButton courseId={row.id} isEnrolled={isEnrolled} />
        </div>

        <CourseTabs
          uniSlug={uniSlug}
          courseSlug={courseSlug}
          courseId={row.id}
          courseCode={row.code}
          isEnrolled={isEnrolled}
          initialTab={tab}
          wallPosts={wallPosts}
          papersList={papersList}
        />
      </div>
    </div>
  );
}

/* ── Enroll button (client) ──────────────────────────────────────────────── */
function EnrollButton({ courseId, isEnrolled }: { courseId: string; isEnrolled: boolean }) {
  return (
    <EnrollButtonClient courseId={courseId} initialEnrolled={isEnrolled} />
  );
}

/* ── Client islands ──────────────────────────────────────────────────────── */
import { EnrollButtonClient } from "./enroll-button";

import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { studyGroups, studyGroupMembers, courses, universities } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, isFuture } from "date-fns";
import { ArrowAccent } from "@/components/ui/academic-accents";

type MyGroup = {
  id: string; name: string; description: string | null;
  memberCount: number; maxSize: number; scheduledAt: Date | null;
  courseCode: string; courseSlug: string; uniSlug: string; uniName: string;
};

async function getMyGroups(userId: string): Promise<MyGroup[]> {
  try {
    return await db
      .select({
        id: studyGroups.id, name: studyGroups.name, description: studyGroups.description,
        memberCount: studyGroups.memberCount, maxSize: studyGroups.maxSize, scheduledAt: studyGroups.scheduledAt,
        courseCode: courses.code, courseSlug: courses.slug,
        uniSlug: universities.slug, uniName: universities.name,
      })
      .from(studyGroupMembers)
      .innerJoin(studyGroups, eq(studyGroups.id, studyGroupMembers.groupId))
      .innerJoin(courses, eq(courses.id, studyGroups.courseId))
      .innerJoin(universities, eq(universities.id, courses.universityId))
      .where(eq(studyGroupMembers.userId, userId))
      .orderBy(asc(studyGroups.scheduledAt), desc(studyGroups.createdAt));
  } catch {
    return [];
  }
}

export default async function StudyPage() {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const groups = await getMyGroups(session.user.id);

  return (
    <div className="min-h-screen px-6 sm:px-10 pt-10 pb-16">
      <div className="chapter-label mb-4">Across every course</div>
      <h1
        className="font-display font-extrabold text-ink leading-none mb-2"
        style={{ fontSize: "clamp(2.4rem, 6vw, 5rem)", letterSpacing: "-0.03em" }}
      >
        Study.
      </h1>
      <p className="font-body text-ink-2 text-sm mb-10 max-w-md">
        Every study group you&apos;re part of, in one place — live chat, presence, and a shared Pomodoro timer for each.
      </p>

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => {
            const scheduled = g.scheduledAt ? new Date(g.scheduledAt) : null;
            return (
              <Link
                key={g.id}
                href={`/${g.uniSlug}/${g.courseSlug}?tab=groups&group=${g.id}`}
                className="group bg-surface border border-border hover:border-teal/40 rounded-xl p-5 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono text-teal bg-teal/10 px-2 py-0.5 rounded">{g.courseCode}</span>
                  <span className="text-xs font-body text-ink-3 truncate">{g.uniName}</span>
                </div>
                <p className="font-display font-semibold text-ink text-sm group-hover:text-teal transition-colors leading-snug mb-1">
                  {g.name}
                </p>
                {g.description && (
                  <p className="font-body text-ink-3 text-xs leading-relaxed line-clamp-2 mb-3">{g.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs font-body text-ink-3 flex-wrap">
                  <span>{g.memberCount}/{g.maxSize} members</span>
                  {scheduled && (
                    <>
                      <span>·</span>
                      <span className={isFuture(scheduled) ? "text-amber" : ""}>
                        {isFuture(scheduled) ? "Meets " : "Met "}
                        {formatDistanceToNow(scheduled, { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="max-w-lg">
      <div className="border border-dashed border-border rounded-2xl p-10 text-center relative overflow-hidden">
        <div className="absolute -top-6 -left-4 w-40 h-20 bg-surface-2 border border-border rounded-xl opacity-20 -rotate-6" />
        <div className="absolute -bottom-4 -right-4 w-36 h-16 bg-surface-2 border border-border rounded-xl opacity-15 rotate-3" />

        <div className="relative z-10">
          <blockquote className="font-serif italic text-ink-2 text-xl mb-4 leading-snug">
            &ldquo;No one studies well alone forever.&rdquo;
          </blockquote>
          <p className="text-xs font-body text-ink-3 mb-8 leading-relaxed">
            Head into one of your courses and start or join a study group — live chat,
            presence, and a shared Pomodoro timer, all synced in real time.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-teal text-paper font-display font-bold text-sm px-5 py-2.5 rounded-full hover:bg-teal-dim transition-colors"
              style={{ boxShadow: "0 0 0 1px rgba(14,200,181,0.4), 0 8px 24px -4px rgba(14,200,181,0.25)" }}
            >
              Go to your courses →
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-ink-3 font-body">
              <ArrowAccent className="w-8 h-5 text-teal opacity-40 rotate-12" />
              <span>Open a course → Groups tab</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

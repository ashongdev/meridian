import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { users, universities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { StarDot } from "@/components/ui/academic-accents";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [row] = await db
    .select({
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isPro: users.isPro,
      trialEndsAt: users.trialEndsAt,
      karmaScore: users.karmaScore,
      uniName: universities.name,
    })
    .from(users)
    .leftJoin(universities, eq(universities.id, users.universityId))
    .where(eq(users.id, session.user.id))
    .limit(1);

  const now = new Date();
  const trialActive = row?.trialEndsAt ? row.trialEndsAt > now : false;
  const trialDaysLeft = trialActive
    ? Math.ceil((row!.trialEndsAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  return (
    <div className="min-h-screen px-6 sm:px-10 pt-10 pb-16 max-w-2xl">
      <div className="chapter-label mb-4">Account</div>
      <h1
        className="font-display font-extrabold text-ink leading-none mb-10"
        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.03em" }}
      >
        Settings
      </h1>

      {/* ── Profile ──────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="font-display font-bold text-ink text-sm uppercase tracking-widest mb-4">Profile</h2>
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
          {row?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.avatarUrl} alt="" className="w-14 h-14 rounded-full border border-border object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-teal/15 border border-teal/25 flex items-center justify-center">
              <span className="text-teal font-bold text-lg">{(row?.name ?? "?")[0]?.toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="font-display font-semibold text-ink">{row?.name ?? "Student"}</p>
            <p className="font-body text-ink-3 text-sm">{row?.email}</p>
            {row?.uniName && <p className="font-body text-ink-3 text-xs mt-0.5">{row.uniName}</p>}
          </div>
        </div>
      </section>

      {/* ── Karma ────────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="font-display font-bold text-ink text-sm uppercase tracking-widest mb-4">Karma</h2>
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-3">
          <StarDot className="w-5 h-5 text-amber" />
          <div>
            <p className="font-display font-bold text-ink text-2xl">{row?.karmaScore ?? 0}</p>
            <p className="font-body text-ink-3 text-xs">
              Earned from uploading verified materials and getting upvoted on the Wall.
            </p>
          </div>
        </div>
      </section>

      {/* ── Plan & promo code (interactive) ─────────────────────────────── */}
      <SettingsClient
        isPro={row?.isPro ?? false}
        trialActive={trialActive}
        trialDaysLeft={trialDaysLeft}
      />
    </div>
  );
}

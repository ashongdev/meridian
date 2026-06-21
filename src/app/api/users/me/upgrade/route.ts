import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * POST /api/users/me/upgrade — simulated checkout.
 *
 * No real payment processor is wired up — this is hackathon scope. Judge/demo
 * access is via the promo-code redemption flow; this endpoint exists to
 * demonstrate the upgrade UX end-to-end. Swap for a real Stripe Checkout
 * session (webhook setting isPro on payment_intent.succeeded) before any
 * real money is involved.
 */
export async function POST() {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { limited } = rateLimit(`upgrade:${session.user.id}`, 5, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    await db.update(users).set({ isPro: true }).where(eq(users.id, session.user.id));
    return NextResponse.json({ data: { isPro: true } });
  } catch (err) {
    console.error("[POST /api/users/me/upgrade]", err);
    return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
  }
}

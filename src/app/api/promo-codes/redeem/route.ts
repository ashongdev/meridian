import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { promoCodes, promoRedemptions, users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ code: z.string().min(1).max(50) });

// POST /api/promo-codes/redeem — extends the caller's Pro trial by the code's durationDays
export async function POST(req: NextRequest) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { limited, retryAfter } = rateLimit(`promo-redeem:${userId}`, 10, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const body   = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a promo code" }, { status: 400 });
  }
  const normalizedCode = parsed.data.code.trim().toUpperCase();

  try {
    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, normalizedCode))
      .limit(1);

    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 409 });
    }
    if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) {
      return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 409 });
    }

    const [alreadyRedeemed] = await db
      .select({ id: promoRedemptions.id })
      .from(promoRedemptions)
      .where(and(eq(promoRedemptions.userId, userId), eq(promoRedemptions.promoCodeId, promo.id)))
      .limit(1);
    if (alreadyRedeemed) {
      return NextResponse.json({ error: "You've already redeemed this code" }, { status: 409 });
    }

    const [{ trialEndsAt: currentTrialEndsAt }] = await db
      .select({ trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const base = currentTrialEndsAt && currentTrialEndsAt > new Date() ? currentTrialEndsAt : new Date();
    const newTrialEndsAt = new Date(base.getTime() + promo.durationDays * 24 * 60 * 60 * 1000);

    await db.insert(promoRedemptions).values({ userId, promoCodeId: promo.id });
    await db.update(promoCodes)
      .set({ usageCount: sql`${promoCodes.usageCount} + 1` })
      .where(eq(promoCodes.id, promo.id));
    await db.update(users).set({ trialEndsAt: newTrialEndsAt }).where(eq(users.id, userId));

    return NextResponse.json({
      data: { durationDays: promo.durationDays, trialEndsAt: newTrialEndsAt.toISOString() },
    });
  } catch (err) {
    console.error("[POST /api/promo-codes/redeem]", err);
    return NextResponse.json({ error: "Failed to redeem code" }, { status: 500 });
  }
}

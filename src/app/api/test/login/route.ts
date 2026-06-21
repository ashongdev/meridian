import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/test/login — E2E test auth bypass. Mints a real NextAuth session
 * cookie directly, skipping the Google OAuth flow entirely (which can't be
 * reliably automated — consent screens, CAPTCHA risk on headless browsers).
 *
 * SECURITY: this is a real auth-bypass endpoint. It is hard-disabled (404,
 * before even reading the body) unless BOTH:
 *   1. process.env.NODE_ENV !== "production"
 *   2. process.env.E2E_TEST_SECRET is set AND matches the request body
 * NEVER set E2E_TEST_SECRET in a production environment (Vercel Production
 * or Preview). It only belongs in .env.local / CI test config.
 */

const bodySchema = z.object({
  secret: z.string(),
  email:  z.string().email(),
  name:   z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || !process.env.E2E_TEST_SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || parsed.data.secret !== process.env.E2E_TEST_SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { email, name } = parsed.data;

  await ensureDb();

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  const userId = existing
    ? existing.id
    : (await db.insert(users).values({ email, name: name ?? "E2E Test User", karmaScore: 0 }).returning({ id: users.id }))[0].id;

  const sessionToken = await encode({
    token: { email, name: name ?? "E2E Test User", sub: userId },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
    maxAge: 60 * 60, // 1 hour — short-lived, this is a test-only session
  });

  const res = NextResponse.json({ data: { userId } });
  res.cookies.set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60,
  });
  return res;
}

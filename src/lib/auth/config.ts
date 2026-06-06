import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isPro?: boolean;
      karmaScore?: number;
      universityId?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || account?.provider !== "google") return false;

      await ensureDb();
      try {
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existing.length === 0) {
          // New user — create with 24-hour Pro trial
          const trialEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await db.insert(users).values({
            email: user.email,
            name: user.name ?? null,
            avatarUrl: user.image ?? null,
            isPro: false,
            trialEndsAt: trialEnd,
            karmaScore: 0,
          });
        } else {
          // Existing user — refresh name/avatar from Google
          await db
            .update(users)
            .set({
              name: user.name ?? undefined,
              avatarUrl: user.image ?? undefined,
            })
            .where(eq(users.email, user.email));
        }
        return true;
      } catch (err) {
        console.error("[auth] signIn error:", err);
        // Fail open in dev so we can test UI without a live DB
        return process.env.NODE_ENV !== "production";
      }
    },

    async session({ session }) {
      if (!session.user?.email) return session;

      await ensureDb();
      try {
        const [dbUser] = await db
          .select({
            id: users.id,
            isPro: users.isPro,
            karmaScore: users.karmaScore,
            universityId: users.universityId,
            trialEndsAt: users.trialEndsAt,
          })
          .from(users)
          .where(eq(users.email, session.user.email))
          .limit(1);

        if (dbUser) {
          const trialActive = dbUser.trialEndsAt
            ? dbUser.trialEndsAt > new Date()
            : false;

          session.user.id = dbUser.id;
          session.user.isPro = dbUser.isPro || trialActive;
          session.user.karmaScore = dbUser.karmaScore;
          session.user.universityId = dbUser.universityId;
        }
      } catch {
        // Non-fatal — return partial session
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.AUTH_SECRET,
});

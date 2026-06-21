import { db } from "@/lib/db/aurora-dsql";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const AI_TUTOR_EMAIL = "ai-tutor@meridian.internal";
export const AI_TUTOR_NAME = "AI Tutor";

let _cachedId: string | null = null;

/**
 * Resolves the virtual "AI Tutor" user row, creating it once if it doesn't exist.
 * Letting the AI tutor be a real `users` row (rather than a nullable userId on
 * group_messages) means the existing course/group chat queries — which already
 * left-join `users` for name/avatar — work for AI replies with zero changes.
 */
export async function getAiTutorUserId(): Promise<string> {
  if (_cachedId) return _cachedId;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, AI_TUTOR_EMAIL))
    .limit(1);

  if (existing) {
    _cachedId = existing.id;
    return existing.id;
  }

  try {
    const [created] = await db
      .insert(users)
      .values({ email: AI_TUTOR_EMAIL, name: AI_TUTOR_NAME })
      .returning({ id: users.id });
    _cachedId = created.id;
    return created.id;
  } catch {
    // Lost a race with a concurrent first-ever mention — the row exists now, fetch it
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, AI_TUTOR_EMAIL)).limit(1);
    if (!row) throw new Error("Failed to create or find AI Tutor user");
    _cachedId = row.id;
    return row.id;
  }
}

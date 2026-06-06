import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  universityId: z.string().uuid().optional(),
  name:         z.string().min(1).max(120).optional(),
});

// PATCH /api/users/me — update own profile
export async function PATCH(req: NextRequest) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const { universityId, name } = parsed.data;
  if (!universityId && !name) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const [updated] = await db.update(users)
      .set({
        ...(universityId !== undefined && { universityId }),
        ...(name         !== undefined && { name }),
      })
      .where(eq(users.id, session.user.id))
      .returning({ id: users.id, universityId: users.universityId, name: users.name });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/users/me]", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

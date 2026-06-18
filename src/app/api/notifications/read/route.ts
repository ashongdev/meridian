import { auth } from "@/lib/auth/config";
import { markNotificationRead } from "@/lib/db/presence";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ sk: z.string().min(1) });

// POST /api/notifications/read — mark one of the caller's own notifications as read
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    // pk is always derived from the session — never trust a client-supplied user id
    await markNotificationRead(session.user.id, parsed.data.sk);
    return NextResponse.json({ data: { read: true } });
  } catch (err) {
    console.error("[POST /api/notifications/read]", err);
    return NextResponse.json({ error: "Failed to mark notification read" }, { status: 500 });
  }
}

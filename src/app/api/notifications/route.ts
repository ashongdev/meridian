import { auth } from "@/lib/auth/config";
import { queryNotifications } from "@/lib/db/presence";
import { NextResponse } from "next/server";

// GET /api/notifications — poll the caller's own notification queue (most recent 20)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await queryNotifications(session.user.id);
    const unreadCount = notifications.filter((n) => !n.read).length;
    return NextResponse.json({ data: notifications, meta: { unreadCount } });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

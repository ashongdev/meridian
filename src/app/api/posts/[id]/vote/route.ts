import { auth } from "@/lib/auth/config";
import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { posts, upvotes } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// POST /api/posts/[id]/vote — toggle upvote
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { limited, retryAfter } = rateLimit(`vote:${userId}`, 60, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const { id: postId } = await params;

  try {
    const [post] = await db.select({ id: posts.id, upvoteCount: posts.upvoteCount })
      .from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [existing] = await db.select({ id: upvotes.id })
      .from(upvotes)
      .where(and(eq(upvotes.userId, userId), eq(upvotes.targetId, postId), eq(upvotes.targetType, "post")))
      .limit(1);

    if (existing) {
      await db.delete(upvotes).where(eq(upvotes.id, existing.id));
      await db.update(posts)
        .set({ upvoteCount: sql`greatest(${posts.upvoteCount} - 1, 0)` })
        .where(eq(posts.id, postId));
      return NextResponse.json({ data: { voted: false, count: Math.max(post.upvoteCount - 1, 0) } });
    } else {
      await db.insert(upvotes).values({ userId, targetType: "post", targetId: postId });
      await db.update(posts)
        .set({ upvoteCount: sql`${posts.upvoteCount} + 1` })
        .where(eq(posts.id, postId));
      return NextResponse.json({ data: { voted: true, count: post.upvoteCount + 1 } });
    }
  } catch (err) {
    console.error("[POST /api/posts/[id]/vote]", err);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

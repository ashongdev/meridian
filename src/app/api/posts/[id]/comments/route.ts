import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/aurora-dsql";
import { comments, posts, users, courseMemberships } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { and, asc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  content: z.string().min(1).max(5000),
});

// GET /api/posts/[id]/comments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  try {
    const rows = await db
      .select({
        id:           comments.id,
        content:      comments.content,
        upvoteCount:  comments.upvoteCount,
        createdAt:    comments.createdAt,
        authorId:     comments.authorId,
        authorName:   users.name,
        authorAvatar: users.avatarUrl,
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.authorId))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt))
      .limit(100);

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/posts/[id]/comments]", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/posts/[id]/comments — create a comment (must be enrolled)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { limited, retryAfter } = rateLimit(`comment:${userId}`, 20, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  const { id: postId } = await params;

  const body   = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const [post] = await db.select({ id: posts.id, courseId: posts.courseId })
      .from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [membership] = await db.select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, post.courseId)))
      .limit(1);
    if (!membership) {
      return NextResponse.json({ error: "You must be enrolled to comment" }, { status: 403 });
    }

    const [comment] = await db.insert(comments)
      .values({ postId, authorId: userId, content: parsed.data.content })
      .returning();

    // Fire-and-forget — do not block the response
    db.update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId))
      .catch((err) => console.error("[POST /comments] commentCount increment failed:", err));

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/posts/[id]/comments]", err);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

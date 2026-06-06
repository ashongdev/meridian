import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/aurora-dsql";
import { posts, users, courseMemberships } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const POST_TYPES = ["question", "discussion", "resource", "announcement"] as const;

const createSchema = z.object({
  courseId: z.string().uuid(),
  type:     z.enum(POST_TYPES).default("discussion"),
  title:    z.string().min(1).max(200).optional(),
  content:  z.string().min(1).max(10000),
});

// GET /api/posts?courseId=&type=&limit=&cursor=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const courseId = searchParams.get("courseId");
  const type     = searchParams.get("type");
  const limit    = Math.min(50, Number(searchParams.get("limit") ?? "20"));

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  const filters = [
    eq(posts.courseId, courseId),
    type && POST_TYPES.includes(type as typeof POST_TYPES[number])
      ? eq(posts.type, type)
      : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  try {
    const rows = await db
      .select({
        id:           posts.id,
        type:         posts.type,
        title:        posts.title,
        content:      posts.content,
        isPinned:     posts.isPinned,
        upvoteCount:  posts.upvoteCount,
        commentCount: posts.commentCount,
        createdAt:    posts.createdAt,
        authorId:     posts.authorId,
        authorName:   users.name,
        authorAvatar: users.avatarUrl,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .where(and(...filters))
      .orderBy(desc(posts.isPinned), desc(posts.createdAt))
      .limit(limit);

    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/posts — create a post (must be enrolled)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const { courseId, type, title, content } = parsed.data;
  const userId = session.user.id;

  try {
    // Verify enrollment
    const [membership] = await db
      .select({ id: courseMemberships.id })
      .from(courseMemberships)
      .where(and(eq(courseMemberships.userId, userId), eq(courseMemberships.courseId, courseId)))
      .limit(1);
    if (!membership) {
      return NextResponse.json({ error: "You must be enrolled to post" }, { status: 403 });
    }

    const [post] = await db.insert(posts)
      .values({ courseId, authorId: userId, type, title, content })
      .returning();

    return NextResponse.json({ data: post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

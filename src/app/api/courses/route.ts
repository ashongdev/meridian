import { db } from "@/lib/db/aurora-dsql";
import { courses, universities } from "@/lib/db/schema";
import { and, eq, ilike, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const universityId = searchParams.get("universityId");
  const q            = searchParams.get("q")?.trim() ?? "";
  const page         = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit        = Math.min(50, Number(searchParams.get("limit") ?? "20"));
  const offset       = (page - 1) * limit;

  const filters = [
    universityId ? eq(courses.universityId, universityId) : undefined,
    q ? ilike(courses.title, `%${q}%`) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  try {
    const [rows, [{ total }]] = await Promise.all([
      db.select({
          id:            courses.id,
          code:          courses.code,
          slug:          courses.slug,
          title:         courses.title,
          yearLevel:     courses.yearLevel,
          memberCount:   courses.memberCount,
          materialCount: courses.materialCount,
          universityId:  courses.universityId,
          uniName:       universities.name,
          uniSlug:       universities.slug,
          uniCountry:    universities.country,
        })
        .from(courses)
        .leftJoin(universities, eq(universities.id, courses.universityId))
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(courses.memberCount)
        .limit(limit)
        .offset(offset),

      db.select({ total: sql<number>`count(*)::int` })
        .from(courses)
        .where(filters.length ? and(...filters) : undefined),
    ]);

    return NextResponse.json({
      data: rows,
      meta: { total, page, limit },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

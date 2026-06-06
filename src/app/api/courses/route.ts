import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { courses, universities } from "@/lib/db/schema";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Global unscoped search returns fewer results (Rule 3: no unbounded global scans)
const SCOPED_LIMIT   = 50;
const UNSCOPED_LIMIT = 10;

/**
 * GET /api/courses?universityId=&q=&page=&limit=
 *
 * When universityId is provided: full search within that university (up to 50).
 * Without universityId: global search is limited to 10 results to prevent
 * full-table scans across all universities (Rule 3 compliance).
 */
export async function GET(req: NextRequest) {
  await ensureDb();
  const { searchParams } = req.nextUrl;
  const universityId = searchParams.get("universityId");
  const q            = searchParams.get("q")?.trim() ?? "";
  const page         = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const maxLimit = universityId ? SCOPED_LIMIT : UNSCOPED_LIMIT;
  const limit    = Math.min(maxLimit, Number(searchParams.get("limit") ?? "20"));
  const offset   = (page - 1) * limit;

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
        .orderBy(desc(courses.memberCount))
        .limit(limit)
        .offset(offset),

      db.select({ total: sql<number>`count(*)::int` })
        .from(courses)
        .where(filters.length ? and(...filters) : undefined),
    ]);

    return NextResponse.json({
      data: rows,
      meta: { total, page, limit, scoped: !!universityId },
    });
  } catch (err) {
    console.error("[GET /api/courses]", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

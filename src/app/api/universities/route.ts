import { db, ensureDb } from "@/lib/db/aurora-dsql";
import { universities } from "@/lib/db/schema";
import { ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await ensureDb();
  const { searchParams } = req.nextUrl;
  const q     = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(50, Number(searchParams.get("limit") ?? "30"));

  try {
    const rows = await db
      .select()
      .from(universities)
      .where(q ? ilike(universities.name, `%${q}%`) : undefined)
      .orderBy(universities.name)
      .limit(limit);

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/universities]", err);
    return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
  }
}

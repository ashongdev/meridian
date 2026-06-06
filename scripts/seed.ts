/**
 * Seeds Aurora DSQL with real African university data.
 * Idempotent — safe to re-run (ON CONFLICT DO NOTHING).
 *
 * Usage: npm run db:seed
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { universities, courses, promoCodes } from "../src/lib/db/schema";

const databaseUrl = process.env.DATABASE_URL;
const endpoint    = process.env.AURORA_DSQL_ENDPOINT;
const token       = process.env.AURORA_DSQL_TOKEN;

if (!databaseUrl && (!endpoint || !token)) {
  console.error("Set DATABASE_URL (local) or AURORA_DSQL_ENDPOINT + AURORA_DSQL_TOKEN (production)");
  process.exit(1);
}

const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl, max: 1 })
  : new Pool({
      host: endpoint!, port: 5432, database: "postgres",
      user: "admin", password: token!,
      ssl: { rejectUnauthorized: false }, max: 1,
    });
const db = drizzle(pool);

/* ── Seed data ─────────────────────────────────────────────────────────────── */

const UNI_DATA = [
  { id: "00000000-0000-4000-8000-000000000001", name: "University of Ghana",    slug: "ug",      country: "Ghana" },
  { id: "00000000-0000-4000-8000-000000000002", name: "University of Lagos",    slug: "unilag",  country: "Nigeria" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Makerere University",    slug: "mak",     country: "Uganda" },
];

const COURSE_DATA = [
  // University of Ghana
  { universityId: "00000000-0000-4000-8000-000000000001", code: "CS 101",    slug: "cs-101",    title: "Introduction to Computing",        yearLevel: 1, memberCount: 312 },
  { universityId: "00000000-0000-4000-8000-000000000001", code: "MATH 101",  slug: "math-101",  title: "Calculus I",                       yearLevel: 1, memberCount: 489 },
  { universityId: "00000000-0000-4000-8000-000000000001", code: "ECON 101",  slug: "econ-101",  title: "Principles of Microeconomics",     yearLevel: 1, memberCount: 278 },
  { universityId: "00000000-0000-4000-8000-000000000001", code: "UGBS 221",  slug: "ugbs-221",  title: "Business Statistics",              yearLevel: 2, memberCount: 201 },
  // University of Lagos
  { universityId: "00000000-0000-4000-8000-000000000002", code: "CSC 101",   slug: "csc-101",   title: "Introduction to Computer Science", yearLevel: 1, memberCount: 543 },
  { universityId: "00000000-0000-4000-8000-000000000002", code: "MTH 101",   slug: "mth-101",   title: "Elementary Mathematics I",         yearLevel: 1, memberCount: 621 },
  { universityId: "00000000-0000-4000-8000-000000000002", code: "ECO 121",   slug: "eco-121",   title: "Principles of Economics I",        yearLevel: 1, memberCount: 398 },
  { universityId: "00000000-0000-4000-8000-000000000002", code: "PHY 101",   slug: "phy-101",   title: "General Physics I",                yearLevel: 1, memberCount: 467 },
  // Makerere University
  { universityId: "00000000-0000-4000-8000-000000000003", code: "CIT 1101",  slug: "cit-1101",  title: "Introduction to Computing",        yearLevel: 1, memberCount: 289 },
  { universityId: "00000000-0000-4000-8000-000000000003", code: "ECO 1101",  slug: "eco-1101",  title: "Introduction to Economics",        yearLevel: 1, memberCount: 334 },
  { universityId: "00000000-0000-4000-8000-000000000003", code: "BBA 1101",  slug: "bba-1101",  title: "Principles of Management",         yearLevel: 1, memberCount: 256 },
];

async function main() {
  console.log("Seeding universities…");
  await db.insert(universities)
    .values(UNI_DATA)
    .onConflictDoNothing();

  console.log("Seeding courses…");
  for (const course of COURSE_DATA) {
    await db.insert(courses)
      .values({ ...course, materialCount: 0 })
      .onConflictDoNothing();
  }

  console.log("Seeding promo codes…");
  await db.insert(promoCodes)
    .values([
      {
        code:         "MERIDIAN-JUDGE",
        durationDays: 30,
        usageLimit:   100,
        usageCount:   0,
      },
      {
        code:         "STUDENT50",
        durationDays: 14,
        usageLimit:   500,
        usageCount:   0,
      },
    ])
    .onConflictDoNothing();

  console.log("✓ Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});

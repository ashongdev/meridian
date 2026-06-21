/**
 * Apply DB indexes to Aurora DSQL.
 * Aurora DSQL requires CREATE INDEX ASYNC (indexes are built in the background).
 * Safe to run multiple times — duplicate index names are skipped (42P07).
 * Run: npx tsx --env-file=.env.local scripts/apply-indexes.ts
 */
import "./_network-fix";
import { Pool } from "pg";

const host     = process.env.AURORA_DSQL_ENDPOINT!;
const password = process.env.AURORA_DSQL_TOKEN!;

if (!host || !password) {
  console.error("Missing AURORA_DSQL_ENDPOINT or AURORA_DSQL_TOKEN");
  process.exit(1);
}

const pool = new Pool({ host, port: 5432, database: "postgres", user: "admin", password, ssl: true });

// Aurora DSQL requires ASYNC keyword — index build happens in the background.
// IF NOT EXISTS is supported with ASYNC.
const indexes = [
  // courses
  "CREATE INDEX ASYNC IF NOT EXISTS courses_university_id_idx ON courses (university_id)",
  "CREATE INDEX ASYNC IF NOT EXISTS courses_slug_idx ON courses (slug)",
  "CREATE INDEX ASYNC IF NOT EXISTS courses_university_slug_idx ON courses (university_id, slug)",
  // course_memberships
  "CREATE INDEX ASYNC IF NOT EXISTS memberships_user_course_idx ON course_memberships (user_id, course_id)",
  "CREATE INDEX ASYNC IF NOT EXISTS memberships_course_idx ON course_memberships (course_id)",
  // materials
  "CREATE INDEX ASYNC IF NOT EXISTS materials_course_created_idx ON materials (course_id, created_at)",
  "CREATE INDEX ASYNC IF NOT EXISTS materials_course_sha256_idx ON materials (course_id, sha256)",
  "CREATE INDEX ASYNC IF NOT EXISTS materials_embedding_status_idx ON materials (embedding_status)",
  // posts
  "CREATE INDEX ASYNC IF NOT EXISTS posts_course_pinned_created_idx ON posts (course_id, is_pinned, created_at)",
  // comments
  "CREATE INDEX ASYNC IF NOT EXISTS comments_post_idx ON comments (post_id, created_at)",
  // study_groups
  "CREATE INDEX ASYNC IF NOT EXISTS study_groups_course_idx ON study_groups (course_id)",
  // study_group_members
  "CREATE INDEX ASYNC IF NOT EXISTS study_group_members_group_user_idx ON study_group_members (group_id, user_id)",
  // group_messages
  "CREATE INDEX ASYNC IF NOT EXISTS group_messages_group_created_idx ON group_messages (group_id, created_at)",
  // ai_sessions
  "CREATE INDEX ASYNC IF NOT EXISTS ai_sessions_user_course_idx ON ai_sessions (user_id, course_id)",
  // promo_redemptions
  "CREATE INDEX ASYNC IF NOT EXISTS promo_redemptions_user_code_idx ON promo_redemptions (user_id, promo_code_id)",
  // upvotes
  "CREATE INDEX ASYNC IF NOT EXISTS upvotes_user_target_idx ON upvotes (user_id, target_id, target_type)",
];

async function run() {
  const client = await pool.connect();
  let ok = 0;
  let fail = 0;

  try {
    for (const sql of indexes) {
      const name = sql.match(/IF NOT EXISTS (\S+)/)?.[1] ?? sql;
      try {
        await client.query(sql);
        console.log(`  ✓ ${name}`);
        ok++;
      } catch (err: unknown) {
        const pg = err as { code?: string; message?: string };
        if (pg.code === "42P07") {
          console.log(`  - ${name} (already exists)`);
          ok++;
        } else {
          console.error(`  ✗ ${name}: ${pg.message}`);
          fail++;
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });

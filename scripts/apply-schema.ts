/**
 * Applies the latest generated SQL migration directly to Aurora DSQL,
 * bypassing drizzle-kit's interactive TTY requirement.
 *
 * Usage: npm run db:apply
 */
import "./_network-fix";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const endpoint = process.env.AURORA_DSQL_ENDPOINT;
const token    = process.env.AURORA_DSQL_TOKEN;

if (!endpoint || !token) {
  console.error("Missing AURORA_DSQL_ENDPOINT or AURORA_DSQL_TOKEN");
  process.exit(1);
}

const pool = new Pool({
  host:                    endpoint,
  port:                    5432,
  database:                "postgres",
  user:                    "admin",
  password:                token,
  ssl:                     { rejectUnauthorized: false },
  max:                     1,
  connectionTimeoutMillis: 15000,
});

async function main() {
  const drizzleDir = path.join(process.cwd(), "drizzle");
  const sqlFiles = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (sqlFiles.length === 0) {
    console.error("No SQL files in drizzle/. Run npm run db:generate first.");
    process.exit(1);
  }

  console.log(`Connecting to ${endpoint}…`);
  const client = await pool.connect();

  try {
    for (const file of sqlFiles) {
      const raw = fs.readFileSync(path.join(drizzleDir, file), "utf8");
      // drizzle uses "--> statement-breakpoint" as statement separator
      const statements = raw
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

      console.log(`\nApplying ${file} (${statements.length} statements)…`);

      for (const sql of statements) {
        try {
          await client.query(sql);
          const label = sql.slice(0, 60).replace(/\s+/g, " ");
          console.log(`  ✓ ${label}…`);
        } catch (err: unknown) {
          const e = err as { code?: string; message?: string };
          if (e.code === "42P07") {
            // 42P07 = duplicate_table — already exists, skip
            const label = sql.slice(0, 60).replace(/\s+/g, " ");
            console.log(`  ~ ${label}… (already exists)`);
          } else {
            console.error(`  ✗ Failed: ${e.message}`);
            console.error(`    SQL: ${sql.slice(0, 120)}`);
            throw err;
          }
        }
      }
    }

    console.log("\n✓ Schema applied.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});

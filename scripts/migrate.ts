/**
 * Run Drizzle migrations against Aurora DSQL.
 *
 * Usage:
 *   AURORA_DSQL_ENDPOINT=<host> AURORA_DSQL_TOKEN=<token> npx tsx scripts/migrate.ts
 *
 * Or with a .env.local file:
 *   npx tsx --env-file=.env.local scripts/migrate.ts
 */

import "./_network-fix";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";

const endpoint = process.env.AURORA_DSQL_ENDPOINT;
const token = process.env.AURORA_DSQL_TOKEN;

if (!endpoint || !token) {
  console.error(
    "\n[migrate] Missing required env vars:\n" +
    "  AURORA_DSQL_ENDPOINT — your Aurora DSQL cluster endpoint\n" +
    "  AURORA_DSQL_TOKEN    — IAM auth token (from aws dsql generate-db-connect-admin-auth-token)\n\n" +
    "Generate a token:\n" +
    "  aws dsql generate-db-connect-admin-auth-token \\\n" +
    "    --hostname <endpoint> \\\n" +
    "    --region <region> \\\n" +
    "    --expires-in 3600\n"
  );
  process.exit(1);
}

const pool = new Pool({
  host: endpoint,
  port: 5432,
  database: "postgres",
  user: "admin",
  password: token,
  ssl: { rejectUnauthorized: true },
  max: 1,
  connectionTimeoutMillis: 15000,
});

async function main() {
  console.log(`[migrate] Connecting to ${endpoint}…`);

  const db = drizzle(pool);

  const migrationsFolder = path.join(process.cwd(), "drizzle");

  console.log(`[migrate] Running migrations from ${migrationsFolder}…`);
  await migrate(db, { migrationsFolder });

  console.log("[migrate] Done.");
  await pool.end();
}

main().catch((err) => {
  console.error("[migrate] Failed:", err.message);
  process.exit(1);
});

import "./_network-fix";
import { Pool } from "pg";
import { ingestMaterial } from "../src/lib/ai/ingest";

const databaseUrl = process.env.DATABASE_URL;
const endpoint    = process.env.AURORA_DSQL_ENDPOINT;
const token       = process.env.AURORA_DSQL_TOKEN;

if (!databaseUrl && (!endpoint || !token)) {
  throw new Error("Set DATABASE_URL (local) or AURORA_DSQL_ENDPOINT + AURORA_DSQL_TOKEN (Aurora DSQL)");
}

const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl, max: 1 })
  : new Pool({
      host: endpoint!, port: 5432, database: "postgres",
      user: "admin", password: token!,
      ssl: { rejectUnauthorized: false }, max: 1,
    });

async function main() {
  const { rows } = await pool.query<{
    id: string; course_id: string; file_url: string; mime_type: string | null; title: string;
  }>(
    `SELECT id, course_id, file_url, mime_type, title
     FROM materials
     WHERE embedding_status IN ('pending', 'failed')
     ORDER BY created_at`
  );

  if (rows.length === 0) {
    console.log("No materials need ingesting.");
    return;
  }

  for (const m of rows) {
    console.log(`\nIngesting "${m.title}" (${m.id})...`);
    try {
      const result = await ingestMaterial({
        id:       m.id,
        courseId: m.course_id,
        fileUrl:  m.file_url,
        mimeType: m.mime_type,
      });
      console.log(`  Done: ${result.chunks} chunks (skipped=${result.skipped})`);
    } catch (err) {
      console.error(`  Failed:`, err);
    }
  }
}

main().finally(() => pool.end());

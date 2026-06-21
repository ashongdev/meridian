/**
 * Enable pgvector extension and create material_chunks table.
 * Uses VECTOR_DB_URL (Supabase — Aurora DSQL doesn't support the vector extension).
 *
 * Run: npx tsx --env-file=.env.local scripts/setup-vectors.ts
 */
import { Pool } from "pg";

const connString = process.env.VECTOR_DB_URL;

if (!connString) {
  console.error("Set VECTOR_DB_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: connString, max: 1 });

async function run() {
  const client = await pool.connect();
  try {
    console.log("Enabling pgvector…");
    await client.query("CREATE EXTENSION IF NOT EXISTS vector");

    console.log("Creating material_chunks table…");
    await client.query(`
      CREATE TABLE IF NOT EXISTS material_chunks (
        id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        material_id  uuid        NOT NULL,
        course_id    uuid        NOT NULL,
        chunk_index  integer     NOT NULL,
        content      text        NOT NULL,
        embedding    vector(384),
        created_at   timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Index for scoped vector search (course → nearest chunks)
    await client.query(`
      CREATE INDEX IF NOT EXISTS material_chunks_course_idx
        ON material_chunks (course_id)
    `);

    // IVFFlat index for fast approximate nearest-neighbour search
    await client.query(`
      CREATE INDEX IF NOT EXISTS material_chunks_embedding_idx
        ON material_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 50)
    `);

    console.log("✓ Vector setup complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });

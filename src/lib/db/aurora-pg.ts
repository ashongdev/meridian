import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as vectorSchema from "./vector-schema";

function createVectorDb() {
  const url = process.env.AURORA_PG_URL;
  if (!url) {
    throw new Error(
      "AURORA_PG_URL must be set for the vector database. " +
      "See IMPLEMENTATION.md for environment variable setup."
    );
  }

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: true },
    max: 5,
  });

  return drizzle(pool, { schema: vectorSchema });
}

let _vectorDb: ReturnType<typeof createVectorDb> | null = null;

export function getVectorDb() {
  if (!_vectorDb) _vectorDb = createVectorDb();
  return _vectorDb;
}

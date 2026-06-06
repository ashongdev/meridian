import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function createPool() {
  const endpoint = process.env.AURORA_DSQL_ENDPOINT;
  const token = process.env.AURORA_DSQL_TOKEN;

  if (!endpoint || !token) {
    throw new Error(
      "AURORA_DSQL_ENDPOINT and AURORA_DSQL_TOKEN must be set. " +
      "See IMPLEMENTATION.md for environment variable setup."
    );
  }

  return new Pool({
    host: endpoint,
    port: 5432,
    database: "postgres",
    user: "admin",
    password: token,
    ssl: { rejectUnauthorized: true },
    max: 10,
    idleTimeoutMillis: 30000,
  });
}

// Lazy singleton — pool created on first DB access, not at import time
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (!_db) {
    _pool = createPool();
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle<typeof schema>>];
  },
});

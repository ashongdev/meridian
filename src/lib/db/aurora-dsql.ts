import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const TOKEN_TTL_MS = 50 * 60 * 1000;
let _cachedToken = process.env.AURORA_DSQL_TOKEN ?? "";
let _tokenExpiry = _cachedToken ? Date.now() + TOKEN_TTL_MS : 0;
let _pool: Pool | null = null;
let _db:   Db   | null = null;
let _poolToken  = "";

async function getToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;
  const { DsqlSigner } = await import("@aws-sdk/dsql-signer");
  const signer = new DsqlSigner({
    hostname: process.env.AURORA_DSQL_ENDPOINT!,
    region:   process.env.AWS_REGION ?? "eu-north-1",
  });
  _cachedToken = await signer.getDbConnectAdminAuthToken();
  _tokenExpiry = Date.now() + TOKEN_TTL_MS;
  return _cachedToken;
}

/**
 * Call at the start of every route handler. Generates/rotates the Aurora DSQL
 * auth token and rebuilds the pool only when the token changes (every ~50 min).
 */
export async function ensureDb(): Promise<void> {
  const token = await getToken();
  if (!_db || token !== _poolToken) {
    if (_pool) await _pool.end().catch(() => {});
    _pool = new Pool({
      host:                    process.env.AURORA_DSQL_ENDPOINT!,
      port:                    5432,
      database:                "postgres",
      user:                    "admin",
      password:                token,
      ssl:                     { rejectUnauthorized: true },
      max:                     3,
      connectionTimeoutMillis: 12_000,
      idleTimeoutMillis:       20_000,
    });
    _db        = drizzle(_pool, { schema });
    _poolToken = token;
  }
}

function getDb(): Db {
  if (!_db) throw new Error("DB not initialised — call `await ensureDb()` first");
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return getDb()[prop as keyof Db];
  },
});

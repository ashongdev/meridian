import { Pool } from "pg";

const endpoint = process.env.AURORA_DSQL_ENDPOINT;
const token    = process.env.AURORA_DSQL_TOKEN;

if (!endpoint || !token) {
  console.error("Missing AURORA_DSQL_ENDPOINT or AURORA_DSQL_TOKEN");
  process.exit(1);
}

console.log("Endpoint:", endpoint);
console.log("Token starts with:", token.slice(0, 60), "…");

const pool = new Pool({
  host:                   endpoint,
  port:                   5432,
  database:               "postgres",
  user:                   "admin",
  password:               token,
  ssl:                    { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  max:                    1,
});

pool.connect()
  .then(async (client) => {
    console.log("\n✓ Connected.");
    const { rows } = await client.query("SELECT current_database(), current_user, version()");
    console.log("DB:", rows[0].current_database);
    console.log("User:", rows[0].current_user);
    console.log("PG version:", rows[0].version);

    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log("\nTables in public schema:");
    if (tables.length === 0) {
      console.log("  (none — schema was not applied)");
    } else {
      tables.forEach((t) => console.log(" ", t.tablename));
    }

    client.release();
    await pool.end();
  })
  .catch((err) => {
    console.error("\n✗ Connection failed:");
    console.error("  Code:", err.code);
    console.error("  Message:", err.message);
    console.error("  Detail:", err.detail ?? "(none)");
    process.exit(1);
  });

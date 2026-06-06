import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/lib/db/schema.ts"],  // vector-schema targets Aurora PG, not DSQL
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: process.env.AURORA_DSQL_ENDPOINT
    ? {
        host:     process.env.AURORA_DSQL_ENDPOINT,
        port:     5432,
        database: "postgres",
        user:     "admin",
        password: process.env.AURORA_DSQL_TOKEN,
        ssl:      true,
      }
    : {
        url: "postgresql://localhost:5432/meridian_dev",
      },
});

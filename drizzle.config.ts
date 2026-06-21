import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/lib/db/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host:     process.env.AURORA_DSQL_ENDPOINT!,
    port:     5432,
    database: "postgres",
    user:     "admin",
    password: process.env.AURORA_DSQL_TOKEN,
    ssl:      true,
  },
});

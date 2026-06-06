import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/lib/db/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host:     process.env.AURORA_DSQL_ENDPOINT!,
        port:     5432,
        database: "postgres",
        user:     "admin",
        password: process.env.AURORA_DSQL_TOKEN,
        ssl:      true,
      },
});

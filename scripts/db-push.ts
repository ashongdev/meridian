import { execFileSync } from "child_process";
import path from "path";

const drizzleKit = path.join(process.cwd(), "node_modules/.bin/drizzle-kit");

try {
  execFileSync(drizzleKit, ["push"], {
    env: process.env,
    stdio: "inherit",
  });
} catch (err: unknown) {
  const e = err as { status?: number };
  process.exit(e.status ?? 1);
}

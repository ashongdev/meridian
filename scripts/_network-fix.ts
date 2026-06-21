import { setDefaultAutoSelectFamily } from "net";
import { setDefaultResultOrder } from "dns";

// This machine has no IPv6 routing — Node's Happy Eyeballs races IPv4 + IPv6
// simultaneously and both legs can fail together (AggregateError wrapping
// ETIMEDOUT + ENETUNREACH). Same root cause as the fix in src/instrumentation.ts,
// needed separately here since standalone CLI scripts don't go through Next.js's
// instrumentation hook. Import this first, before any network code runs.
setDefaultAutoSelectFamily(false);
setDefaultResultOrder("ipv4first");

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // This machine has no IPv6 routing. Node's Happy Eyeballs algorithm races IPv4 +
    // IPv6 connection attempts simultaneously for any dual-stack hostname, and on a
    // machine like this both can fail together (AggregateError wrapping ETIMEDOUT +
    // ENETUNREACH) even though a plain IPv4-only attempt would have succeeded.
    // Two separate mechanisms need the same IPv4-only fix: Undici (used by fetch —
    // Google OAuth, etc.) and Node's net/tls module (used by pg — Aurora DSQL).

    const { setGlobalDispatcher, Agent } = await import("undici");
    // `family` is a valid Node net.connect option but missing from undici's published connect types
    type AgentOptions = ConstructorParameters<typeof Agent>[0];
    setGlobalDispatcher(new Agent({ connect: { family: 4 } } as AgentOptions));

    // Disabling the race alone isn't enough — without it, net.connect() falls back to
    // a single sequential attempt using whatever order dns.lookup() returns, and this
    // OS's resolver doesn't prefer IPv4 by default. Force IPv4-first explicitly too.
    const { setDefaultAutoSelectFamily } = await import("net");
    const { setDefaultResultOrder } = await import("dns");
    setDefaultAutoSelectFamily(false);
    setDefaultResultOrder("ipv4first");
  }
}

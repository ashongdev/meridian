export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js v20+ (Undici) uses Happy Eyeballs — tries IPv4 + IPv6 simultaneously.
    // On machines without IPv6 routing, both attempts race and fail.
    // Force IPv4-only so fetch() can reliably reach Google OAuth endpoints.
    const { setGlobalDispatcher, Agent } = await import("undici");
    // `family` is a valid Node net.connect option but missing from undici's published connect types
    type AgentOptions = ConstructorParameters<typeof Agent>[0];
    setGlobalDispatcher(new Agent({ connect: { family: 4 } } as AgentOptions));
  }
}

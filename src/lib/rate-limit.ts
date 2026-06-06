/**
 * In-memory sliding-window rate limiter.
 * Production upgrade path: replace Map with Upstash Redis INCR + EXPIRE.
 *
 * Usage:
 *   const { limited, retryAfter } = rateLimit(`post:${userId}`, 5, 60_000);
 *   if (limited) return NextResponse.json({ error: "Too many requests" }, {
 *     status: 429, headers: { "Retry-After": String(retryAfter) }
 *   });
 */

type Bucket = { count: number; reset: number };

const store = new Map<string, Bucket>();

/**
 * @param key      Unique string (e.g. "post:userId")
 * @param max      Max requests allowed within the window
 * @param windowMs Window duration in ms
 * @returns { limited: boolean, retryAfter: number (seconds) }
 */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now    = Date.now();
  let bucket   = store.get(key);

  if (!bucket || now > bucket.reset) {
    bucket = { count: 0, reset: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count++;

  if (bucket.count > max) {
    return { limited: true, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
  }

  return { limited: false, retryAfter: 0 };
}

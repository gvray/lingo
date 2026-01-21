import type { Context, Next } from "hono";

type Bucket = { count: number; resetAt: number };

export function rateLimit(options?: { windowMs?: number; max?: number }) {
  const windowMs = options?.windowMs ?? 10000;
  const max = options?.max ?? 50;
  const buckets = new Map<string, Bucket>();

  return async (c: Context, next: Next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      "local";
    const now = Date.now();
    const b = buckets.get(ip);
    if (!b || now >= b.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (b.count >= max) {
      return c.json({ error: "Too Many Requests" }, 429);
    }
    b.count += 1;
    return next();
  };
}

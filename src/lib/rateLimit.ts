import { prisma } from "./prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Simple, zero-cost rate limiter backed by the existing Postgres database -
 * no external service (Upstash/Redis/Cloudflare) needed. Tracks attempts per
 * "bucket" (a string combining an action name and an identifier, usually IP
 * address or email) within a rolling time window.
 *
 * This is deliberately simple rather than perfectly precise (it does a
 * count-then-insert, which has a small race window under very high concurrent
 * load) - for a district office's realistic traffic, that tradeoff is fine,
 * and it avoids needing any paid rate-limiting service.
 */
export async function checkRateLimit(
  action: string,
  identifier: string,
  opts: { maxAttempts: number; windowMinutes: number }
): Promise<RateLimitResult> {
  const bucket = `${action}:${identifier}`;
  const windowStart = new Date(Date.now() - opts.windowMinutes * 60 * 1000);

  // Clean up old entries for this bucket opportunistically (keeps the table small)
  await prisma.rateLimitAttempt.deleteMany({
    where: { bucket, createdAt: { lt: windowStart } },
  });

  const count = await prisma.rateLimitAttempt.count({
    where: { bucket, createdAt: { gte: windowStart } },
  });

  if (count >= opts.maxAttempts) {
    const oldest = await prisma.rateLimitAttempt.findFirst({
      where: { bucket, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
    });
    const retryAfterSeconds = oldest
      ? Math.max(1, Math.ceil((oldest.createdAt.getTime() + opts.windowMinutes * 60 * 1000 - Date.now()) / 1000))
      : opts.windowMinutes * 60;
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  await prisma.rateLimitAttempt.create({ data: { bucket } });
  return { allowed: true, remaining: opts.maxAttempts - count - 1 };
}

/** Extracts the caller's IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

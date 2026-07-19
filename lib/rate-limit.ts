import { logger } from "@/lib/logger";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();
let warnedAboutMemoryBackend = false;

function cleanupExpired(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  retryAfterMs?: number;
};

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true };
}

/**
 * Deploy-safe rate limiter.
 * - Development: in-memory buckets
 * - Production without a shared store: stricter in-memory limit + warning
 *   (configure UPSTASH_REDIS_REST_URL later for multi-instance correctness)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const isProd = process.env.NODE_ENV === "production";
  const hasSharedStore = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (isProd && !hasSharedStore && !warnedAboutMemoryBackend) {
    warnedAboutMemoryBackend = true;
    logger.warn("rate_limit_memory_backend", {
      message:
        "Using in-memory rate limits in production. Configure Upstash Redis for multi-instance protection.",
    });
  }

  // Until a shared backend is wired, apply a stricter ceiling in production.
  const effectiveLimit =
    isProd && !hasSharedStore ? Math.max(1, Math.floor(limit / 2)) : limit;

  return memoryRateLimit(key, effectiveLimit, windowMs);
}

/**
 * Prefer platform-trusted IP headers over spoofable X-Forwarded-For.
 */
export function getClientIp(
  forwardedFor: string | null,
  realIp: string | null,
  vercelForwardedFor?: string | null
): string {
  const trusted =
    vercelForwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    null;

  if (trusted) return trusted;

  // Last resort: first X-Forwarded-For hop (may be spoofable behind untrusted proxies).
  const forwarded = forwardedFor?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

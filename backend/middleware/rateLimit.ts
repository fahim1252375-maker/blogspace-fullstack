import type { RequestHandler } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

interface ClientBucket {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_CLIENTS = 10_000;

/**
 * A small per-process IP rate limiter for sensitive endpoints.
 * Use a shared store (for example Redis) if the service runs multiple instances.
 */
export const createRateLimiter = ({
  windowMs,
  max,
  message,
}: RateLimitOptions): RequestHandler => {
  if (!Number.isFinite(windowMs) || windowMs <= 0 || !Number.isInteger(max) || max <= 0) {
    throw new Error('Rate limiter requires a positive windowMs and a positive integer max.');
  }

  const clients = new Map<string, ClientBucket>();
  let nextCleanupAt = 0;

  return (req, res, next) => {
    const now = Date.now();
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';

    if (now >= nextCleanupAt) {
      for (const [key, bucket] of clients) {
        if (bucket.resetAt <= now) clients.delete(key);
      }
      nextCleanupAt = now + 60_000;
    }

    let bucket = clients.get(clientKey);

    if (!bucket || bucket.resetAt <= now) {
      if (clients.size >= MAX_TRACKED_CLIENTS) {
        const oldestKey = clients.keys().next().value;
        if (oldestKey) clients.delete(oldestKey);
      }
      bucket = { count: 1, resetAt: now + windowMs };
    } else {
      bucket.count += 1;
    }

    // Move the active client to the end so the oldest inactive bucket is evicted first.
    clients.delete(clientKey);
    clients.set(clientKey, bucket);

    const remaining = Math.max(0, max - bucket.count);
    const resetInSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(resetInSeconds));
    res.setHeader('RateLimit-Policy', `${max};w=${Math.ceil(windowMs / 1000)}`);

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(resetInSeconds));
      res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: resetInSeconds,
      });
      return;
    }

    next();
  };
};

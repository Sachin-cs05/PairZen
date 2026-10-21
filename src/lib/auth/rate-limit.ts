interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory rate limit store for sliding time windows
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

export interface RateLimitOptions {
  limit: number; // Maximum number of requests allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * Checks whether an action from a given identifier (IP/user) has exceeded the rate limit.
 * Returns { success: boolean, remaining: number, resetInSeconds: number }.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60000 }
): { success: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  if (!existing || existing.resetAt <= now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: options.limit - existing.count,
    resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

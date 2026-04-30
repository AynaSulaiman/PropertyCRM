// In-memory rate limiter (production: use Redis)
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  windowMs: number  // Time window in ms
  max: number       // Max requests per window
}

export function rateLimit(key: string, options: RateLimitOptions): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.max - 1, resetAt: now + options.windowMs }
  }

  if (entry.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: options.max - entry.count, resetAt: entry.resetAt }
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const keys = Array.from(store.keys())
  for (const key of keys) {
    const entry = store.get(key)
    if (entry && now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

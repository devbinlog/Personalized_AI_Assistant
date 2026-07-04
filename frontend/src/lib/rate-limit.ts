type Entry = { count: number; reset: number }

const store = new Map<string, Entry>()

// Prune expired entries every 5 minutes to prevent memory leaks
const PRUNE_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.reset) store.delete(key)
  }
}, PRUNE_INTERVAL).unref?.()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return { allowed: true, remaining: limit - 1, reset: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, reset: entry.reset }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, reset: entry.reset }
}

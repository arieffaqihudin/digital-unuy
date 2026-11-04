import { getRequestIP, type H3Event } from 'h3'

type Entry = { count: number; resetAt: number }
const buckets = new Map<string, Entry>()
let lastSweep = Date.now()

function sweep() {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key)
  }
}

export function checkRateLimit(
  event: H3Event,
  name: string,
  limit: number,
  windowMs: number,
  discriminator = ''
) {
  sweep()
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const key = `${name}:${ip}:${discriminator.toLowerCase()}`
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  existing.count += 1
  if (existing.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    setHeader(event, 'Retry-After', String(retryAfter))
    throw createError({
      statusCode: 429,
      statusMessage: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.`
    })
  }
}

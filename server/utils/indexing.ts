/** Indexing policy shared by robots.txt, X-Robots-Tag header, and sitemap. */

const LOCAL_HOST = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/i

export function getSiteBase(): string {
  const config = useRuntimeConfig()
  return String(config.public.siteUrl || config.siteUrl || '').replace(/\/+$/, '')
}

export function isLocalBase(base = getSiteBase()): boolean {
  try {
    return LOCAL_HOST.test(new URL(base).hostname)
  } catch {
    return true
  }
}

/**
 * Search engines may index only when running in production with a real https site URL,
 * and NUXT_PUBLIC_NOINDEX is not "true" (use it for staging builds that run with NODE_ENV=production).
 */
export function isIndexableEnvironment(): boolean {
  if (process.env.NUXT_PUBLIC_NOINDEX === 'true') return false
  if (process.env.NODE_ENV !== 'production') return false
  const base = getSiteBase()
  return base.startsWith('https://') && !isLocalBase(base)
}

/** Routes that must never be indexed, regardless of environment. */
export const PRIVATE_PATTERNS: RegExp[] = [
  /^\/admin(\/|$)/,
  /^\/masuk(\/|$)/,
  /^\/aktivasi(\/|$)/,
  /^\/lacak(\/|$)/,
  /^\/permohonan-saya(\/|$)/,
  /^\/lacak-permohonan(\/|$)/,
  /^\/pencarian(\/|$)/,
  /^\/layanan\/[^/]+\/ajukan(\/|$)/,
  /^\/api(\/|$)/
]

export function isPrivatePath(path: string): boolean {
  const clean = path.split('?')[0]
  return PRIVATE_PATTERNS.some((pattern) => pattern.test(clean))
}

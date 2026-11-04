export default defineEventHandler((event) => {
  const base = getSiteBase()
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=600')

  if (!isIndexableEnvironment()) {
    // Development / staging: ask crawlers to stay away. Real protection is the X-Robots-Tag header
    // and (for staging) access control at the host; robots.txt alone is not a safeguard.
    return `User-agent: *\nDisallow: /\n`
  }

  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /masuk
Disallow: /aktivasi
Disallow: /lacak
Disallow: /permohonan-saya
Disallow: /pencarian
Disallow: /layanan/*/ajukan
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`
})

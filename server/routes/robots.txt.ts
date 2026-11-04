export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const base = String(config.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /masuk
Disallow: /aktivasi
Disallow: /lacak
Disallow: /api

Sitemap: ${base}/sitemap.xml
`
})

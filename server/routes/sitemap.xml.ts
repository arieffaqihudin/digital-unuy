import { Article, DigitalPlatform, Document, Page, Service } from '../models'

interface Entry {
  loc: string
  lastmod?: Date | string | null
}

export default defineEventHandler(async (event) => {
  const base = getSiteBase()
  if (process.env.NODE_ENV === 'production' && isLocalBase(base)) {
    throw createError({ statusCode: 503, statusMessage: 'NUXT_PUBLIC_SITE_URL belum diatur ke domain produksi.' })
  }

  let data
  try {
    await connectDb()
    // Content with seo.noindex is excluded so the sitemap matches page-level robots directives.
    const visible = { 'seo.noindex': { $ne: true } }
    data = await Promise.all([
      Service.find({ active: true, ...visible }).select('slug updatedAt').lean(),
      Document.find({ published: true, archived: false }).select('slug updatedAt').lean(),
      Article.find({ status: 'published', ...visible }).select('slug updatedAt').lean(),
      Page.find({ published: true, ...visible }).select('slug updatedAt').lean(),
      DigitalPlatform.find({ published: true, ...visible }).select('slug updatedAt').lean()
    ])
  } catch {
    // Never serve an empty sitemap because the CMS was unreachable.
    throw createError({ statusCode: 503, statusMessage: 'Sitemap sementara tidak tersedia.' })
  }
  const [services, documents, articles, pages, platforms] = data

  // Static pages carry no reliable modification date, so no <lastmod> is emitted for them.
  const entries: Entry[] = [
    { loc: '/' },
    { loc: '/tentang' },
    { loc: '/ekosistem-digital' },
    { loc: '/layanan' },
    { loc: '/tentang-kami/tim' },
    { loc: '/dokumen' },
    { loc: '/publikasi' },
    ...platforms.map((item) => ({ loc: `/ekosistem-digital/${item.slug}`, lastmod: item.updatedAt })),
    ...services.map((item) => ({ loc: `/layanan/${item.slug}`, lastmod: item.updatedAt })),
    ...documents.map((item) => ({ loc: `/dokumen/${item.slug}`, lastmod: item.updatedAt })),
    ...articles.map((item) => ({ loc: `/publikasi/${item.slug}`, lastmod: item.updatedAt })),
    ...pages.filter((item) => item.slug !== 'tentang-kami').map((item) => ({ loc: `/halaman/${item.slug}`, lastmod: item.updatedAt }))
  ]

  const seen = new Set<string>()
  const lines = entries
    .filter((entry) => !seen.has(entry.loc) && seen.add(entry.loc))
    .map((entry) => {
      const date = entry.lastmod ? new Date(entry.lastmod) : null
      const lastmod = date && !Number.isNaN(date.getTime()) ? `<lastmod>${date.toISOString()}</lastmod>` : ''
      return `  <url><loc>${escapeXml(base + entry.loc)}</loc>${lastmod}</url>`
    })

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=600')
  if (!isIndexableEnvironment()) setHeader(event, 'X-Robots-Tag', 'noindex')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines.join('\n')}
</urlset>`
})

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

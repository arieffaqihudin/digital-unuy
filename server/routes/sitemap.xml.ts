import { Article, Document, Page, Service } from '../models'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const base = String(config.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  const [services, documents, articles, pages] = await Promise.all([
    Service.find({ active: true }).select('slug updatedAt').lean(),
    Document.find({ published: true, archived: false }).select('slug updatedAt').lean(),
    Article.find({ status: 'published' }).select('slug updatedAt').lean(),
    Page.find({ published: true }).select('slug updatedAt').lean()
  ])

  const urls = [
    { loc: '/', lastmod: new Date().toISOString() },
    { loc: '/tentang', lastmod: new Date().toISOString() },
    { loc: '/layanan', lastmod: new Date().toISOString() },
    { loc: '/ekosistem-digital', lastmod: new Date().toISOString() },
    { loc: '/dokumen', lastmod: new Date().toISOString() },
    { loc: '/publikasi', lastmod: new Date().toISOString() },
    ...services.map((service) => ({ loc: `/layanan/${service.slug}`, lastmod: service.updatedAt })),
    ...documents.map((doc) => ({ loc: `/dokumen/${doc.slug}`, lastmod: doc.updatedAt })),
    ...articles.map((article) => ({ loc: `/publikasi/${article.slug}`, lastmod: article.updatedAt })),
    ...pages
      .filter((page) => page.slug !== 'tentang-kami')
      .map((page) => ({ loc: `/halaman/${page.slug}`, lastmod: page.updatedAt }))
  ]

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url><loc>${escapeXml(base + url.loc)}</loc><lastmod>${new Date(
      url.lastmod
    ).toISOString()}</lastmod></url>`
  )
  .join('\n')}
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

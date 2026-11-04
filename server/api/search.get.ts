import { Article, DigitalPlatform, Document, Page, Service } from '../models'
import { toIso } from '../utils/serializers'
import { SEARCH_CONTENT_TYPES, type SearchContentType, type SearchResultDTO } from '../../shared/types'

const TYPE_LABELS = Object.fromEntries(SEARCH_CONTENT_TYPES.map((type) => [type.value, type.label])) as Record<SearchContentType, string>
const TYPE_ORDER: Record<SearchContentType, number> = { service: 1, platform: 2, document: 3, article: 4, page: 5 }
const ALL_TYPES = SEARCH_CONTENT_TYPES.map((type) => type.value) as SearchContentType[]

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function plainText(value: unknown, max = 220) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function pageHref(slug: string) {
  return slug === 'tentang-kami' ? '/tentang' : `/halaman/${slug}`
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 10)
  const term = String(query.q || '').trim().slice(0, 120)
  const requestedType = String(query.type || '').trim()
  if (requestedType && !ALL_TYPES.includes(requestedType as SearchContentType)) {
    throw createError({ statusCode: 422, statusMessage: 'Jenis konten pencarian tidak valid.' })
  }
  const type = (requestedType || '') as SearchContentType | ''
  const emptyCounts = Object.fromEntries(ALL_TYPES.map((item) => [item, 0]))
  if (term.length < 2) {
    return { query: term, items: [] as SearchResultDTO[], total: 0, page, pageSize, counts: emptyCounts }
  }

  checkRateLimit(event, 'public-search', 120, 60_000)
  const regex = new RegExp(escapeRegex(term), 'i')
  const fetchLimit = 120

  const [services, platforms, documents, articles, pages] = await Promise.all([
    Service.find({
      active: true,
      $or: [{ name: regex }, { shortDescription: regex }, { description: regex }, { category: regex }]
    })
      .select('name slug shortDescription category updatedAt')
      .sort({ updatedAt: -1 })
      .limit(fetchLimit)
      .lean(),
    DigitalPlatform.find({
      published: true,
      $or: [{ name: regex }, { description: regex }, { category: regex }, { unit: regex }, { audiences: regex }, { features: regex }, { benefits: regex }]
    })
      .select('name slug description category updatedAt')
      .sort({ updatedAt: -1 })
      .limit(fetchLimit)
      .lean(),
    Document.find({
      published: true,
      archived: false,
      $or: [{ title: regex }, { description: regex }, { category: regex }]
    })
      .select('title slug description category updatedAt')
      .sort({ updatedAt: -1 })
      .limit(fetchLimit)
      .lean(),
    Article.find({
      status: 'published',
      $or: [{ title: regex }, { excerpt: regex }, { category: regex }]
    })
      .select('title slug excerpt category updatedAt')
      .sort({ publishedAt: -1 })
      .limit(fetchLimit)
      .lean(),
    Page.find({
      published: true,
      $or: [{ title: regex }, { excerpt: regex }, { seoDescription: regex }]
    })
      .select('title slug excerpt seoDescription updatedAt')
      .sort({ updatedAt: -1 })
      .limit(fetchLimit)
      .lean()
  ])

  const items: SearchResultDTO[] = [
    ...services.map((item) => ({
      id: `service-${String(item._id)}`,
      type: 'service' as const,
      typeLabel: TYPE_LABELS.service,
      title: item.name,
      category: item.category,
      excerpt: plainText(item.shortDescription || item.description),
      href: `/layanan/${item.slug}`,
      updatedAt: toIso(item.updatedAt)
    })),
    ...platforms.map((item) => ({
      id: `platform-${String(item._id)}`,
      type: 'platform' as const,
      typeLabel: TYPE_LABELS.platform,
      title: item.name,
      category: item.category,
      excerpt: plainText(item.description),
      href: `/ekosistem-digital/${item.slug}`,
      updatedAt: toIso(item.updatedAt)
    })),
    ...documents.map((item) => ({
      id: `document-${String(item._id)}`,
      type: 'document' as const,
      typeLabel: TYPE_LABELS.document,
      title: item.title,
      category: item.category,
      excerpt: plainText(item.description),
      href: `/dokumen/${item.slug}`,
      updatedAt: toIso(item.updatedAt)
    })),
    ...articles.map((item) => ({
      id: `article-${String(item._id)}`,
      type: 'article' as const,
      typeLabel: TYPE_LABELS.article,
      title: item.title,
      category: item.category,
      excerpt: plainText(item.excerpt),
      href: `/publikasi/${item.slug}`,
      updatedAt: toIso(item.updatedAt)
    })),
    ...pages.map((item) => ({
      id: `page-${String(item._id)}`,
      type: 'page' as const,
      typeLabel: TYPE_LABELS.page,
      title: item.title,
      category: 'Informasi publik',
      excerpt: plainText(item.excerpt || item.seoDescription),
      href: pageHref(item.slug),
      updatedAt: toIso(item.updatedAt)
    }))
  ]

  items.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.title.localeCompare(b.title, 'id'))
  const counts = Object.fromEntries(ALL_TYPES.map((item) => [item, items.filter((entry) => entry.type === item).length]))
  const filtered = type ? items.filter((item) => item.type === type) : items

  return {
    query: term,
    items: filtered.slice(skip, skip + pageSize),
    total: filtered.length,
    page,
    pageSize,
    counts
  }
})

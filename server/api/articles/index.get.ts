import { Article } from '../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 9)
  const search = String(query.q || '').trim().slice(0, 120)
  const category = String(query.category || '').trim()

  const filter: Record<string, unknown> = { status: 'published' }
  if (category) filter.category = category
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ title: regex }, { excerpt: regex }, { category: regex }]
  }

  const [items, total, categories] = await Promise.all([
    Article.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(pageSize).lean(),
    Article.countDocuments(filter),
    Article.distinct('category', { status: 'published' })
  ])

  return {
    items: items.map((article) => serializeArticle(article)),
    total,
    page,
    pageSize,
    categories: categories.sort()
  }
})

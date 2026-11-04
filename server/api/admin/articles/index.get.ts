import { Article } from '../../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.manage')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 20)
  const search = String(query.q || '').trim().slice(0, 100)
  const filter: Record<string, unknown> = {}
  if (query.status) filter.status = String(query.status)
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ title: regex }, { category: regex }, { author: regex }]
  }
  const [items, total] = await Promise.all([
    Article.find(filter).sort({ publishedAt: -1, updatedAt: -1 }).skip(skip).limit(pageSize).lean(),
    Article.countDocuments(filter)
  ])
  return { items: items.map((article) => serializeArticle(article)), total, page, pageSize }
})

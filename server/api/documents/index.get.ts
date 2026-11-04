import { Document } from '../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 12)
  const search = String(query.q || '').trim().slice(0, 120)
  const category = String(query.category || '').trim()

  const filter: Record<string, unknown> = { published: true, archived: false }
  if (category) filter.category = category
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ title: regex }, { description: regex }, { category: regex }]
  }

  const [items, total, categories] = await Promise.all([
    Document.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('currentVersion')
      .populate('services', 'name slug')
      .lean(),
    Document.countDocuments(filter),
    Document.distinct('category', { published: true, archived: false })
  ])

  return {
    items: items.map((doc) => serializeDocument(doc)),
    total,
    page,
    pageSize,
    categories: categories.sort()
  }
})

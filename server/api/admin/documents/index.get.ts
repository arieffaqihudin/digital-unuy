import { Document } from '../../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'documents.manage')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 20)
  const search = String(query.q || '').trim().slice(0, 120)
  const filter: Record<string, unknown> = {}
  if (query.category) filter.category = String(query.category)
  if (query.status === 'published') {
    filter.published = true
    filter.archived = false
  } else if (query.status === 'draft') {
    filter.published = false
    filter.archived = false
  } else if (query.status === 'archived') {
    filter.archived = true
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ title: regex }, { description: regex }, { category: regex }]
  }

  const [items, total] = await Promise.all([
    Document.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('currentVersion')
      .populate('services', 'name slug')
      .lean(),
    Document.countDocuments(filter)
  ])

  return { items: items.map((doc) => serializeDocument(doc)), total, page, pageSize }
})

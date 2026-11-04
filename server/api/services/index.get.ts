import { Service } from '../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 12)
  const search = String(query.q || '').trim().slice(0, 120)
  const category = String(query.category || '').trim()

  const filter: Record<string, unknown> = { active: true }
  if (category) filter.category = category
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: regex }, { shortDescription: regex }, { description: regex }, { category: regex }]
  }

  const [items, total, categories] = await Promise.all([
    Service.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(pageSize).lean(),
    Service.countDocuments(filter),
    Service.distinct('category', { active: true })
  ])

  return {
    items: items.map((service) => serializeService(service)),
    total,
    page,
    pageSize,
    categories: categories.sort()
  }
})

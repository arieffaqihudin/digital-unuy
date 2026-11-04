import { DigitalPlatform } from '../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 24)
  const search = String(query.q || '').trim().slice(0, 120)
  const category = String(query.category || '').trim()
  const status = String(query.status || '').trim()

  const filter: Record<string, unknown> = {}
  if (category) filter.category = category
  if (status) filter.status = status
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: regex }, { description: regex }, { unit: regex }, { audience: regex }]
  }

  const [items, total, categories] = await Promise.all([
    DigitalPlatform.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(pageSize).lean(),
    DigitalPlatform.countDocuments(filter),
    DigitalPlatform.distinct('category')
  ])

  return {
    items: items.map((platform) => serializePlatform(platform)),
    total,
    page,
    pageSize,
    categories: categories.sort()
  }
})

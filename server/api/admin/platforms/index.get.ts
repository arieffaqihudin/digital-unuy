import { DigitalPlatform } from '../../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.manage')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 20)
  const search = String(query.q || '').trim().slice(0, 100)
  const filter: Record<string, unknown> = {}
  if (query.category) filter.category = String(query.category)
  if (query.status) filter.status = String(query.status)
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: regex }, { category: regex }, { unit: regex }]
  }

  const [items, total] = await Promise.all([
    DigitalPlatform.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(pageSize).lean(),
    DigitalPlatform.countDocuments(filter)
  ])
  return {
    items: items.map((platform) => serializePlatform(platform)),
    total,
    page,
    pageSize
  }
})

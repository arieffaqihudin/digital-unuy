import { Service } from '../../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'services.manage')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 20)
  const search = String(query.q || '').trim().slice(0, 120)
  const active = String(query.active || '')

  const filter: Record<string, unknown> = {}
  if (active === 'true') filter.active = true
  if (active === 'false') filter.active = false
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: regex }, { slug: regex }, { category: regex }]
  }

  const [items, total] = await Promise.all([
    Service.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(pageSize).lean(),
    Service.countDocuments(filter)
  ])

  return {
    items: items.map((service) => serializeService(service)),
    total,
    page,
    pageSize
  }
})

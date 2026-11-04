import { Program } from '../../../models'

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
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ title: regex }, { summary: regex }, { category: regex }]
  }
  const [items, total] = await Promise.all([
    Program.find(filter).sort({ order: 1, updatedAt: -1 }).skip(skip).limit(pageSize).lean(),
    Program.countDocuments(filter)
  ])
  return { items: items.map((program) => serializeProgram(program)), total, page, pageSize }
})

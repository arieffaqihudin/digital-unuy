import { ServiceRequest } from '../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 10)
  const status = String(query.status || '').trim()
  const search = String(query.q || '').trim().slice(0, 80)

  const filter: Record<string, unknown> = { user: user.id }
  if (status) filter.status = status
  if (search) {
    filter.$or = [
      { ticketNumber: new RegExp(escapeRegex(search), 'i') },
      { serviceName: new RegExp(escapeRegex(search), 'i') }
    ]
  }

  const [items, total] = await Promise.all([
    ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('assignedTo', 'name')
      .lean(),
    ServiceRequest.countDocuments(filter)
  ])

  return {
    items: items.map((request) => serializeRequestSummary(request)),
    total,
    page,
    pageSize
  }
})

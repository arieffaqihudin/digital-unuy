import { ServiceRequest } from '../../../models'
import { WAITING_SUBSTATUS } from '../../../../shared/types'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'requests.read')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 20)
  const status = String(query.status || '').trim()
  const service = String(query.service || '').trim()
  const assigned = String(query.assigned || '').trim()
  const search = String(query.q || '').trim().slice(0, 100)
  const waiting = String(query.waiting || '') === 'true'

  const filter: Record<string, unknown> = {}
  if (status) filter.status = status
  if (service) filter.serviceSlug = service
  if (assigned === 'unassigned') filter.assignedTo = null
  else if (isObjectId(assigned)) filter.assignedTo = assigned
  if (waiting) filter.substatus = WAITING_SUBSTATUS
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ ticketNumber: regex }, { serviceName: regex }, { 'data.nama_lengkap': regex }]
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

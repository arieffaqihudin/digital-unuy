import { AuditLog } from '../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'audit.read')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 30)
  const search = String(query.q || '').trim().slice(0, 100)
  const filter: Record<string, unknown> = {}
  if (query.action) filter.action = String(query.action)
  if (query.entityType) filter.entityType = String(query.entityType)
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ actorName: regex }, { actorEmail: regex }, { action: regex }, { entityId: regex }]
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    AuditLog.countDocuments(filter)
  ])
  return {
    items: items.map((item) => ({
      id: String(item._id),
      actorName: item.actorName,
      actorEmail: item.actorEmail,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      metadata: item.metadata,
      ip: item.ip,
      createdAt: item.createdAt
    })),
    total,
    page,
    pageSize
  }
})

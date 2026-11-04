import { NotificationLog } from '../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'notifications.read')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 30)
  const search = String(query.q || '').trim().slice(0, 100)
  const filter: Record<string, unknown> = {}
  if (query.status) filter.status = String(query.status)
  if (query.template) filter.template = String(query.template)
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ recipient: regex }, { template: regex }, { reference: regex }]
  }

  const [items, total, failed] = await Promise.all([
    NotificationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    NotificationLog.countDocuments(filter),
    NotificationLog.countDocuments({ status: 'failed' })
  ])
  return {
    items: items.map((item) => ({
      id: String(item._id),
      template: item.template,
      recipient: item.recipient,
      status: item.status,
      provider: item.provider,
      error: item.error,
      reference: item.reference,
      createdAt: item.createdAt
    })),
    total,
    failed,
    page,
    pageSize
  }
})

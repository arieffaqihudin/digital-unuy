import { ServiceRequest } from '../../models'
import { WAITING_SUBSTATUS } from '../../../shared/types'

function notificationTitle(status: string, substatus: string) {
  if (substatus === WAITING_SUBSTATUS) return 'Menunggu kelengkapan pemohon'
  if (status === 'Diajukan') return 'Permohonan baru menunggu verifikasi'
  if (status === 'Diverifikasi') return 'Permohonan siap diproses'
  if (status === 'Diproses') return 'Permohonan sedang diproses'
  if (status === 'Selesai') return 'Permohonan telah selesai'
  if (status === 'Ditolak') return 'Permohonan ditolak'
  return 'Pembaruan permohonan'
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'notifications.read')
  await requirePermission(event, 'requests.read')

  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 20)
  const view = String(query.view || 'all')
  const filter: Record<string, unknown> = {}

  if (view === 'action') {
    filter.status = { $in: ['Diajukan', 'Diverifikasi'] }
  } else if (view === 'waiting') {
    filter.substatus = WAITING_SUBSTATUS
  } else {
    filter.lastActivityAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  }

  const [items, total, actionCount, waitingCount] = await Promise.all([
    ServiceRequest.find(filter).sort({ lastActivityAt: -1 }).skip(skip).limit(pageSize).lean(),
    ServiceRequest.countDocuments(filter),
    ServiceRequest.countDocuments({ status: { $in: ['Diajukan', 'Diverifikasi'] } }),
    ServiceRequest.countDocuments({ substatus: WAITING_SUBSTATUS })
  ])

  setHeader(event, 'Cache-Control', 'no-store')

  return {
    items: items.map((request) => {
      const waiting = request.substatus === WAITING_SUBSTATUS
      const actionRequired = ['Diajukan', 'Diverifikasi'].includes(request.status)
      return {
        id: String(request._id),
        ticketNumber: request.ticketNumber,
        title: notificationTitle(request.status, request.substatus || ''),
        description: `${request.serviceName}${request.requesterName ? ` · ${request.requesterName}` : ''}`,
        status: request.status,
        substatus: request.substatus || '',
        kind: waiting ? 'waiting' : actionRequired ? 'action' : 'info',
        actionRequired,
        href: `/admin/permohonan/${String(request._id)}`,
        updatedAt: request.lastActivityAt || request.updatedAt
      }
    }),
    total,
    actionCount,
    waitingCount,
    page,
    pageSize
  }
})

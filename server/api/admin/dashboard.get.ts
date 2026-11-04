import { ServiceRequest } from '../../models'
import { WAITING_SUBSTATUS } from '../../../shared/types'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'requests.read')
  const query = getQuery(event)
  const period = String(query.period || '30d')
  const now = new Date()
  const from = new Date(now)
  if (period === '7d') from.setDate(from.getDate() - 7)
  else if (period === '30d') from.setDate(from.getDate() - 30)
  else if (period === '90d') from.setDate(from.getDate() - 90)
  else from.setFullYear(2000)

  const dateFilter = { createdAt: { $gte: from } }
  const [total, submitted, processing, completed, rejected, waiting, recent, actionQueue, completedDocs] =
    await Promise.all([
      ServiceRequest.countDocuments(dateFilter),
      ServiceRequest.countDocuments({ ...dateFilter, status: 'Diajukan' }),
      ServiceRequest.countDocuments({ ...dateFilter, status: 'Diproses' }),
      ServiceRequest.countDocuments({ ...dateFilter, status: 'Selesai' }),
      ServiceRequest.countDocuments({ ...dateFilter, status: 'Ditolak' }),
      ServiceRequest.countDocuments({ ...dateFilter, substatus: WAITING_SUBSTATUS }),
      ServiceRequest.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('assignedTo', 'name')
        .lean(),
      ServiceRequest.find({
        ...dateFilter,
        $or: [{ status: 'Diajukan' }, { status: 'Diverifikasi' }, { substatus: WAITING_SUBSTATUS }]
      })
        .sort({ createdAt: 1 })
        .limit(8)
        .populate('assignedTo', 'name')
        .lean(),
      ServiceRequest.find({ ...dateFilter, status: 'Selesai' })
        .select('createdAt lastActivityAt')
        .lean()
    ])

  const terminal = completed + rejected
  const completionRate = terminal ? Math.round((completed / terminal) * 100) : null
  const averageHours =
    completedDocs.length > 0
      ? Math.round(
          completedDocs.reduce(
            (sum, request) =>
              sum +
              Math.max(
                0,
                (new Date(request.lastActivityAt || request.createdAt).getTime() -
                  new Date(request.createdAt).getTime()) /
                  3_600_000
              ),
            0
          ) / completedDocs.length
        )
      : null

  return {
    period,
    counts: {
      total,
      submitted,
      processing,
      completed,
      rejected,
      waitingOnRequester: waiting
    },
    simpleStats: {
      completionRate,
      averageResolutionHours: averageHours
    },
    recent: recent.map((request) => serializeRequestSummary(request)),
    actionQueue: actionQueue.map((request) => serializeRequestSummary(request))
  }
})

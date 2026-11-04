import { RequestComment, RequestStatusHistory, ServiceRequest } from '../../../models'
import { WAITING_SUBSTATUS } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const body = await readBody(event)
  const message = String(body?.message || '').trim()
  if (message.length < 5) throw createError({ statusCode: 422, statusMessage: 'Keterangan minimal 5 karakter.' })
  if (message.length > 5000) {
    throw createError({ statusCode: 422, statusMessage: 'Keterangan maksimal 5000 karakter.' })
  }
  checkRateLimit(event, 'request-response', 12, 10 * 60 * 1000, user.id)

  const request = await ServiceRequest.findOne({ _id: id, user: user.id })
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })
  if (request.substatus !== WAITING_SUBSTATUS) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Permohonan ini tidak sedang menunggu kelengkapan dari pemohon.'
    })
  }

  const fromStatus = request.status
  request.status = 'Diverifikasi'
  request.substatus = ''
  request.requestedCompletionNote = ''
  request.lastActivityAt = new Date()
  await request.save()

  await RequestComment.create({
    request: request._id,
    author: user.id,
    authorName: user.name,
    message,
    visibility: 'public'
  })

  await RequestStatusHistory.create({
    request: request._id,
    fromStatus,
    toStatus: 'Diverifikasi',
    note: 'Pemohon telah mengirimkan kelengkapan yang diminta.',
    actor: user.id,
    actorName: user.name
  })

  await recordAudit(event, user, 'request.completed_info', 'ServiceRequest', String(request._id), {
    ticketNumber: request.ticketNumber
  })

  return { ok: true, status: request.status }
})

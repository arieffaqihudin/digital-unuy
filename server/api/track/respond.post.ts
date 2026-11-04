import { RequestComment, RequestStatusHistory, ServiceRequest } from '../../models'
import { WAITING_SUBSTATUS } from '../../../shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  checkRateLimit(event, 'track-respond', 20, 10 * 60 * 1000)
  const request = await requireTrackedRequest(body?.ticket, body?.token)
  const message = String(body?.message || '').trim()
  if (message.length < 5) throw createError({ statusCode: 422, statusMessage: 'Keterangan minimal 5 karakter.' })
  if (message.length > 5000) throw createError({ statusCode: 422, statusMessage: 'Keterangan maksimal 5000 karakter.' })
  if (request.substatus !== WAITING_SUBSTATUS) {
    throw createError({ statusCode: 409, statusMessage: 'Permohonan ini tidak sedang menunggu kelengkapan.' })
  }

  const updated = await ServiceRequest.findOneAndUpdate(
    { _id: request._id, substatus: WAITING_SUBSTATUS },
    {
      $set: {
        status: 'Diverifikasi',
        substatus: '',
        requestedCompletionNote: '',
        lastActivityAt: new Date()
      }
    },
    { new: true }
  )
  if (!updated) {
    throw createError({ statusCode: 409, statusMessage: 'Status permohonan telah berubah. Muat ulang halaman.' })
  }

  await RequestComment.create({
    request: request._id,
    author: null,
    authorName: request.requesterName || 'Pemohon',
    message,
    visibility: 'public'
  })

  await RequestStatusHistory.create({
    request: request._id,
    fromStatus: request.status,
    toStatus: 'Diverifikasi',
    note: 'Pemohon telah mengirimkan kelengkapan yang diminta.',
    actor: null,
    actorName: request.requesterName || 'Pemohon'
  })

  await recordAudit(event, null, 'request.completed_info_guest', 'ServiceRequest', String(request._id), {
    ticketNumber: request.ticketNumber,
    requesterEmail: request.requesterEmail
  })

  return { ok: true, status: updated.status }
})

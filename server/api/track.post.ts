import {
  RequestAttachment,
  RequestComment,
  RequestStatusHistory,
  ServiceRequest
} from '../models'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ticket = String(body?.ticket || '').trim().toUpperCase()
  const token = String(body?.token || '').trim()
  checkRateLimit(event, 'tracking', 30, 10 * 60 * 1000)

  if (!ticket || !token) {
    throw createError({ statusCode: 400, statusMessage: 'Nomor tiket dan token akses wajib diisi.' })
  }

  const request = await ServiceRequest.findOne({ ticketNumber: ticket }).lean()
  if (!request || !safeEqual(request.trackingTokenHash, hashToken(token))) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Permohonan tidak ditemukan. Periksa kembali nomor tiket dan token akses.'
    })
  }

  const [timeline, comments, attachments] = await Promise.all([
    RequestStatusHistory.find({ request: request._id }).sort({ createdAt: 1 }).lean(),
    RequestComment.find({ request: request._id, visibility: 'public' }).sort({ createdAt: 1 }).lean(),
    RequestAttachment.find({ request: request._id }).sort({ createdAt: 1 }).lean()
  ])

  setHeader(event, 'Cache-Control', 'no-store')
  return {
    request: serializeRequestDetail(request, timeline, comments, attachments, {
      includeInternal: false
    })
  }
})

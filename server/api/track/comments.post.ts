import { RequestComment, ServiceRequest } from '../../models'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  checkRateLimit(event, 'track-comment', 20, 10 * 60 * 1000)
  const request = await requireTrackedRequest(body?.ticket, body?.token)
  const message = String(body?.message || '').trim()
  if (message.length < 3) throw createError({ statusCode: 422, statusMessage: 'Pesan minimal 3 karakter.' })
  if (message.length > 5000) throw createError({ statusCode: 422, statusMessage: 'Pesan maksimal 5000 karakter.' })

  const comment = await RequestComment.create({
    request: request._id,
    author: null,
    authorName: request.requesterName || 'Pemohon',
    message,
    visibility: 'public'
  })
  await ServiceRequest.findByIdAndUpdate(request._id, { lastActivityAt: new Date() })
  await recordAudit(event, null, 'request.comment_added_guest', 'ServiceRequest', String(request._id), {
    ticketNumber: request.ticketNumber,
    requesterEmail: request.requesterEmail
  })

  return {
    comment: {
      id: String(comment._id),
      message: comment.message,
      authorName: comment.authorName,
      createdAt: comment.createdAt
    }
  }
})

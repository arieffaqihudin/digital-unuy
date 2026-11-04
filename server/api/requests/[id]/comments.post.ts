import { RequestComment, ServiceRequest } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const body = await readBody(event)
  const message = String(body?.message || '').trim()
  if (message.length < 3) throw createError({ statusCode: 422, statusMessage: 'Pesan minimal 3 karakter.' })
  if (message.length > 5000) throw createError({ statusCode: 422, statusMessage: 'Pesan maksimal 5000 karakter.' })
  checkRateLimit(event, 'request-comment', 20, 10 * 60 * 1000, user.id)

  const request = await ServiceRequest.findOne({ _id: id, user: user.id })
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const comment = await RequestComment.create({
    request: request._id,
    author: user.id,
    authorName: user.name,
    message,
    visibility: 'public'
  })

  request.lastActivityAt = new Date()
  await request.save()
  await recordAudit(event, user, 'request.comment_added', 'ServiceRequest', String(request._id), {
    ticketNumber: request.ticketNumber,
    visibility: 'public'
  })

  return {
    comment: {
      id: String(comment._id),
      message: comment.message,
      visibility: comment.visibility,
      authorName: comment.authorName,
      createdAt: comment.createdAt
    }
  }
})

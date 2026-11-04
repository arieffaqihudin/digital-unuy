import {
  RequestAttachment,
  RequestComment,
  RequestStatusHistory,
  ServiceRequest
} from '../../models'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const request = await ServiceRequest.findOne({ _id: id, user: user.id })
    .populate('assignedTo', 'name')
    .lean()
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

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

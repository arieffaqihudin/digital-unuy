import {
  RequestAttachment,
  RequestComment,
  RequestStatusHistory,
  ServiceRequest,
  User
} from '../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'requests.read')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const request = await ServiceRequest.findById(id).populate('assignedTo', 'name email').lean()
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const [timeline, comments, attachments, requester, assignees] = await Promise.all([
    RequestStatusHistory.find({ request: request._id }).sort({ createdAt: 1 }).lean(),
    RequestComment.find({ request: request._id }).sort({ createdAt: 1 }).lean(),
    RequestAttachment.find({ request: request._id }).sort({ createdAt: 1 }).lean(),
    User.findById(request.user).select('name email active role').lean(),
    User.find({ role: { $in: ['admin', 'superadmin'] }, active: true })
      .select('name email role')
      .sort({ name: 1 })
      .lean()
  ])

  setHeader(event, 'Cache-Control', 'no-store')
  return {
    request: serializeRequestDetail(request, timeline, comments, attachments, {
      includeInternal: true
    }),
    requester: requester
      ? {
          id: String(requester._id),
          name: requester.name,
          email: requester.email,
          active: requester.active,
          role: requester.role
        }
      : null,
    assignees: assignees.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role
    }))
  }
})

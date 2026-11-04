import { RequestAttachment, ServiceRequest } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Lampiran tidak ditemukan.' })

  const attachment = await RequestAttachment.findById(id).lean()
  if (!attachment) throw createError({ statusCode: 404, statusMessage: 'Lampiran tidak ditemukan.' })

  const request = await ServiceRequest.findById(attachment.request).select('user ticketNumber').lean()
  const isOwner = request && String(request.user) === user.id
  const canManage = user.permissions.includes('requests.read')
  if (!isOwner && !canManage) {
    throw createError({ statusCode: 403, statusMessage: 'Anda tidak memiliki akses ke lampiran ini.' })
  }

  const buffer = await readPrivateUpload(attachment.storageKey)
  setHeader(event, 'Content-Type', attachment.mimeType)
  setHeader(event, 'Content-Disposition', contentDisposition(attachment.originalName, true))
  setHeader(event, 'Content-Length', String(buffer.length))
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  await recordAudit(event, user, 'attachment.accessed', 'RequestAttachment', String(attachment._id), {
    ticketNumber: request?.ticketNumber || '',
    owner: isOwner
  })

  return buffer
})

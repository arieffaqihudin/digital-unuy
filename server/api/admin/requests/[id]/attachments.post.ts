import { RequestAttachment, ServiceRequest } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'requests.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const request = await ServiceRequest.findById(id).lean()
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })
  if (['Selesai', 'Ditolak'].includes(request.status)) {
    throw createError({ statusCode: 409, statusMessage: 'Lampiran tidak dapat ditambahkan pada permohonan yang sudah ditutup.' })
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === 'file' && part.filename)
  if (!file) throw createError({ statusCode: 422, statusMessage: 'Pilih file yang akan diunggah.' })

  const saved = await savePrivateUpload({
    data: file.data,
    originalName: file.filename || 'hasil',
    mimeType: String(file.type || ''),
    maxMB: 10,
    folder: `requests/${String(request._id)}/admin`
  })

  const attachment = await RequestAttachment.create({
    request: request._id,
    fieldKey: 'hasil_penyelesaian',
    originalName: saved.originalName,
    storageKey: saved.storageKey,
    mimeType: saved.mimeType,
    size: saved.size,
    uploadedBy: user.id
  })

  await ServiceRequest.findByIdAndUpdate(request._id, { lastActivityAt: new Date() })
  await recordAudit(event, user, 'request.attachment_uploaded', 'ServiceRequest', String(request._id), {
    ticketNumber: request.ticketNumber,
    attachmentId: String(attachment._id)
  })

  return {
    attachment: {
      id: String(attachment._id),
      fieldKey: attachment.fieldKey,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size
    }
  }
})

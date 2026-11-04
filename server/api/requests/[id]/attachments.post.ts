import { RequestAttachment, ServiceRequest } from '../../../models'
import { WAITING_SUBSTATUS } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const request = await ServiceRequest.findOne({ _id: id, user: user.id }).lean()
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })
  if (request.substatus !== WAITING_SUBSTATUS) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Lampiran hanya dapat ditambahkan ketika petugas meminta kelengkapan.'
    })
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === 'file' && part.filename)
  if (!file) throw createError({ statusCode: 422, statusMessage: 'Pilih file yang akan diunggah.' })

  const saved = await savePrivateUpload({
    data: file.data,
    originalName: file.filename || 'kelengkapan',
    mimeType: String(file.type || ''),
    maxMB: 10,
    folder: `requests/${String(request._id)}/requester`
  })

  const attachment = await RequestAttachment.create({
    request: request._id,
    fieldKey: 'kelengkapan_pemohon',
    originalName: saved.originalName,
    storageKey: saved.storageKey,
    mimeType: saved.mimeType,
    size: saved.size,
    uploadedBy: user.id
  })

  await ServiceRequest.findByIdAndUpdate(request._id, { lastActivityAt: new Date() })
  await recordAudit(event, user, 'request.attachment_uploaded_by_requester', 'ServiceRequest', String(request._id), {
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

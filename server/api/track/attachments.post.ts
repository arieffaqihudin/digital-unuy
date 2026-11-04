import { RequestAttachment, ServiceRequest } from '../../models'
import { WAITING_SUBSTATUS } from '../../../shared/types'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, 'track-attachment', 15, 10 * 60 * 1000)
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'Data unggahan kosong.' })
  const ticketPart = parts.find((part) => part.name === 'ticket')
  const tokenPart = parts.find((part) => part.name === 'token')
  const file = parts.find((part) => part.name === 'file' && part.filename)
  const request = await requireTrackedRequest(
    ticketPart?.data?.toString('utf8'),
    tokenPart?.data?.toString('utf8')
  )
  if (!file) throw createError({ statusCode: 422, statusMessage: 'Pilih file yang akan diunggah.' })
  if (request.substatus !== WAITING_SUBSTATUS) {
    throw createError({ statusCode: 409, statusMessage: 'Lampiran hanya dapat ditambahkan saat diminta petugas.' })
  }

  const saved = await savePrivateUpload({
    data: file.data,
    originalName: file.filename || 'kelengkapan',
    mimeType: String(file.type || ''),
    maxMB: 10,
    folder: `requests/${String(request._id)}/guest`
  })

  const attachment = await RequestAttachment.create({
    request: request._id,
    fieldKey: 'kelengkapan_pemohon',
    originalName: saved.originalName,
    storageKey: saved.storageKey,
    mimeType: saved.mimeType,
    size: saved.size,
    uploadedBy: null
  })

  await ServiceRequest.findByIdAndUpdate(request._id, { lastActivityAt: new Date() })
  await recordAudit(event, null, 'request.attachment_uploaded_guest', 'ServiceRequest', String(request._id), {
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

import { Document, DocumentVersion } from '../../../../models'

const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip'
]

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'documents.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })
  const doc = await Document.findById(id)
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })

  const parts = await readMultipartFormData(event)
  const metaPart = parts?.find((part) => part.name === 'metadata')
  const filePart = parts?.find((part) => part.name === 'file' && part.filename)
  if (!filePart) throw createError({ statusCode: 422, statusMessage: 'File versi baru wajib diunggah.' })
  let metadata: any = {}
  if (metaPart) {
    try {
      metadata = JSON.parse(metaPart.data.toString('utf8'))
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Metadata versi tidak dapat dibaca.' })
    }
  }

  const versionLabel = String(metadata?.version || '').trim()
  if (!versionLabel) throw createError({ statusCode: 422, statusMessage: 'Nomor versi wajib diisi.' })
  if (await DocumentVersion.exists({ document: doc._id, version: versionLabel })) {
    throw createError({ statusCode: 409, statusMessage: 'Nomor versi tersebut sudah digunakan.' })
  }
  const effectiveDate = parseDate(metadata?.effectiveDate)

  const saved = await savePrivateUpload({
    data: filePart.data,
    originalName: filePart.filename || 'dokumen',
    mimeType: String(filePart.type || ''),
    allowedMimes: ALLOWED_DOCUMENT_MIMES,
    maxMB: 10,
    folder: `documents/${String(doc._id)}`
  })

  try {
    const version = await DocumentVersion.create({
      document: doc._id,
      version: versionLabel.slice(0, 30),
      fileName: saved.originalName,
      storageKey: saved.storageKey,
      mimeType: saved.mimeType,
      size: saved.size,
      effectiveDate,
      changelog: String(metadata?.changelog || '').slice(0, 1000),
      createdBy: user.id
    })
    doc.currentVersionId = version._id
    doc.archived = false
    await doc.save()

    await recordAudit(event, user, 'document.version_uploaded', 'Document', String(doc._id), {
      title: doc.title,
      version: version.version
    })
    return {
      version: {
        id: String(version._id),
        version: version.version,
        fileName: version.fileName,
        createdAt: version.createdAt
      }
    }
  } catch (error) {
    await deletePrivateUpload(saved.storageKey)
    await DocumentVersion.deleteMany({ storageKey: saved.storageKey }).catch(() => {})
    throw error
  }
})

function parseDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 422, statusMessage: 'Tanggal berlaku tidak valid.' })
  }
  return date
}

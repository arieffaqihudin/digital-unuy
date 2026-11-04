import { Document, DocumentVersion } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'documents.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })
  const doc = await Document.findById(id).lean()
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })

  const versionId = String(getQuery(event).versionId || '')
  const version = isObjectId(versionId)
    ? await DocumentVersion.findOne({ _id: versionId, document: doc._id }).lean()
    : await DocumentVersion.findById(doc.currentVersionId).lean()
  if (!version) throw createError({ statusCode: 404, statusMessage: 'Versi dokumen tidak ditemukan.' })

  const buffer = await readPrivateUpload(version.storageKey)
  setHeader(event, 'Content-Type', version.mimeType)
  setHeader(event, 'Content-Disposition', contentDisposition(version.fileName, true))
  setHeader(event, 'Content-Length', String(buffer.length))
  setHeader(event, 'Cache-Control', 'private, no-store')
  await recordAudit(event, user, 'document.downloaded_admin', 'Document', String(doc._id), {
    title: doc.title,
    version: version.version
  })
  return buffer
})

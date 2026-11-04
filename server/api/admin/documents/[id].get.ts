import { Document, DocumentVersion } from '../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'documents.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })
  const doc = await Document.findById(id).populate('services', 'name slug').lean()
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })
  const versions = await DocumentVersion.find({ document: doc._id }).sort({ createdAt: -1 }).lean()
  const current = versions.find((version) => String(version._id) === String(doc.currentVersionId))

  return {
    document: {
      ...serializeDocument({ ...doc, currentVersion: current }),
      published: doc.published,
      archived: doc.archived,
      serviceIds: (doc.services || []).map((service: any) => String(service._id || service)),
      versions: versions.map((version) => ({
        id: String(version._id),
        version: version.version,
        fileName: version.fileName,
        mimeType: version.mimeType,
        size: version.size,
        effectiveDate: version.effectiveDate,
        changelog: version.changelog,
        createdAt: version.createdAt
      }))
    }
  }
})

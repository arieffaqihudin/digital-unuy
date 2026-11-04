import { Document } from '../../../models'

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
  const preview = String(getQuery(event).preview || '') === '1'
  const doc = await Document.findOne({ slug, published: true, archived: false })
    .populate('currentVersion')
    .lean()
  if (!doc?.currentVersion) {
    throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan atau belum diterbitkan.' })
  }

  const version = doc.currentVersion as any
  const buffer = await readPrivateUpload(version.storageKey)
  setHeader(event, 'Content-Type', version.mimeType)
  setHeader(event, 'Content-Disposition', contentDisposition(version.fileName, !preview))
  setHeader(event, 'Content-Length', String(buffer.length))
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  return buffer
})

import { Document } from '../../models'

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
  const doc = await Document.findOne({ slug, published: true, archived: false })
    .populate('currentVersion')
    .populate('services', 'name slug')
    .lean()
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })
  return { document: serializeDocument(doc) }
})

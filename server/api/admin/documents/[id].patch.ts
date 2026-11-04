import { Document, DocumentVersion, Service } from '../../../models'
import { DOCUMENT_CATEGORIES } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'documents.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })
  const doc = await Document.findById(id)
  if (!doc) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []

  if (body?.title !== undefined) {
    const title = String(body.title).trim()
    if (title.length < 3) throw createError({ statusCode: 422, statusMessage: 'Judul dokumen minimal 3 karakter.' })
    doc.title = title
    changed.push('title')
  }
  if (body?.slug !== undefined) {
    const nextSlug = slugify(String(body.slug))
    if (!nextSlug) throw createError({ statusCode: 422, statusMessage: 'Slug dokumen tidak valid.' })
    if (nextSlug !== doc.slug && (await Document.exists({ slug: nextSlug, _id: { $ne: doc._id } }))) {
      throw createError({ statusCode: 409, statusMessage: 'Slug dokumen sudah digunakan.' })
    }
    doc.slug = nextSlug
    changed.push('slug')
  }
  if (body?.category !== undefined) {
    if (!DOCUMENT_CATEGORIES.includes(body.category)) {
      throw createError({ statusCode: 422, statusMessage: 'Kategori dokumen tidak valid.' })
    }
    doc.category = body.category
    changed.push('category')
  }
  if (body?.description !== undefined) {
    doc.description = String(body.description).trim().slice(0, 1000)
    changed.push('description')
  }
  if (body?.published !== undefined) {
    doc.published = Boolean(body.published)
    changed.push('published')
  }
  if (body?.archived !== undefined) {
    doc.archived = Boolean(body.archived)
    if (doc.archived) doc.published = false
    changed.push('archived')
  }
  if (body?.serviceIds !== undefined) {
    const serviceIds = Array.isArray(body.serviceIds) ? body.serviceIds.filter(isObjectId) : []
    if (serviceIds.length) {
      const found = await Service.countDocuments({ _id: { $in: serviceIds } })
      if (found !== serviceIds.length) throw createError({ statusCode: 422, statusMessage: 'Layanan terkait tidak ditemukan.' })
    }
    doc.services = serviceIds
    changed.push('services')
  }

  if (doc.published) {
    const currentVersion = doc.currentVersionId
      ? await DocumentVersion.findById(doc.currentVersionId).lean()
      : null
    if (!currentVersion) {
      throw createError({ statusCode: 409, statusMessage: 'Dokumen belum memiliki file versi yang dapat diterbitkan.' })
    }
    if (doc.archived) {
      throw createError({ statusCode: 409, statusMessage: 'Dokumen yang diarsipkan tidak dapat diterbitkan.' })
    }
  }

  await doc.save()
  await recordAudit(event, user, 'document.updated', 'Document', String(doc._id), {
    title: doc.title,
    published: doc.published,
    archived: doc.archived,
    changed
  })

  const populated = await Document.findById(doc._id)
    .populate('currentVersion')
    .populate('services', 'name slug')
    .lean()
  return { document: serializeDocument(populated) }
})

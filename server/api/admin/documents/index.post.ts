import mongoose from 'mongoose'
import { Document, DocumentVersion, Service } from '../../../models'
import { DOCUMENT_CATEGORIES } from '../../../../shared/types'

const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip'
]

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'documents.manage')
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'Data dokumen kosong.' })

  const metadataPart = parts.find((part) => part.name === 'metadata')
  const filePart = parts.find((part) => part.name === 'file' && part.filename)
  if (!metadataPart) throw createError({ statusCode: 400, statusMessage: 'Metadata dokumen tidak ditemukan.' })
  if (!filePart) throw createError({ statusCode: 422, statusMessage: 'File dokumen wajib diunggah.' })

  let payload: any
  try {
    payload = JSON.parse(metadataPart.data.toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Metadata dokumen tidak dapat dibaca.' })
  }

  const title = String(payload?.title || '').trim()
  if (title.length < 3) throw createError({ statusCode: 422, statusMessage: 'Judul dokumen minimal 3 karakter.' })
  if (!DOCUMENT_CATEGORIES.includes(payload?.category)) {
    throw createError({ statusCode: 422, statusMessage: 'Kategori dokumen tidak valid.' })
  }
  const slug = slugify(String(payload?.slug || title))
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Slug dokumen tidak valid.' })
  if (await Document.exists({ slug })) throw createError({ statusCode: 409, statusMessage: 'Slug dokumen sudah digunakan.' })

  const serviceIds = Array.isArray(payload?.serviceIds) ? payload.serviceIds.filter(isObjectId) : []
  if (serviceIds.length) {
    const found = await Service.countDocuments({ _id: { $in: serviceIds } })
    if (found !== serviceIds.length) throw createError({ statusCode: 422, statusMessage: 'Layanan terkait tidak ditemukan.' })
  }

  const docId = new mongoose.Types.ObjectId()
  const saved = await savePrivateUpload({
    data: filePart.data,
    originalName: filePart.filename || 'dokumen',
    mimeType: String(filePart.type || ''),
    allowedMimes: ALLOWED_DOCUMENT_MIMES,
    maxMB: 10,
    folder: `documents/${String(docId)}`
  })

  try {
    const doc = await Document.create({
      _id: docId,
      title,
      slug,
      category: payload.category,
      description: String(payload?.description || '').trim().slice(0, 1000),
      published: Boolean(payload?.published),
      services: serviceIds,
      createdBy: user.id
    })
    const version = await DocumentVersion.create({
      document: doc._id,
      version: String(payload?.version || '1.0').trim().slice(0, 30),
      fileName: saved.originalName,
      storageKey: saved.storageKey,
      mimeType: saved.mimeType,
      size: saved.size,
      effectiveDate: validDate(payload?.effectiveDate),
      changelog: String(payload?.changelog || '').slice(0, 1000),
      createdBy: user.id
    })
    doc.currentVersionId = version._id
    await doc.save()

    await recordAudit(event, user, 'document.created', 'Document', String(doc._id), {
      title: doc.title,
      category: doc.category,
      published: doc.published
    })

    return {
      document: serializeDocument({ ...doc.toObject(), currentVersion: version.toObject(), services: serviceIds })
    }
  } catch (error) {
    await deletePrivateUpload(saved.storageKey)
    await Document.deleteOne({ _id: docId }).catch(() => {})
    await DocumentVersion.deleteMany({ document: docId }).catch(() => {})
    throw error
  }
})

function validDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 422, statusMessage: 'Tanggal berlaku tidak valid.' })
  }
  return date
}

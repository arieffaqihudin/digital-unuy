import { Document, Service, ServiceFormVersion } from '../../../models'
import { SERVICE_CATEGORIES } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'services.manage')
  const body = await readBody(event)

  const name = String(body?.name || '').trim()
  const description = String(body?.description || '').trim()
  const shortDescription = String(body?.shortDescription || '').trim()
  if (name.length < 3) throw createError({ statusCode: 422, statusMessage: 'Nama layanan minimal 3 karakter.' })
  if (shortDescription.length < 10) {
    throw createError({ statusCode: 422, statusMessage: 'Ringkasan layanan minimal 10 karakter.' })
  }
  if (description.length < 20) {
    throw createError({ statusCode: 422, statusMessage: 'Deskripsi layanan minimal 20 karakter.' })
  }
  if (!SERVICE_CATEGORIES.includes(body?.category)) {
    throw createError({ statusCode: 422, statusMessage: 'Kategori layanan tidak valid.' })
  }

  const { fields, error } = validateFormDefinition(body?.fields)
  if (error) throw createError({ statusCode: 422, statusMessage: error })

  const slug = slugify(String(body?.slug || name))
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Slug layanan tidak valid.' })
  if (await Service.exists({ slug })) {
    throw createError({ statusCode: 409, statusMessage: 'Slug layanan sudah digunakan.' })
  }

  const documentIds = Array.isArray(body?.documentIds) ? body.documentIds.filter(isObjectId) : []
  if (documentIds.length) {
    const found = await Document.countDocuments({ _id: { $in: documentIds } })
    if (found !== documentIds.length) {
      throw createError({ statusCode: 422, statusMessage: 'Dokumen terkait tidak ditemukan.' })
    }
  }

  const active = Boolean(body?.active)
  const service = await Service.create({
    seo: parseSeoInput(body?.seo),
    name,
    slug,
    shortDescription,
    description,
    category: body.category,
    icon: String(body?.icon || 'layers').slice(0, 40),
    active,
    acceptsRequests: Boolean(body?.acceptsRequests),
    featured: Boolean(body?.featured),
    order: Number(body?.order) || 0,
    targetUsers: stringArray(body?.targetUsers),
    requirements: stringArray(body?.requirements),
    requiredDocuments: stringArray(body?.requiredDocuments),
    procedure: stringArray(body?.procedure),
    estimatedDuration: String(body?.estimatedDuration || '').slice(0, 100),
    createdBy: user.id
  })

  try {
    const version = await ServiceFormVersion.create({
      service: service._id,
      version: 1,
      fields,
      createdBy: user.id
    })
    service.currentFormVersionId = version._id
    service.formVersionNumber = 1
    await service.save()
  } catch (error) {
    await Service.deleteOne({ _id: service._id })
    throw error
  }

  await recordAudit(event, user, 'service.created', 'Service', String(service._id), {
    name: service.name,
    slug: service.slug,
    active
  })

  return { service: serializeService(service, fields) }
})

function stringArray(input: unknown) {
  if (!Array.isArray(input)) return []
  return input.map((item) => String(item).trim()).filter(Boolean).slice(0, 40)
}

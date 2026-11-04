import { Document, Service, ServiceFormVersion } from '../../../models'
import { SERVICE_CATEGORIES } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'services.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.' })

  const service = await Service.findById(id)
  if (!service) throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []

  if (body?.name !== undefined) {
    const name = String(body.name).trim()
    if (name.length < 3) throw createError({ statusCode: 422, statusMessage: 'Nama layanan minimal 3 karakter.' })
    service.name = name
    changed.push('name')
  }
  if (body?.slug !== undefined) {
    const nextSlug = slugify(String(body.slug))
    if (!nextSlug) throw createError({ statusCode: 422, statusMessage: 'Slug layanan tidak valid.' })
    if (nextSlug !== service.slug && (await Service.exists({ slug: nextSlug, _id: { $ne: service._id } }))) {
      throw createError({ statusCode: 409, statusMessage: 'Slug layanan sudah digunakan.' })
    }
    service.slug = nextSlug
    changed.push('slug')
  }
  if (body?.shortDescription !== undefined) {
    const value = String(body.shortDescription).trim()
    if (value.length < 10) {
      throw createError({ statusCode: 422, statusMessage: 'Ringkasan layanan minimal 10 karakter.' })
    }
    service.shortDescription = value
    changed.push('shortDescription')
  }
  if (body?.description !== undefined) {
    const value = String(body.description).trim()
    if (value.length < 20) {
      throw createError({ statusCode: 422, statusMessage: 'Deskripsi layanan minimal 20 karakter.' })
    }
    service.description = value
    changed.push('description')
  }
  if (body?.category !== undefined) {
    if (!SERVICE_CATEGORIES.includes(body.category)) {
      throw createError({ statusCode: 422, statusMessage: 'Kategori layanan tidak valid.' })
    }
    service.category = body.category
    changed.push('category')
  }
  if (body?.icon !== undefined) {
    service.icon = String(body.icon).slice(0, 40)
    changed.push('icon')
  }
  if (body?.active !== undefined) {
    service.active = Boolean(body.active)
    changed.push('active')
  }
  if (body?.acceptsRequests !== undefined) {
    service.acceptsRequests = Boolean(body.acceptsRequests)
    changed.push('acceptsRequests')
  }
  if (body?.featured !== undefined) {
    service.featured = Boolean(body.featured)
    changed.push('featured')
  }
  if (body?.order !== undefined) {
    const order = Number(body.order)
    if (!Number.isFinite(order)) throw createError({ statusCode: 422, statusMessage: 'Urutan tidak valid.' })
    service.order = order
    changed.push('order')
  }
  for (const key of ['targetUsers', 'requirements', 'requiredDocuments', 'procedure'] as const) {
    if (body?.[key] !== undefined) {
      service[key] = stringArray(body[key])
      changed.push(key)
    }
  }
  if (body?.estimatedDuration !== undefined) {
    service.estimatedDuration = String(body.estimatedDuration || '').slice(0, 100)
    changed.push('estimatedDuration')
  }

  if (body?.fields !== undefined) {
    const { fields, error } = validateFormDefinition(body.fields)
    if (error) throw createError({ statusCode: 422, statusMessage: error })

    const current = service.currentFormVersionId
      ? await ServiceFormVersion.findById(service.currentFormVersionId).lean()
      : null
    const currentJson = JSON.stringify(current?.fields || [])
    const nextJson = JSON.stringify(fields)
    if (currentJson !== nextJson) {
      const nextVersion = (service.formVersionNumber || current?.version || 0) + 1
      const version = await ServiceFormVersion.create({
        service: service._id,
        version: nextVersion,
        fields,
        createdBy: user.id
      })
      service.currentFormVersionId = version._id
      service.formVersionNumber = nextVersion
      changed.push('fields')
    }
  }

  if (body?.documentIds !== undefined) {
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds.filter(isObjectId) : []
    if (documentIds.length) {
      const found = await Document.countDocuments({ _id: { $in: documentIds } })
      if (found !== documentIds.length) {
        throw createError({ statusCode: 422, statusMessage: 'Dokumen terkait tidak ditemukan.' })
      }
    }
    await Document.updateMany({ services: service._id }, { $pull: { services: service._id } })
    if (documentIds.length) {
      await Document.updateMany({ _id: { $in: documentIds } }, { $addToSet: { services: service._id } })
    }
    changed.push('documentIds')
  }

  if (service.active) {
    const version = service.currentFormVersionId
      ? await ServiceFormVersion.findById(service.currentFormVersionId).lean()
      : null
    if (!version?.fields?.length) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Layanan tidak dapat diaktifkan sebelum formulir memiliki minimal satu field.'
      })
    }
  }

  await service.save()
  await recordAudit(event, user, 'service.updated', 'Service', String(service._id), {
    name: service.name,
    changed
  })

  const formVersion = service.currentFormVersionId
    ? await ServiceFormVersion.findById(service.currentFormVersionId).lean()
    : null
  const documents = await Document.find({ services: service._id })
    .sort({ updatedAt: -1 })
    .populate('currentVersion')
    .lean()

  return {
    service: {
      ...serializeService(service, (formVersion?.fields || []) as any),
      documentIds: documents.map((doc) => String(doc._id))
    },
    documents: documents.map((doc) => serializeDocument(doc))
  }
})

function stringArray(input: unknown) {
  if (!Array.isArray(input)) return []
  return input.map((item) => String(item).trim()).filter(Boolean).slice(0, 40)
}

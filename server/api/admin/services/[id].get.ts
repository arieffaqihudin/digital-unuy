import { Document, Service, ServiceFormVersion } from '../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'services.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.' })

  const service = await Service.findById(id).lean()
  if (!service) throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.' })
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

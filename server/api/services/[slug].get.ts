import { Document, DocumentVersion, Service, ServiceFormVersion } from '../../models'

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
  const service = await Service.findOne({ slug }).lean()
  if (!service) throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.' })

  const formVersion = service.currentFormVersionId
    ? await ServiceFormVersion.findById(service.currentFormVersionId).lean()
    : null

  const docs = await Document.find({
    published: true,
    archived: false,
    services: service._id
  })
    .sort({ updatedAt: -1 })
    .populate('currentVersion')
    .limit(12)
    .lean()

  return {
    service: serializeService(service, formVersion?.fields || [], docs.map((doc) => serializeDocument(doc)))
  }
})

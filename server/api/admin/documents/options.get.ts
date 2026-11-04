import { Service } from '../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'documents.manage')
  const services = await Service.find({}).select('name slug active').sort({ name: 1 }).lean()
  return {
    services: services.map((service) => ({
      id: String(service._id),
      name: service.name,
      slug: service.slug,
      active: service.active
    }))
  }
})

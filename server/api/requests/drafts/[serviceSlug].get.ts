import { RequestDraft, Service } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const serviceSlug = String(getRouterParam(event, 'serviceSlug') || '')
  const service = await Service.findOne({ slug: serviceSlug, active: true }).select('_id').lean()
  if (!service) throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.' })
  const draft = await RequestDraft.findOne({ user: user.id, service: service._id }).lean()
  setHeader(event, 'Cache-Control', 'no-store')
  return { data: draft?.data || {}, updatedAt: draft?.updatedAt || null }
})

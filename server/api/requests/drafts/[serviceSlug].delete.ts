import { RequestDraft, Service } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const serviceSlug = String(getRouterParam(event, 'serviceSlug') || '')
  const service = await Service.findOne({ slug: serviceSlug }).select('_id').lean()
  if (service) {
    await RequestDraft.deleteOne({ user: user.id, service: service._id })
  }
  return { ok: true }
})

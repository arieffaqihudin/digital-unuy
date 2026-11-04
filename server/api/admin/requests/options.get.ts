import { ServiceRequest, User } from '../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'requests.read')
  const services = await ServiceRequest.aggregate([
    { $group: { _id: { slug: '$serviceSlug', name: '$serviceName' } } },
    { $sort: { '_id.name': 1 } }
  ])
  const assignees = await User.find({ role: { $in: ['admin', 'superadmin'] }, active: true })
    .select('name email role')
    .sort({ name: 1 })
    .lean()

  return {
    services: services.map((service) => ({ slug: service._id.slug, name: service._id.name })),
    assignees: assignees.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role
    }))
  }
})

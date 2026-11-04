import { User } from '../../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users.manage')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 20)
  const search = String(query.q || '').trim().slice(0, 100)
  const filter: Record<string, unknown> = {}
  if (query.role) filter.role = String(query.role)
  if (query.active === 'true') filter.active = true
  if (query.active === 'false') filter.active = false
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: regex }, { email: regex }]
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('+passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter)
  ])

  return {
    items: items.map((user: any) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      hasPassword: Boolean(user.passwordHash),
      invitationPending: Boolean(user.active && !user.passwordHash),
      lastLoginAt: user.lastLoginAt || null,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt || null
    })),
    total,
    page,
    pageSize
  }
})

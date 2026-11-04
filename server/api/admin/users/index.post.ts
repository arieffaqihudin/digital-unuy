import { User } from '../../../models'
import { ROLE_LABELS } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'users.manage')
  const body = await readBody(event)
  const name = String(body?.name || '').trim()
  const email = String(body?.email || '').trim().toLowerCase()
  const role = String(body?.role || 'pemohon')

  if (name.length < 3) throw createError({ statusCode: 422, statusMessage: 'Nama pengguna minimal 3 karakter.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 180) {
    throw createError({ statusCode: 422, statusMessage: 'Alamat email tidak valid.' })
  }
  if (!['superadmin', 'admin', 'pemohon'].includes(role)) {
    throw createError({ statusCode: 422, statusMessage: 'Role pengguna tidak valid.' })
  }
  if (role !== 'pemohon' && !user.permissions.includes('roles.manage')) {
    throw createError({ statusCode: 403, statusMessage: 'Anda tidak memiliki izin memberikan role staf.' })
  }
  if (await User.exists({ email })) {
    throw createError({ statusCode: 409, statusMessage: 'Email sudah digunakan oleh akun lain.' })
  }

  const created = await User.create({
    name,
    email,
    role,
    active: false,
    passwordHash: '',
    createdBy: user.id
  })

  await recordAudit(event, user, 'user.created', 'User', String(created._id), {
    email,
    role,
    active: false
  })

  return {
    user: {
      id: String(created._id),
      name: created.name,
      email: created.email,
      role: created.role,
      roleLabel: ROLE_LABELS[created.role as keyof typeof ROLE_LABELS],
      active: created.active,
      invitationPending: false
    }
  }
})

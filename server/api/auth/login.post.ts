import { User } from '../../models'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  checkRateLimit(event, 'login', 8, 10 * 60 * 1000, email || 'empty')

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email dan kata sandi wajib diisi.' })
  }

  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user || !user.passwordHash) {
    throw createError({ statusCode: 401, statusMessage: 'Email atau kata sandi tidak sesuai.' })
  }
  if (!user.active) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akun belum aktif. Hubungi administrator untuk mengaktifkan akun Anda.'
    })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    await recordAudit(event, null, 'auth.login_failed', 'User', String(user._id), { email })
    throw createError({ statusCode: 401, statusMessage: 'Email atau kata sandi tidak sesuai.' })
  }

  user.lastLoginAt = new Date()
  await user.save()
  await createSession(event, String(user._id))
  const permissions = await getRolePermissions(user.role)

  await recordAudit(
    event,
    { id: String(user._id), name: user.name, email: user.email, role: user.role, permissions },
    'auth.login',
    'User',
    String(user._id)
  )

  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions
    }
  }
})

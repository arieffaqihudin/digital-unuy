import { ActivationToken, User } from '../../models'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const token = String(body?.token || '')
  const password = String(body?.password || '')

  checkRateLimit(event, 'activation', 10, 15 * 60 * 1000, token.slice(0, 12))

  if (!token) throw createError({ statusCode: 400, statusMessage: 'Token aktivasi tidak ditemukan.' })
  const problem = passwordProblems(password)
  if (problem) throw createError({ statusCode: 422, statusMessage: problem })

  const now = new Date()
  const activation = await ActivationToken.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: now },
    usedAt: null
  })

  if (!activation) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Tautan aktivasi tidak valid, sudah digunakan, atau telah kedaluwarsa.'
    })
  }

  const user = await User.findById(activation.user)
  if (!user || !user.active) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Akun tidak tersedia atau sedang nonaktif. Hubungi administrator.'
    })
  }

  const claimed = await ActivationToken.findOneAndUpdate(
    { _id: activation._id, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } }
  )
  if (!claimed) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Tautan aktivasi sudah digunakan. Silakan masuk atau minta tautan baru.'
    })
  }

  user.passwordHash = await hashPassword(password)
  user.emailVerifiedAt = now
  await user.save()

  await ActivationToken.deleteMany({ user: user._id, usedAt: null })

  await createSession(event, String(user._id))
  const permissions = await getRolePermissions(user.role)
  const sessionUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions
  }
  await recordAudit(event, sessionUser, 'auth.activated', 'User', String(user._id))

  return { user: sessionUser }
})

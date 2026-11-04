import { escapeHtml, sendEmail } from '../../../../utils/email'
import { ActivationToken, User } from '../../../../models'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'users.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
  const target = await User.findById(id).select('+passwordHash')
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
  if (target.passwordHash) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Akun sudah memiliki kata sandi. Gunakan pemulihan akses bila pengguna lupa kata sandi.'
    })
  }

  checkRateLimit(event, 'resend-activation', 6, 15 * 60 * 1000, String(target._id))

  const token = randomToken(32)
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
  await ActivationToken.deleteMany({ user: target._id })
  await ActivationToken.create({ tokenHash: hashToken(token), user: target._id, expiresAt })

  const wasActive = target.active
  if (!target.active) {
    target.active = true
    await target.save()
  }

  const siteUrl = useRuntimeConfig().siteUrl
  const activationUrl = `${siteUrl}/aktivasi?token=${encodeURIComponent(token)}`
  const result = await sendEmail({
    template: 'user-activation-resend',
    to: target.email,
    subject: 'Aktivasi akun Digital Service Portal UNU Yogyakarta',
    heading: 'Aktivasi akun Anda',
    reference: `user:${String(target._id)}`,
    preheader: 'Tautan aktivasi baru berlaku selama 48 jam.',
    bodyHtml: `<p>Halo ${escapeHtml(target.name)},</p><p>Berikut tautan aktivasi akun Digital Service Portal UNU Yogyakarta Anda. Tautan sebelumnya tidak berlaku lagi.</p><p style="margin:24px 0;"><a href="${escapeHtml(activationUrl)}" style="display:inline-block;background:#1C1A1A;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700;">Aktivasi Akun</a></p><p>Tautan berlaku selama 48 jam dan hanya dapat digunakan satu kali.</p><p style="font-size:12px;color:#68625C;">Jika tombol tidak berfungsi, salin tautan berikut: ${escapeHtml(activationUrl)}</p>`
  })

  if (!result.ok) {
    if (!wasActive) {
      target.active = false
      await target.save()
    }
    await ActivationToken.deleteMany({ user: target._id })
    throw createError({
      statusCode: 502,
      statusMessage: 'Email aktivasi gagal dikirim. Periksa konfigurasi email lalu coba lagi.'
    })
  }

  await recordAudit(event, actor, 'user.activation_resent', 'User', String(target._id), {
    email: target.email,
    emailStatus: result.simulated ? 'simulated' : 'sent'
  })

  return {
    ok: true,
    emailStatus: result.simulated ? 'simulated' : 'sent'
  }
})

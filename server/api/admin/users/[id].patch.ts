import { escapeHtml, sendEmail } from '../../../utils/email'
import { ActivationToken, Session, User } from '../../../models'

export default defineEventHandler(async (event) => {
  const actor = await requirePermission(event, 'users.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })

  const target = await User.findById(id).select('+passwordHash')
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []
  let activationEmailStatus = 'not-sent'

  if (String(target._id) === actor.id && body?.active === false) {
    throw createError({ statusCode: 409, statusMessage: 'Anda tidak dapat menonaktifkan akun sendiri.' })
  }

  if (body?.name !== undefined) {
    const name = String(body.name).trim()
    if (name.length < 3) throw createError({ statusCode: 422, statusMessage: 'Nama pengguna minimal 3 karakter.' })
    target.name = name
    changed.push('name')
  }

  if (body?.email !== undefined) {
    const email = String(body.email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 180) {
      throw createError({ statusCode: 422, statusMessage: 'Alamat email tidak valid.' })
    }
    if (email !== target.email) {
      if (target.active || target.passwordHash) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email akun aktif tidak dapat diubah tanpa proses verifikasi. Nonaktifkan atau buat akun baru.'
        })
      }
      if (await User.exists({ email, _id: { $ne: target._id } })) {
        throw createError({ statusCode: 409, statusMessage: 'Email sudah digunakan oleh akun lain.' })
      }
      target.email = email
      target.emailVerifiedAt = null
      await ActivationToken.deleteMany({ user: target._id })
      changed.push('email')
    }
  }

  if (body?.role !== undefined && body.role !== target.role) {
    if (String(target._id) === actor.id) {
      throw createError({ statusCode: 409, statusMessage: 'Anda tidak dapat mengubah role akun sendiri.' })
    }
    if (!actor.permissions.includes('roles.manage')) {
      throw createError({ statusCode: 403, statusMessage: 'Anda tidak memiliki izin mengubah role.' })
    }
    if (!['superadmin', 'admin'].includes(body.role)) {
      throw createError({ statusCode: 422, statusMessage: 'Role pengguna tidak valid.' })
    }
    if (target.role === 'superadmin' && body.role !== 'superadmin') {
      const remaining = await User.countDocuments({
        _id: { $ne: target._id },
        role: 'superadmin',
        active: true
      })
      if (remaining < 1) {
        throw createError({ statusCode: 409, statusMessage: 'Harus tersedia minimal satu superadmin aktif.' })
      }
    }
    target.role = body.role
    changed.push('role')
  }

  if (body?.active !== undefined && Boolean(body.active) !== target.active) {
    if (Boolean(body.active)) {
      if (!target.passwordHash) {
        const token = randomToken(32)
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
        await ActivationToken.deleteMany({ user: target._id })
        await ActivationToken.create({
          tokenHash: hashToken(token),
          user: target._id,
          expiresAt
        })
        target.active = true
        target.emailVerifiedAt = null
        await target.save()

        const siteUrl = useRuntimeConfig().siteUrl
        const activationUrl = `${siteUrl}/aktivasi?token=${encodeURIComponent(token)}`
        const result = await sendEmail({
          template: 'user-activation',
          to: target.email,
          subject: 'Aktivasi akun Digital Service Portal UNU Yogyakarta',
          heading: 'Aktivasi akun Anda',
          reference: `user:${String(target._id)}`,
          preheader: 'Tautan aktivasi berlaku selama 48 jam.',
          bodyHtml: `<p>Halo ${escapeHtml(target.name)},</p><p>Akun Digital Service Portal UNU Yogyakarta Anda telah disiapkan. Buat kata sandi melalui tautan sekali pakai berikut.</p><p style="margin:24px 0;"><a href="${escapeHtml(activationUrl)}" style="display:inline-block;background:#1C1A1A;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700;">Aktivasi Akun</a></p><p>Tautan berlaku selama 48 jam dan hanya dapat digunakan satu kali. Jangan teruskan email ini kepada siapa pun.</p><p style="font-size:12px;color:#68625C;">Jika tombol tidak berfungsi, salin tautan berikut: ${escapeHtml(activationUrl)}</p>`
        })
        if (!result.ok) {
          target.active = false
          await target.save()
          await ActivationToken.deleteMany({ user: target._id })
          throw createError({
            statusCode: 502,
            statusMessage:
              'Akun tidak diaktifkan karena email aktivasi gagal dikirim. Periksa konfigurasi email lalu coba lagi.'
          })
        }
        activationEmailStatus = result.simulated ? 'simulated' : 'sent'
      } else {
        target.active = true
        await target.save()
      }
      changed.push('active')
    } else {
      if (target.role === 'superadmin') {
        const remaining = await User.countDocuments({
          _id: { $ne: target._id },
          role: 'superadmin',
          active: true
        })
        if (remaining < 1) {
          throw createError({ statusCode: 409, statusMessage: 'Harus tersedia minimal satu superadmin aktif.' })
        }
      }
      target.active = false
      await target.save()
      await ActivationToken.deleteMany({ user: target._id })
      await Session.deleteMany({ user: target._id })
      changed.push('active')
    }
  }

  if (changed.length) {
    await target.save()
    await recordAudit(event, actor, 'user.updated', 'User', String(target._id), {
      email: target.email,
      role: target.role,
      active: target.active,
      changed,
      activationEmailStatus
    })
  }

  return {
    user: {
      id: String(target._id),
      name: target.name,
      email: target.email,
      role: target.role,
      active: target.active,
      hasPassword: Boolean(target.passwordHash),
      invitationPending: Boolean(target.active && !target.passwordHash)
    },
    emailStatus: activationEmailStatus
  }
})

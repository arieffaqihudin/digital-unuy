import { escapeHtml, sendEmail } from '../../../utils/email'
import { WAITING_SUBSTATUS } from '../../../../shared/types'
import {
  RequestComment,
  RequestStatusHistory,
  ServiceRequest,
  User
} from '../../../models'

const terminalStatuses = ['Selesai', 'Ditolak']

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'requests.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const body = await readBody(event)
  const action = String(body?.action || '')
  const request = await ServiceRequest.findById(id).lean()
  if (!request) throw createError({ statusCode: 404, statusMessage: 'Permohonan tidak ditemukan.' })

  const account = request.user
    ? await User.findById(request.user).select('name email active').lean()
    : null
  const requester = account
    ? { name: account.name, email: account.email }
    : { name: request.requesterName || 'Pemohon', email: request.requesterEmail || '' }
  if (!requester.email) {
    throw createError({ statusCode: 409, statusMessage: 'Email pemohon tidak tersedia untuk notifikasi.' })
  }

  const note = String(body?.note || '').trim().slice(0, 5000)
  let emailStatus = 'not-sent'
  let update: Record<string, unknown> | null = null
  let history: { toStatus: string; substatus?: string; note: string } | null = null
  let email: { template: string; subject: string; heading: string; body: string } | null = null

  if (action === 'assign') {
    if (!user.permissions.includes('requests.assign')) {
      throw createError({ statusCode: 403, statusMessage: 'Anda tidak memiliki izin menugaskan petugas.' })
    }
    const assignedTo = body?.assignedTo ? String(body.assignedTo) : null
    if (assignedTo) {
      if (!isObjectId(assignedTo)) {
        throw createError({ statusCode: 422, statusMessage: 'Petugas tidak valid.' })
      }
      const assignee = await User.findOne({
        _id: assignedTo,
        role: { $in: ['admin', 'superadmin'] },
        active: true
      }).lean()
      if (!assignee) throw createError({ statusCode: 422, statusMessage: 'Petugas tidak ditemukan atau nonaktif.' })
    }
    await ServiceRequest.findByIdAndUpdate(request._id, {
      assignedTo,
      lastActivityAt: new Date()
    })
    await recordAudit(event, user, 'request.assigned', 'ServiceRequest', String(request._id), {
      ticketNumber: request.ticketNumber,
      assignedTo
    })
    return { ok: true, emailStatus: 'not-sent' }
  }

  if (action === 'comment') {
    if (note.length < 2) throw createError({ statusCode: 422, statusMessage: 'Catatan minimal 2 karakter.' })
    const visibility = body?.visibility === 'internal' ? 'internal' : 'public'
    await RequestComment.create({
      request: request._id,
      author: user.id,
      authorName: user.name,
      message: note,
      visibility
    })
    await ServiceRequest.findByIdAndUpdate(request._id, { lastActivityAt: new Date() })
    await recordAudit(event, user, 'request.comment_added', 'ServiceRequest', String(request._id), {
      ticketNumber: request.ticketNumber,
      visibility
    })
    return { ok: true, emailStatus: 'not-sent' }
  }

  if (terminalStatuses.includes(request.status)) {
    throw createError({ statusCode: 409, statusMessage: 'Permohonan yang sudah selesai atau ditolak tidak dapat diubah.' })
  }

  const now = new Date()
  if (action === 'verify') {
    if (request.status !== 'Diajukan' || request.substatus === WAITING_SUBSTATUS) {
      throw createError({ statusCode: 409, statusMessage: 'Permohonan tidak berada pada tahap yang dapat diverifikasi.' })
    }
    update = {
      status: 'Diverifikasi',
      substatus: '',
      lastActivityAt: now
    }
    history = { toStatus: 'Diverifikasi', note: note || 'Permohonan telah diverifikasi.' }
  } else if (action === 'start') {
    if (request.status !== 'Diverifikasi' || request.substatus) {
      throw createError({ statusCode: 409, statusMessage: 'Permohonan harus berstatus Diverifikasi sebelum diproses.' })
    }
    update = { status: 'Diproses', substatus: '', lastActivityAt: now }
    history = { toStatus: 'Diproses', note: note || 'Permohonan mulai diproses.' }
    email = {
      template: 'request-processing',
      subject: `Permohonan ${request.ticketNumber} mulai diproses`,
      heading: 'Permohonan Anda mulai diproses',
      body: `<p>Halo ${escapeHtml(requester.name)},</p><p>Permohonan <strong>${escapeHtml(request.ticketNumber)}</strong> untuk layanan <strong>${escapeHtml(request.serviceName)}</strong> telah mulai diproses oleh petugas.</p>${note ? `<p>Catatan petugas:</p><blockquote style="border-left:3px solid #C99517;padding-left:12px;color:#68625C;">${escapeHtml(note)}</blockquote>` : ''}<p>Anda dapat memantau perkembangan melalui halaman pelacakan permohonan.</p>`
    }
  } else if (action === 'request_info') {
    if (!note) {
      throw createError({ statusCode: 422, statusMessage: 'Rincian kelengkapan yang diminta wajib diisi.' })
    }
    if (request.substatus === WAITING_SUBSTATUS) {
      throw createError({ statusCode: 409, statusMessage: 'Permohonan sudah menunggu kelengkapan pemohon.' })
    }
    update = {
      substatus: WAITING_SUBSTATUS,
      requestedCompletionNote: note,
      lastActivityAt: now
    }
    history = {
      toStatus: request.status,
      substatus: WAITING_SUBSTATUS,
      note: `Menunggu kelengkapan pemohon: ${note}`
    }
    email = {
      template: 'request-needs-info',
      subject: `Kelengkapan diperlukan untuk ${request.ticketNumber}`,
      heading: 'Permohonan membutuhkan kelengkapan',
      body: `<p>Halo ${escapeHtml(requester.name)},</p><p>Permohonan <strong>${escapeHtml(request.ticketNumber)}</strong> memerlukan kelengkapan dari Anda sebelum dapat dilanjutkan.</p><div style="background:#FAF8ED;border:1px solid #E6E1D3;border-radius:10px;padding:16px;margin:16px 0;">${escapeHtml(note)}</div><p>Silakan buka halaman pelacakan permohonan, lengkapi data, lalu kirimkan keterangan Anda.</p>`
    }
  } else if (action === 'complete') {
    const summary = String(body?.resolutionSummary || '').trim()
    if (summary.length < 10) {
      throw createError({ statusCode: 422, statusMessage: 'Ringkasan hasil penyelesaian minimal 10 karakter.' })
    }
    if (request.status !== 'Diproses') {
      throw createError({ statusCode: 409, statusMessage: 'Hanya permohonan yang sedang diproses yang dapat diselesaikan.' })
    }
    update = {
      status: 'Selesai',
      substatus: '',
      resolutionSummary: summary.slice(0, 5000),
      requestedCompletionNote: '',
      lastActivityAt: now
    }
    history = { toStatus: 'Selesai', note: note || 'Permohonan telah diselesaikan.' }
    email = {
      template: 'request-completed',
      subject: `Permohonan ${request.ticketNumber} telah selesai`,
      heading: 'Permohonan Anda telah selesai',
      body: `<p>Halo ${escapeHtml(requester.name)},</p><p>Permohonan <strong>${escapeHtml(request.ticketNumber)}</strong> untuk layanan <strong>${escapeHtml(request.serviceName)}</strong> telah diselesaikan.</p><p><strong>Ringkasan hasil:</strong></p><div style="background:#FAF8ED;border:1px solid #E6E1D3;border-radius:10px;padding:16px;margin:16px 0;">${escapeHtml(summary)}</div>${note ? `<p>Catatan tambahan: ${escapeHtml(note)}</p>` : ''}<p>Terima kasih telah menggunakan layanan Direktorat Transformasi Digital.</p>`
    }
  } else if (action === 'reject') {
    const reason = String(body?.reason || '').trim()
    if (reason.length < 10) {
      throw createError({ statusCode: 422, statusMessage: 'Alasan penolakan minimal 10 karakter.' })
    }
    update = {
      status: 'Ditolak',
      substatus: '',
      rejectionReason: reason.slice(0, 5000),
      lastActivityAt: now
    }
    history = { toStatus: 'Ditolak', note: `Permohonan ditolak: ${reason}` }
    email = {
      template: 'request-rejected',
      subject: `Permohonan ${request.ticketNumber} tidak dapat diproses`,
      heading: 'Permohonan tidak dapat diproses',
      body: `<p>Halo ${escapeHtml(requester.name)},</p><p>Permohonan <strong>${escapeHtml(request.ticketNumber)}</strong> untuk layanan <strong>${escapeHtml(request.serviceName)}</strong> tidak dapat diproses.</p><p><strong>Alasan:</strong></p><div style="background:#FAF8ED;border:1px solid #E6E1D3;border-radius:10px;padding:16px;margin:16px 0;">${escapeHtml(reason)}</div><p>Jika Anda memerlukan penjelasan lebih lanjut, silakan hubungi administrator melalui kanal resmi yang tersedia.</p>`
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Aksi permohonan tidak dikenali.' })
  }

  const conditions: Record<string, unknown> = { _id: request._id }
  if (action === 'verify') {
    conditions.status = 'Diajukan'
    conditions.substatus = { $ne: WAITING_SUBSTATUS }
  } else if (action === 'start') {
    conditions.status = 'Diverifikasi'
    conditions.substatus = ''
  } else if (action === 'complete') {
    conditions.status = 'Diproses'
  } else if (action === 'request_info') {
    conditions.substatus = { $ne: WAITING_SUBSTATUS }
  } else if (action === 'reject') {
    conditions.status = { $in: ['Diajukan', 'Diverifikasi', 'Diproses'] }
  }

  const updated = await ServiceRequest.findOneAndUpdate(conditions, { $set: update }, { new: true })
  if (!updated) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Status permohonan telah berubah. Muat ulang halaman lalu periksa kembali.'
    })
  }

  if (history) {
    await RequestStatusHistory.create({
      request: request._id,
      fromStatus: request.status,
      toStatus: history.toStatus,
      substatus: history.substatus || '',
      note: history.note,
      actor: user.id,
      actorName: user.name
    })
  }

  if (body?.publicNote && String(body.publicNote).trim()) {
    await RequestComment.create({
      request: request._id,
      author: user.id,
      authorName: user.name,
      message: String(body.publicNote).trim().slice(0, 5000),
      visibility: 'public'
    })
  }

  if (email) {
    const siteUrl = useRuntimeConfig().siteUrl
    const destination = account
      ? `${siteUrl}/permohonan-saya/${String(request._id)}`
      : `${siteUrl}/lacak?ticket=${encodeURIComponent(request.ticketNumber)}`
    const result = await sendEmail({
      template: email.template,
      to: requester.email,
      subject: email.subject,
      heading: email.heading,
      reference: request.ticketNumber,
      preheader: `Pembaruan permohonan ${request.ticketNumber}.`,
      bodyHtml: `${email.body}<p style="margin:24px 0;"><a href="${escapeHtml(destination)}" style="display:inline-block;background:#337449;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700;">Buka Pelacakan Permohonan</a></p>${account ? '' : '<p style="font-size:12px;color:#68625C;">Masukkan ID permohonan dan token akses yang Anda simpan saat pengajuan.</p>'}`
    })
    emailStatus = result.ok ? (result.simulated ? 'simulated' : 'sent') : 'failed'
  }

  await recordAudit(event, user, `request.${action}`, 'ServiceRequest', String(request._id), {
    ticketNumber: request.ticketNumber,
    fromStatus: request.status,
    toStatus: updated.status,
    emailStatus
  })

  return {
    ok: true,
    status: updated.status,
    substatus: updated.substatus,
    emailStatus,
    warning:
      emailStatus === 'failed'
        ? 'Perubahan tersimpan, tetapi email notifikasi gagal dikirim. Periksa log notifikasi.'
        : null
  }
})

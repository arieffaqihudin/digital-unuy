import { randomInt } from 'node:crypto'
import mongoose from 'mongoose'
import { escapeHtml, sendEmail } from '../../../utils/email'
import {
  RequestAttachment,
  RequestStatusHistory,
  Service,
  ServiceFormVersion,
  ServiceRequest,
  User
} from '../../../models'

function generateTicketNumber() {
  const now = new Date()
  const year = String(now.getFullYear()).slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) code += alphabet[randomInt(alphabet.length)]
  return `UNU-DTD-${year}${month}-${code}`
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  checkRateLimit(event, 'request-submit', 12, 60 * 60 * 1000, user.id)

  const idempotencyKey = String(getHeader(event, 'x-idempotency-key') || '').trim()
  if (idempotencyKey.length < 10 || idempotencyKey.length > 120) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kunci idempotensi tidak valid. Muat ulang halaman lalu coba lagi.'
    })
  }

  const existing = await ServiceRequest.findOne({ idempotencyKey }).lean()
  if (existing) {
    if (String(existing.user) !== user.id) {
      throw createError({ statusCode: 409, statusMessage: 'Permintaan duplikat terdeteksi.' })
    }
    return {
      duplicate: true,
      ticketNumber: existing.ticketNumber,
      requestId: String(existing._id),
      status: existing.status,
      emailStatus: 'not-resent'
    }
  }

  const slug = String(getRouterParam(event, 'slug') || '')
  const service = await Service.findOne({ slug, active: true }).lean()
  if (!service) throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan atau sedang nonaktif.' })
  if (!service.acceptsRequests) {
    throw createError({ statusCode: 409, statusMessage: 'Layanan ini sedang tidak menerima permohonan.' })
  }

  const formVersion = service.currentFormVersionId
    ? await ServiceFormVersion.findById(service.currentFormVersionId).lean()
    : null
  if (!formVersion?.fields?.length) {
    throw createError({ statusCode: 409, statusMessage: 'Formulir layanan belum siap. Hubungi administrator.' })
  }

  const contentType = String(getHeader(event, 'content-type') || '')
  let payload: Record<string, unknown> = {}
  const fileEntries = new Map<string, { data: Buffer; filename: string; type: string }>()

  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'Data formulir kosong.' })
    let totalSize = 0
    for (const part of parts) {
      totalSize += part.data?.length || 0
      if (part.name === 'payload') {
        try {
          payload = JSON.parse(part.data.toString('utf8'))
        } catch {
          throw createError({ statusCode: 400, statusMessage: 'Data formulir tidak dapat dibaca.' })
        }
        continue
      }
      if (part.filename) {
        const field = formVersion.fields.find((candidate: any) => candidate.key === part.name && candidate.type === 'file')
        if (!field) {
          throw createError({ statusCode: 422, statusMessage: `Lampiran "${part.name}" tidak dikenali.` })
        }
        if (fileEntries.has(part.name)) {
          throw createError({ statusCode: 422, statusMessage: `Lampiran ${field.label} hanya boleh satu file.` })
        }
        fileEntries.set(part.name, {
          data: part.data,
          filename: part.filename,
          type: String(part.type || '')
        })
      }
    }
    if (totalSize > 12 * 1024 * 1024) {
      throw createError({ statusCode: 413, statusMessage: 'Total lampiran melebihi 12 MB.' })
    }
  } else {
    const body = await readBody(event)
    payload = body?.data && typeof body.data === 'object' ? body.data : body || {}
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createError({ statusCode: 400, statusMessage: 'Data formulir tidak valid.' })
  }

  const fileMeta = new Map<string, { originalName: string; mimeType: string; size: number }>()
  for (const [key, file] of fileEntries) {
    const field = formVersion.fields.find((candidate: any) => candidate.key === key)
    const allowed = field?.accept?.length ? field.accept : DEFAULT_ALLOWED_MIME_TYPES
    validateUploadMetadata(
      file.filename,
      file.type,
      file.data.length,
      allowed,
      Math.min(Number(field?.fileMaxMB) || 10, 10)
    )
    fileMeta.set(key, { originalName: file.filename, mimeType: file.type, size: file.data.length })
  }

  const { data, errors } = validateSubmission(formVersion.fields as any, payload, fileMeta)
  if (Object.keys(errors).length) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Periksa kembali isian formulir.',
      data: { errors }
    })
  }

  const requestId = new mongoose.Types.ObjectId()
  const trackingToken = randomToken(32)
  const savedFiles: { storageKey: string; fieldKey: string; originalName: string; mimeType: string; size: number }[] = []

  try {
    for (const [key, file] of fileEntries) {
      const field = formVersion.fields.find((candidate: any) => candidate.key === key)
      const saved = await savePrivateUpload({
        data: file.data,
        originalName: file.filename,
        mimeType: file.type,
        allowedMimes: field?.accept?.length ? field.accept : DEFAULT_ALLOWED_MIME_TYPES,
        maxMB: Math.min(Number(field?.fileMaxMB) || 10, 10),
        folder: `requests/${String(requestId)}`
      })
      savedFiles.push({ ...saved, fieldKey: key })
    }

    let ticketNumber = generateTicketNumber()
    let attempts = 0
    while (await ServiceRequest.exists({ ticketNumber })) {
      ticketNumber = generateTicketNumber()
      attempts += 1
      if (attempts > 5) throw createError({ statusCode: 503, statusMessage: 'Gagal membuat nomor tiket. Coba lagi.' })
    }

    const request = await ServiceRequest.create({
      _id: requestId,
      ticketNumber,
      trackingTokenHash: hashToken(trackingToken),
      user: user.id,
      service: service._id,
      serviceSlug: service.slug,
      serviceName: service.name,
      formVersion: formVersion.version,
      formSnapshot: formVersion.fields,
      data,
      status: 'Diajukan',
      substatus: '',
      idempotencyKey,
      lastActivityAt: new Date()
    })

    if (savedFiles.length) {
      await RequestAttachment.insertMany(
        savedFiles.map((file) => ({
          request: requestId,
          fieldKey: file.fieldKey,
          originalName: file.originalName,
          storageKey: file.storageKey,
          mimeType: file.mimeType,
          size: file.size,
          uploadedBy: user.id
        }))
      )
    }

    await RequestStatusHistory.create({
      request: requestId,
      fromStatus: '',
      toStatus: 'Diajukan',
      note: 'Permohonan berhasil diajukan melalui portal.',
      actor: user.id,
      actorName: user.name
    })

    await recordAudit(event, user, 'request.created', 'ServiceRequest', String(request._id), {
      ticketNumber,
      service: service.slug
    })

    const siteUrl = useRuntimeConfig().siteUrl
    const trackingUrl = `${siteUrl}/lacak?ticket=${encodeURIComponent(ticketNumber)}&token=${encodeURIComponent(trackingToken)}`
    const emailResult = await sendEmail({
      template: 'request-created',
      to: user.email,
      subject: `Permohonan ${ticketNumber} telah diterima`,
      heading: 'Permohonan Anda telah diterima',
      reference: ticketNumber,
      preheader: `Nomor tiket ${ticketNumber} untuk layanan ${service.name}.`,
      bodyHtml: `
        <p>Halo ${escapeHtml(user.name)},</p>
        <p>Permohonan Anda untuk layanan <strong>${escapeHtml(service.name)}</strong> telah kami terima.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E6E1D3;color:#68625C;">Nomor tiket</td><td style="padding:10px 0;border-bottom:1px solid #E6E1D3;text-align:right;font-weight:700;">${escapeHtml(ticketNumber)}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E6E1D3;color:#68625C;">Status awal</td><td style="padding:10px 0;border-bottom:1px solid #E6E1D3;text-align:right;">Diajukan</td></tr>
        </table>
        <p>Pantau status dan komunikasi permohonan melalui tautan aman berikut. Tautan ini bersifat pribadi, jangan dibagikan.</p>
        <p style="margin:24px 0;"><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#1C1A1A;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700;">Lacak Permohonan</a></p>
        <p style="font-size:12px;color:#68625C;">Jika tombol tidak berfungsi, salin tautan berikut: ${escapeHtml(trackingUrl)}</p>
      `
    })

    return {
      duplicate: false,
      ticketNumber,
      requestId: String(request._id),
      status: 'Diajukan',
      trackingUrl,
      emailStatus: emailResult.ok ? (emailResult.simulated ? 'simulated' : 'sent') : 'failed'
    }
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.idempotencyKey) {
      const duplicate = await ServiceRequest.findOne({ idempotencyKey }).lean()
      if (duplicate && String(duplicate.user) === user.id) {
        return {
          duplicate: true,
          ticketNumber: duplicate.ticketNumber,
          requestId: String(duplicate._id),
          status: duplicate.status,
          emailStatus: 'not-resent'
        }
      }
    }
    await Promise.all(savedFiles.map((file) => deletePrivateUpload(file.storageKey)))
    if (!error?.statusCode) console.error('[request-create] failed', error)
    throw error
  }
})

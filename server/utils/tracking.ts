import { ServiceRequest } from '../models'

export async function requireTrackedRequest(ticketInput: unknown, tokenInput: unknown) {
  const ticket = String(ticketInput || '').trim().toUpperCase()
  const token = String(tokenInput || '').trim()
  if (!ticket || !token) {
    throw createError({ statusCode: 400, statusMessage: 'Nomor tiket dan token akses wajib diisi.' })
  }

  const request = await ServiceRequest.findOne({ ticketNumber: ticket }).lean()
  if (!request || !safeEqual(request.trackingTokenHash, hashToken(token))) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Permohonan tidak ditemukan. Periksa kembali nomor tiket dan token akses.'
    })
  }
  return request
}

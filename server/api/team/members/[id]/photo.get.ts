import { TeamMember } from '../../../../models'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Foto tidak ditemukan.' })
  const member = await TeamMember.findOne({ _id: id, published: true }).select('photoStorageKey photoMimeType').lean()
  if (!member?.photoStorageKey) throw createError({ statusCode: 404, statusMessage: 'Foto tidak ditemukan.' })

  const buffer = await readPrivateUpload(member.photoStorageKey)
  setHeader(event, 'Content-Type', member.photoMimeType || 'image/webp')
  setHeader(event, 'Content-Length', String(buffer.length))
  setHeader(event, 'Cache-Control', 'private, max-age=0, must-revalidate')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  return buffer
})

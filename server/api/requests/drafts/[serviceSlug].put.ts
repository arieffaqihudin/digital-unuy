import { RequestDraft, Service, ServiceFormVersion } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const serviceSlug = String(getRouterParam(event, 'serviceSlug') || '')
  const service = await Service.findOne({ slug: serviceSlug, active: true }).lean()
  if (!service) throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.' })
  const form = service.currentFormVersionId
    ? await ServiceFormVersion.findById(service.currentFormVersionId).lean()
    : null
  if (!form) throw createError({ statusCode: 409, statusMessage: 'Formulir layanan belum tersedia.' })

  const body = await readBody(event)
  if (!body?.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
    throw createError({ statusCode: 400, statusMessage: 'Data draft tidak valid.' })
  }

  const allowedKeys = new Set(
    (form.fields as any[]).filter((field) => field.type !== 'file').map((field) => field.key)
  )
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body.data)) {
    if (!allowedKeys.has(key)) continue
    if (typeof value === 'string') data[key] = value.slice(0, 10000)
    else if (typeof value === 'number' || typeof value === 'boolean') data[key] = value
    else if (value === null) data[key] = ''
  }
  if (JSON.stringify(data).length > 60_000) {
    throw createError({ statusCode: 413, statusMessage: 'Draft terlalu besar.' })
  }

  await RequestDraft.findOneAndUpdate(
    { user: user.id, service: service._id },
    { $set: { data } },
    { upsert: true, new: true }
  )
  return { ok: true, savedAt: new Date().toISOString() }
})

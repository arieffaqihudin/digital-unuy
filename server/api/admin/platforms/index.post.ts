import { DigitalPlatform } from '../../../models'
import { PLATFORM_CATEGORIES, PLATFORM_STATUSES } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const body = await readBody(event)
  const name = String(body?.name || '').trim()
  const description = String(body?.description || '').trim()
  if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama platform minimal 2 karakter.' })
  if (description.length < 10) {
    throw createError({ statusCode: 422, statusMessage: 'Deskripsi platform minimal 10 karakter.' })
  }
  if (!PLATFORM_CATEGORIES.includes(body?.category)) {
    throw createError({ statusCode: 422, statusMessage: 'Kategori platform tidak valid.' })
  }
  if (!PLATFORM_STATUSES.includes(body?.status)) {
    throw createError({ statusCode: 422, statusMessage: 'Status implementasi tidak valid.' })
  }
  const slug = slugify(String(body?.slug || name))
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Slug platform tidak valid.' })
  if (await DigitalPlatform.exists({ slug })) {
    throw createError({ statusCode: 409, statusMessage: 'Slug platform sudah digunakan.' })
  }
  const url = validateUrl(body?.url)

  const platform = await DigitalPlatform.create({
    name,
    slug,
    description,
    category: body.category,
    unit: String(body?.unit || '').trim().slice(0, 160),
    status: body.status,
    url,
    audience: String(body?.audience || '').trim().slice(0, 200),
    icon: String(body?.icon || 'globe').slice(0, 40),
    order: Number(body?.order) || 0,
    createdBy: user.id
  })
  await recordAudit(event, user, 'platform.created', 'DigitalPlatform', String(platform._id), {
    name: platform.name,
    status: platform.status
  })
  return { platform: serializePlatform(platform) }
})

function validateUrl(value: unknown) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (url.length > 500) throw createError({ statusCode: 422, statusMessage: 'URL terlalu panjang.' })
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol')
    return parsed.toString()
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'URL platform harus diawali http:// atau https://.' })
  }
}

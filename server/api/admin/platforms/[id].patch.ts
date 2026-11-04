import { DigitalPlatform } from '../../../models'
import { PLATFORM_CATEGORIES, PLATFORM_STATUSES } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Platform tidak ditemukan.' })
  const platform = await DigitalPlatform.findById(id)
  if (!platform) throw createError({ statusCode: 404, statusMessage: 'Platform tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []

  if (body?.name !== undefined) {
    const name = String(body.name).trim()
    if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama platform minimal 2 karakter.' })
    platform.name = name
    changed.push('name')
  }
  if (body?.slug !== undefined) {
    const nextSlug = slugify(String(body.slug))
    if (!nextSlug) throw createError({ statusCode: 422, statusMessage: 'Slug platform tidak valid.' })
    if (nextSlug !== platform.slug && (await DigitalPlatform.exists({ slug: nextSlug, _id: { $ne: platform._id } }))) {
      throw createError({ statusCode: 409, statusMessage: 'Slug platform sudah digunakan.' })
    }
    platform.slug = nextSlug
    changed.push('slug')
  }
  if (body?.description !== undefined) {
    const description = String(body.description).trim()
    if (description.length < 10) {
      throw createError({ statusCode: 422, statusMessage: 'Deskripsi platform minimal 10 karakter.' })
    }
    platform.description = description
    changed.push('description')
  }
  if (body?.category !== undefined) {
    if (!PLATFORM_CATEGORIES.includes(body.category)) {
      throw createError({ statusCode: 422, statusMessage: 'Kategori platform tidak valid.' })
    }
    platform.category = body.category
    changed.push('category')
  }
  if (body?.status !== undefined) {
    if (!PLATFORM_STATUSES.includes(body.status)) {
      throw createError({ statusCode: 422, statusMessage: 'Status implementasi tidak valid.' })
    }
    platform.status = body.status
    changed.push('status')
  }
  if (body?.url !== undefined) {
    platform.url = validateUrl(body.url)
    changed.push('url')
  }
  for (const key of ['unit', 'audience', 'icon'] as const) {
    if (body?.[key] !== undefined) {
      platform[key] = String(body[key] || '').slice(0, key === 'icon' ? 40 : 200)
      changed.push(key)
    }
  }
  if (body?.order !== undefined) {
    const order = Number(body.order)
    if (!Number.isFinite(order)) throw createError({ statusCode: 422, statusMessage: 'Urutan tidak valid.' })
    platform.order = order
    changed.push('order')
  }

  await platform.save()
  await recordAudit(event, user, 'platform.updated', 'DigitalPlatform', String(platform._id), {
    name: platform.name,
    changed
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

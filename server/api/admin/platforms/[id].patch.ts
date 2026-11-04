import { DigitalPlatform, PlatformCategory } from '../../../models'
import { PLATFORM_STATUSES } from '../../../../shared/types'
import {
  platformAudiences,
  platformGallery,
  platformMetrics,
  platformModules,
  platformText,
  platformUrl
} from '../../../utils/platform-input'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })
  const platform = await DigitalPlatform.findById(id)
  if (!platform) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []
  const publishedBefore = Boolean(platform.published)

  if (body?.name !== undefined) {
    const name = platformText(body.name, 160)
    if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama produk minimal 2 karakter.' })
    platform.name = name
    changed.push('name')
  }
  if (body?.slug !== undefined) {
    const nextSlug = slugify(String(body.slug))
    if (!nextSlug) throw createError({ statusCode: 422, statusMessage: 'Slug produk tidak valid.' })
    if (nextSlug !== platform.slug && (await DigitalPlatform.exists({ slug: nextSlug, _id: { $ne: platform._id } }))) {
      throw createError({ statusCode: 409, statusMessage: 'Slug produk sudah digunakan.' })
    }
    platform.slug = nextSlug
    changed.push('slug')
  }
  if (body?.description !== undefined) {
    const description = platformText(body.description, 500)
    if (description.length < 10) {
      throw createError({ statusCode: 422, statusMessage: 'Deskripsi produk minimal 10 karakter.' })
    }
    platform.description = description
    changed.push('description')
  }
  if (body?.categoryId !== undefined) {
    const category = await PlatformCategory.findById(String(body.categoryId || ''))
    if (!category) throw createError({ statusCode: 422, statusMessage: 'Kategori produk tidak ditemukan.' })
    platform.categoryId = category._id
    platform.category = category.name
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
    platform.url = platformUrl(body.url)
    changed.push('url')
  }
  for (const [key, max] of [
    ['unit', 160],
    ['thumbnail', 500],
    ['problem', 2000],
    ['solution', 2000],
    ['benefits', 2000],
    ['features', 2000]
  ] as const) {
    if (body?.[key] !== undefined) {
      platform.set(key, platformText(body[key], max))
      changed.push(key)
    }
  }
  if (body?.audiences !== undefined) {
    const audiences = platformAudiences(body.audiences)
    platform.audiences = audiences
    platform.audience = audiences.join(', ')
    changed.push('audiences')
  }
  if (body?.gallery !== undefined) {
    platform.gallery = platformGallery(body.gallery)
    changed.push('gallery')
  }
  if (body?.modules !== undefined) {
    platform.modules = platformModules(body.modules) as typeof platform.modules
    changed.push('modules')
  }
  if (body?.metrics !== undefined) {
    platform.metrics = platformMetrics(body.metrics) as typeof platform.metrics
    changed.push('metrics')
  }
  if (body?.published !== undefined) {
    platform.published = Boolean(body.published)
    changed.push('published')
  }
  if (body?.featured !== undefined) {
    platform.featured = Boolean(body.featured)
    changed.push('featured')
  }
  if (body?.order !== undefined) {
    const order = Number(body.order)
    if (!Number.isFinite(order)) throw createError({ statusCode: 422, statusMessage: 'Urutan tidak valid.' })
    platform.order = order
    changed.push('order')
  }

  const seoInput = parseSeoInput(body?.seo)
  if (seoInput) {
    platform.seo = seoInput as any
    changed.push('seo')
  }

  await platform.save()
  await recordAudit(event, user, 'platform.updated', 'DigitalPlatform', String(platform._id), {
    name: platform.name,
    changed,
    publishedBefore,
    publishedAfter: Boolean(platform.published)
  })
  const populated = await DigitalPlatform.findById(platform._id).populate('categoryId', 'name slug order').lean()
  return { platform: serializePlatform(populated) }
})

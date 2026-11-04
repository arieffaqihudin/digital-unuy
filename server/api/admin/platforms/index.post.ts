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
  const body = await readBody(event)
  const name = platformText(body?.name, 160)
  const description = platformText(body?.description, 500)
  if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama produk minimal 2 karakter.' })
  if (description.length < 10) {
    throw createError({ statusCode: 422, statusMessage: 'Deskripsi produk minimal 10 karakter.' })
  }
  if (!PLATFORM_STATUSES.includes(body?.status)) {
    throw createError({ statusCode: 422, statusMessage: 'Status implementasi tidak valid.' })
  }
  const category = await PlatformCategory.findById(String(body?.categoryId || ''))
  if (!category) throw createError({ statusCode: 422, statusMessage: 'Kategori produk tidak ditemukan.' })
  const slug = slugify(String(body?.slug || name))
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Slug produk tidak valid.' })
  if (await DigitalPlatform.exists({ slug })) {
    throw createError({ statusCode: 409, statusMessage: 'Slug produk sudah digunakan.' })
  }
  const url = platformUrl(body?.url)
  const audiences = platformAudiences(body?.audiences)

  const platform = await DigitalPlatform.create({
    name,
    slug,
    description,
    category: category.name,
    categoryId: category._id,
    unit: platformText(body?.unit, 160),
    status: body.status,
    url,
    audience: audiences.join(', '),
    audiences,
    order: Number(body?.order) || 0,
    published: Boolean(body?.published),
    featured: Boolean(body?.featured),
    thumbnail: platformText(body?.thumbnail, 500),
    gallery: platformGallery(body?.gallery),
    problem: platformText(body?.problem, 2000),
    solution: platformText(body?.solution, 2000),
    benefits: platformText(body?.benefits, 2000),
    features: platformText(body?.features, 2000),
    modules: platformModules(body?.modules),
    metrics: platformMetrics(body?.metrics),
    createdBy: user.id
  })
  await recordAudit(event, user, 'platform.created', 'DigitalPlatform', String(platform._id), {
    name: platform.name,
    status: platform.status,
    published: platform.published
  })
  const populated = await DigitalPlatform.findById(platform._id).populate('categoryId', 'name slug order').lean()
  return { platform: serializePlatform(populated) }
})

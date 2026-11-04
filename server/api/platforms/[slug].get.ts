import { DigitalPlatform } from '../../models'

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '').trim()
  if (!slug) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })
  const platform = await DigitalPlatform.findOne({ slug, published: true })
    .populate('categoryId', 'name slug order')
    .lean()
  if (!platform) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })
  return { platform: serializePlatform(platform) }
})

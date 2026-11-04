import { DigitalPlatform } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })
  const platform = await DigitalPlatform.findById(id)
  if (!platform) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })

  await platform.deleteOne()
  await recordAudit(event, user, 'platform.deleted', 'DigitalPlatform', String(platform._id), {
    name: platform.name,
    slug: platform.slug,
    category: platform.category,
    published: platform.published
  })
  return { ok: true }
})

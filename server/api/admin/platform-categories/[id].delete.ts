import { DigitalPlatform, PlatformCategory } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan.' })
  const category = await PlatformCategory.findById(id)
  if (!category) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan.' })
  const platformCount = await DigitalPlatform.countDocuments({ categoryId: category._id })
  if (platformCount > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Kategori masih digunakan oleh ${platformCount} produk. Pindahkan produk ke kategori lain terlebih dahulu.`
    })
  }
  await category.deleteOne()
  await recordAudit(event, user, 'platform_category.deleted', 'PlatformCategory', String(category._id), {
    name: category.name
  })
  return { ok: true }
})

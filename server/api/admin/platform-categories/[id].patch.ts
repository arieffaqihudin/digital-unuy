import { DigitalPlatform, PlatformCategory } from '../../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan.' })
  const category = await PlatformCategory.findById(id)
  if (!category) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []

  if (body?.name !== undefined) {
    const name = String(body.name || '').trim().slice(0, 100)
    if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama kategori minimal 2 karakter.' })
    const slug = slugify(name)
    if (!slug) throw createError({ statusCode: 422, statusMessage: 'Nama kategori tidak valid.' })
    const duplicate = await PlatformCategory.exists({
      _id: { $ne: category._id },
      $or: [{ slug }, { name: new RegExp(`^${escapeRegex(name)}$`, 'i') }]
    })
    if (duplicate) throw createError({ statusCode: 409, statusMessage: 'Kategori sudah ada.' })
    category.name = name
    category.slug = slug
    changed.push('name')
  }
  if (body?.description !== undefined) {
    category.description = String(body.description || '').trim().slice(0, 500)
    changed.push('description')
  }
  if (body?.order !== undefined) {
    const order = Number(body.order)
    if (!Number.isFinite(order)) throw createError({ statusCode: 422, statusMessage: 'Urutan tidak valid.' })
    category.order = order
    changed.push('order')
  }
  if (body?.active !== undefined) {
    category.active = Boolean(body.active)
    changed.push('active')
  }

  await category.save()
  if (changed.includes('name')) {
    await DigitalPlatform.updateMany({ categoryId: category._id }, { $set: { category: category.name } })
  }
  await recordAudit(event, user, 'platform_category.updated', 'PlatformCategory', String(category._id), {
    name: category.name,
    changed
  })
  return { category: serializePlatformCategory(category) }
})

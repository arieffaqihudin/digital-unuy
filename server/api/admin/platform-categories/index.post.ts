import { PlatformCategory } from '../../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const body = await readBody(event)
  const name = String(body?.name || '').trim().slice(0, 100)
  const description = String(body?.description || '').trim().slice(0, 500)
  if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama kategori minimal 2 karakter.' })
  const slug = slugify(name)
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Nama kategori tidak valid.' })
  const duplicate = await PlatformCategory.exists({
    $or: [{ slug }, { name: new RegExp(`^${escapeRegex(name)}$`, 'i') }]
  })
  if (duplicate) throw createError({ statusCode: 409, statusMessage: 'Kategori sudah ada.' })

  const category = await PlatformCategory.create({
    name,
    slug,
    description,
    order: Number(body?.order) || 0,
    active: body?.active !== false
  })
  await recordAudit(event, user, 'platform_category.created', 'PlatformCategory', String(category._id), {
    name: category.name
  })
  return { category: serializePlatformCategory(category) }
})

import { DigitalPlatform, PlatformCategory } from '../../../models'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.manage')
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 48)
  const search = String(query.q || '').trim().slice(0, 100)
  const categoryQuery = String(query.category || '').trim()
  const status = String(query.status || '').trim()
  const published = String(query.published || '').trim()

  const categoryDocs = await PlatformCategory.find({}).sort({ order: 1, name: 1 }).lean()
  const filter: Record<string, unknown> = {}
  if (categoryQuery) {
    const category = categoryDocs.find(
      (item) => item.slug === categoryQuery || item.name.toLowerCase() === categoryQuery.toLowerCase()
    )
    if (category) filter.categoryId = category._id
    else filter.category = categoryQuery
  }
  if (status) filter.status = status
  if (published === 'true') filter.published = true
  if (published === 'false') filter.published = false
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ name: regex }, { category: regex }, { unit: regex }, { audiences: regex }]
  }

  const [items, total, counts] = await Promise.all([
    DigitalPlatform.find(filter)
      .populate('categoryId', 'name slug order')
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    DigitalPlatform.countDocuments(filter),
    DigitalPlatform.aggregate([
      { $match: { categoryId: { $ne: null } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ])
  ])
  const countMap = new Map(counts.map((item) => [String(item._id), Number(item.count)]))

  return {
    items: items.map((platform) => serializePlatform(platform)),
    total,
    page,
    pageSize,
    categories: categoryDocs.map((category) => ({
      ...serializePlatformCategory(category),
      platformCount: countMap.get(String(category._id)) || 0
    }))
  }
})

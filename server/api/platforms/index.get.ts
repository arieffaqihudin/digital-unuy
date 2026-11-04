import { DigitalPlatform, PlatformCategory } from '../../models'
import { PLATFORM_AUDIENCES } from '../../../shared/types'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, pageSize, skip } = parsePagination(query, 24)
  const search = String(query.q || '').trim().slice(0, 120)
  const categoryQuery = String(query.category || '').trim()
  const audience = String(query.audience || '').trim()
  const status = String(query.status || '').trim()

  const categoryDocs = await PlatformCategory.find({ active: true }).sort({ order: 1, name: 1 }).lean()
  const filter: Record<string, unknown> = { published: true }

  if (categoryQuery) {
    const category = categoryDocs.find(
      (item) => item.slug === categoryQuery || item.name.toLowerCase() === categoryQuery.toLowerCase()
    )
    if (category) {
      filter.categoryId = category._id
    } else {
      filter.category = categoryQuery
    }
  }
  if (audience && PLATFORM_AUDIENCES.includes(audience as (typeof PLATFORM_AUDIENCES)[number])) {
    filter.audiences = audience
  }
  if (status) filter.status = status
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    filter.$or = [
      { name: regex },
      { description: regex },
      { unit: regex },
      { category: regex },
      { audiences: regex }
    ]
  }

  const [items, total] = await Promise.all([
    DigitalPlatform.find(filter)
      .populate('categoryId', 'name slug order')
      .sort({ featured: -1, order: 1, name: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    DigitalPlatform.countDocuments(filter)
  ])

  const [categoryCounts, audienceCounts] = await Promise.all([
    DigitalPlatform.aggregate([
      { $match: { published: true, categoryId: { $ne: null } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]),
    Promise.all(
      PLATFORM_AUDIENCES.map(async (option) => ({
        name: option,
        count: await DigitalPlatform.countDocuments({ published: true, audiences: option })
      }))
    )
  ])
  const countMap = new Map(categoryCounts.map((item) => [String(item._id), Number(item.count)]))

  return {
    items: items.map((platform) => serializePlatform(platform)),
    total,
    page,
    pageSize,
    categories: categoryDocs.map((category) => ({
      ...serializePlatformCategory(category),
      platformCount: countMap.get(String(category._id)) || 0
    })),
    audiences: audienceCounts
  }
})

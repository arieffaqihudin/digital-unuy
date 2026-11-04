import { DigitalPlatform, PlatformCategory } from '../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.manage')
  const categories = await PlatformCategory.find({}).sort({ order: 1, name: 1 }).lean()
  const counts = await DigitalPlatform.aggregate([
    { $match: { categoryId: { $ne: null } } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } }
  ])
  const countMap = new Map(counts.map((item) => [String(item._id), Number(item.count)]))
  return {
    items: categories.map((category) => ({
      ...serializePlatformCategory(category),
      platformCount: countMap.get(String(category._id)) || 0
    }))
  }
})

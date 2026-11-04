import { TeamGroup, TeamMember } from '../../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.manage')
  const groups = await TeamGroup.find({}).sort({ order: 1, name: 1 }).lean()
  const counts = await TeamMember.aggregate([{ $group: { _id: '$group', count: { $sum: 1 } } }])
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]))
  return {
    items: groups.map((group) => ({
      ...serializeTeamGroup(group),
      memberCount: countMap.get(String(group._id)) || 0
    }))
  }
})

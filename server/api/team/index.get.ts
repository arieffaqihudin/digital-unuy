import { TeamGroup, TeamMember } from '../../models'

export default defineEventHandler(async () => {
  const [groups, members] = await Promise.all([
    TeamGroup.find({}).sort({ order: 1, name: 1 }).lean(),
    TeamMember.find({ published: true }).populate('group', 'name slug order').sort({ order: 1, name: 1 }).lean()
  ])

  const memberItems = members.map((member) => serializeTeamMember(member))
  return {
    groups: groups
      .map((group) => {
        const groupMembers = memberItems.filter((member) => member.groupId === String(group._id))
        return { ...serializeTeamGroup(group), members: groupMembers }
      })
      .filter((group) => group.members.length > 0),
    ungrouped: memberItems.filter((member) => !member.groupId),
    total: memberItems.length
  }
})

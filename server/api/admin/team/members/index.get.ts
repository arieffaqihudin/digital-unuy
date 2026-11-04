import { TeamMember } from '../../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.manage')
  const members = await TeamMember.find({}).populate('group', 'name slug order').sort({ order: 1, name: 1 }).lean()
  return {
    items: members.map((member) => serializeTeamMember(member, '/api/admin/team/members'))
  }
})

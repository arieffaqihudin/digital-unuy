import { TeamGroup, TeamMember } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Kelompok tim tidak ditemukan.' })
  const group = await TeamGroup.findById(id)
  if (!group) throw createError({ statusCode: 404, statusMessage: 'Kelompok tim tidak ditemukan.' })
  await TeamMember.updateMany({ group: group._id }, { $set: { group: null } })
  await group.deleteOne()
  await recordAudit(event, user, 'team_group.deleted', 'TeamGroup', id, { name: group.name })
  return { ok: true }
})

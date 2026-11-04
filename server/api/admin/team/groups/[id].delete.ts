import { TeamGroup, TeamMember } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Kelompok tim tidak ditemukan.' })
  const group = await TeamGroup.findById(id)
  if (!group) throw createError({ statusCode: 404, statusMessage: 'Kelompok tim tidak ditemukan.' })
  const memberCount = await TeamMember.countDocuments({ group: group._id })
  if (memberCount > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Kelompok masih digunakan oleh ${memberCount} anggota. Pindahkan anggota ke kelompok lain terlebih dahulu.`
    })
  }
  await group.deleteOne()
  await recordAudit(event, user, 'team_group.deleted', 'TeamGroup', id, { name: group.name })
  return { ok: true }
})

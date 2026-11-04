import { TeamMember } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Anggota tidak ditemukan.' })
  const member = await TeamMember.findById(id)
  if (!member) throw createError({ statusCode: 404, statusMessage: 'Anggota tidak ditemukan.' })

  const storageKey = member.photoStorageKey
  await member.deleteOne()
  if (storageKey) await deletePrivateUpload(storageKey)
  await recordAudit(event, user, 'team_member.deleted', 'TeamMember', id, { name: member.name })
  return { ok: true }
})

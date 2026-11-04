import { TeamGroup } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const body = await readBody(event)
  const name = String(body?.name || '').trim().slice(0, 100)
  if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama kelompok minimal 2 karakter.' })
  const slug = slugify(name)
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Nama kelompok tidak valid.' })
  if (await TeamGroup.exists({ $or: [{ name }, { slug }] })) {
    throw createError({ statusCode: 409, statusMessage: 'Kelompok tim sudah ada.' })
  }
  const group = await TeamGroup.create({ name, slug, order: Number(body?.order) || 0, createdBy: user.id })
  await recordAudit(event, user, 'team_group.created', 'TeamGroup', String(group._id), { name })
  return { group: serializeTeamGroup(group) }
})

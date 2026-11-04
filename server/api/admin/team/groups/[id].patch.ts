import { TeamGroup } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Kelompok tim tidak ditemukan.' })
  const group = await TeamGroup.findById(id)
  if (!group) throw createError({ statusCode: 404, statusMessage: 'Kelompok tim tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []
  if (body?.name !== undefined) {
    const name = String(body.name).trim().slice(0, 100)
    if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama kelompok minimal 2 karakter.' })
    const slug = slugify(name)
    if (await TeamGroup.exists({ _id: { $ne: group._id }, $or: [{ name }, { slug }] })) {
      throw createError({ statusCode: 409, statusMessage: 'Kelompok tim sudah ada.' })
    }
    group.name = name
    group.slug = slug
    changed.push('name')
  }
  if (body?.order !== undefined) {
    const order = Number(body.order)
    if (!Number.isFinite(order)) throw createError({ statusCode: 422, statusMessage: 'Urutan tidak valid.' })
    group.order = order
    changed.push('order')
  }
  await group.save()
  await recordAudit(event, user, 'team_group.updated', 'TeamGroup', String(group._id), {
    name: group.name,
    changed
  })
  return { group: serializeTeamGroup(group) }
})

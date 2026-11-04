import { TeamGroup, TeamMember } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Anggota tidak ditemukan.' })
  const member = await TeamMember.findById(id)
  if (!member) throw createError({ statusCode: 404, statusMessage: 'Anggota tidak ditemukan.' })

  const contentType = String(getHeader(event, 'content-type') || '')
  let payload: any = {}
  let photoPart: { data: Buffer; filename?: string; type?: string } | null = null

  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    const metaPart = parts?.find((part) => part.name === 'metadata')
    photoPart = parts?.find((part) => part.name === 'photo' && part.filename) || null
    if (metaPart) {
      try {
        payload = JSON.parse(metaPart.data.toString('utf8'))
      } catch {
        throw createError({ statusCode: 400, statusMessage: 'Metadata anggota tidak dapat dibaca.' })
      }
    }
  } else {
    payload = (await readBody(event)) || {}
  }

  const changed: string[] = []
  if (payload?.name !== undefined) {
    const name = String(payload.name).trim()
    if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama anggota minimal 2 karakter.' })
    member.name = name.slice(0, 120)
    changed.push('name')
  }
  if (payload?.position !== undefined) {
    const position = String(payload.position).trim()
    if (position.length < 2) throw createError({ statusCode: 422, statusMessage: 'Jabatan anggota minimal 2 karakter.' })
    member.position = position.slice(0, 160)
    changed.push('position')
  }
  if (payload?.unit !== undefined) {
    member.unit = String(payload.unit || '').trim().slice(0, 160)
    changed.push('unit')
  }
  if (payload?.bio !== undefined) {
    member.bio = String(payload.bio || '').trim().slice(0, 1500)
    changed.push('bio')
  }
  if (payload?.groupId !== undefined) {
    const groupId = payload.groupId ? String(payload.groupId) : null
    if (groupId) {
      if (!isObjectId(groupId) || !(await TeamGroup.exists({ _id: groupId }))) {
        throw createError({ statusCode: 422, statusMessage: 'Kelompok tim tidak ditemukan.' })
      }
    }
    member.group = groupId
    changed.push('group')
  }
  if (payload?.order !== undefined) {
    const order = Number(payload.order)
    if (!Number.isFinite(order)) throw createError({ statusCode: 422, statusMessage: 'Urutan tidak valid.' })
    member.order = order
    changed.push('order')
  }
  if (payload?.published !== undefined) {
    member.published = Boolean(payload.published)
    changed.push('published')
  }
  if (payload?.focalX !== undefined) {
    member.focalX = clampPercent(payload.focalX)
    changed.push('focalX')
  }
  if (payload?.focalY !== undefined) {
    member.focalY = clampPercent(payload.focalY)
    changed.push('focalY')
  }

  const oldStorageKey = member.photoStorageKey
  let newPhoto: Awaited<ReturnType<typeof processTeamPhoto>> | null = null
  if (photoPart) {
    newPhoto = await processTeamPhoto({
      data: photoPart.data,
      filename: photoPart.filename || 'foto.jpg',
      mimeType: String(photoPart.type || ''),
      memberId: String(member._id)
    })
    member.photoStorageKey = newPhoto.storageKey
    member.photoMimeType = newPhoto.mimeType
    member.photoSize = newPhoto.size
    changed.push('photo')
  } else if (payload?.removePhoto === true) {
    member.photoStorageKey = ''
    member.photoMimeType = ''
    member.photoSize = 0
    changed.push('photo_removed')
  }

  try {
    await member.save()
  } catch (error) {
    if (newPhoto?.storageKey) await deletePrivateUpload(newPhoto.storageKey)
    throw error
  }

  if (newPhoto && oldStorageKey && oldStorageKey !== newPhoto.storageKey) {
    await deletePrivateUpload(oldStorageKey)
  }
  if (payload?.removePhoto === true && oldStorageKey && !newPhoto) {
    await deletePrivateUpload(oldStorageKey)
  }

  await recordAudit(event, user, 'team_member.updated', 'TeamMember', String(member._id), {
    name: member.name,
    changed
  })

  const populated = await TeamMember.findById(member._id).populate('group', 'name slug order').lean()
  return { member: serializeTeamMember(populated, '/api/admin/team/members') }
})

function clampPercent(value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 50
  return Math.min(100, Math.max(0, Math.round(number)))
}

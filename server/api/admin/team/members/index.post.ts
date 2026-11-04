import mongoose from 'mongoose'
import { TeamGroup, TeamMember } from '../../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'Data anggota tidak ditemukan.' })
  const metaPart = parts.find((part) => part.name === 'metadata')
  const photoPart = parts.find((part) => part.name === 'photo' && part.filename)
  if (!metaPart) throw createError({ statusCode: 400, statusMessage: 'Metadata anggota tidak ditemukan.' })

  let payload: any
  try {
    payload = JSON.parse(metaPart.data.toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Metadata anggota tidak dapat dibaca.' })
  }

  const name = String(payload?.name || '').trim().slice(0, 120)
  const position = String(payload?.position || '').trim().slice(0, 160)
  if (name.length < 2) throw createError({ statusCode: 422, statusMessage: 'Nama anggota minimal 2 karakter.' })
  if (position.length < 2) throw createError({ statusCode: 422, statusMessage: 'Jabatan anggota minimal 2 karakter.' })

  const groupId = payload?.groupId ? String(payload.groupId) : null
  if (groupId) {
    if (!isObjectId(groupId) || !(await TeamGroup.exists({ _id: groupId }))) {
      throw createError({ statusCode: 422, statusMessage: 'Kelompok tim tidak ditemukan.' })
    }
  }

  const memberId = new mongoose.Types.ObjectId()
  let photo: Awaited<ReturnType<typeof processTeamPhoto>> | null = null
  if (photoPart) {
    photo = await processTeamPhoto({
      data: photoPart.data,
      filename: photoPart.filename || 'foto.jpg',
      mimeType: String(photoPart.type || ''),
      memberId: String(memberId)
    })
  }

  try {
    const member = await TeamMember.create({
      _id: memberId,
      name,
      position,
      unit: String(payload?.unit || '').trim().slice(0, 160),
      bio: String(payload?.bio || '').trim().slice(0, 1500),
      group: groupId,
      order: Number(payload?.order) || 0,
      published: false,
      photoStorageKey: photo?.storageKey || '',
      photoMimeType: photo?.mimeType || '',
      photoSize: photo?.size || 0,
      createdBy: user.id
    })

    await recordAudit(event, user, 'team_member.created', 'TeamMember', String(member._id), {
      name: member.name,
      position: member.position,
      published: member.published
    })

    const populated = await TeamMember.findById(member._id).populate('group', 'name slug order').lean()
    return { member: serializeTeamMember(populated, '/api/admin/team/members') }
  } catch (error) {
    if (photo?.storageKey) await deletePrivateUpload(photo.storageKey)
    throw error
  }
})

import { Role } from '../../../models'
import { PERMISSION_META } from '../../../../shared/permissions'
import { ROLE_LABELS, ROLE_PERMISSIONS, type RoleSlug } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'roles.manage')
  const slug = String(getRouterParam(event, 'slug') || '')
  if (!['admin', 'pemohon'].includes(slug)) {
    throw createError({ statusCode: 409, statusMessage: 'Role superadmin bersifat tetap dan tidak dapat diubah.' })
  }
  const body = await readBody(event)
  if (!Array.isArray(body?.permissions)) {
    throw createError({ statusCode: 422, statusMessage: 'Daftar permission tidak valid.' })
  }
  const allowed = new Set(PERMISSION_META.map((permission) => permission.key))
  const requested = [...new Set(body.permissions.map(String))]
  const permissions = requested.filter((permission) => allowed.has(permission as any))
  if (permissions.length !== requested.length) {
    throw createError({ statusCode: 422, statusMessage: 'Terdapat permission yang tidak dikenali.' })
  }

  const existing = await Role.findOne({ slug })
  const previous = existing?.permissions || ROLE_PERMISSIONS[slug as RoleSlug]
  const role = await Role.findOneAndUpdate(
    { slug },
    {
      $set: {
        permissions,
        label: ROLE_LABELS[slug as RoleSlug],
        description: existing?.description || ''
      }
    },
    { upsert: true, new: true }
  )
  clearRolePermissionCache()

  await recordAudit(event, user, 'role.permissions_updated', 'Role', String(role._id), {
    slug,
    previous,
    permissions
  })

  return {
    role: {
      slug: role.slug,
      label: role.label,
      permissions: role.permissions,
      locked: false
    }
  }
})

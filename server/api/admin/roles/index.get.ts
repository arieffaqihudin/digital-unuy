import { Role } from '../../../models'
import { ROLE_LABELS, ROLE_PERMISSIONS, type RoleSlug } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'roles.manage')
  const roles = await Role.find({}).sort({ slug: 1 }).lean()
  const slugs: RoleSlug[] = ['superadmin', 'admin']
  return {
    roles: slugs.map((slug) => {
      const role = roles.find((item) => item.slug === slug)
      return {
        slug,
        label: role?.label || ROLE_LABELS[slug],
        description: role?.description || '',
        permissions: slug === 'superadmin' ? ROLE_PERMISSIONS.superadmin : role?.permissions || ROLE_PERMISSIONS[slug],
        locked: slug === 'superadmin'
      }
    })
  }
})

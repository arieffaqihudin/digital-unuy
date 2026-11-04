import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  deleteCookie,
  getCookie,
  getHeader,
  getRequestIP,
  setCookie,
  type H3Event
} from 'h3'
import { ROLE_PERMISSIONS, type Permission, type RoleSlug, type SessionUser } from '../../shared/types'
import { Role, Session, User } from '../models'

export const SESSION_COOKIE = 'unu_session'
const SESSION_DAYS = 7
const roleCache = new Map<string, { permissions: Permission[]; expires: number }>()

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function safeEqual(a: string, b: string) {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

export async function getRolePermissions(role: RoleSlug): Promise<Permission[]> {
  if (role === 'superadmin') return ROLE_PERMISSIONS.superadmin
  const cached = roleCache.get(role)
  if (cached && cached.expires > Date.now()) return cached.permissions

  const roleDoc = await Role.findOne({ slug: role }).lean()
  const permissions = (roleDoc?.permissions as Permission[]) || ROLE_PERMISSIONS[role] || []
  roleCache.set(role, { permissions, expires: Date.now() + 60_000 })
  return permissions
}

export function clearRolePermissionCache() {
  roleCache.clear()
}

export async function createSession(event: H3Event, userId: string) {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await Session.create({
    tokenHash: hashToken(token),
    user: userId,
    expiresAt,
    ip: getRequestIP(event, { xForwardedFor: true }) || '',
    userAgent: String(getHeader(event, 'user-agent') || '').slice(0, 500)
  })

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60
  })

  return token
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    await Session.deleteOne({ tokenHash: hashToken(token) })
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  if (event.context.sessionUser !== undefined) {
    return event.context.sessionUser as SessionUser | null
  }

  const token = getCookie(event, SESSION_COOKIE)
  if (!token) {
    event.context.sessionUser = null
    return null
  }

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() }
  }).lean()

  if (!session) {
    event.context.sessionUser = null
    return null
  }

  const user = await User.findById(session.user).lean()
  if (!user || !user.active) {
    await Session.deleteOne({ _id: session._id })
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
    event.context.sessionUser = null
    return null
  }

  const permissions = await getRolePermissions(user.role as RoleSlug)
  const sessionUser: SessionUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as RoleSlug,
    permissions
  }
  event.context.sessionUser = sessionUser
  event.context.userDoc = user
  return sessionUser
}

export async function requireUser(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Silakan masuk untuk melanjutkan.' })
  }
  return user
}

export async function requirePermission(event: H3Event, permission: Permission): Promise<SessionUser> {
  const user = await requireUser(event)
  if (!user.permissions.includes(permission)) {
    throw createError({ statusCode: 403, statusMessage: 'Anda tidak memiliki izin untuk tindakan ini.' })
  }
  return user
}

export function requireMutationHeader(event: H3Event) {
  const method = String(event.method || 'GET').toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return

  const marker = getHeader(event, 'x-unu-csrf')
  if (marker !== '1') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permintaan ditolak. Muat ulang halaman lalu coba lagi.'
    })
  }

  const origin = getHeader(event, 'origin')
  if (origin) {
    const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host') || ''
    try {
      const originHost = new URL(origin).host
      if (host && originHost !== host) {
        throw createError({ statusCode: 403, statusMessage: 'Origin permintaan tidak valid.' })
      }
    } catch (error: any) {
      if (error?.statusCode) throw error
      throw createError({ statusCode: 403, statusMessage: 'Origin permintaan tidak valid.' })
    }
  }
}

export function publicUser(user: any): SessionUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: []
  }
}

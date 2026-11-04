import { getHeader, getRequestIP, type H3Event } from 'h3'
import type { SessionUser } from '../../shared/types'
import { AuditLog } from '../models'

export async function recordAudit(
  event: H3Event,
  user: SessionUser | null,
  action: string,
  entityType: string,
  entityId = '',
  metadata: Record<string, unknown> = {}
) {
  try {
    await AuditLog.create({
      actor: user?.id || null,
      actorName: user?.name || 'Sistem',
      actorEmail: user?.email || '',
      action,
      entityType,
      entityId: String(entityId),
      metadata,
      ip: getRequestIP(event, { xForwardedFor: true }) || '',
      userAgent: String(getHeader(event, 'user-agent') || '').slice(0, 500)
    })
  } catch (error: any) {
    console.error('[audit] failed to write audit log', error?.message || error)
  }
}

export function sanitizeMetadata(metadata: Record<string, unknown>) {
  const blocked = ['password', 'token', 'secret', 'authorization', 'cookie']
  const safe: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.some((word) => key.toLowerCase().includes(word))) continue
    safe[key] = value
  }
  return safe
}

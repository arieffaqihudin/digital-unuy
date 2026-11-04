import { PLATFORM_AUDIENCES } from '../../shared/types'

export function platformText(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max)
}

export function platformAudiences(value: unknown) {
  if (!Array.isArray(value)) return []
  const allowed = new Set<string>(PLATFORM_AUDIENCES)
  return [...new Set(value.map((item) => String(item || '').trim()).filter((item) => allowed.has(item)))]
}

export function platformGallery(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 500))
    .slice(0, 12)
}

export function platformModules(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .slice(0, 30)
    .map((item: any, index) => ({
      name: platformText(item?.name, 120),
      description: platformText(item?.description, 500),
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
      active: item?.active !== false
    }))
    .filter((item) => item.name.length >= 2)
}

export function platformMetrics(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .slice(0, 20)
    .map((item: any) => ({
      value: Number(item?.value),
      suffix: platformText(item?.suffix, 12),
      label: platformText(item?.label, 160),
      period: platformText(item?.period, 80),
      source: platformText(item?.source, 200)
    }))
    .filter((item) => Number.isFinite(item.value) && item.label.length >= 2)
}

export function platformUrl(value: unknown) {
  const url = String(value ?? '').trim()
  if (!url) return ''
  if (url.length > 500) throw createError({ statusCode: 422, statusMessage: 'URL terlalu panjang.' })
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol')
    return parsed.toString()
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'URL produk harus diawali http:// atau https://.' })
  }
}

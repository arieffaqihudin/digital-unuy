import { SEO_HARD_MAX, cleanSeoText, type SeoDTO } from '../../shared/seo'

/** Normalise stored SEO subdocument to the public DTO. */
export function serializeSeo(seo: any, legacy?: { title?: string; description?: string }): SeoDTO {
  return {
    title: seo?.title || legacy?.title || '',
    description: seo?.description || legacy?.description || '',
    image: seo?.image || '',
    canonical: seo?.canonical || '',
    noindex: Boolean(seo?.noindex)
  }
}

function safeUrl(value: unknown, label: string, allowPath: boolean): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (raw.length > SEO_HARD_MAX.url) throw createError({ statusCode: 422, statusMessage: `${label} terlalu panjang.` })
  if (allowPath && raw.startsWith('/') && !raw.startsWith('//')) {
    if (/[\s<>"']/.test(raw)) throw createError({ statusCode: 422, statusMessage: `${label} tidak valid.` })
    return raw
  }
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol')
    url.hash = ''
    return url.toString()
  } catch {
    throw createError({ statusCode: 422, statusMessage: `${label} harus berupa URL http(s) yang valid.` })
  }
}

/** Validate + sanitise SEO input from admin forms. Returns undefined when the field was not sent. */
export function parseSeoInput(raw: unknown) {
  if (raw === undefined || raw === null || typeof raw !== 'object') return undefined
  const input = raw as Record<string, unknown>
  return {
    title: cleanSeoText(input.title, SEO_HARD_MAX.title),
    description: cleanSeoText(input.description, SEO_HARD_MAX.description),
    image: safeUrl(input.image, 'Gambar share', true),
    canonical: safeUrl(input.canonical, 'Canonical URL', false),
    noindex: Boolean(input.noindex)
  }
}

/** Per-content SEO fields managed from the CMS. All optional; empty values fall back to content. */
export interface SeoDTO {
  title: string
  description: string
  image: string
  canonical: string
  noindex: boolean
}

export interface SeoSettingsDTO {
  titleSuffix: string
  defaultDescription: string
  defaultOgImage: string
  googleVerification: string
}

/** Recommended (not hard) lengths, used for indicators in the CMS. */
export const SEO_RECOMMENDED = {
  title: { min: 30, max: 60 },
  description: { min: 70, max: 160 }
} as const

export const SEO_HARD_MAX = { title: 160, description: 320, url: 500 } as const

export const emptySeo = (): SeoDTO => ({ title: '', description: '', image: '', canonical: '', noindex: false })
export const defaultSeoSettings = (): SeoSettingsDTO => ({
  titleSuffix: 'UNU Yogyakarta',
  defaultDescription:
    'Layanan digital, ekosistem teknologi, dokumentasi, dan publikasi Direktorat Transformasi Digital Universitas Nahdlatul Ulama Yogyakarta.',
  defaultOgImage: '/og-default.png',
  googleVerification: ''
})

/** Collapse whitespace and strip anything tag-like or control characters. Output is plain text. */
export function cleanSeoText(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

/** Shorten text to a snippet-friendly length at a word boundary. */
export function snippet(value: unknown, max = 160): string {
  const text = cleanSeoText(value, 5000)
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:.\-–\s]+$/, '')}…`
}

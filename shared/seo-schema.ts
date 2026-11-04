import type { SiteSettingsDTO } from './types'

/** Pure builders for schema.org JSON-LD. Only values that exist on the visible page are included. */

export const SITE_BRAND = 'Transformasi Digital UNU Yogyakarta'
export const SITE_TAGLINE = 'Satu Kampus, Satu Ekosistem Digital.'

const abs = (base: string, value?: string) => {
  if (!value) return undefined
  if (/^https?:\/\//i.test(value)) return value
  return value.startsWith('/') ? `${base}${value}` : undefined
}
const strip = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length))) as T

export function organizationLd(base: string, settings: SiteSettingsDTO) {
  return strip({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}/#organization`,
    name: settings.directorateName,
    alternateName: SITE_BRAND,
    url: base,
    logo: abs(base, settings.logoUrl) || `${base}/unu-logo.png`,
    description: settings.description || undefined,
    parentOrganization: { '@type': 'CollegeOrUniversity', name: settings.universityName },
    address: settings.address || undefined,
    contactPoint:
      settings.contactEmail || settings.contactPhone
        ? strip({ '@type': 'ContactPoint', contactType: 'customer support', email: settings.contactEmail, telephone: settings.contactPhone, availableLanguage: 'id' })
        : undefined,
    sameAs: settings.socials.map((social) => social.url).filter((url) => /^https?:\/\//.test(url))
  })
}

export function websiteLd(base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: SITE_BRAND,
    url: base,
    inLanguage: 'id-ID',
    publisher: { '@id': `${base}/#organization` }
  }
}

export function breadcrumbLd(base: string, items: { name: string; to: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${base}${item.to === '/' ? '' : item.to}` || base
    }))
  }
}

export function articleLd(
  base: string,
  input: { url: string; headline: string; description?: string; image?: string; datePublished?: string; dateModified?: string; author?: string; section?: string }
) {
  return strip({
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    headline: input.headline.slice(0, 110),
    description: input.description,
    image: abs(base, input.image),
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: input.author ? { '@type': 'Person', name: input.author } : { '@id': `${base}/#organization` },
    articleSection: input.section,
    inLanguage: 'id-ID',
    publisher: { '@id': `${base}/#organization` }
  })
}

export function serviceLd(base: string, input: { url: string; name: string; description: string; audience?: string[]; category?: string }) {
  return strip({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: input.category,
    provider: { '@id': `${base}/#organization` },
    areaServed: 'Universitas Nahdlatul Ulama Yogyakarta',
    audience: input.audience?.length ? { '@type': 'Audience', audienceType: input.audience.join(', ') } : undefined
  })
}

export function softwareLd(base: string, input: { url: string; name: string; description: string; image?: string; category?: string; appUrl?: string }) {
  return strip({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url: input.url,
    image: abs(base, input.image),
    applicationCategory: input.category || 'BusinessApplication',
    operatingSystem: 'Web',
    installUrl: input.appUrl && /^https?:\/\//.test(input.appUrl) ? input.appUrl : undefined,
    publisher: { '@id': `${base}/#organization` }
  })
}

/** JSON for inline <script type="application/ld+json">; `<` is escaped so content can never close the tag. */
export const safeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')

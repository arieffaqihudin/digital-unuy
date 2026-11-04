import type { MaybeRefOrGetter } from 'vue'
import type { SeoDTO } from '~/shared/seo'
import { cleanSeoText, snippet } from '~/shared/seo'
import { breadcrumbLd, safeJsonLd } from '~/shared/seo-schema'

export interface PageSeoInput {
  /** Final <title>. Used as-is unless `suffix` is set and the CMS gave no SEO title. */
  title: string
  description?: string
  /** CMS-managed overrides. Empty fields fall back automatically. */
  seo?: Partial<SeoDTO> | null
  /** Canonical path; defaults to the current route path (query strings are never part of the canonical). */
  path?: string
  image?: string
  type?: 'website' | 'article'
  noindex?: boolean
  /** Append the global title suffix (e.g. "| UNU Yogyakarta") for CMS entries without their own SEO title. */
  suffix?: boolean
  breadcrumbs?: { name: string; to: string }[]
  /** Extra JSON-LD objects built with shared/seo-schema. */
  jsonLd?: unknown[]
  publishedTime?: string
  modifiedTime?: string
}

export function usePageSeo(source: MaybeRefOrGetter<PageSeoInput>) {
  const route = useRoute()
  const config = useRuntimeConfig()
  const { settings } = useSite()
  const base = String(config.public.siteUrl || '').replace(/\/+$/, '')
  const input = computed(() => toValue(source))

  const canonical = computed(() => {
    const override = input.value.seo?.canonical
    if (override && /^https?:\/\//i.test(override)) return override
    const raw = input.value.path ?? route.path
    const path = raw.length > 1 ? raw.replace(/\/+$/, '') : raw
    return `${base}${path === '/' ? '' : path}${path === '/' ? '/' : ''}`
  })

  const resolved = computed(() => {
    const value = input.value
    const seoSettings = settings.value.seo
    const cmsTitle = cleanSeoText(value.seo?.title, 160)
    const suffix = seoSettings?.titleSuffix || 'UNU Yogyakarta'
    const title = cmsTitle || (value.suffix ? `${value.title} | ${suffix}` : value.title)
    const description =
      cleanSeoText(value.seo?.description, 320) ||
      snippet(value.description, 160) ||
      seoSettings?.defaultDescription ||
      ''
    const rawImage = value.seo?.image || value.image || seoSettings?.defaultOgImage || '/og-default.png'
    const image = /^https?:\/\//i.test(rawImage) ? rawImage : `${base}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`
    return { title, description, image, noindex: Boolean(value.noindex || value.seo?.noindex) }
  })

  useHead(() => {
    const { title, description, image, noindex } = resolved.value
    const value = input.value
    const scripts = [
      ...(value.breadcrumbs?.length ? [breadcrumbLd(base, value.breadcrumbs)] : []),
      ...(value.jsonLd || [])
    ]
    return {
      title,
      titleTemplate: '%s',
      meta: [
        { name: 'description', content: description },
        ...(settings.value.seo?.googleVerification ? [{ name: 'google-site-verification', content: settings.value.seo.googleVerification }] : []),
        ...(noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
        { property: 'og:site_name', content: 'Transformasi Digital UNU Yogyakarta' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:type', content: value.type || 'website' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: canonical.value },
        { property: 'og:image', content: image },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: image },
        ...(value.type === 'article' && value.publishedTime ? [{ property: 'article:published_time', content: value.publishedTime }] : []),
        ...(value.type === 'article' && value.modifiedTime ? [{ property: 'article:modified_time', content: value.modifiedTime }] : [])
      ],
      link: noindex ? [] : [{ rel: 'canonical', href: canonical.value }],
      script: scripts.map((item, index) => ({
        key: `ld-${index}`,
        type: 'application/ld+json',
        innerHTML: safeJsonLd(item)
      }))
    }
  })

  return { canonical, resolved, base }
}

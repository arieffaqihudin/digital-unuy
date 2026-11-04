<script setup lang="ts">
import { ArrowLeft, ArrowRight, CalendarDays, UserRound } from 'lucide-vue-next'
import type { ArticleDTO } from '~/shared/types'
import { articleLd } from '~/shared/seo-schema'

interface ArticleResponse {
  article: ArticleDTO
  related: ArticleDTO[]
}

const route = useRoute()
const { data } = await useAsyncData<ArticleResponse>(`article-${route.params.slug}`, () =>
  $fetch<ArticleResponse>(`/api/articles/${route.params.slug}`)
)
const article = computed(() => data.value?.article)
if (!article.value) throw createError({ statusCode: 404, statusMessage: 'Publikasi tidak ditemukan.', fatal: true })
const { formatDate } = useFormat()
const runtimeConfig = useRuntimeConfig()

const siteBase = String(runtimeConfig.public.siteUrl || '').replace(/\/+$/, '')
usePageSeo(() => {
  const item = article.value
  return {
    title: item?.title || 'Publikasi',
    suffix: true,
    description: item?.excerpt,
    seo: item?.seo,
    image: item?.thumbnail || undefined,
    type: 'article' as const,
    publishedTime: item?.publishedAt,
    modifiedTime: item?.updatedAt,
    breadcrumbs: [
      { name: 'Beranda', to: '/' },
      { name: 'Publikasi', to: '/publikasi' },
      { name: item?.title || '', to: `/publikasi/${item?.slug}` }
    ],
    jsonLd: item
      ? [
          articleLd(siteBase, {
            url: `${siteBase}/publikasi/${item.slug}`,
            headline: item.title,
            description: item.excerpt,
            image: item.thumbnail,
            datePublished: item.publishedAt,
            dateModified: item.updatedAt,
            author: item.author,
            section: item.category
          })
        ]
      : []
  }
})
</script>

<template>
  <article v-if="article">
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Publikasi', to: '/publikasi' }, { label: article.title }]" />
        <div class="mx-auto mt-8 max-w-4xl">
          <span class="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">{{ article.category }}</span>
          <h1 class="display-2 mt-5">{{ article.title }}</h1>
          <p class="body-lg mt-5">{{ article.excerpt }}</p>
          <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-warm pt-5 text-xs text-ink-muted">
            <span class="inline-flex items-center gap-1.5"><UserRound :size="13" aria-hidden="true" />{{ article.author }}</span>
            <span class="inline-flex items-center gap-1.5"><CalendarDays :size="13" aria-hidden="true" />{{ formatDate(article.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div class="mx-auto max-w-3xl">
          <div v-if="article.thumbnail" class="mb-8 overflow-hidden rounded-2xl border border-line-warm">
            <img :src="article.thumbnail" :alt="`Ilustrasi ${article.title}`" loading="lazy" class="w-full object-cover" />
          </div>
          <div class="prose-unu" v-html="article.content" />

          <div class="mt-10 flex flex-col gap-3 border-t border-line-warm pt-6 sm:flex-row sm:items-center sm:justify-between">
            <NuxtLink to="/publikasi" class="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:text-unu-green hover:underline">
              <ArrowLeft :size="15" aria-hidden="true" /> Semua publikasi
            </NuxtLink>
            <NuxtLink to="/layanan" class="inline-flex items-center gap-1.5 text-sm font-semibold text-unu-green underline-offset-4 hover:underline">
              Jelajahi layanan <ArrowRight :size="15" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section v-if="data?.related.length" class="section-space border-t border-line-warm bg-ivory">
      <div class="page-shell">
        <SectionHeading eyebrow="Bacaan lain" title="Publikasi terkait" />
        <div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="item in data.related" :key="item.id" :article="item" />
        </div>
      </div>
    </section>
  </article>
</template>

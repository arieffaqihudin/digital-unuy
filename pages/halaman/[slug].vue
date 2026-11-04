<script setup lang="ts">
interface PageResponse {
  page: {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    seoTitle: string
    seoDescription: string
    seo?: import('~/shared/seo').SeoDTO
    updatedAt: string
  }
}

const route = useRoute()
const { data } = await useAsyncData<PageResponse>(`page-${route.params.slug}`, () =>
  $fetch<PageResponse>(`/api/pages/${route.params.slug}`)
)
const page = computed(() => data.value?.page)
if (!page.value) throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan.', fatal: true })
const { formatDate } = useFormat()

usePageSeo(() => ({
  title: page.value?.title || 'Halaman',
  suffix: true,
  description: page.value?.excerpt,
  seo: page.value?.seo,
  breadcrumbs: [{ name: 'Beranda', to: '/' }, { name: page.value?.title || '', to: `/halaman/${page.value?.slug}` }]
}))
</script>

<template>
  <div v-if="page">
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: page.title }]" />
        <h1 class="display-1 mt-8 max-w-4xl">{{ page.title }}</h1>
        <p v-if="page.excerpt" class="body-lg mt-5 max-w-2xl">{{ page.excerpt }}</p>
        <p class="mt-5 text-[14px] text-ink-muted">Diperbarui {{ formatDate(page.updatedAt) }}</p>
      </div>
    </section>
    <section class="section-space bg-white">
      <div class="page-shell">
        <div class="prose-unu mx-auto max-w-3xl" v-html="page.content" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { FilterX, Search } from 'lucide-vue-next'
import type { ArticleDTO } from '~/shared/types'

const search = ref('')
const category = ref('')
const page = ref(1)
const pending = ref(true)
const failure = ref('')
const result = ref<{ items: ArticleDTO[]; total: number; page: number; pageSize: number; categories: string[] } | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  pending.value = true
  failure.value = ''
  try {
    result.value = await $fetch('/api/articles', {
      query: { q: search.value || undefined, category: category.value || undefined, page: page.value, pageSize: 9 }
    })
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Publikasi gagal dimuat.'
  } finally {
    pending.value = false
  }
}
await load()
watch(category, () => {
  page.value = 1
  load()
})
watch(page, load)
watch(search, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
function reset() {
  search.value = ''
  category.value = ''
  page.value = 1
  load()
}
const hasFilters = computed(() => Boolean(search.value || category.value))
const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 9))))
const featured = computed(() => result.value?.items?.[0])
const rest = computed(() => result.value?.items?.slice(1) || [])

usePageSeo({
  title: 'Berita & Publikasi Transformasi Digital | UNU Yogyakarta',
  description:
    'Informasi terbaru mengenai pengembangan sistem, program, kegiatan, dan inovasi transformasi digital UNU Yogyakarta.',
  breadcrumbs: [{ name: 'Beranda', to: '/' }, { name: 'Publikasi', to: '/publikasi' }]
})
</script>

<template>
  <div>
    <PublicPageHeader
      eyebrow="Catatan & Kabar"
      title="Publikasi"
      description="Kabar, pembelajaran, dan pembaruan dari kerja transformasi digital di lingkungan universitas."
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Publikasi' }]"
    >
      <template #aside>
        <p class="max-w-[250px] text-[14px] leading-5 text-slate-500">Artikel berstatus draft tidak ditampilkan di website publik.</p>
      </template>
    </PublicPageHeader>

    <section class="py-10 lg:py-12 bg-soft-white">
      <h2 class="sr-only">Daftar publikasi</h2>
      <div class="page-shell">
        <div class="flex flex-col gap-3 border-y border-line-warm bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="relative w-full sm:max-w-sm">
            <label for="article-search" class="sr-only">Cari publikasi</label>
            <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input id="article-search" v-model="search" type="search" class="field-input border-0 bg-transparent pl-10" placeholder="Cari publikasi…" />
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" class="min-h-[44px] border-b-2 px-3 text-[14px] font-semibold transition" :class="!category ? 'border-unu-green text-unu-green' : 'border-transparent text-slate-500 hover:text-charcoal'" @click="category = ''">Semua</button>
            <button v-for="item in result?.categories || []" :key="item" type="button" class="min-h-[44px] border-b-2 px-3 text-[14px] font-semibold transition" :class="category === item ? 'border-unu-green text-unu-green' : 'border-transparent text-slate-500 hover:text-charcoal'" @click="category = item">{{ item }}</button>
            <button v-if="hasFilters" type="button" class="inline-flex min-h-[44px] items-center gap-1 px-2 text-[14px] font-semibold text-slate-400" @click="reset"><FilterX :size="13" /> Reset</button>
          </div>
        </div>

        <div v-if="pending" class="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div class="skeleton h-[380px] rounded-2xl" />
          <div class="grid gap-4"><div class="skeleton h-44 rounded-xl" /><div class="skeleton h-44 rounded-xl" /></div>
        </div>
        <EmptyState v-else-if="failure" class="mt-8" title="Publikasi belum dapat dimuat" description="Silakan coba lagi.">
          <AppButton variant="secondary" @click="load">Muat ulang</AppButton>
        </EmptyState>
        <EmptyState
          v-else-if="!result?.items.length"
          class="mt-8"
          title="Publikasi tidak ditemukan"
          :description="hasFilters ? 'Coba kata kunci atau kategori lain.' : 'Belum ada publikasi yang diterbitkan.'"
        >
          <AppButton v-if="hasFilters" variant="secondary" @click="reset">Hapus filter</AppButton>
        </EmptyState>
        <template v-else>
          <div class="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <ArticleCard v-if="featured" :article="featured" variant="featured" />
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ArticleCard v-for="article in rest.slice(0, 2)" :key="article.id" :article="article" variant="compact" />
            </div>
          </div>
          <div v-if="rest.length > 2" class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ArticleCard v-for="article in rest.slice(2)" :key="article.id" :article="article" />
          </div>
        </template>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-10" @update:page="page = $event" />
      </div>
    </section>
  </div>
</template>

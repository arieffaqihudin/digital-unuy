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

useSeoMeta({
  title: 'Publikasi',
  description:
    'Kabar, pembelajaran, dan pembaruan dari Direktorat Tim Transformasi Digital Universitas Nahdlatul Ulama Yogyakarta.',
  ogTitle: 'Publikasi · Transformasi Digital UNU Yogyakarta',
  ogDescription: 'Catatan dan pembaruan seputar transformasi digital UNU Yogyakarta.'
})
</script>

<template>
  <div>
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10 lg:py-14">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Publikasi' }]" />
        <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Publikasi</p>
            <h1 class="display-1 mt-5">Catatan transformasi</h1>
            <p class="body-lg mt-5 max-w-2xl">Kabar, pembelajaran, dan pembaruan dari kerja transformasi digital di lingkungan universitas.</p>
          </div>
          <div class="rounded-2xl border border-line-warm bg-white p-5">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Publikasi resmi</p>
            <p class="mt-2 text-sm leading-6 text-ink-muted">Konten publikasi dikelola melalui CMS. Artikel berstatus draft tidak ditampilkan di website publik.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="relative w-full lg:max-w-md">
            <label for="article-search" class="sr-only">Cari publikasi</label>
            <Search :size="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <input id="article-search" v-model="search" type="search" class="field-input pl-10" placeholder="Cari publikasi…" />
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" class="min-h-[44px] rounded-full border px-3.5 text-xs font-semibold transition" :class="!category ? 'border-charcoal bg-charcoal text-white' : 'border-line-warm bg-white text-ink-muted'" @click="category = ''">Semua</button>
            <button v-for="item in result?.categories || []" :key="item" type="button" class="min-h-[44px] rounded-full border px-3.5 text-xs font-semibold transition" :class="category === item ? 'border-charcoal bg-charcoal text-white' : 'border-line-warm bg-white text-ink-muted'" @click="category = item">{{ item }}</button>
            <button v-if="hasFilters" type="button" class="inline-flex min-h-[44px] items-center gap-1 rounded-full px-2 text-xs font-semibold text-ink-muted" @click="reset"><FilterX :size="13" /> Reset</button>
          </div>
        </div>

        <div v-if="pending" class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton v-for="index in 6" :key="index" />
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
        <div v-else class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="article in result.items" :key="article.id" :article="article" />
        </div>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-10" @update:page="page = $event" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import type { SearchContentType, SearchResultDTO } from '~/shared/types'
import { SEARCH_CONTENT_TYPES } from '~/shared/types'

interface SearchResponse {
  query: string
  items: SearchResultDTO[]
  total: number
  page: number
  pageSize: number
  counts: Record<string, number>
}

const route = useRoute()
const validTypes = new Set(SEARCH_CONTENT_TYPES.map((item) => item.value))
const q = computed(() => String(route.query.q || '').trim())
const type = computed<SearchContentType | ''>(() => {
  const value = String(route.query.type || '')
  return validTypes.has(value as SearchContentType) ? (value as SearchContentType) : ''
})
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const searchInput = ref(q.value)
const quickLinks = [
  { label: 'Layanan Digital', to: '/layanan' },
  { label: 'Ekosistem Digital', to: '/ekosistem-digital' },
  { label: 'Panduan & Dokumen', to: '/dokumen' },
  { label: 'Publikasi', to: '/publikasi' },
  { label: 'Tentang Kami', to: '/tentang' }
]

watch(q, (value) => {
  searchInput.value = value
})

const { data, pending, error } = await useAsyncData<SearchResponse>(
  'public-search-page',
  () =>
    $fetch('/api/search', {
      query: {
        q: q.value,
        type: type.value || undefined,
        page: page.value,
        pageSize: 12
      }
    }),
  { watch: [q, type, page] }
)

const items = computed(() => data.value?.items || [])
const total = computed(() => data.value?.total || 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / (data.value?.pageSize || 12))))
const counts = computed(() => data.value?.counts || {})
const totalCounts = computed(() => Object.values(counts.value).reduce((sum, value) => sum + Number(value || 0), 0))

function submit() {
  const term = searchInput.value.trim()
  if (term.length < 2) return
  navigateTo({
    path: '/pencarian',
    query: { q: term, ...(type.value ? { type: type.value } : {}) }
  })
}

function setType(value: SearchContentType | '') {
  navigateTo({
    path: '/pencarian',
    query: { q: q.value, ...(value ? { type: value } : {}) }
  })
}

function goPage(value: number) {
  navigateTo({
    path: '/pencarian',
    query: { q: q.value, ...(type.value ? { type: type.value } : {}), ...(value > 1 ? { page: value } : {}) }
  })
}

useSeoMeta({
  title: q.value ? `Pencarian: ${q.value}` : 'Pencarian',
  description: 'Cari layanan digital, produk ekosistem, panduan, publikasi, dan informasi publik UNU Yogyakarta.',
  robots: 'noindex, follow'
})
</script>

<template>
  <div>
    <PublicPageHeader
      eyebrow="Pencarian"
      :title="q ? 'Hasil Pencarian' : 'Cari di Portal'"
      description="Temukan layanan, produk digital, panduan, publikasi, dan informasi publik dalam satu tempat."
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Pencarian' }]"
    >
      <template #aside>
        <div class="flex items-center gap-3 text-[14px] text-slate-500">
          <span class="font-semibold tabular-nums text-charcoal">{{ q ? total : '—' }}</span>
          <span>hasil ditemukan</span>
        </div>
      </template>
    </PublicPageHeader>

    <section class="bg-soft-white py-8 lg:py-10">
      <div class="page-shell">
        <form class="rounded-xl border border-line-warm bg-white p-3 sm:p-4" @submit.prevent="submit">
          <div class="flex flex-col gap-2 sm:flex-row">
            <div class="relative flex-1">
              <Search :size="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <label for="search-page-input" class="sr-only">Cari konten publik</label>
              <input
                id="search-page-input"
                v-model="searchInput"
                type="search"
                class="min-h-[48px] w-full rounded-lg border border-line-warm bg-white pl-11 pr-4 text-[16px] text-charcoal outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-0"
                placeholder="Cari layanan, aplikasi, panduan..."
                autocomplete="off"
              />
            </div>
            <AppButton type="submit" class="sm:min-w-[120px]">Cari</AppButton>
          </div>
        </form>

        <div v-if="q" class="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
          <span class="text-slate-500">Kata kunci:</span>
          <span class="rounded-full border border-unu-green/20 bg-unu-green-soft px-3 py-1.5 font-semibold text-unu-green-dark">“{{ q }}”</span>
        </div>

        <div v-if="q" class="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            class="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition"
            :class="!type ? 'border-charcoal bg-charcoal text-white' : 'border-line-warm bg-white text-slate-600 hover:border-unu-green/40'"
            @click="setType('')"
          >
            Semua
            <span class="tabular-nums opacity-70">{{ totalCounts }}</span>
          </button>
          <button
            v-for="option in SEARCH_CONTENT_TYPES"
            :key="option.value"
            type="button"
            class="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition"
            :class="type === option.value ? 'border-unu-green bg-unu-green text-white' : 'border-line-warm bg-white text-slate-600 hover:border-unu-green/40'"
            @click="setType(option.value)"
          >
            {{ option.label }}
            <span class="tabular-nums opacity-70">{{ counts[option.value] || 0 }}</span>
          </button>
        </div>

        <div v-if="pending" class="mt-7 space-y-2 rounded-xl border border-line-warm bg-white p-4">
          <div v-for="index in 5" :key="index" class="skeleton h-20 rounded-lg" />
        </div>

        <EmptyState
          v-else-if="error"
          class="mt-7"
          title="Pencarian gagal dimuat"
          description="Silakan coba lagi beberapa saat lagi."
        />

        <div v-else-if="q.length < 2" class="mt-7 rounded-xl border border-line-warm bg-white p-6 sm:p-8">
          <h2 class="text-[20px] font-semibold tracking-[-0.02em]">Mulai mencari</h2>
          <p class="mt-2 max-w-xl text-[14px] leading-6 text-slate-600">Ketik minimal dua karakter untuk mencari layanan, produk ekosistem, panduan, publikasi, dan informasi publik.</p>
          <div class="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="link in quickLinks"
              :key="link.to"
              :to="link.to"
              class="flex min-h-[48px] items-center justify-between gap-3 rounded-lg border border-line-warm px-4 text-[14px] font-medium text-slate-700 transition hover:border-unu-green/35 hover:bg-soft-white hover:text-unu-green"
            >
              {{ link.label }}
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>

        <EmptyState
          v-else-if="!items.length"
          class="mt-7"
          title="Tidak ada hasil ditemukan"
          description="Coba kata kunci lain atau perluas filter jenis konten."
        >
          <AppButton v-if="type" variant="secondary" @click="setType('')">Tampilkan semua jenis konten</AppButton>
        </EmptyState>

        <div v-else class="mt-7 overflow-hidden rounded-xl border border-line-warm bg-white">
          <div class="flex items-center justify-between border-b border-line-warm px-5 py-3">
            <p class="text-[13px] text-slate-500">Menampilkan {{ items.length }} dari {{ total }} hasil</p>
            <p v-if="type" class="text-[12px] font-semibold uppercase tracking-wide text-unu-green">{{ SEARCH_CONTENT_TYPES.find((item) => item.value === type)?.label }}</p>
          </div>
          <SearchResultRow v-for="item in items" :key="item.id" :result="item" :query="q" />
        </div>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-10" @update:page="goPage" />
      </div>
    </section>
  </div>
</template>

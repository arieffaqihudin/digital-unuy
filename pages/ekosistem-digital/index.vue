<script setup lang="ts">
import { FilterX } from 'lucide-vue-next'
import type { DigitalPlatformDTO, PlatformCategoryDTO } from '~/shared/types'

const route = useRoute()
const category = ref(String(route.query.category || ''))
const audience = ref(String(route.query.audience || ''))
const page = ref(1)
const pending = ref(true)
const failure = ref('')
const result = ref<{
  items: DigitalPlatformDTO[]
  total: number
  page: number
  pageSize: number
  categories: PlatformCategoryDTO[]
  audiences: { name: string; count: number }[]
} | null>(null)

async function load() {
  pending.value = true
  failure.value = ''
  try {
    result.value = await $fetch('/api/platforms', {
      query: {
        category: category.value || undefined,
        audience: audience.value || undefined,
        page: page.value,
        pageSize: 24
      }
    })
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Ekosistem digital gagal dimuat.'
  } finally {
    pending.value = false
  }
}

await load()

watch([category, audience], () => {
  page.value = 1
  load()
})
watch(page, load)
watch(
  () => route.query,
  (query) => {
    category.value = String(query.category || '')
    audience.value = String(query.audience || '')
  }
)

function reset() {
  category.value = ''
  audience.value = ''
  page.value = 1
  load()
}

const hasFilters = computed(() => Boolean(category.value || audience.value))
const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 24))))
const activeCategory = computed(() => result.value?.categories.find((item) => item.slug === category.value) || null)
const featuredProduct = computed(() => result.value?.items.find((item) => item.featured) || null)
const gridProducts = computed(() => {
  const items = featuredProduct.value
    ? result.value?.items.filter((item) => item.id !== featuredProduct.value?.id) || []
    : result.value?.items || []
  return [...items].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
})

usePageSeo({
  title: 'Ekosistem Digital UNU Yogyakarta | Sistem & Platform Kampus',
  description:
    'Temukan sistem akademik, operasional, pengabdian, serta platform digital yang dikembangkan untuk mendukung aktivitas UNU Yogyakarta.',
  breadcrumbs: [{ name: 'Beranda', to: '/' }, { name: 'Ekosistem Digital', to: '/ekosistem-digital' }]
})
</script>

<template>
  <div>
    <PublicPageHeader
      eyebrow="Platform & Sistem"
      title="Ekosistem Digital UNU Yogyakarta"
      description="Berbagai sistem yang saling terhubung untuk mendukung akademik, operasional, pengabdian, dan pengelolaan universitas."
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Ekosistem Digital' }]"
    >
      <template #aside>
        <div class="flex items-center gap-3 text-[14px] text-slate-500">
          <span class="font-semibold tabular-nums text-charcoal">{{ result?.total ?? '—' }}</span>
          <span>produk digital</span>
        </div>
      </template>
    </PublicPageHeader>

    <section class="bg-soft-white py-8 lg:py-10">
      <h2 class="sr-only">Daftar produk ekosistem digital</h2>
      <div class="page-shell">
        <div class="flex flex-col gap-3 border-b border-line-warm pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div>
              <label for="ecosystem-category" class="sr-only">Filter kategori</label>
              <select
                id="ecosystem-category"
                v-model="category"
                class="min-h-[44px] w-full rounded-lg border border-line-warm bg-white px-3.5 text-[14px] font-medium text-charcoal transition hover:border-slate-300 focus:border-unu-green focus:ring-2 focus:ring-unu-green/15 sm:w-64"
              >
                <option value="">Semua Produk</option>
                <option v-for="item in result?.categories || []" :key="item.id" :value="item.slug">{{ item.name }}</option>
              </select>
            </div>
            <div>
              <label for="ecosystem-audience" class="sr-only">Filter sasaran pengguna</label>
              <select
                id="ecosystem-audience"
                v-model="audience"
                class="min-h-[44px] w-full rounded-lg border border-line-warm bg-white px-3.5 text-[14px] font-medium text-charcoal transition hover:border-slate-300 focus:border-unu-green focus:ring-2 focus:ring-unu-green/15 sm:w-56"
              >
                <option value="">Semua Pengguna</option>
                <option v-for="item in result?.audiences || []" :key="item.name" :value="item.name">{{ item.name }}</option>
              </select>
            </div>
          </div>
          <button
            v-if="hasFilters"
            type="button"
            class="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 self-start rounded-lg px-2.5 text-[13px] font-semibold text-slate-500 transition hover:bg-white hover:text-charcoal sm:self-auto"
            @click="reset"
          >
            <FilterX :size="14" aria-hidden="true" /> Reset filter
          </button>
        </div>

        <p v-if="activeCategory" class="mt-4 max-w-3xl text-[14px] leading-6 text-slate-600">{{ activeCategory.description }}</p>

        <div v-if="pending" class="mt-7 space-y-4">
          <div class="skeleton h-[340px] rounded-2xl" />
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="index in 5" :key="index" class="skeleton h-80 rounded-xl" />
          </div>
        </div>
        <EmptyState v-else-if="failure" class="mt-7" title="Data belum dapat dimuat" description="Silakan coba lagi.">
          <AppButton variant="secondary" @click="load">Muat ulang</AppButton>
        </EmptyState>
        <EmptyState
          v-else-if="!result?.items.length"
          class="mt-7"
          title="Produk tidak ditemukan"
          :description="hasFilters ? 'Coba pilih kategori atau sasaran pengguna lain.' : 'Belum ada produk digital yang dipublikasikan.'"
        >
          <AppButton v-if="hasFilters" variant="secondary" @click="reset">Hapus filter</AppButton>
        </EmptyState>
        <template v-else>
          <div v-if="featuredProduct" class="mt-7">
            <p class="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">Produk unggulan</p>
            <PlatformCard :platform="featuredProduct" featured />
          </div>
          <div v-if="gridProducts.length" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PlatformCard v-for="(platform, index) in gridProducts" :key="platform.id" :platform="platform" :index="index + 1" />
          </div>
        </template>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-10" @update:page="page = $event" />
      </div>
    </section>
  </div>
</template>

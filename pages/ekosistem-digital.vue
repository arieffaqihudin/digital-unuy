<script setup lang="ts">
import { FilterX, Search } from 'lucide-vue-next'
import type { DigitalPlatformDTO } from '~/shared/types'
import { PLATFORM_STATUSES } from '~/shared/types'

const search = ref('')
const category = ref('')
const status = ref('')
const page = ref(1)
const pending = ref(true)
const failure = ref('')
const result = ref<{ items: DigitalPlatformDTO[]; total: number; page: number; pageSize: number; categories: string[] } | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  pending.value = true
  failure.value = ''
  try {
    result.value = await $fetch('/api/platforms', {
      query: {
        q: search.value || undefined,
        category: category.value || undefined,
        status: status.value || undefined,
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

watch([category, status], () => {
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
  status.value = ''
  page.value = 1
  load()
}

const hasFilters = computed(() => Boolean(search.value || category.value || status.value))
const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 24))))

useSeoMeta({
  title: 'Ekosistem Digital',
  description:
    'Direktori platform digital Universitas Nahdlatul Ulama Yogyakarta beserta kategori, unit pengelola, dan status implementasinya.',
  ogTitle: 'Ekosistem Digital UNU Yogyakarta',
  ogDescription: 'Platform digital yang tercatat resmi di lingkungan UNU Yogyakarta.'
})
</script>

<template>
  <div>
    <PublicPageHeader
      eyebrow="Platform & Sistem"
      title="Ekosistem Digital"
      description="Direktori platform yang menyusun layanan digital universitas, lengkap dengan unit pengelola dan status implementasinya."
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Ekosistem Digital' }]"
    >
      <template #aside>
        <div class="flex items-center gap-3 text-[14px] text-slate-500">
          <span class="font-semibold tabular-nums text-charcoal">{{ result?.total ?? '—' }}</span>
          <span>platform tercatat</span>
        </div>
      </template>
    </PublicPageHeader>

    <section class="py-10 lg:py-12 bg-soft-white">
      <div class="page-shell">
        <div class="border-y border-line-warm bg-white px-4 py-3 sm:px-5">
          <div class="grid gap-3 lg:grid-cols-[1fr_210px_210px_auto]">
            <div class="relative">
              <label for="platform-search" class="sr-only">Cari platform</label>
              <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input id="platform-search" v-model="search" type="search" class="field-input border-0 bg-transparent pl-10" placeholder="Cari platform, unit, atau sasaran…" />
            </div>
            <select v-model="category" class="field-input border-0 bg-transparent" aria-label="Filter kategori">
              <option value="">Semua kategori</option>
              <option v-for="item in result?.categories || []" :key="item" :value="item">{{ item }}</option>
            </select>
            <select v-model="status" class="field-input border-0 bg-transparent" aria-label="Filter status">
              <option value="">Semua status</option>
              <option v-for="item in PLATFORM_STATUSES" :key="item" :value="item">{{ item }}</option>
            </select>
            <button v-if="hasFilters" type="button" class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-slate-500 hover:bg-soft-white hover:text-charcoal" @click="reset">
              <FilterX :size="14" aria-hidden="true" /> Reset
            </button>
          </div>
        </div>

        <div v-if="pending" class="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="index in 6" :key="index" class="skeleton h-60 rounded-xl" />
        </div>
        <EmptyState v-else-if="failure" class="mt-7" title="Data belum dapat dimuat" description="Silakan coba lagi.">
          <AppButton variant="secondary" @click="load">Muat ulang</AppButton>
        </EmptyState>
        <EmptyState
          v-else-if="!result?.items.length"
          class="mt-7"
          title="Platform tidak ditemukan"
          :description="hasFilters ? 'Coba ubah kata kunci atau filter.' : 'Belum ada platform digital yang dicatat.'"
        >
          <AppButton v-if="hasFilters" variant="secondary" @click="reset">Hapus filter</AppButton>
        </EmptyState>
        <div v-else class="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PlatformCard v-for="(platform, index) in result.items" :key="platform.id" :platform="platform" :index="index + 1" />
        </div>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-10" @update:page="page = $event" />
      </div>
    </section>
  </div>
</template>

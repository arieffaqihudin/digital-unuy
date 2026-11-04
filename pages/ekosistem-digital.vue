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
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10 lg:py-14">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Ekosistem Digital' }]" />
        <div class="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Ekosistem Digital</p>
            <h1 class="display-1 mt-5 max-w-3xl">Direktori platform digital</h1>
            <p class="body-lg mt-5 max-w-2xl">Platform yang tercatat resmi, lengkap dengan unit pengelola, pengguna sasaran, dan status implementasinya.</p>
          </div>
          <div class="rounded-xl border border-line-warm bg-white px-4 py-3 text-xs text-ink-muted">
            <span class="font-semibold text-charcoal">{{ result?.total ?? 0 }}</span> platform tercatat
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div class="rounded-2xl border border-line-warm bg-ivory p-4 sm:p-5">
          <div class="grid gap-3 lg:grid-cols-[1fr_210px_210px_auto]">
            <div class="relative">
              <label for="platform-search" class="sr-only">Cari platform</label>
              <Search :size="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input id="platform-search" v-model="search" type="search" class="field-input pl-10" placeholder="Cari platform, unit, atau sasaran…" />
            </div>
            <select v-model="category" class="field-input" aria-label="Filter kategori">
              <option value="">Semua kategori</option>
              <option v-for="item in result?.categories || []" :key="item" :value="item">{{ item }}</option>
            </select>
            <select v-model="status" class="field-input" aria-label="Filter status">
              <option value="">Semua status</option>
              <option v-for="item in PLATFORM_STATUSES" :key="item" :value="item">{{ item }}</option>
            </select>
            <button v-if="hasFilters" type="button" class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-ink-muted hover:bg-white hover:text-charcoal" @click="reset">
              <FilterX :size="14" aria-hidden="true" /> Reset
            </button>
          </div>
        </div>

        <div v-if="pending" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton v-for="index in 6" :key="index" />
        </div>
        <EmptyState v-else-if="failure" class="mt-8" title="Data belum dapat dimuat" description="Silakan coba lagi.">
          <AppButton variant="secondary" @click="load">Muat ulang</AppButton>
        </EmptyState>
        <EmptyState
          v-else-if="!result?.items.length"
          class="mt-8"
          title="Platform tidak ditemukan"
          :description="hasFilters ? 'Coba ubah kata kunci atau filter.' : 'Belum ada platform digital yang dicatat.'"
        >
          <AppButton v-if="hasFilters" variant="secondary" @click="reset">Hapus filter</AppButton>
        </EmptyState>
        <div v-else class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PlatformCard v-for="platform in result.items" :key="platform.id" :platform="platform" />
        </div>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-10" @update:page="page = $event" />
      </div>
    </section>
  </div>
</template>

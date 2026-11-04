<script setup lang="ts">
import { FilterX, Search, SlidersHorizontal } from 'lucide-vue-next'
import type { ServiceDTO, ServiceListResponse } from '~/shared/types'

const search = ref('')
const category = ref('')
const page = ref(1)
const result = ref<ServiceListResponse | null>(null)
const pending = ref(true)
const failure = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function load() {
  pending.value = true
  failure.value = ''
  try {
    result.value = await $fetch<ServiceListResponse>('/api/services', {
      query: {
        q: search.value || undefined,
        category: category.value || undefined,
        page: page.value,
        pageSize: 12
      }
    })
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Katalog layanan gagal dimuat.'
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
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

function resetFilters() {
  search.value = ''
  category.value = ''
  page.value = 1
  load()
}

const hasFilters = computed(() => Boolean(search.value || category.value))
const items = computed<ServiceDTO[]>(() => result.value?.items || [])
const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 12))))

useSeoMeta({
  title: 'Katalog Layanan Digital',
  description:
    'Telusuri layanan teknologi informasi UNU Yogyakarta: email institusi, pengembangan sistem, domain dan server, Google Workspace, bantuan teknis, integrasi data, website unit, serta keamanan akses.',
  ogTitle: 'Katalog Layanan Digital UNU Yogyakarta',
  ogDescription: 'Satu pintu untuk kebutuhan teknologi informasi di lingkungan UNU Yogyakarta.'
})
</script>

<template>
  <div>
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10 lg:py-14">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Layanan Digital' }]" />
        <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Layanan Digital</p>
            <h1 class="display-1 mt-5">Katalog layanan digital</h1>
            <p class="body-lg mt-5 max-w-2xl">Temukan layanan yang sesuai dengan kebutuhan Anda, baca persyaratannya, lalu ajukan secara daring.</p>
          </div>
          <div class="rounded-2xl border border-line-warm bg-white p-4">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Cara memulai</p>
            <ol class="mt-3 space-y-2 text-xs leading-5 text-ink-muted">
              <li><span class="mr-2 font-bold text-charcoal">01</span>Pilih layanan yang sesuai.</li>
              <li><span class="mr-2 font-bold text-charcoal">02</span>Baca persyaratan dan dokumen.</li>
              <li><span class="mr-2 font-bold text-charcoal">03</span>Ajukan dan pantau nomor tiket.</li>
            </ol>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div class="rounded-2xl border border-line-warm bg-ivory p-4 sm:p-5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="relative flex-1">
              <label for="service-search" class="sr-only">Cari layanan</label>
              <Search :size="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input
                id="service-search"
                v-model="search"
                type="search"
                class="field-input pl-10"
                placeholder="Cari nama layanan atau kata kunci…"
                autocomplete="off"
              />
            </div>
            <div class="flex items-center gap-2">
              <SlidersHorizontal :size="15" class="hidden text-ink-muted sm:block" aria-hidden="true" />
              <label for="service-category" class="sr-only">Filter kategori</label>
              <select id="service-category" v-model="category" class="field-input min-w-[190px]">
                <option value="">Semua kategori</option>
                <option v-for="item in result?.categories || []" :key="item" :value="item">{{ item }}</option>
              </select>
            </div>
            <button
              v-if="hasFilters"
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-ink-muted transition hover:bg-white hover:text-charcoal"
              @click="resetFilters"
            >
              <FilterX :size="14" aria-hidden="true" /> Reset
            </button>
          </div>
          <div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
            <span>{{ result?.total ?? 0 }} layanan ditemukan</span>
            <span v-if="search" class="truncate">Pencarian: “{{ search }}”</span>
          </div>
        </div>

        <div v-if="pending" class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton v-for="index in 6" :key="index" />
        </div>

        <EmptyState
          v-else-if="failure"
          class="mt-8"
          title="Katalog belum dapat dimuat"
          description="Periksa koneksi lalu coba lagi."
        >
          <AppButton variant="secondary" @click="load">Muat ulang</AppButton>
        </EmptyState>

        <EmptyState
          v-else-if="!items.length"
          class="mt-8"
          title="Layanan tidak ditemukan"
          :description="hasFilters ? 'Coba kata kunci lain atau hapus filter yang aktif.' : 'Belum ada layanan yang dipublikasikan saat ini.'"
        >
          <AppButton v-if="hasFilters" variant="secondary" @click="resetFilters">Hapus filter</AppButton>
        </EmptyState>

        <div v-else class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard v-for="service in items" :key="service.id" :service="service" />
        </div>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-10" @update:page="page = $event" />
      </div>
    </section>
  </div>
</template>

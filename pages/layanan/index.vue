<script setup lang="ts">
import { FilterX, Search } from 'lucide-vue-next'
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

usePageSeo({
  title: 'Layanan Digital UNU Yogyakarta | Permohonan Teknologi Informasi',
  description:
    'Ajukan kebutuhan email institusi, Google Workspace, domain, server, pengembangan sistem informasi, dan layanan digital UNU Yogyakarta.',
  breadcrumbs: [{ name: 'Beranda', to: '/' }, { name: 'Layanan Digital', to: '/layanan' }]
})
</script>

<template>
  <div>
    <PublicPageHeader
      eyebrow="Satu Pintu"
      title="Layanan Digital"
      description="Temukan layanan teknologi informasi untuk mendukung kebutuhan akademik dan operasional universitas."
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Layanan Digital' }]"
    >
      <template #aside>
        <div class="flex items-center gap-3 text-[14px] text-slate-500">
          <span class="font-semibold tabular-nums text-charcoal">{{ result?.total ?? '—' }}</span>
          <span>layanan tersedia</span>
        </div>
      </template>
    </PublicPageHeader>

    <section class="py-10 lg:py-12 bg-soft-white">
      <h2 class="sr-only">Daftar layanan digital</h2>
      <div class="page-shell">
        <div class="border-y border-line-warm bg-white px-4 py-3 sm:px-5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="relative flex-1">
              <label for="service-search" class="sr-only">Cari layanan</label>
              <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="service-search"
                v-model="search"
                type="search"
                class="field-input border-0 bg-transparent pl-10"
                placeholder="Cari layanan atau kata kunci…"
                autocomplete="off"
              />
            </div>
            <div class="flex items-center gap-2 border-t border-line-warm pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <label for="service-category" class="sr-only">Filter kategori</label>
              <select id="service-category" v-model="category" class="field-input min-w-0 border-0 bg-transparent lg:min-w-[190px]">
                <option value="">Semua kategori</option>
                <option v-for="item in result?.categories || []" :key="item" :value="item">{{ item }}</option>
              </select>
              <button
                v-if="hasFilters"
                type="button"
                class="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-slate-500 transition hover:bg-soft-white hover:text-charcoal"
                @click="resetFilters"
              >
                <FilterX :size="14" aria-hidden="true" /> Reset
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3 text-[14px] text-slate-500">
          <span>{{ result?.total ?? 0 }} layanan ditemukan</span>
          <span v-if="search" class="truncate">Pencarian: “{{ search }}”</span>
          <span v-else class="hidden sm:block">Diurutkan berdasarkan prioritas layanan</span>
        </div>

        <div v-if="pending" class="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="index in 6" :key="index" class="skeleton h-56 rounded-xl" />
        </div>

        <EmptyState v-else-if="failure" class="mt-7" title="Katalog belum dapat dimuat" description="Periksa koneksi lalu coba lagi.">
          <AppButton variant="secondary" @click="load">Muat ulang</AppButton>
        </EmptyState>

        <EmptyState
          v-else-if="!items.length"
          class="mt-7"
          title="Layanan tidak ditemukan"
          :description="hasFilters ? 'Coba kata kunci lain atau hapus filter yang aktif.' : 'Belum ada layanan yang dipublikasikan saat ini.'"
        >
          <AppButton v-if="hasFilters" variant="secondary" @click="resetFilters">Hapus filter</AppButton>
        </EmptyState>

        <div v-else class="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard v-for="(service, index) in items" :key="service.id" :service="service" :index="index + 1" />
        </div>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-10" @update:page="page = $event" />
      </div>
    </section>
  </div>
</template>

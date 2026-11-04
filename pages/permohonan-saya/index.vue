<script setup lang="ts">
import { ArrowRight, Plus, Search } from 'lucide-vue-next'
import type { RequestListItem } from '~/shared/types'
import { REQUEST_STATUSES } from '~/shared/types'

definePageMeta({ middleware: 'auth' })

const { user } = useAuth()
const { formatDateTime } = useFormat()
const requestFetch = useRequestFetch()
const status = ref('')
const search = ref('')
const page = ref(1)
const pending = ref(true)
const failure = ref('')
const result = ref<{ items: RequestListItem[]; total: number; page: number; pageSize: number } | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  pending.value = true
  failure.value = ''
  try {
    result.value = await requestFetch('/api/requests/mine', {
      query: { status: status.value || undefined, q: search.value || undefined, page: page.value, pageSize: 10 }
    })
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Daftar permohonan gagal dimuat.'
  } finally {
    pending.value = false
  }
}

await load()

watch(status, () => {
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

const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 10))))

useSeoMeta({ title: 'Permohonan Saya', robots: 'noindex, nofollow' })
</script>

<template>
  <div>
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Permohonan Saya' }]" />
        <div class="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Ruang pemohon</p>
            <h1 class="display-1 mt-4">Permohonan saya</h1>
            <p class="body-lg mt-4 max-w-2xl">Pantau status, lengkapi data, dan lihat hasil penyelesaian seluruh permohonan yang Anda ajukan.</p>
          </div>
          <AppButton to="/layanan" size="lg"><template #left><Plus :size="16" /></template>Ajukan Layanan</AppButton>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div class="flex flex-col gap-3 rounded-2xl border border-line-warm bg-ivory p-4 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <label for="my-request-search" class="sr-only">Cari permohonan</label>
            <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <input id="my-request-search" v-model="search" type="search" class="field-input pl-10" placeholder="Cari nomor tiket atau layanan…" />
          </div>
          <select v-model="status" class="field-input sm:max-w-[210px]" aria-label="Filter status">
            <option value="">Semua status</option>
            <option v-for="item in REQUEST_STATUSES" :key="item" :value="item">{{ item }}</option>
          </select>
          <span class="px-2 text-[14px] text-ink-muted">{{ result?.total ?? 0 }} permohonan</span>
        </div>

        <div v-if="pending" class="mt-6 space-y-3">
          <div v-for="index in 4" :key="index" class="skeleton h-28 rounded-2xl" />
        </div>
        <EmptyState v-else-if="failure" class="mt-6" title="Permohonan belum dapat dimuat" description="Coba muat ulang halaman.">
          <AppButton variant="secondary" @click="load">Muat ulang</AppButton>
        </EmptyState>
        <EmptyState
          v-else-if="!result?.items.length"
          class="mt-6"
          title="Belum ada permohonan"
          description="Permohonan yang Anda ajukan akan tampil di sini beserta status terbarunya."
        >
          <AppButton to="/layanan">Mulai ajukan layanan</AppButton>
        </EmptyState>

        <div v-else class="mt-6 space-y-3">
          <NuxtLink
            v-for="item in result.items"
            :key="item.id"
            :to="`/permohonan-saya/${item.id}`"
            class="group block rounded-2xl border border-line-warm bg-white p-5 transition hover:border-charcoal/25 hover:shadow-card"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[12px] font-bold uppercase tracking-[0.14em] text-gold-dark">{{ item.serviceName }}</span>
                  <StatusBadge :status="item.status" :substatus="item.substatus" />
                </div>
                <h2 class="mt-2 text-lg font-semibold tracking-wide">{{ item.ticketNumber }}</h2>
                <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-muted">
                  <span>Diajukan {{ formatDateTime(item.createdAt) }}</span>
                  <span>Diperbarui {{ formatDateTime(item.updatedAt) }}</span>
                  <span v-if="item.assignedToName">Petugas: {{ item.assignedToName }}</span>
                </div>
              </div>
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal transition group-hover:text-unu-green">
                Lihat detail <ArrowRight :size="14" aria-hidden="true" />
              </span>
            </div>
            <div v-if="item.substatus" class="mt-4 flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-[14px] font-semibold text-gold-dark">
              <span aria-hidden="true">◷</span> Tindakan diperlukan: lengkapi data yang diminta.
            </div>
          </NuxtLink>
        </div>

        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-8" @update:page="page = $event" />
      </div>
    </section>
  </div>
</template>

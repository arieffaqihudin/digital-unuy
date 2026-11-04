<script setup lang="ts">
import { ArrowRight, FilterX, Search } from 'lucide-vue-next'
import type { RequestListItem } from '~/shared/types'
import { REQUEST_STATUSES } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const { formatDateTime } = useFormat()
const status = ref('')
const service = ref('')
const assigned = ref('')
const waiting = ref(false)
const search = ref('')
const page = ref(1)
const loading = ref(true)
const failure = ref('')
const result = ref<{ items: RequestListItem[]; total: number; page: number; pageSize: number } | null>(null)
const options = ref<{ services: { slug: string; name: string }[]; assignees: { id: string; name: string }[] }>({ services: [], assignees: [] })
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  failure.value = ''
  try {
    result.value = await requestFetch('/api/admin/requests', {
      query: {
        status: status.value || undefined,
        service: service.value || undefined,
        assigned: assigned.value || undefined,
        waiting: waiting.value || undefined,
        q: search.value || undefined,
        page: page.value,
        pageSize: 20
      }
    })
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Daftar permohonan gagal dimuat.'
  } finally {
    loading.value = false
  }
}

await Promise.all([
  load(),
  requestFetch<{ services: { slug: string; name: string }[]; assignees: { id: string; name: string }[] }>('/api/admin/requests/options')
    .then((data) => {
      options.value = data
    })
    .catch(() => {})
])

watch([status, service, assigned, waiting], () => {
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

const hasFilters = computed(() => Boolean(status.value || service.value || assigned.value || waiting.value || search.value))
const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 20))))

function reset() {
  status.value = ''
  service.value = ''
  assigned.value = ''
  waiting.value = false
  search.value = ''
  page.value = 1
  load()
}

useSeoMeta({ title: 'Manajemen Permohonan', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Operasional</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight">Permohonan</h2>
        <p class="mt-1 text-sm text-ink-muted">Verifikasi, proses, dan selesaikan permohonan layanan.</p>
      </div>
      <div class="rounded-xl border border-line-warm bg-white px-4 py-2.5 text-xs text-ink-muted">
        <span class="font-semibold text-charcoal">{{ result?.total ?? 0 }}</span> hasil
      </div>
    </div>

    <div class="rounded-2xl border border-line-warm bg-white p-4">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <div class="relative">
          <label for="admin-request-search" class="sr-only">Cari nomor tiket</label>
          <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input id="admin-request-search" v-model="search" type="search" class="field-input pl-10" placeholder="Cari nomor tiket atau layanan…" />
        </div>
        <select v-model="status" class="field-input" aria-label="Filter status">
          <option value="">Semua status</option>
          <option v-for="item in REQUEST_STATUSES" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="service" class="field-input" aria-label="Filter layanan">
          <option value="">Semua layanan</option>
          <option v-for="item in options.services" :key="item.slug" :value="item.slug">{{ item.name }}</option>
        </select>
        <select v-model="assigned" class="field-input" aria-label="Filter petugas">
          <option value="">Semua petugas</option>
          <option value="unassigned">Belum ditugaskan</option>
          <option v-for="item in options.assignees" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
        <div class="flex items-center gap-2">
          <label class="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-line-warm px-3 text-xs font-semibold">
            <input v-model="waiting" type="checkbox" class="h-4 w-4 accent-charcoal" /> Menunggu pemohon
          </label>
          <button v-if="hasFilters" type="button" class="grid h-10 w-10 place-items-center rounded-lg text-ink-muted hover:bg-ivory hover:text-charcoal" aria-label="Reset filter" @click="reset">
            <FilterX :size="15" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-line-warm bg-white">
      <div v-if="loading" class="space-y-2 p-4">
        <div v-for="i in 6" :key="i" class="skeleton h-14 rounded-lg" />
      </div>
      <div v-else-if="failure" class="p-8 text-center">
        <p class="text-sm font-semibold text-red-800">{{ failure }}</p>
        <AppButton variant="secondary" class="mt-4" @click="load">Muat ulang</AppButton>
      </div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Tidak ada permohonan" :description="hasFilters ? 'Ubah filter untuk melihat hasil lain.' : 'Belum ada permohonan yang masuk.'" compact>
        <AppButton v-if="hasFilters" variant="secondary" @click="reset">Reset filter</AppButton>
      </EmptyState>

      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[800px] text-left">
            <thead>
              <tr class="border-b border-line-warm bg-ivory text-[10px] uppercase tracking-wide text-ink-muted">
                <th class="px-5 py-3 font-bold">Tiket</th>
                <th class="px-5 py-3 font-bold">Layanan</th>
                <th class="px-5 py-3 font-bold">Status</th>
                <th class="px-5 py-3 font-bold">Petugas</th>
                <th class="px-5 py-3 font-bold">Diajukan</th>
                <th class="px-5 py-3 font-bold">Diperbarui</th>
                <th class="px-5 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line-warm">
              <tr v-for="item in result.items" :key="item.id" class="transition hover:bg-ivory/60">
                <td class="px-5 py-3.5 text-xs font-semibold tracking-wide">{{ item.ticketNumber }}</td>
                <td class="max-w-[220px] px-5 py-3.5 text-xs">{{ item.serviceName }}</td>
                <td class="px-5 py-3.5"><StatusBadge :status="item.status" :substatus="item.substatus" /></td>
                <td class="px-5 py-3.5 text-xs text-ink-muted">{{ item.assignedToName || '—' }}</td>
                <td class="px-5 py-3.5 text-[11px] text-ink-muted">{{ formatDateTime(item.createdAt) }}</td>
                <td class="px-5 py-3.5 text-[11px] text-ink-muted">{{ formatDateTime(item.updatedAt) }}</td>
                <td class="px-5 py-3.5 text-right">
                  <NuxtLink :to="`/admin/permohonan/${item.id}`" class="inline-flex items-center gap-1 text-xs font-semibold text-gold-dark hover:underline">Kelola <ArrowRight :size="12" /></NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-line-warm md:hidden">
          <NuxtLink v-for="item in result.items" :key="item.id" :to="`/admin/permohonan/${item.id}`" class="block p-4 transition hover:bg-ivory">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-semibold tracking-wide">{{ item.ticketNumber }}</p>
                <p class="mt-1 truncate text-xs text-ink-muted">{{ item.serviceName }}</p>
              </div>
              <StatusBadge :status="item.status" :substatus="item.substatus" />
            </div>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink-muted">
              <span>Diajukan {{ formatDateTime(item.createdAt) }}</span>
              <span>Petugas: {{ item.assignedToName || '—' }}</span>
            </div>
          </NuxtLink>
        </div>
      </template>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="page = $event" />
  </div>
</template>

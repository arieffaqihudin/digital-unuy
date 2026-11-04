<script setup lang="ts">
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  Layers,
  Plus,
  Timer,
  TrendingUp
} from 'lucide-vue-next'
import type { RequestListItem } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const { formatDateTime } = useFormat()
const period = ref('30d')
const loading = ref(true)
const error = ref('')
const data = ref<{
  period: string
  counts: { total: number; submitted: number; processing: number; completed: number; rejected: number; waitingOnRequester: number }
  simpleStats: { completionRate: number | null; averageResolutionHours: number | null }
  recent: RequestListItem[]
  actionQueue: RequestListItem[]
} | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await requestFetch('/api/admin/dashboard', { query: { period: period.value } })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Dashboard gagal dimuat.'
  } finally {
    loading.value = false
  }
}

await load()
watch(period, load)

const cards = computed(() => [
  { label: 'Total permohonan', value: data.value?.counts.total ?? 0, icon: Inbox, note: 'Dalam periode terpilih' },
  { label: 'Perlu diverifikasi', value: data.value?.counts.submitted ?? 0, icon: Clock3, note: 'Status Diajukan' },
  { label: 'Sedang diproses', value: data.value?.counts.processing ?? 0, icon: Layers, note: 'Status Diproses' },
  { label: 'Selesai', value: data.value?.counts.completed ?? 0, icon: CheckCircle2, note: 'Status Selesai' }
])

function avgTime(hours: number | null) {
  if (hours === null) return '—'
  if (hours < 24) return `${hours} jam`
  return `${(hours / 24).toFixed(1)} hari`
}

useSeoMeta({ title: 'Dashboard Admin', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Ringkasan operasional</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p class="mt-1 text-sm text-ink-muted">Pantau permohonan dan tindakan yang perlu diselesaikan.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label for="dashboard-period" class="sr-only">Filter periode</label>
        <select id="dashboard-period" v-model="period" class="field-input min-h-[44px] w-auto">
          <option value="7d">7 hari terakhir</option>
          <option value="30d">30 hari terakhir</option>
          <option value="90d">90 hari terakhir</option>
          <option value="all">Semua periode</option>
        </select>
        <AppButton to="/admin/permohonan" variant="secondary" size="sm">Semua Permohonan</AppButton>
        <AppButton to="/admin/layanan/baru" size="sm"><template #left><Plus :size="14" /></template>Layanan</AppButton>
      </div>
    </div>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      {{ error }}
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in cards" :key="card.label" class="rounded-2xl border border-line-warm bg-white p-5">
        <div class="flex items-start justify-between">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-sage-soft text-charcoal">
            <component :is="card.icon" :size="18" :stroke-width="1.7" aria-hidden="true" />
          </span>
          <span class="text-[10px] font-medium text-ink-muted">{{ card.note }}</span>
        </div>
        <p class="mt-5 text-3xl font-semibold tracking-tight">{{ loading ? '—' : card.value }}</p>
        <p class="mt-1 text-xs font-medium text-ink-muted">{{ card.label }}</p>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-line-warm bg-white p-4">
        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted"><TrendingUp :size="13" /> Tingkat penyelesaian</div>
        <p class="mt-2 text-xl font-semibold">{{ data?.simpleStats.completionRate === null ? '—' : `${data?.simpleStats.completionRate ?? 0}%` }}</p>
        <p class="mt-1 text-[11px] text-ink-muted">Selesai dibanding permohonan tertutup</p>
      </div>
      <div class="rounded-2xl border border-line-warm bg-white p-4">
        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted"><Timer :size="13" /> Rata-rata penyelesaian</div>
        <p class="mt-2 text-xl font-semibold">{{ avgTime(data?.simpleStats.averageResolutionHours ?? null) }}</p>
        <p class="mt-1 text-[11px] text-ink-muted">Dihitung dari permohonan selesai</p>
      </div>
      <div class="rounded-2xl border border-line-warm bg-white p-4">
        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted"><Clock3 :size="13" /> Menunggu pemohon</div>
        <p class="mt-2 text-xl font-semibold">{{ data?.counts.waitingOnRequester ?? 0 }}</p>
        <p class="mt-1 text-[11px] text-ink-muted">Perlu kelengkapan dari pemohon</p>
      </div>
      <div class="rounded-2xl border border-line-warm bg-white p-4">
        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-ink-muted"><Inbox :size="13" /> Ditolak</div>
        <p class="mt-2 text-xl font-semibold">{{ data?.counts.rejected ?? 0 }}</p>
        <p class="mt-1 text-[11px] text-ink-muted">Dalam periode terpilih</p>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div class="rounded-2xl border border-line-warm bg-white">
        <div class="flex items-center justify-between gap-3 border-b border-line-warm px-5 py-4">
          <div><h3 class="text-sm font-semibold">Permohonan terbaru</h3><p class="mt-0.5 text-[11px] text-ink-muted">Enam permohonan terakhir pada periode ini.</p></div>
          <NuxtLink to="/admin/permohonan" class="text-[11px] font-semibold text-gold-dark underline-offset-4 hover:underline">Lihat semua</NuxtLink>
        </div>
        <div v-if="loading" class="space-y-2 p-4">
          <div v-for="i in 4" :key="i" class="skeleton h-12 rounded-lg" />
        </div>
        <div v-else-if="!data?.recent.length" class="p-8 text-center text-sm text-ink-muted">Belum ada permohonan pada periode ini.</div>
        <div v-else class="divide-y divide-line-warm">
          <NuxtLink v-for="item in data.recent" :key="item.id" :to="`/admin/permohonan/${item.id}`" class="group flex flex-col gap-2 px-5 py-3.5 transition hover:bg-ivory sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold tracking-wide">{{ item.ticketNumber }}</p>
              <p class="mt-0.5 truncate text-[11px] text-ink-muted">{{ item.serviceName }} · {{ formatDateTime(item.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge :status="item.status" :substatus="item.substatus" />
              <ArrowRight :size="13" class="text-ink-muted transition group-hover:text-gold-dark" aria-hidden="true" />
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-2xl border border-line-warm bg-white">
        <div class="flex items-center justify-between gap-3 border-b border-line-warm px-5 py-4">
          <div><h3 class="text-sm font-semibold">Membutuhkan tindakan</h3><p class="mt-0.5 text-[11px] text-ink-muted">Diajukan, diverifikasi, atau menunggu kelengkapan.</p></div>
          <span class="grid h-6 min-w-6 place-items-center rounded-full bg-gold/20 px-1.5 text-[10px] font-bold text-gold-dark">{{ data?.actionQueue.length || 0 }}</span>
        </div>
        <div v-if="loading" class="space-y-2 p-4">
          <div v-for="i in 4" :key="i" class="skeleton h-12 rounded-lg" />
        </div>
        <div v-else-if="!data?.actionQueue.length" class="p-8 text-center">
          <CheckCircle2 :size="22" class="mx-auto text-emerald-600" aria-hidden="true" />
          <p class="mt-2 text-sm font-semibold">Tidak ada antrean mendesak</p>
          <p class="mt-1 text-[11px] text-ink-muted">Semua permohonan dalam periode ini sudah ditangani.</p>
        </div>
        <div v-else class="divide-y divide-line-warm">
          <NuxtLink v-for="item in data.actionQueue" :key="item.id" :to="`/admin/permohonan/${item.id}`" class="group block px-5 py-3.5 transition hover:bg-ivory">
            <div class="flex items-start justify-between gap-2">
              <p class="text-xs font-semibold tracking-wide">{{ item.ticketNumber }}</p>
              <StatusBadge :status="item.status" :substatus="item.substatus" />
            </div>
            <p class="mt-1 text-[11px] text-ink-muted">{{ item.serviceName }}</p>
            <p class="mt-1 text-[10px] text-ink-muted/70">{{ formatDateTime(item.updatedAt) }}</p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-line-warm bg-ivory p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p class="text-xs font-semibold">Akses cepat</p><p class="mt-0.5 text-[11px] text-ink-muted">Kelola layanan, dokumentasi, dan konten website dari satu tempat.</p></div>
        <div class="flex flex-wrap gap-2">
          <AppButton to="/admin/layanan" variant="secondary" size="sm">Manajemen Layanan</AppButton>
          <AppButton to="/admin/dokumen" variant="secondary" size="sm">Dokumentasi</AppButton>
          <AppButton to="/admin/konten" variant="secondary" size="sm">Konten Website</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

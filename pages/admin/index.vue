<script setup lang="ts">
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  Inbox,
  Layers,
  Newspaper,
  Plus,
  Timer,
  TrendingUp,
  Workflow
} from 'lucide-vue-next'
import type { RequestListItem } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const { can } = useAuth()
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

const contentLoading = ref(true)
const contentCounts = ref({ platforms: 0, programs: 0, articles: 0, pages: 0 })

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

async function loadContentCounts() {
  if (!can('content.manage')) {
    contentLoading.value = false
    return
  }
  contentLoading.value = true
  try {
    const [platforms, programs, articles, pages] = await Promise.all([
      requestFetch<{ total: number }>('/api/admin/platforms', { query: { pageSize: 1 } }).catch(() => ({ total: 0 })),
      requestFetch<{ total: number }>('/api/admin/programs', { query: { pageSize: 1 } }).catch(() => ({ total: 0 })),
      requestFetch<{ total: number }>('/api/admin/articles', { query: { pageSize: 1 } }).catch(() => ({ total: 0 })),
      requestFetch<{ items: unknown[] }>('/api/admin/pages').catch(() => ({ items: [] }))
    ])
    contentCounts.value = {
      platforms: platforms.total,
      programs: programs.total,
      articles: articles.total,
      pages: pages.items.length
    }
  } finally {
    contentLoading.value = false
  }
}

await Promise.all([load(), loadContentCounts()])
watch(period, load)

const contentCards = computed(() => [
  { title: 'Ekosistem Digital', to: '/admin/ekosistem', icon: Globe2, count: contentCounts.value.platforms, description: 'Platform, kategori, unit, dan status implementasi.' },
  { title: 'Program & Inisiatif', to: '/admin/program', icon: Workflow, count: contentCounts.value.programs, description: 'Program transformasi dan status pelaksanaannya.' },
  { title: 'Publikasi', to: '/admin/publikasi', icon: Newspaper, count: contentCounts.value.articles, description: 'Artikel, draft, thumbnail, dan status terbit.' },
  { title: 'Halaman & Profil', to: '/admin/halaman', icon: FileText, count: contentCounts.value.pages, description: 'Profil direktorat dan halaman informasi.' }
])

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
        <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Ringkasan operasional</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p class="mt-1 text-sm text-admin-muted">Pantau permohonan dan tindakan yang perlu diselesaikan.</p>
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
      <div v-for="card in cards" :key="card.label" class="rounded-xl border border-admin-border bg-white p-5">
        <div class="flex items-start justify-between">
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-unu-green-soft text-unu-green">
            <component :is="card.icon" :size="17" :stroke-width="1.8" aria-hidden="true" />
          </span>
          <span class="text-[12px] font-medium text-admin-muted">{{ card.note }}</span>
        </div>
        <p class="mt-5 text-[30px] font-semibold leading-none tracking-tight text-admin-text">{{ loading ? '—' : card.value }}</p>
        <p class="mt-2 text-[14px] font-medium text-admin-muted">{{ card.label }}</p>
      </div>
    </div>

    <div class="grid overflow-hidden rounded-xl border border-admin-border bg-white sm:grid-cols-3 sm:divide-x sm:divide-admin-border">
      <div class="p-4 sm:p-5">
        <div class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-admin-muted"><TrendingUp :size="13" /> Tingkat penyelesaian</div>
        <p class="mt-2 text-xl font-semibold">{{ data?.simpleStats.completionRate === null ? '—' : `${data?.simpleStats.completionRate ?? 0}%` }}</p>
        <p class="mt-1 text-[12px] text-admin-muted">Selesai dibanding permohonan tertutup</p>
      </div>
      <div class="border-t border-admin-border p-4 sm:border-t-0 sm:p-5">
        <div class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-admin-muted"><Timer :size="13" /> Rata-rata penyelesaian</div>
        <p class="mt-2 text-xl font-semibold">{{ avgTime(data?.simpleStats.averageResolutionHours ?? null) }}</p>
        <p class="mt-1 text-[12px] text-admin-muted">Dihitung dari permohonan selesai</p>
      </div>
      <div class="border-t border-admin-border p-4 sm:border-t-0 sm:p-5">
        <div class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-admin-muted"><Clock3 :size="13" /> Menunggu pemohon</div>
        <p class="mt-2 text-xl font-semibold">{{ data?.counts.waitingOnRequester ?? 0 }}</p>
        <p class="mt-1 text-[12px] text-admin-muted">Perlu kelengkapan dari pemohon</p>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div class="rounded-xl border border-admin-border bg-white">
        <div class="flex items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
          <div><h3 class="text-sm font-semibold">Permohonan terbaru</h3><p class="mt-0.5 text-[14px] text-admin-muted">Enam permohonan terakhir pada periode ini.</p></div>
          <NuxtLink to="/admin/permohonan" class="text-[14px] font-semibold text-unu-green underline-offset-4 hover:underline">Lihat semua</NuxtLink>
        </div>
        <div v-if="loading" class="space-y-2 p-4">
          <div v-for="i in 4" :key="i" class="skeleton h-12 rounded-lg" />
        </div>
        <div v-else-if="!data?.recent.length" class="p-8 text-center text-sm text-admin-muted">Belum ada permohonan pada periode ini.</div>
        <div v-else class="divide-y divide-admin-border">
          <NuxtLink v-for="item in data.recent" :key="item.id" :to="`/admin/permohonan/${item.id}`" class="group flex flex-col gap-2 px-5 py-3.5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold tracking-wide">{{ item.ticketNumber }}</p>
              <p class="mt-0.5 truncate text-[14px] text-admin-muted">{{ item.serviceName }} · {{ formatDateTime(item.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge :status="item.status" :substatus="item.substatus" />
              <ArrowRight :size="13" class="text-admin-muted transition group-hover:text-unu-green" aria-hidden="true" />
            </div>
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-xl border border-admin-border bg-white">
        <div class="flex items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
          <div><h3 class="text-sm font-semibold">Membutuhkan tindakan</h3><p class="mt-0.5 text-[14px] text-admin-muted">Diajukan, diverifikasi, atau menunggu kelengkapan.</p></div>
          <span class="grid h-6 min-w-6 place-items-center rounded-full bg-unu-green-soft px-1.5 text-[12px] font-bold text-unu-green">{{ data?.actionQueue.length || 0 }}</span>
        </div>
        <div v-if="loading" class="space-y-2 p-4">
          <div v-for="i in 4" :key="i" class="skeleton h-12 rounded-lg" />
        </div>
        <div v-else-if="!data?.actionQueue.length" class="p-8 text-center">
          <CheckCircle2 :size="22" class="mx-auto text-emerald-600" aria-hidden="true" />
          <p class="mt-2 text-sm font-semibold">Tidak ada antrean mendesak</p>
          <p class="mt-1 text-[14px] text-admin-muted">Semua permohonan dalam periode ini sudah ditangani.</p>
        </div>
        <div v-else class="divide-y divide-admin-border">
          <NuxtLink v-for="item in data.actionQueue" :key="item.id" :to="`/admin/permohonan/${item.id}`" class="group block px-5 py-3.5 transition hover:bg-slate-50">
            <div class="flex items-start justify-between gap-2">
              <p class="text-xs font-semibold tracking-wide">{{ item.ticketNumber }}</p>
              <StatusBadge :status="item.status" :substatus="item.substatus" />
            </div>
            <p class="mt-1 text-[14px] text-admin-muted">{{ item.serviceName }}</p>
            <p class="mt-1 text-[12px] text-admin-muted/70">{{ formatDateTime(item.updatedAt) }}</p>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="can('content.manage')" class="rounded-xl border border-admin-border bg-white p-5">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[16px] font-semibold text-admin-text">Konten Website</p>
          <p class="mt-0.5 text-[14px] text-admin-muted">Kelola konten publik langsung dari dashboard.</p>
        </div>
        <span class="text-[12px] text-slate-400">{{ contentLoading ? 'Memuat…' : 'Terhubung ke CMS' }}</span>
      </div>
      <div class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <NuxtLink
          v-for="item in contentCards"
          :key="item.to"
          :to="item.to"
          class="group rounded-lg border border-admin-border p-4 transition hover:border-unu-green/30 hover:bg-unu-green-soft/20"
        >
          <div class="flex items-start justify-between gap-3">
            <span class="grid h-8 w-8 place-items-center rounded-md bg-unu-green-soft text-unu-green">
              <component :is="item.icon" :size="15" aria-hidden="true" />
            </span>
            <span class="text-[20px] font-bold leading-none tracking-tight text-admin-text">{{ contentLoading ? '—' : item.count }}</span>
          </div>
          <p class="mt-3 text-[14px] font-semibold text-admin-text">{{ item.title }}</p>
          <p class="mt-1 text-[12px] leading-5 text-admin-muted">{{ item.description }}</p>
          <span class="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-unu-green">
            Kelola <ArrowRight :size="11" aria-hidden="true" />
          </span>
        </NuxtLink>
      </div>
    </div>

    <div class="rounded-xl border border-admin-border bg-slate-50 p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p class="text-xs font-semibold">Akses cepat</p><p class="mt-0.5 text-[14px] text-admin-muted">Kelola layanan dan dokumentasi dari satu tempat.</p></div>
        <div class="flex flex-wrap gap-2">
          <AppButton to="/admin/layanan" variant="secondary" size="sm">Manajemen Layanan</AppButton>
          <AppButton to="/admin/dokumen" variant="secondary" size="sm">Dokumentasi</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

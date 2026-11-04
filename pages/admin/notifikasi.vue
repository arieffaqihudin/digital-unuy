<script setup lang="ts">
import { AlertCircle, ArrowRight, Bell, CheckCircle2, Clock3 } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

interface NotificationItem {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: string
  substatus: string
  kind: 'action' | 'waiting' | 'info'
  actionRequired: boolean
  href: string
  updatedAt: string
}

interface NotificationResponse {
  items: NotificationItem[]
  total: number
  actionCount: number
  waitingCount: number
  page: number
  pageSize: number
}

const requestFetch = useRequestFetch()
const { formatDateTime } = useFormat()
const view = ref<'all' | 'action' | 'waiting'>('all')
const page = ref(1)
const loading = ref(true)
const failure = ref('')
const result = ref<NotificationResponse | null>(null)

async function load() {
  loading.value = true
  failure.value = ''
  try {
    result.value = await requestFetch<NotificationResponse>('/api/admin/notifications', {
      query: { view: view.value, page: page.value, pageSize: 20 }
    })
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Notifikasi gagal dimuat.'
    result.value = null
  } finally {
    loading.value = false
  }
}
await load()

watch(view, () => {
  page.value = 1
  load()
})
watch(page, load)

const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 20))))
const tabs = computed(() => [
  { value: 'all' as const, label: 'Semua', count: result.value?.total ?? 0 },
  { value: 'action' as const, label: 'Perlu tindakan', count: result.value?.actionCount ?? 0 },
  { value: 'waiting' as const, label: 'Menunggu pemohon', count: result.value?.waitingCount ?? 0 }
])

const kindMeta = {
  action: { icon: AlertCircle, classes: 'border-amber-200 bg-amber-50 text-amber-800' },
  waiting: { icon: Clock3, classes: 'border-sky-200 bg-sky-50 text-sky-800' },
  info: { icon: CheckCircle2, classes: 'border-slate-200 bg-slate-50 text-slate-600' }
} as const

function statusClass(status: string) {
  if (status === 'Diajukan') return 'border-sky-200 bg-sky-50 text-sky-800'
  if (status === 'Diverifikasi' || status === 'Diproses') return 'border-amber-200 bg-amber-50 text-amber-900'
  if (status === 'Selesai') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'Ditolak') return 'border-red-200 bg-red-50 text-red-800'
  return 'border-admin-border bg-slate-50 text-slate-600'
}

useSeoMeta({ title: 'Notifikasi', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green"><Bell :size="14" aria-hidden="true" /> Administrasi</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight">Notifikasi</h2>
        <p class="mt-1 text-sm text-admin-muted">Pembaruan permohonan dan tindakan yang perlu ditindaklanjuti.</p>
      </div>
      <div class="inline-flex w-fit items-center gap-2 rounded-xl border border-admin-border bg-white px-4 py-2.5 text-xs">
        <AlertCircle :size="14" class="text-amber-700" aria-hidden="true" />
        <span><strong>{{ result?.actionCount ?? 0 }}</strong> perlu tindakan</span>
      </div>
    </div>

    <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition"
        :class="view === tab.value ? 'border-charcoal bg-charcoal text-white' : 'border-admin-border bg-white text-slate-600 hover:border-unu-green/40'"
        @click="view = tab.value"
      >
        {{ tab.label }}
        <span class="tabular-nums opacity-70">{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="failure" class="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-900">{{ failure }}</div>

    <div class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div v-if="loading" class="space-y-2 p-4">
        <div v-for="index in 5" :key="index" class="skeleton h-20 rounded-lg" />
      </div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Tidak ada notifikasi" description="Belum ada pembaruan permohonan pada filter ini." compact />
      <template v-else>
        <NuxtLink
          v-for="item in result.items"
          :key="item.id"
          :to="item.href"
          class="group flex items-start gap-3 border-b border-admin-border p-4 transition last:border-b-0 hover:bg-slate-50/70 sm:gap-4"
        >
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full border" :class="kindMeta[item.kind].classes">
            <component :is="kindMeta[item.kind].icon" :size="17" :stroke-width="1.8" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-start justify-between gap-2">
              <span class="text-[14px] font-semibold leading-5 text-admin-text">{{ item.title }}</span>
              <span class="shrink-0 text-[12px] text-admin-muted">{{ formatDateTime(item.updatedAt) }}</span>
            </span>
            <span class="mt-1 block text-[13px] leading-5 text-slate-600">{{ item.description }}</span>
            <span class="mt-2 flex flex-wrap items-center gap-2">
              <span class="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide" :class="statusClass(item.status)">{{ item.status }}</span>
              <span class="text-[12px] text-admin-muted">{{ item.ticketNumber }}</span>
              <span v-if="item.substatus" class="text-[12px] text-sky-700">{{ item.substatus }}</span>
            </span>
          </span>
          <ArrowRight :size="15" class="mt-2 shrink-0 text-slate-400 transition duration-150 group-hover:translate-x-0.5 group-hover:text-unu-green" aria-hidden="true" />
        </NuxtLink>
      </template>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="page = $event" />

    <p class="text-[12px] leading-5 text-admin-muted">Notifikasi berasal dari aktivitas permohonan. Data email, token, dan catatan internal tidak ditampilkan di sini.</p>
  </div>
</template>

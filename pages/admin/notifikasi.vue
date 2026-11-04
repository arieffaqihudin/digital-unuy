<script setup lang="ts">
import { AlertCircle, CheckCircle2, FlaskConical, Mail, Search, XCircle } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const { formatDateTime } = useFormat()
const search = ref('')
const status = ref('')
const page = ref(1)
const loading = ref(true)
const result = ref<{
  items: { id: string; template: string; recipient: string; status: string; provider: string; error: string; reference: string; createdAt: string }[]
  total: number
  failed: number
  page: number
  pageSize: number
} | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  try {
    result.value = await requestFetch('/api/admin/notifications', {
      query: { q: search.value || undefined, status: status.value || undefined, page: page.value, pageSize: 30 }
    })
  } catch {
    result.value = null
  } finally {
    loading.value = false
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

const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 30))))
const statusMeta = (value: string) => {
  if (value === 'sent') return { label: 'Terkirim', icon: CheckCircle2, classes: 'border-emerald-200 bg-emerald-50 text-emerald-800' }
  if (value === 'failed') return { label: 'Gagal', icon: XCircle, classes: 'border-red-200 bg-red-50 text-red-800' }
  return { label: 'Outbox dev', icon: FlaskConical, classes: 'border-amber-200 bg-amber-50 text-amber-900' }
}

useSeoMeta({ title: 'Log Notifikasi', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Administrasi</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">Log Notifikasi</h2><p class="mt-1 text-sm text-admin-muted">Pantau status pengiriman email. Token dan kata sandi tidak pernah disimpan di log.</p></div>
      <div class="flex items-center gap-2 rounded-xl border border-admin-border bg-white px-4 py-2.5 text-xs"><AlertCircle :size="14" class="text-red-600" /><span><strong>{{ result?.failed ?? 0 }}</strong> gagal</span></div>
    </div>

    <div v-if="result?.failed" class="rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-900">
      Terdapat email gagal terkirim. Periksa konfigurasi SMTP, koneksi, dan alamat penerima. Untuk undangan aktivasi, gunakan tombol kirim ulang pada menu Pengguna.
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-admin-border bg-white p-4 sm:flex-row">
      <div class="relative flex-1"><Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" /><input v-model="search" type="search" class="field-input pl-10" placeholder="Cari penerima, template, atau referensi…" aria-label="Cari log" /></div>
      <select v-model="status" class="field-input sm:w-48" aria-label="Filter status"><option value="">Semua status</option><option value="sent">Terkirim</option><option value="failed">Gagal</option><option value="simulated">Outbox dev</option></select>
    </div>

    <div class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg" /></div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Belum ada log notifikasi" description="Notifikasi akan tercatat setelah ada aktivitas pengiriman email." compact />
      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[900px] text-left"><thead><tr class="border-b border-admin-border bg-slate-50 text-[12px] uppercase tracking-wide text-admin-muted"><th class="px-5 py-3 font-bold">Waktu</th><th class="px-5 py-3 font-bold">Template</th><th class="px-5 py-3 font-bold">Penerima</th><th class="px-5 py-3 font-bold">Status</th><th class="px-5 py-3 font-bold">Referensi</th><th class="px-5 py-3 font-bold">Error</th></tr></thead><tbody class="divide-y divide-admin-border"><tr v-for="item in result.items" :key="item.id" class="hover:bg-slate-50/60"><td class="px-5 py-3.5 text-[12px] text-admin-muted">{{ formatDateTime(item.createdAt) }}</td><td class="px-5 py-3.5 text-xs font-medium">{{ item.template }}</td><td class="px-5 py-3.5 text-xs">{{ item.recipient }}</td><td class="px-5 py-3.5"><span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-bold" :class="statusMeta(item.status).classes"><component :is="statusMeta(item.status).icon" :size="11" />{{ statusMeta(item.status).label }}</span></td><td class="px-5 py-3.5 text-[12px] text-admin-muted">{{ item.reference || '—' }}</td><td class="max-w-[240px] px-5 py-3.5 text-[12px] text-red-700">{{ item.error || '—' }}</td></tr></tbody></table></div>
        <div class="divide-y divide-admin-border md:hidden"><div v-for="item in result.items" :key="item.id" class="p-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold">{{ item.template }}</p><p class="mt-0.5 text-[12px] text-admin-muted">{{ item.recipient }}</p></div><span class="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[12px] font-bold" :class="statusMeta(item.status).classes">{{ statusMeta(item.status).label }}</span></div><p class="mt-2 text-[12px] text-admin-muted">{{ formatDateTime(item.createdAt) }} · {{ item.reference || 'tanpa referensi' }}</p><p v-if="item.error" class="mt-1 text-[12px] text-red-700">{{ item.error }}</p></div></div>
      </template>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="page = $event" />

    <div class="rounded-xl border border-admin-border bg-slate-50 p-5 text-xs leading-5 text-admin-muted">
      <div class="flex items-center gap-2 font-semibold text-admin-text"><Mail :size="14" class="text-unu-green" /> Konfigurasi email</div>
      <p class="mt-2">SMTP diatur melalui environment variable. Pada development tanpa SMTP, email disimpan sebagai file JSON di <code class="rounded bg-white px-1.5 py-0.5 text-[12px]">.data/mail-outbox</code> dan ditandai sebagai outbox dev, bukan email terkirim.</p>
    </div>
  </div>
</template>

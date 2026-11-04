<script setup lang="ts">
import { Search } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const { formatDateTime } = useFormat()
const search = ref('')
const entityType = ref('')
const page = ref(1)
const loading = ref(true)
const result = ref<{
  items: { id: string; actorName: string; actorEmail: string; action: string; entityType: string; entityId: string; metadata: Record<string, unknown>; ip: string; createdAt: string }[]
  total: number
  page: number
  pageSize: number
} | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  try {
    result.value = await requestFetch('/api/admin/audit', {
      query: { q: search.value || undefined, entityType: entityType.value || undefined, page: page.value, pageSize: 30 }
    })
  } catch {
    result.value = null
  } finally {
    loading.value = false
  }
}
await load()
watch(entityType, () => {
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
const entityTypes = ['User', 'Service', 'ServiceRequest', 'Document', 'DigitalPlatform', 'Program', 'Article', 'Page', 'SiteSetting', 'Role', 'RequestAttachment']

function metadataSummary(metadata: Record<string, unknown>) {
  const text = JSON.stringify(metadata || {})
  return text === '{}' ? '—' : text.length > 120 ? `${text.slice(0, 119)}…` : text
}

useSeoMeta({ title: 'Audit Log', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Administrasi</p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight">Audit Log</h2>
      <p class="mt-1 text-sm text-ink-muted">Jejak perubahan sensitif: login, pengguna, role, layanan, dokumen, dan permohonan.</p>
    </div>

    <div class="flex flex-col gap-3 rounded-2xl border border-line-warm bg-white p-4 sm:flex-row">
      <div class="relative flex-1"><Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" /><input v-model="search" type="search" class="field-input pl-10" placeholder="Cari aktor, aksi, atau ID entitas…" aria-label="Cari audit log" /></div>
      <select v-model="entityType" class="field-input sm:w-56" aria-label="Filter entitas"><option value="">Semua entitas</option><option v-for="item in entityTypes" :key="item" :value="item">{{ item }}</option></select>
      <span class="self-center px-2 text-[11px] text-ink-muted">{{ result?.total ?? 0 }} entri</span>
    </div>

    <div class="overflow-hidden rounded-2xl border border-line-warm bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg" /></div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Tidak ada audit log" description="Aktivitas akan tercatat otomatis." compact />
      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[960px] text-left"><thead><tr class="border-b border-line-warm bg-ivory text-[10px] uppercase tracking-wide text-ink-muted"><th class="px-5 py-3 font-bold">Waktu</th><th class="px-5 py-3 font-bold">Aktor</th><th class="px-5 py-3 font-bold">Aksi</th><th class="px-5 py-3 font-bold">Entitas</th><th class="px-5 py-3 font-bold">Metadata</th><th class="px-5 py-3 font-bold">IP</th></tr></thead><tbody class="divide-y divide-line-warm"><tr v-for="item in result.items" :key="item.id" class="hover:bg-ivory/60"><td class="whitespace-nowrap px-5 py-3.5 text-[10px] text-ink-muted">{{ formatDateTime(item.createdAt) }}</td><td class="px-5 py-3.5"><p class="text-xs font-medium">{{ item.actorName }}</p><p class="text-[10px] text-ink-muted">{{ item.actorEmail }}</p></td><td class="px-5 py-3.5"><code class="rounded bg-ivory px-1.5 py-1 text-[10px]">{{ item.action }}</code></td><td class="px-5 py-3.5"><p class="text-xs">{{ item.entityType }}</p><p class="text-[9px] text-ink-muted">{{ item.entityId || '—' }}</p></td><td class="max-w-[280px] px-5 py-3.5 text-[10px] text-ink-muted"><span class="line-clamp-2 break-all">{{ metadataSummary(item.metadata) }}</span></td><td class="px-5 py-3.5 text-[10px] text-ink-muted">{{ item.ip || '—' }}</td></tr></tbody></table></div>
        <div class="divide-y divide-line-warm md:hidden"><div v-for="item in result.items" :key="item.id" class="p-4"><div class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold">{{ item.action }}</p><p class="mt-0.5 text-[10px] text-ink-muted">{{ item.actorName }} · {{ formatDateTime(item.createdAt) }}</p></div><span class="rounded bg-ivory px-1.5 py-1 text-[9px]">{{ item.entityType }}</span></div><p class="mt-2 break-all text-[10px] text-ink-muted">{{ metadataSummary(item.metadata) }}</p></div></div>
      </template>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="page = $event" />

    <p class="text-[11px] leading-5 text-ink-muted">Audit log bersifat append-only melalui aplikasi. Token aktivasi, kata sandi, dan cookie tidak dicatat.</p>
  </div>
</template>

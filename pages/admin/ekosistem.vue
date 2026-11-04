<script setup lang="ts">
import { Pencil, Plus, Search } from 'lucide-vue-next'
import type { DigitalPlatformDTO } from '~/shared/types'
import { PLATFORM_CATEGORIES, PLATFORM_STATUSES } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const { formatDate } = useFormat()
const search = ref('')
const status = ref('')
const loading = ref(true)
const result = ref<{ items: DigitalPlatformDTO[]; total: number; page: number; pageSize: number } | null>(null)
const modalOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const errorMessage = ref('')
const form = reactive({
  name: '',
  slug: '',
  description: '',
  category: 'Akademik',
  unit: '',
  status: 'Dalam Pengembangan',
  url: '',
  audience: '',
  icon: 'globe',
  order: 0
})
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  try {
    result.value = await requestFetch('/api/admin/platforms', {
      query: { q: search.value || undefined, status: status.value || undefined, pageSize: 48 }
    })
  } catch (error: any) {
    toast.error('Gagal memuat', error?.data?.statusMessage)
  } finally {
    loading.value = false
  }
}
await load()
watch(status, load)
watch(search, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(load, 350)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

function openCreate() {
  editingId.value = ''
  Object.assign(form, {
    name: '',
    slug: '',
    description: '',
    category: 'Akademik',
    unit: '',
    status: 'Dalam Pengembangan',
    url: '',
    audience: '',
    icon: 'globe',
    order: 0
  })
  errorMessage.value = ''
  modalOpen.value = true
}

function openEdit(item: DigitalPlatformDTO) {
  editingId.value = item.id
  Object.assign(form, {
    name: item.name,
    slug: item.slug,
    description: item.description,
    category: item.category,
    unit: item.unit,
    status: item.status,
    url: item.url || '',
    audience: item.audience,
    icon: item.icon,
    order: item.order
  })
  errorMessage.value = ''
  modalOpen.value = true
}

async function save() {
  errorMessage.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await api(`/api/admin/platforms/${editingId.value}`, { method: 'PATCH', body: form })
      toast.success('Platform diperbarui')
    } else {
      await api('/api/admin/platforms', { method: 'POST', body: form })
      toast.success('Platform ditambahkan')
    }
    modalOpen.value = false
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal menyimpan platform.'
  } finally {
    saving.value = false
  }
}

useSeoMeta({ title: 'Ekosistem Digital', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Konten</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">Ekosistem Digital</h2><p class="mt-1 text-sm text-ink-muted">Catat platform digital dan status implementasinya.</p></div>
      <AppButton size="sm" @click="openCreate"><template #left><Plus :size="14" /></template>Tambah Platform</AppButton>
    </div>

    <div class="flex flex-col gap-3 rounded-2xl border border-line-warm bg-white p-4 sm:flex-row">
      <div class="relative flex-1"><Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" /><input v-model="search" type="search" class="field-input pl-10" placeholder="Cari platform…" aria-label="Cari platform" /></div>
      <select v-model="status" class="field-input sm:w-56" aria-label="Filter status"><option value="">Semua status</option><option v-for="item in PLATFORM_STATUSES" :key="item" :value="item">{{ item }}</option></select>
      <span class="self-center px-2 text-[11px] text-ink-muted">{{ result?.total ?? 0 }} platform</span>
    </div>

    <div class="overflow-hidden rounded-2xl border border-line-warm bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 4" :key="i" class="skeleton h-14 rounded-lg" /></div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Belum ada platform" description="Tambahkan platform digital pertama." compact><AppButton size="sm" @click="openCreate">Tambah Platform</AppButton></EmptyState>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[820px] text-left">
            <thead><tr class="border-b border-line-warm bg-ivory text-[10px] uppercase tracking-wide text-ink-muted"><th class="px-5 py-3 font-bold">Nama</th><th class="px-5 py-3 font-bold">Kategori</th><th class="px-5 py-3 font-bold">Unit</th><th class="px-5 py-3 font-bold">Status</th><th class="px-5 py-3 font-bold">Diperbarui</th><th class="px-5 py-3 text-right font-bold">Aksi</th></tr></thead>
            <tbody class="divide-y divide-line-warm"><tr v-for="item in result.items" :key="item.id" class="hover:bg-ivory/60"><td class="px-5 py-3.5"><p class="text-xs font-semibold">{{ item.name }}</p><p class="mt-0.5 text-[10px] text-ink-muted">/{{ item.slug }}</p></td><td class="px-5 py-3.5 text-xs">{{ item.category }}</td><td class="px-5 py-3.5 text-xs text-ink-muted">{{ item.unit || '—' }}</td><td class="px-5 py-3.5"><span class="rounded-full border border-line-warm bg-ivory px-2.5 py-1 text-[10px] font-bold">{{ item.status }}</span></td><td class="px-5 py-3.5 text-[11px] text-ink-muted">{{ formatDate(item.updatedAt) }}</td><td class="px-5 py-3.5 text-right"><button type="button" class="text-xs font-semibold text-gold-dark hover:underline" @click="openEdit(item)"><Pencil :size="12" class="inline" /> Edit</button></td></tr></tbody>
          </table>
        </div>
        <div class="divide-y divide-line-warm md:hidden"><button v-for="item in result.items" :key="item.id" type="button" class="block w-full p-4 text-left" @click="openEdit(item)"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ item.name }}</p><p class="mt-0.5 text-[10px] text-ink-muted">{{ item.category }}</p></div><span class="rounded-full border px-2 py-1 text-[9px] font-bold">{{ item.status }}</span></div></button></div>
      </template>
    </div>

    <ModalDialog v-model="modalOpen" :title="editingId ? 'Edit Platform' : 'Tambah Platform'" description="Status implementasi harus mencerminkan kondisi operasional yang terverifikasi." size="lg">
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 sm:col-span-2">{{ errorMessage }}</div>
        <div class="sm:col-span-2"><label class="admin-label">Nama platform</label><input v-model="form.name" class="field-input" maxlength="160" /></div>
        <div><label class="admin-label">Slug</label><input v-model="form.slug" class="field-input font-mono text-xs" placeholder="otomatis" /></div>
        <div><label class="admin-label">Kategori</label><select v-model="form.category" class="field-input"><option v-for="item in PLATFORM_CATEGORIES" :key="item" :value="item">{{ item }}</option></select></div>
        <div><label class="admin-label">Status</label><select v-model="form.status" class="field-input"><option v-for="item in PLATFORM_STATUSES" :key="item" :value="item">{{ item }}</option></select></div>
        <div><label class="admin-label">Unit pengelola</label><input v-model="form.unit" class="field-input" maxlength="160" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Deskripsi</label><textarea v-model="form.description" rows="3" class="field-input" maxlength="500" /></div>
        <div><label class="admin-label">Pengguna sasaran</label><input v-model="form.audience" class="field-input" maxlength="200" /></div>
        <div><label class="admin-label">URL</label><input v-model="form.url" type="url" class="field-input" placeholder="https://" maxlength="500" /></div>
        <div><label class="admin-label">Ikon</label><input v-model="form.icon" class="field-input" maxlength="40" placeholder="globe, academic, users…" /></div>
        <div><label class="admin-label">Urutan</label><input v-model.number="form.order" type="number" class="field-input" /></div>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AppButton variant="secondary" @click="modalOpen = false">Batal</AppButton><AppButton :loading="saving" @click="save">Simpan</AppButton></div></template>
    </ModalDialog>
  </div>
</template>

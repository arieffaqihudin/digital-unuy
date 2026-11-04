<script setup lang="ts">
import { Pencil, Plus, Search } from 'lucide-vue-next'
import type { ProgramDTO } from '~/shared/types'
import { PROGRAM_CATEGORIES } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const { formatDate } = useFormat()
const search = ref('')
const loading = ref(true)
const result = ref<{ items: ProgramDTO[]; total: number } | null>(null)
const modalOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const errorMessage = ref('')
const form = reactive({ title: '', slug: '', category: 'Digitalisasi Layanan', summary: '', content: '', status: 'Direncanakan', order: 0 })
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  try {
    result.value = await requestFetch('/api/admin/programs', { query: { q: search.value || undefined, pageSize: 48 } })
  } catch (error: any) {
    toast.error('Gagal memuat', error?.data?.statusMessage)
  } finally {
    loading.value = false
  }
}
await load()
watch(search, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(load, 350)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

function openCreate() {
  editingId.value = ''
  Object.assign(form, { title: '', slug: '', category: 'Digitalisasi Layanan', summary: '', content: '', status: 'Direncanakan', order: 0 })
  errorMessage.value = ''
  modalOpen.value = true
}
function openEdit(item: ProgramDTO) {
  editingId.value = item.id
  Object.assign(form, { title: item.title, slug: item.slug, category: item.category, summary: item.summary, content: item.content, status: item.status, order: item.order })
  errorMessage.value = ''
  modalOpen.value = true
}
async function save() {
  errorMessage.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await api(`/api/admin/programs/${editingId.value}`, { method: 'PATCH', body: form })
      toast.success('Program diperbarui')
    } else {
      await api('/api/admin/programs', { method: 'POST', body: form })
      toast.success('Program ditambahkan')
    }
    modalOpen.value = false
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal menyimpan program.'
  } finally {
    saving.value = false
  }
}

useSeoMeta({ title: 'Program & Inisiatif', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Konten</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">Program & Inisiatif</h2><p class="mt-1 text-sm text-ink-muted">Kelola program transformasi yang tampil di beranda.</p></div>
      <AppButton size="sm" @click="openCreate"><template #left><Plus :size="14" /></template>Tambah Program</AppButton>
    </div>

    <div class="relative rounded-2xl border border-line-warm bg-white p-4"><Search :size="16" class="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-ink-muted" /><input v-model="search" type="search" class="field-input pl-10" placeholder="Cari program…" aria-label="Cari program" /></div>

    <div class="overflow-hidden rounded-2xl border border-line-warm bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 4" :key="i" class="skeleton h-14 rounded-lg" /></div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Belum ada program" description="Tambahkan program atau inisiatif pertama." compact><AppButton size="sm" @click="openCreate">Tambah Program</AppButton></EmptyState>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[760px] text-left"><thead><tr class="border-b border-line-warm bg-ivory text-[10px] uppercase tracking-wide text-ink-muted"><th class="px-5 py-3 font-bold">Judul</th><th class="px-5 py-3 font-bold">Kategori</th><th class="px-5 py-3 font-bold">Status</th><th class="px-5 py-3 font-bold">Urutan</th><th class="px-5 py-3 font-bold">Diperbarui</th><th class="px-5 py-3 text-right font-bold">Aksi</th></tr></thead><tbody class="divide-y divide-line-warm"><tr v-for="item in result.items" :key="item.id" class="hover:bg-ivory/60"><td class="px-5 py-3.5"><p class="max-w-xs text-xs font-semibold">{{ item.title }}</p><p class="mt-0.5 line-clamp-1 text-[10px] text-ink-muted">{{ item.summary }}</p></td><td class="px-5 py-3.5 text-xs">{{ item.category }}</td><td class="px-5 py-3.5"><span class="rounded-full border border-line-warm bg-ivory px-2.5 py-1 text-[10px] font-bold">{{ item.status }}</span></td><td class="px-5 py-3.5 text-xs">{{ item.order }}</td><td class="px-5 py-3.5 text-[11px] text-ink-muted">{{ formatDate(item.updatedAt) }}</td><td class="px-5 py-3.5 text-right"><button type="button" class="text-xs font-semibold text-gold-dark hover:underline" @click="openEdit(item)"><Pencil :size="12" class="inline" /> Edit</button></td></tr></tbody></table>
        </div>
        <div class="divide-y divide-line-warm md:hidden"><button v-for="item in result.items" :key="item.id" type="button" class="block w-full p-4 text-left" @click="openEdit(item)"><p class="text-sm font-semibold">{{ item.title }}</p><p class="mt-1 text-[10px] text-ink-muted">{{ item.category }} · {{ item.status }}</p></button></div>
      </template>
    </div>

    <ModalDialog v-model="modalOpen" :title="editingId ? 'Edit Program' : 'Tambah Program'" size="lg">
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 sm:col-span-2">{{ errorMessage }}</div>
        <div class="sm:col-span-2"><label class="admin-label">Judul</label><input v-model="form.title" class="field-input" maxlength="180" /></div>
        <div><label class="admin-label">Slug</label><input v-model="form.slug" class="field-input font-mono text-xs" placeholder="otomatis" /></div>
        <div><label class="admin-label">Kategori</label><select v-model="form.category" class="field-input"><option v-for="item in PROGRAM_CATEGORIES" :key="item" :value="item">{{ item }}</option></select></div>
        <div><label class="admin-label">Status</label><select v-model="form.status" class="field-input"><option>Direncanakan</option><option>Berjalan</option><option>Selesai</option></select></div>
        <div><label class="admin-label">Urutan</label><input v-model.number="form.order" type="number" class="field-input" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Ringkasan</label><textarea v-model="form.summary" rows="2" class="field-input" maxlength="400" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Konten</label><textarea v-model="form.content" rows="7" class="field-input font-mono text-xs" placeholder="Mendukung Markdown dasar…" /><p class="field-help">Markdown didukung. Konten disanitasi sebelum disimpan.</p></div>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AppButton variant="secondary" @click="modalOpen = false">Batal</AppButton><AppButton :loading="saving" @click="save">Simpan</AppButton></div></template>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { ExternalLink, Pencil, Plus, Search } from 'lucide-vue-next'
import type { ArticleDTO } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const { formatDate } = useFormat()
const search = ref('')
const status = ref('')
const loading = ref(true)
const result = ref<{ items: ArticleDTO[]; total: number } | null>(null)
const modalOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const errorMessage = ref('')
const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  thumbnail: '',
  category: 'Berita',
  author: 'Direktorat Transformasi Digital',
  publishedAt: '',
  status: 'draft'
})
let timer: ReturnType<typeof setTimeout> | null = null

function toLocalInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function load() {
  loading.value = true
  try {
    result.value = await requestFetch('/api/admin/articles', {
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
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    thumbnail: '',
    category: 'Berita',
    author: 'Direktorat Transformasi Digital',
    publishedAt: toLocalInput(new Date().toISOString()),
    status: 'draft'
  })
  errorMessage.value = ''
  modalOpen.value = true
}
function openEdit(item: ArticleDTO) {
  editingId.value = item.id
  Object.assign(form, {
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content: item.content,
    thumbnail: item.thumbnail || '',
    category: item.category,
    author: item.author,
    publishedAt: toLocalInput(item.publishedAt),
    status: item.status
  })
  errorMessage.value = ''
  modalOpen.value = true
}
async function save() {
  errorMessage.value = ''
  saving.value = true
  try {
    const payload = {
      ...form,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : new Date().toISOString()
    }
    if (editingId.value) {
      await api(`/api/admin/articles/${editingId.value}`, { method: 'PATCH', body: payload })
      toast.success('Publikasi diperbarui')
    } else {
      await api('/api/admin/articles', { method: 'POST', body: payload })
      toast.success('Publikasi dibuat')
    }
    modalOpen.value = false
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal menyimpan publikasi.'
  } finally {
    saving.value = false
  }
}

useSeoMeta({ title: 'Publikasi', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Konten</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">Publikasi</h2><p class="mt-1 text-sm text-admin-muted">Kelola artikel, berita, dan pembaruan direktorat.</p></div>
      <AppButton size="sm" @click="openCreate"><template #left><Plus :size="14" /></template>Tambah Publikasi</AppButton>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-admin-border bg-white p-4 sm:flex-row">
      <div class="relative flex-1"><Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" /><input v-model="search" type="search" class="field-input pl-10" placeholder="Cari publikasi…" aria-label="Cari publikasi" /></div>
      <select v-model="status" class="field-input sm:w-48" aria-label="Filter status"><option value="">Semua status</option><option value="draft">Draft</option><option value="published">Terbit</option></select>
      <span class="self-center px-2 text-[14px] text-admin-muted">{{ result?.total ?? 0 }} publikasi</span>
    </div>

    <div class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 4" :key="i" class="skeleton h-14 rounded-lg" /></div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Belum ada publikasi" description="Tulis publikasi pertama untuk website." compact><AppButton size="sm" @click="openCreate">Tambah Publikasi</AppButton></EmptyState>
      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[820px] text-left"><thead><tr class="border-b border-admin-border bg-slate-50 text-[12px] uppercase tracking-wide text-admin-muted"><th class="px-5 py-3 font-bold">Judul</th><th class="px-5 py-3 font-bold">Kategori</th><th class="px-5 py-3 font-bold">Status</th><th class="px-5 py-3 font-bold">Terbit</th><th class="px-5 py-3 font-bold">Penulis</th><th class="px-5 py-3 text-right font-bold">Aksi</th></tr></thead><tbody class="divide-y divide-admin-border"><tr v-for="item in result.items" :key="item.id" class="hover:bg-slate-50/60"><td class="px-5 py-3.5"><p class="max-w-xs text-xs font-semibold">{{ item.title }}</p><p class="mt-0.5 text-[12px] text-admin-muted">/{{ item.slug }}</p></td><td class="px-5 py-3.5 text-xs">{{ item.category }}</td><td class="px-5 py-3.5"><span class="rounded-full border px-2.5 py-1 text-[12px] font-bold" :class="item.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-admin-border bg-slate-50 text-admin-muted'">{{ item.status === 'published' ? 'Terbit' : 'Draft' }}</span></td><td class="px-5 py-3.5 text-[14px] text-admin-muted">{{ formatDate(item.publishedAt) }}</td><td class="px-5 py-3.5 text-[14px] text-admin-muted">{{ item.author }}</td><td class="px-5 py-3.5 text-right"><div class="flex items-center justify-end gap-3"><NuxtLink v-if="item.status === 'published'" :to="`/publikasi/${item.slug}`" target="_blank" class="text-xs font-semibold text-admin-muted hover:text-admin-text"><ExternalLink :size="12" class="inline" /></NuxtLink><button type="button" class="text-xs font-semibold text-unu-green hover:underline" @click="openEdit(item)"><Pencil :size="12" class="inline" /> Edit</button></div></td></tr></tbody></table></div>
        <div class="divide-y divide-admin-border md:hidden"><button v-for="item in result.items" :key="item.id" type="button" class="block w-full p-4 text-left" @click="openEdit(item)"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ item.title }}</p><p class="mt-1 text-[12px] text-admin-muted">{{ item.category }} · {{ formatDate(item.publishedAt) }}</p></div><span class="rounded-full border px-2 py-1 text-[12px] font-bold">{{ item.status === 'published' ? 'Terbit' : 'Draft' }}</span></div></button></div>
      </template>
    </div>

    <ModalDialog v-model="modalOpen" :title="editingId ? 'Edit Publikasi' : 'Tambah Publikasi'" size="lg">
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 sm:col-span-2">{{ errorMessage }}</div>
        <div class="sm:col-span-2"><label class="admin-label">Judul</label><input v-model="form.title" class="field-input" maxlength="200" /></div>
        <div><label class="admin-label">Slug</label><input v-model="form.slug" class="field-input font-mono text-xs" placeholder="otomatis" /></div>
        <div><label class="admin-label">Kategori</label><input v-model="form.category" class="field-input" maxlength="80" /></div>
        <div><label class="admin-label">Penulis</label><input v-model="form.author" class="field-input" maxlength="120" /></div>
        <div><label class="admin-label">Tanggal publikasi</label><input v-model="form.publishedAt" type="datetime-local" class="field-input" /></div>
        <div><label class="admin-label">Status</label><select v-model="form.status" class="field-input"><option value="draft">Draft</option><option value="published">Terbit</option></select></div>
        <div><label class="admin-label">Thumbnail URL</label><input v-model="form.thumbnail" type="url" class="field-input" placeholder="https://" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Ringkasan</label><textarea v-model="form.excerpt" rows="2" class="field-input" maxlength="400" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Konten</label><textarea v-model="form.content" rows="10" class="field-input font-mono text-xs" placeholder="Tulis konten dengan Markdown…" /><p class="field-help">Markdown didukung. HTML berbahaya akan disanitasi.</p></div>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AppButton variant="secondary" @click="modalOpen = false">Batal</AppButton><AppButton :loading="saving" @click="save">Simpan</AppButton></div></template>
    </ModalDialog>
  </div>
</template>

<script setup lang="ts">
import { ExternalLink, Pencil, Plus } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

interface AdminPage {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
  published: boolean
  updatedAt: string
}

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const { formatDate } = useFormat()
const loading = ref(true)
const pages = ref<AdminPage[]>([])
const modalOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const errorMessage = ref('')
const form = reactive({ title: '', slug: '', excerpt: '', content: '', seoTitle: '', seoDescription: '', published: true })

async function load() {
  loading.value = true
  try {
    const data = await requestFetch<{ items: AdminPage[] }>('/api/admin/pages')
    pages.value = data.items
  } catch (error: any) {
    toast.error('Gagal memuat', error?.data?.statusMessage)
  } finally {
    loading.value = false
  }
}
await load()

function openCreate() {
  editingId.value = ''
  Object.assign(form, { title: '', slug: '', excerpt: '', content: '', seoTitle: '', seoDescription: '', published: true })
  errorMessage.value = ''
  modalOpen.value = true
}
function openEdit(page: AdminPage) {
  editingId.value = page.id
  Object.assign(form, {
    title: page.title,
    slug: page.slug,
    excerpt: page.excerpt || '',
    content: page.content || '',
    seoTitle: page.seoTitle || '',
    seoDescription: page.seoDescription || '',
    published: page.published
  })
  errorMessage.value = ''
  modalOpen.value = true
}
async function save() {
  errorMessage.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await api(`/api/admin/pages/${editingId.value}`, { method: 'PATCH', body: form })
      toast.success('Halaman diperbarui')
    } else {
      await api('/api/admin/pages', { method: 'POST', body: form })
      toast.success('Halaman dibuat')
    }
    modalOpen.value = false
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal menyimpan halaman.'
  } finally {
    saving.value = false
  }
}

useSeoMeta({ title: 'Halaman & Profil', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Konten</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">Halaman & Profil</h2><p class="mt-1 text-sm text-admin-muted">Kelola halaman profil direktorat dan halaman kustom.</p></div>
      <AppButton size="sm" @click="openCreate"><template #left><Plus :size="14" /></template>Tambah Halaman</AppButton>
    </div>

    <div class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 3" :key="i" class="skeleton h-14 rounded-lg" /></div>
      <EmptyState v-else-if="!pages.length" class="m-4" title="Belum ada halaman" description="Buat halaman profil atau halaman informasi." compact><AppButton size="sm" @click="openCreate">Tambah Halaman</AppButton></EmptyState>
      <div v-else class="divide-y divide-admin-border">
        <div v-for="page in pages" :key="page.id" class="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2"><p class="text-sm font-semibold">{{ page.title }}</p><span class="rounded-full border px-2 py-0.5 text-[12px] font-bold" :class="page.published ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-admin-border bg-slate-50 text-admin-muted'">{{ page.published ? 'Publik' : 'Draft' }}</span></div>
            <p class="mt-1 text-[12px] text-admin-muted">/{{ page.slug }} · diperbarui {{ formatDate(page.updatedAt) }}</p>
            <p v-if="page.excerpt" class="mt-1 line-clamp-1 text-xs text-admin-muted">{{ page.excerpt }}</p>
          </div>
          <div class="flex items-center gap-3">
            <NuxtLink :to="page.slug === 'tentang-kami' ? '/tentang' : `/halaman/${page.slug}`" target="_blank" class="text-xs font-semibold text-admin-muted hover:text-admin-text"><ExternalLink :size="12" class="inline" /></NuxtLink>
            <button type="button" class="text-xs font-semibold text-unu-green hover:underline" @click="openEdit(page)"><Pencil :size="12" class="inline" /> Edit</button>
          </div>
        </div>
      </div>
    </div>

    <ModalDialog v-model="modalOpen" :title="editingId ? 'Edit Halaman' : 'Tambah Halaman'" size="lg">
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 sm:col-span-2">{{ errorMessage }}</div>
        <div class="sm:col-span-2"><label class="admin-label">Judul</label><input v-model="form.title" class="field-input" maxlength="180" /></div>
        <div><label class="admin-label">Slug</label><input v-model="form.slug" class="field-input font-mono text-xs" placeholder="otomatis" /></div>
        <div><label class="admin-label">Status</label><select v-model="form.published" class="field-input"><option :value="true">Publik</option><option :value="false">Draft</option></select></div>
        <div class="sm:col-span-2"><label class="admin-label">Ringkasan</label><textarea v-model="form.excerpt" rows="2" class="field-input" maxlength="400" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Konten</label><textarea v-model="form.content" rows="12" class="field-input font-mono text-xs" placeholder="Markdown atau HTML dasar…" /><p class="field-help">Konten disanitasi sebelum disimpan.</p></div>
        <div><label class="admin-label">SEO title</label><input v-model="form.seoTitle" class="field-input" maxlength="160" /></div>
        <div><label class="admin-label">SEO description</label><textarea v-model="form.seoDescription" rows="2" class="field-input" maxlength="300" /></div>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AppButton variant="secondary" @click="modalOpen = false">Batal</AppButton><AppButton :loading="saving" @click="save">Simpan</AppButton></div></template>
    </ModalDialog>
  </div>
</template>

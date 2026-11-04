<script setup lang="ts">
import { Archive, Download, FilePlus2, Pencil, Plus, Search, UploadCloud } from 'lucide-vue-next'
import type { DocumentDTO } from '~/shared/types'
import { DOCUMENT_CATEGORIES } from '~/shared/types'

definePageMeta({ layout: 'admin' })

interface AdminDoc extends DocumentDTO {
  serviceIds?: string[]
  versions?: { id: string; version: string; fileName: string; size: number; createdAt: string; effectiveDate?: string; changelog?: string }[]
}

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const { formatDate, formatFileSize } = useFormat()
const search = ref('')
const status = ref('')
const category = ref('')
const loading = ref(true)
const docs = ref<AdminDoc[]>([])
const services = ref<{ id: string; name: string; active: boolean }[]>([])
const createOpen = ref(false)
const editOpen = ref(false)
const versionOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const errorMessage = ref('')
const file = ref<File | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const createForm = reactive({
  title: '',
  slug: '',
  category: 'SOP',
  description: '',
  version: '1.0',
  effectiveDate: '',
  changelog: '',
  published: false,
  serviceIds: [] as string[]
})
const editForm = reactive({ title: '', slug: '', category: 'SOP', description: '', published: false, archived: false, serviceIds: [] as string[] })
const versionForm = reactive({ version: '', effectiveDate: '', changelog: '' })
const versions = ref<AdminDoc['versions']>([])

async function load() {
  loading.value = true
  try {
    const data = await requestFetch<{ items: AdminDoc[]; total: number }>('/api/admin/documents', {
      query: { q: search.value || undefined, status: status.value || undefined, category: category.value || undefined, pageSize: 48 }
    })
    docs.value = data.items
  } catch (error: any) {
    toast.error('Gagal memuat', error?.data?.statusMessage)
  } finally {
    loading.value = false
  }
}

async function loadServices() {
  try {
    const data = await requestFetch<{ services: typeof services.value }>('/api/admin/documents/options')
    services.value = data.services
  } catch {
    services.value = []
  }
}

await Promise.all([load(), loadServices()])

watch(status, load)
watch(category, load)
watch(search, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(load, 350)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

function resetCreate() {
  Object.assign(createForm, { title: '', slug: '', category: 'SOP', description: '', version: '1.0', effectiveDate: '', changelog: '', published: false, serviceIds: [] })
  file.value = null
  errorMessage.value = ''
}
function openCreate() {
  resetCreate()
  createOpen.value = true
}

async function openEdit(doc: AdminDoc) {
  errorMessage.value = ''
  editingId.value = doc.id
  Object.assign(editForm, {
    title: doc.title,
    slug: doc.slug,
    category: doc.category,
    description: doc.description || '',
    published: doc.published,
    archived: Boolean(doc.archived),
    serviceIds: []
  })
  versions.value = []
  editOpen.value = true
  try {
    const data = await requestFetch<{ document: AdminDoc }>(`/api/admin/documents/${doc.id}`)
    Object.assign(editForm, {
      title: data.document.title,
      slug: data.document.slug,
      category: data.document.category,
      description: data.document.description || '',
      published: data.document.published,
      archived: Boolean(data.document.archived),
      serviceIds: data.document.serviceIds || []
    })
    versions.value = data.document.versions || []
  } catch (error: any) {
    toast.error('Detail dokumen gagal dimuat', error?.data?.statusMessage)
  }
}

function toggleService(id: string) {
  const list = editForm.serviceIds
  editForm.serviceIds = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}
function toggleCreateService(id: string) {
  const list = createForm.serviceIds
  createForm.serviceIds = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

async function createDocument() {
  errorMessage.value = ''
  if (!file.value) {
    errorMessage.value = 'File dokumen wajib dipilih.'
    return
  }
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('metadata', JSON.stringify(createForm))
    formData.append('file', file.value)
    await api('/api/admin/documents', { method: 'POST', body: formData })
    toast.success('Dokumen dibuat')
    createOpen.value = false
    resetCreate()
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal membuat dokumen.'
  } finally {
    saving.value = false
  }
}

async function saveEdit() {
  errorMessage.value = ''
  saving.value = true
  try {
    await api(`/api/admin/documents/${editingId.value}`, { method: 'PATCH', body: editForm })
    toast.success('Metadata dokumen diperbarui')
    editOpen.value = false
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal memperbarui dokumen.'
  } finally {
    saving.value = false
  }
}

function openVersion(doc: AdminDoc) {
  editingId.value = doc.id
  Object.assign(versionForm, { version: '', effectiveDate: '', changelog: '' })
  file.value = null
  errorMessage.value = ''
  versionOpen.value = true
}

async function uploadVersion() {
  errorMessage.value = ''
  if (!file.value) {
    errorMessage.value = 'File versi baru wajib dipilih.'
    return
  }
  if (!versionForm.version.trim()) {
    errorMessage.value = 'Nomor versi wajib diisi.'
    return
  }
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('metadata', JSON.stringify(versionForm))
    formData.append('file', file.value)
    await api(`/api/admin/documents/${editingId.value}/versions`, { method: 'POST', body: formData })
    toast.success('Versi baru diunggah')
    versionOpen.value = false
    file.value = null
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal mengunggah versi.'
  } finally {
    saving.value = false
  }
}

async function archive(doc: AdminDoc) {
  if (!window.confirm(`Arsipkan "${doc.title}"? Dokumen tidak akan dapat diakses publik.`)) return
  try {
    await api(`/api/admin/documents/${doc.id}`, { method: 'PATCH', body: { archived: true, published: false } })
    toast.success('Dokumen diarsipkan')
    await load()
  } catch (error: any) {
    toast.error('Gagal mengarsipkan', error?.data?.statusMessage)
  }
}

useSeoMeta({ title: 'Dokumentasi', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Dokumentasi</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">SOP, Panduan & Dokumen</h2><p class="mt-1 text-sm text-ink-muted">Kelola file publik, versi, dan hubungan dokumen dengan layanan.</p></div>
      <AppButton size="sm" @click="openCreate"><template #left><Plus :size="14" /></template>Tambah Dokumen</AppButton>
    </div>

    <div class="grid gap-3 rounded-2xl border border-line-warm bg-white p-4 lg:grid-cols-[1fr_190px_190px_auto]">
      <div class="relative"><Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" /><input v-model="search" type="search" class="field-input pl-10" placeholder="Cari dokumen…" aria-label="Cari dokumen" /></div>
      <select v-model="status" class="field-input" aria-label="Filter status"><option value="">Semua status</option><option value="published">Publik</option><option value="draft">Draft</option><option value="archived">Diarsipkan</option></select>
      <select v-model="category" class="field-input" aria-label="Filter kategori"><option value="">Semua kategori</option><option v-for="item in DOCUMENT_CATEGORIES" :key="item" :value="item">{{ item }}</option></select>
      <span class="self-center px-2 text-[11px] text-ink-muted">{{ docs.length }} dokumen</span>
    </div>

    <div class="overflow-hidden rounded-2xl border border-line-warm bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 4" :key="i" class="skeleton h-14 rounded-lg" /></div>
      <EmptyState v-else-if="!docs.length" class="m-4" title="Belum ada dokumen" description="Unggah SOP, panduan, kebijakan, atau formulir." compact><AppButton size="sm" @click="openCreate">Tambah Dokumen</AppButton></EmptyState>
      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[900px] text-left"><thead><tr class="border-b border-line-warm bg-ivory text-[10px] uppercase tracking-wide text-ink-muted"><th class="px-5 py-3 font-bold">Judul</th><th class="px-5 py-3 font-bold">Kategori</th><th class="px-5 py-3 font-bold">Versi</th><th class="px-5 py-3 font-bold">Status</th><th class="px-5 py-3 font-bold">Ukuran</th><th class="px-5 py-3 font-bold">Diperbarui</th><th class="px-5 py-3 text-right font-bold">Aksi</th></tr></thead><tbody class="divide-y divide-line-warm"><tr v-for="doc in docs" :key="doc.id" class="hover:bg-ivory/60"><td class="px-5 py-3.5"><p class="max-w-xs text-xs font-semibold">{{ doc.title }}</p><p class="mt-0.5 text-[10px] text-ink-muted">/{{ doc.slug }}</p></td><td class="px-5 py-3.5 text-xs">{{ doc.category }}</td><td class="px-5 py-3.5 text-xs">{{ doc.version }}</td><td class="px-5 py-3.5"><span class="rounded-full border px-2.5 py-1 text-[10px] font-bold" :class="doc.archived ? 'border-line-warm bg-ivory text-ink-muted' : doc.published ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'">{{ doc.archived ? 'Arsip' : doc.published ? 'Publik' : 'Draft' }}</span></td><td class="px-5 py-3.5 text-[10px] text-ink-muted">{{ formatFileSize(doc.fileSize) }}</td><td class="px-5 py-3.5 text-[10px] text-ink-muted">{{ formatDate(doc.updatedAt) }}</td><td class="px-5 py-3.5"><div class="flex items-center justify-end gap-2"><a :href="`/api/admin/documents/${doc.id}/download`" class="text-ink-muted hover:text-charcoal" title="Unduh versi aktif"><Download :size="13" /></a><button type="button" class="text-xs font-semibold text-gold-dark hover:underline" @click="openEdit(doc)"><Pencil :size="12" class="inline" /> Edit</button><button type="button" class="text-xs font-semibold text-ink-muted hover:text-charcoal" @click="openVersion(doc)"><FilePlus2 :size="12" class="inline" /> Versi</button><button v-if="!doc.archived" type="button" class="text-xs font-semibold text-red-700" @click="archive(doc)" title="Arsipkan"><Archive :size="12" /></button></div></td></tr></tbody></table></div>
        <div class="divide-y divide-line-warm md:hidden"><div v-for="doc in docs" :key="doc.id" class="p-4"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ doc.title }}</p><p class="mt-1 text-[10px] text-ink-muted">{{ doc.category }} · v{{ doc.version }} · {{ doc.published ? 'Publik' : 'Draft' }}</p></div><span class="rounded-full border px-2 py-1 text-[9px] font-bold">{{ doc.archived ? 'Arsip' : doc.published ? 'Publik' : 'Draft' }}</span></div><div class="mt-3 flex flex-wrap gap-3"><button type="button" class="text-xs font-semibold text-gold-dark" @click="openEdit(doc)">Edit</button><button type="button" class="text-xs font-semibold" @click="openVersion(doc)">Versi baru</button><a :href="`/api/admin/documents/${doc.id}/download`" class="text-xs font-semibold text-ink-muted">Unduh</a></div></div></div>
      </template>
    </div>

    <ModalDialog v-model="createOpen" title="Tambah Dokumen" description="Dokumen yang diterbitkan dapat diakses publik. Simpan sebagai draft bila belum siap." size="lg">
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 sm:col-span-2">{{ errorMessage }}</div>
        <div class="sm:col-span-2"><label class="admin-label">File dokumen <span class="text-red-700">*</span></label><input type="file" accept=".pdf,.docx,.xlsx,.zip" class="block w-full rounded-xl border border-line-warm bg-white p-2.5 text-xs" @change="file = ($event.target as HTMLInputElement).files?.[0] || null" /><p class="field-help">PDF, DOCX, XLSX, atau ZIP. Maksimal 10 MB. Pratinjau PDF tersedia di halaman publik.</p></div>
        <div class="sm:col-span-2"><label class="admin-label">Judul <span class="text-red-700">*</span></label><input v-model="createForm.title" class="field-input" maxlength="180" /></div>
        <div><label class="admin-label">Slug</label><input v-model="createForm.slug" class="field-input font-mono text-xs" placeholder="otomatis" /></div>
        <div><label class="admin-label">Kategori</label><select v-model="createForm.category" class="field-input"><option v-for="item in DOCUMENT_CATEGORIES" :key="item" :value="item">{{ item }}</option></select></div>
        <div><label class="admin-label">Versi</label><input v-model="createForm.version" class="field-input" placeholder="1.0" /></div>
        <div><label class="admin-label">Tanggal berlaku</label><input v-model="createForm.effectiveDate" type="date" class="field-input" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Deskripsi</label><textarea v-model="createForm.description" rows="2" class="field-input" maxlength="1000" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Changelog</label><input v-model="createForm.changelog" class="field-input" maxlength="1000" placeholder="Perubahan pada versi ini…" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Layanan terkait</label><div class="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-line-warm p-3 sm:grid-cols-2"><label v-for="service in services" :key="service.id" class="flex cursor-pointer items-start gap-2 text-xs"><input type="checkbox" class="mt-0.5 h-4 w-4 accent-charcoal" :checked="createForm.serviceIds.includes(service.id)" @change="toggleCreateService(service.id)" />{{ service.name }}</label><p v-if="!services.length" class="text-[11px] text-ink-muted">Belum ada layanan.</p></div></div>
        <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold sm:col-span-2"><input v-model="createForm.published" type="checkbox" class="h-4 w-4 accent-charcoal" /> Terbitkan setelah disimpan</label>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AppButton variant="secondary" @click="createOpen = false">Batal</AppButton><AppButton :loading="saving" @click="createDocument"><template #left><UploadCloud :size="14" /></template>Simpan Dokumen</AppButton></div></template>
    </ModalDialog>

    <ModalDialog v-model="editOpen" title="Edit Dokumen" description="Perubahan metadata tidak mengubah file versi aktif." size="lg">
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 sm:col-span-2">{{ errorMessage }}</div>
        <div class="sm:col-span-2"><label class="admin-label">Judul</label><input v-model="editForm.title" class="field-input" maxlength="180" /></div>
        <div><label class="admin-label">Slug</label><input v-model="editForm.slug" class="field-input font-mono text-xs" /></div>
        <div><label class="admin-label">Kategori</label><select v-model="editForm.category" class="field-input"><option v-for="item in DOCUMENT_CATEGORIES" :key="item" :value="item">{{ item }}</option></select></div>
        <div class="sm:col-span-2"><label class="admin-label">Deskripsi</label><textarea v-model="editForm.description" rows="2" class="field-input" maxlength="1000" /></div>
        <div class="sm:col-span-2"><label class="admin-label">Layanan terkait</label><div class="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-line-warm p-3 sm:grid-cols-2"><label v-for="service in services" :key="service.id" class="flex cursor-pointer items-start gap-2 text-xs"><input type="checkbox" class="mt-0.5 h-4 w-4 accent-charcoal" :checked="editForm.serviceIds.includes(service.id)" @change="toggleService(service.id)" />{{ service.name }}</label></div></div>
        <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold"><input v-model="editForm.published" type="checkbox" class="h-4 w-4 accent-charcoal" /> Publik</label>
        <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold"><input v-model="editForm.archived" type="checkbox" class="h-4 w-4 accent-charcoal" /> Arsipkan</label>
        <div v-if="versions?.length" class="sm:col-span-2"><label class="admin-label">Riwayat versi</label><div class="space-y-1.5"><div v-for="version in versions" :key="version.id" class="flex items-center justify-between rounded-lg border border-line-warm bg-ivory px-3 py-2 text-[11px]"><span><strong>v{{ version.version }}</strong> · {{ formatFileSize(version.size) }} · {{ formatDate(version.createdAt) }}</span><a :href="`/api/admin/documents/${editingId}/download?versionId=${version.id}`" class="font-semibold text-gold-dark">Unduh</a></div></div></div>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AppButton variant="secondary" @click="editOpen = false">Batal</AppButton><AppButton :loading="saving" @click="saveEdit">Simpan</AppButton></div></template>
    </ModalDialog>

    <ModalDialog v-model="versionOpen" title="Unggah Versi Baru" description="Versi baru langsung menggantikan file aktif setelah diunggah.">
      <div class="space-y-4">
        <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">{{ errorMessage }}</div>
        <div><label class="admin-label">File baru</label><input type="file" accept=".pdf,.docx,.xlsx,.zip" class="block w-full rounded-xl border border-line-warm p-2.5 text-xs" @change="file = ($event.target as HTMLInputElement).files?.[0] || null" /></div>
        <div><label class="admin-label">Nomor versi</label><input v-model="versionForm.version" class="field-input" placeholder="1.1" /></div>
        <div><label class="admin-label">Tanggal berlaku</label><input v-model="versionForm.effectiveDate" type="date" class="field-input" /></div>
        <div><label class="admin-label">Changelog</label><textarea v-model="versionForm.changelog" rows="2" class="field-input" placeholder="Apa yang berubah?" /></div>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AppButton variant="secondary" @click="versionOpen = false">Batal</AppButton><AppButton :loading="saving" @click="uploadVersion">Unggah Versi</AppButton></div></template>
    </ModalDialog>
  </div>
</template>

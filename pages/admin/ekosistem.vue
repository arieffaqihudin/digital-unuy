<script setup lang="ts">
import { emptySeo } from '~/shared/seo'
import { Pencil, Plus, Search, Settings2, Trash2, X } from 'lucide-vue-next'
import type { DigitalPlatformDTO, PlatformCategoryDTO, PlatformMetricDTO, PlatformModuleDTO } from '~/shared/types'
import { PLATFORM_AUDIENCES, PLATFORM_STATUSES } from '~/shared/types'

definePageMeta({ layout: 'admin' })

type CategoryWithCount = PlatformCategoryDTO & { platformCount: number }

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const search = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const page = ref(1)
const loading = ref(true)
const result = ref<{ items: DigitalPlatformDTO[]; total: number; page: number; pageSize: number; categories: CategoryWithCount[] } | null>(null)
const categories = ref<CategoryWithCount[]>([])
const publicationBusy = ref('')
const deleteTarget = ref<DigitalPlatformDTO | null>(null)
const deletingProduct = ref(false)

const modalOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  status: 'Dalam Pengembangan' as (typeof PLATFORM_STATUSES)[number],
  audiences: [] as string[],
  unit: '',
  url: '',
  order: 0,
  published: false,
  featured: false,
  thumbnail: '',
  galleryText: '',
  problem: '',
  solution: '',
  benefits: '',
  features: '',
  modules: [] as PlatformModuleDTO[],
  metrics: [] as PlatformMetricDTO[],
  seo: emptySeo()
})

const categoryModalOpen = ref(false)
const categorySaving = ref(false)
const categoryError = ref('')
const categoryForm = reactive({ id: '', name: '', description: '', order: 0, active: true })
const categoryDeleteTarget = ref<CategoryWithCount | null>(null)
const deletingCategory = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  try {
    const data = await requestFetch<{ items: DigitalPlatformDTO[]; total: number; page: number; pageSize: number; categories: CategoryWithCount[] }>(
      '/api/admin/platforms',
      {
        query: {
          q: search.value || undefined,
          category: categoryFilter.value || undefined,
          status: statusFilter.value || undefined,
          page: page.value,
          pageSize: 24
        }
      }
    )
    result.value = data
    categories.value = data.categories
  } catch (error: any) {
    toast.error('Gagal memuat', error?.data?.statusMessage)
  } finally {
    loading.value = false
  }
}
await load()
watch([categoryFilter, statusFilter], () => {
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

function resetForm() {
  Object.assign(form, {
    name: '',
    slug: '',
    description: '',
    categoryId: categories.value[0]?.id || '',
    status: 'Dalam Pengembangan',
    audiences: [],
    unit: '',
    url: '',
    order: (result.value?.total || 0) + 1,
    published: false,
    featured: false,
    thumbnail: '',
    galleryText: '',
    problem: '',
    solution: '',
    benefits: '',
    features: '',
    modules: [],
    metrics: [],
    seo: emptySeo()
  })
}

function openCreate() {
  editingId.value = ''
  resetForm()
  formError.value = ''
  modalOpen.value = true
}

function openEdit(item: DigitalPlatformDTO) {
  editingId.value = item.id
  Object.assign(form, {
    name: item.name,
    slug: item.slug,
    description: item.description,
    categoryId: item.categoryId || categories.value[0]?.id || '',
    status: item.status,
    audiences: [...item.audiences],
    unit: item.unit,
    url: item.url || '',
    order: item.order,
    published: item.published,
    featured: item.featured,
    thumbnail: item.thumbnail,
    galleryText: item.gallery.join('\n'),
    problem: item.problem,
    solution: item.solution,
    benefits: item.benefits,
    features: item.features,
    modules: item.modules.map((module) => ({ ...module })),
    metrics: item.metrics.map((metric) => ({ ...metric })),
    seo: { ...emptySeo(), ...(item.seo || {}) }
  })
  formError.value = ''
  modalOpen.value = true
}

function toggleAudience(name: string) {
  if (form.audiences.includes(name)) form.audiences = form.audiences.filter((item) => item !== name)
  else form.audiences.push(name)
}

function addModule() {
  form.modules.push({ name: '', description: '', order: form.modules.length + 1, active: true })
}

function removeModule(index: number) {
  form.modules.splice(index, 1)
}

function addMetric() {
  form.metrics.push({ value: 0, suffix: '', label: '', period: '', source: '' })
}

function removeMetric(index: number) {
  form.metrics.splice(index, 1)
}

async function save() {
  formError.value = ''
  if (form.name.trim().length < 2) {
    formError.value = 'Nama produk minimal 2 karakter.'
    return
  }
  if (form.description.trim().length < 10) {
    formError.value = 'Deskripsi singkat minimal 10 karakter.'
    return
  }
  if (!form.categoryId) {
    formError.value = 'Pilih kategori utama.'
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form,
      gallery: form.galleryText.split('\n').map((line) => line.trim()).filter(Boolean)
    }
    delete (payload as any).galleryText
    if (editingId.value) {
      await api(`/api/admin/platforms/${editingId.value}`, { method: 'PATCH', body: payload })
      toast.success('Produk diperbarui')
    } else {
      await api('/api/admin/platforms', { method: 'POST', body: payload })
      toast.success('Produk ditambahkan')
    }
    modalOpen.value = false
    await load()
  } catch (error: any) {
    formError.value = error?.data?.statusMessage || 'Gagal menyimpan produk.'
  } finally {
    saving.value = false
  }
}

async function togglePublished(item: DigitalPlatformDTO) {
  if (publicationBusy.value) return
  publicationBusy.value = item.id
  try {
    await api(`/api/admin/platforms/${item.id}`, { method: 'PATCH', body: { published: !item.published } })
    toast.success(item.published ? 'Produk disembunyikan dari publik' : 'Produk dipublikasikan')
    await load()
  } catch (error: any) {
    toast.error('Gagal mengubah publikasi', error?.data?.statusMessage || 'Status publikasi tidak berubah.')
  } finally {
    publicationBusy.value = ''
  }
}

async function deleteProduct() {
  if (!deleteTarget.value) return
  deletingProduct.value = true
  try {
    await api(`/api/admin/platforms/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.success('Produk dihapus')
    deleteTarget.value = null
    await load()
  } catch (error: any) {
    toast.error('Gagal menghapus produk', error?.data?.statusMessage || 'Produk tidak dihapus.')
  } finally {
    deletingProduct.value = false
  }
}

function openCategoryManager() {
  categoryError.value = ''
  resetCategoryForm()
  categoryModalOpen.value = true
}

function resetCategoryForm() {
  categoryForm.id = ''
  categoryForm.name = ''
  categoryForm.description = ''
  categoryForm.order = categories.value.length + 1
  categoryForm.active = true
  categoryError.value = ''
}

function editCategory(item: CategoryWithCount) {
  categoryForm.id = item.id
  categoryForm.name = item.name
  categoryForm.description = item.description
  categoryForm.order = item.order
  categoryForm.active = item.active
  categoryError.value = ''
}

async function saveCategory() {
  categoryError.value = ''
  if (categoryForm.name.trim().length < 2) {
    categoryError.value = 'Nama kategori minimal 2 karakter.'
    return
  }
  categorySaving.value = true
  try {
    const body = {
      name: categoryForm.name,
      description: categoryForm.description,
      order: categoryForm.order,
      active: categoryForm.active
    }
    if (categoryForm.id) {
      await api(`/api/admin/platform-categories/${categoryForm.id}`, { method: 'PATCH', body })
      toast.success('Kategori diperbarui')
    } else {
      await api('/api/admin/platform-categories', { method: 'POST', body })
      toast.success('Kategori ditambahkan')
    }
    resetCategoryForm()
    await load()
  } catch (error: any) {
    categoryError.value = error?.data?.statusMessage || 'Gagal menyimpan kategori.'
  } finally {
    categorySaving.value = false
  }
}

async function deleteCategory() {
  if (!categoryDeleteTarget.value) return
  deletingCategory.value = true
  try {
    await api(`/api/admin/platform-categories/${categoryDeleteTarget.value.id}`, { method: 'DELETE' })
    toast.success('Kategori dihapus')
    if (categoryForm.id === categoryDeleteTarget.value.id) resetCategoryForm()
    categoryDeleteTarget.value = null
    await load()
  } catch (error: any) {
    toast.error('Gagal menghapus kategori', error?.data?.statusMessage || 'Coba lagi.')
  } finally {
    deletingCategory.value = false
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 24))))
const statusClass = (status: string) =>
  status === 'Sudah Rilis'
    ? 'border-unu-green/20 bg-unu-green-soft text-unu-green-dark'
    : status === 'Pilot / Beta'
      ? 'border-sky-200 bg-sky-50 text-sky-800'
      : 'border-amber-200 bg-amber-50 text-amber-900'

useSeoMeta({ title: 'Ekosistem Digital', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Konten Website</p>
        <h2 class="mt-2">Ekosistem Digital</h2>
        <p class="mt-1 text-[14px] text-admin-muted">Kelola produk, kategori, sasaran pengguna, modul, dan publikasi.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <AppButton variant="secondary" size="sm" @click="openCategoryManager"><template #left><Settings2 :size="14" /></template>Kelola Kategori</AppButton>
        <AppButton size="sm" @click="openCreate"><template #left><Plus :size="14" /></template>Tambah Produk</AppButton>
      </div>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-admin-border bg-white p-4 lg:flex-row">
      <div class="relative flex-1">
        <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" aria-hidden="true" />
        <input v-model="search" type="search" class="field-input pl-10" placeholder="Cari produk, kategori, atau unit…" aria-label="Cari produk" />
      </div>
      <select v-model="categoryFilter" class="field-input lg:w-64" aria-label="Filter kategori">
        <option value="">Semua kategori</option>
        <option v-for="item in categories" :key="item.id" :value="item.slug">{{ item.name }}</option>
      </select>
      <select v-model="statusFilter" class="field-input lg:w-52" aria-label="Filter status">
        <option value="">Semua status</option>
        <option v-for="item in PLATFORM_STATUSES" :key="item" :value="item">{{ item }}</option>
      </select>
      <span class="self-center px-2 text-[14px] text-admin-muted">{{ result?.total ?? 0 }} produk</span>
    </div>

    <div class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div v-if="loading" class="space-y-2 p-4">
        <div v-for="i in 5" :key="i" class="skeleton h-16 rounded-lg" />
      </div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Belum ada produk" description="Tambahkan produk digital pertama." compact>
        <AppButton size="sm" @click="openCreate">Tambah Produk</AppButton>
      </EmptyState>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[1040px] text-left">
            <thead>
              <tr class="border-b border-admin-border bg-slate-50 text-[12px] uppercase tracking-wide text-admin-muted">
                <th class="px-5 py-3 font-bold">Produk</th>
                <th class="px-5 py-3 font-bold">Kategori</th>
                <th class="px-5 py-3 font-bold">Sasaran Pengguna</th>
                <th class="px-5 py-3 font-bold">Status</th>
                <th class="px-5 py-3 font-bold">Publikasi</th>
                <th class="px-5 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-admin-border">
              <tr v-for="item in result.items" :key="item.id" class="hover:bg-slate-50/60">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.name" class="h-full w-full object-cover object-top" />
                      <span v-else class="grid h-full w-full place-items-center text-[12px] font-bold text-slate-400">{{ item.name.slice(0, 1) }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-[14px] font-semibold">{{ item.name }}</p>
                      <p class="mt-0.5 truncate text-[12px] text-admin-muted">/{{ item.slug }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-[13px] text-slate-600">{{ item.category }}</td>
                <td class="max-w-[220px] px-5 py-3.5 text-[13px] text-slate-600">{{ item.audiences.length ? item.audiences.join(', ') : '—' }}</td>
                <td class="px-5 py-3.5"><span class="inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold" :class="statusClass(item.status)">{{ item.status }}</span></td>
                <td class="px-5 py-3.5">
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="item.published"
                    :aria-label="`Publikasi ${item.name}`"
                    :disabled="publicationBusy === item.id"
                    class="inline-flex min-h-[36px] items-center gap-2 text-[13px] font-medium disabled:opacity-50"
                    @click="togglePublished(item)"
                  >
                    <span class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors" :class="item.published ? 'bg-unu-green' : 'bg-slate-300'">
                      <span class="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform" :class="item.published ? 'translate-x-5' : 'translate-x-0'" />
                    </span>
                    <span :class="item.published ? 'text-unu-green' : 'text-slate-500'">{{ publicationBusy === item.id ? 'Menyimpan…' : item.published ? 'Publikasi ON' : 'Publikasi OFF' }}</span>
                  </button>
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center justify-end gap-1">
                    <button type="button" class="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-unu-green-soft hover:text-unu-green" :aria-label="`Edit ${item.name}`" title="Edit produk" @click="openEdit(item)">
                      <Pencil :size="15" aria-hidden="true" />
                    </button>
                    <button type="button" class="grid h-9 w-9 place-items-center rounded-lg text-red-700/75 transition hover:bg-red-50 hover:text-red-800" :aria-label="`Hapus ${item.name}`" title="Hapus produk" @click="deleteTarget = item">
                      <Trash2 :size="15" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-admin-border md:hidden">
          <div v-for="item in result.items" :key="item.id" class="p-4">
            <div class="flex items-start gap-3">
              <div class="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.name" class="h-full w-full object-cover object-top" />
                <span v-else class="grid h-full w-full place-items-center text-[14px] font-bold text-slate-400">{{ item.name.slice(0, 1) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[14px] font-semibold">{{ item.name }}</p>
                <p class="mt-0.5 text-[13px] text-slate-600">{{ item.category }}</p>
                <p class="mt-0.5 text-[12px] text-admin-muted">{{ item.audiences.length ? item.audiences.join(' · ') : 'Sasaran belum diisi' }}</p>
              </div>
              <span class="shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold" :class="statusClass(item.status)">{{ item.status }}</span>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-4">
              <button type="button" role="switch" :aria-checked="item.published" :aria-label="`Publikasi ${item.name}`" :disabled="publicationBusy === item.id" class="inline-flex min-h-[36px] items-center gap-2 text-[13px] font-medium disabled:opacity-50" @click="togglePublished(item)">
                <span class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors" :class="item.published ? 'bg-unu-green' : 'bg-slate-300'">
                  <span class="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform" :class="item.published ? 'translate-x-5' : 'translate-x-0'" />
                </span>
                <span :class="item.published ? 'text-unu-green' : 'text-slate-500'">{{ publicationBusy === item.id ? 'Menyimpan…' : item.published ? 'Publikasi ON' : 'Publikasi OFF' }}</span>
              </button>
              <button type="button" class="inline-flex min-h-[36px] items-center gap-1 text-[13px] font-semibold text-unu-green" :aria-label="`Edit ${item.name}`" @click="openEdit(item)"><Pencil :size="13" aria-hidden="true" /> Edit</button>
              <button type="button" class="inline-flex min-h-[36px] items-center gap-1 text-[13px] font-semibold text-red-700" :aria-label="`Hapus ${item.name}`" @click="deleteTarget = item"><Trash2 :size="13" aria-hidden="true" /> Hapus</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="page = $event" />

    <ModalDialog v-model="modalOpen" :title="editingId ? 'Edit Produk' : 'Tambah Produk'" description="Kelola informasi produk, visual, modul, dan capaian." size="lg">
      <div v-if="formError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-900">{{ formError }}</div>

      <div class="space-y-7">
        <section>
          <h3 class="text-[14px] font-bold uppercase tracking-[0.12em] text-unu-green">Informasi utama</h3>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2"><label for="platform-name" class="admin-label">Nama produk</label><input id="platform-name" v-model="form.name" class="field-input" maxlength="160" /></div>
            <div><label for="platform-slug" class="admin-label">Slug</label><input id="platform-slug" v-model="form.slug" class="field-input font-mono text-[13px]" placeholder="otomatis" maxlength="160" /></div>
            <div><label for="platform-category" class="admin-label">Kategori utama</label><select id="platform-category" v-model="form.categoryId" class="field-input"><option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></div>
            <div><label for="platform-status" class="admin-label">Status implementasi</label><select id="platform-status" v-model="form.status" class="field-input"><option v-for="item in PLATFORM_STATUSES" :key="item" :value="item">{{ item }}</option></select></div>
            <div><label for="platform-order" class="admin-label">Urutan tampil</label><input id="platform-order" v-model.number="form.order" type="number" class="field-input" /></div>
            <div class="sm:col-span-2"><label for="platform-description" class="admin-label">Deskripsi singkat</label><textarea id="platform-description" v-model="form.description" rows="3" class="field-input" maxlength="500" /></div>
            <div class="sm:col-span-2">
              <p class="admin-label">Sasaran pengguna</p>
              <div class="flex flex-wrap gap-2">
                <button v-for="item in PLATFORM_AUDIENCES" :key="item" type="button" class="min-h-[40px] rounded-full border px-3 text-[13px] font-semibold transition" :class="form.audiences.includes(item) ? 'border-unu-green bg-unu-green text-white' : 'border-admin-border bg-white text-admin-text hover:border-unu-green/40'" @click="toggleAudience(item)">{{ item }}</button>
              </div>
            </div>
            <div><label for="platform-unit" class="admin-label">Unit pengelola</label><input id="platform-unit" v-model="form.unit" class="field-input" maxlength="160" /></div>
            <div><label for="platform-url" class="admin-label">URL produk</label><input id="platform-url" v-model="form.url" type="url" class="field-input" placeholder="https://" maxlength="500" /></div>
          </div>
        </section>

        <section class="border-t border-admin-border pt-6">
          <h3 class="text-[14px] font-bold uppercase tracking-[0.12em] text-unu-green">Visual & publikasi</h3>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2"><label for="platform-thumbnail" class="admin-label">Screenshot utama (URL/path)</label><input id="platform-thumbnail" v-model="form.thumbnail" class="field-input" placeholder="/images/… atau https://…" maxlength="500" /><p class="field-help">Kosongkan untuk memakai fallback visual UNU.</p></div>
            <div class="sm:col-span-2"><label for="platform-gallery" class="admin-label">Screenshot tambahan</label><textarea id="platform-gallery" v-model="form.galleryText" rows="2" class="field-input font-mono text-[13px]" placeholder="Satu URL/path per baris" /></div>
            <SeoFields v-model="form.seo" :fallback-title="form.name" :fallback-description="form.description" :path="form.slug ? `/ekosistem-digital/${form.slug}` : '/ekosistem-digital/…'" />
            <label class="flex min-h-[48px] items-center justify-between gap-3 rounded-lg border border-admin-border px-4 text-[14px] font-medium"><span>Produk unggulan</span><input v-model="form.featured" type="checkbox" class="h-5 w-5 accent-unu-green" /></label>
            <label class="flex min-h-[48px] items-center justify-between gap-3 rounded-lg border border-admin-border px-4 text-[14px] font-medium"><span>Publikasikan</span><input v-model="form.published" type="checkbox" class="h-5 w-5 accent-unu-green" /></label>
          </div>
        </section>

        <section class="border-t border-admin-border pt-6">
          <h3 class="text-[14px] font-bold uppercase tracking-[0.12em] text-unu-green">Detail produk</h3>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2"><label for="platform-problem" class="admin-label">Permasalahan</label><textarea id="platform-problem" v-model="form.problem" rows="3" class="field-input" maxlength="2000" /></div>
            <div class="sm:col-span-2"><label for="platform-solution" class="admin-label">Solusi</label><textarea id="platform-solution" v-model="form.solution" rows="3" class="field-input" maxlength="2000" /></div>
            <div class="sm:col-span-2"><label for="platform-benefits" class="admin-label">Manfaat</label><textarea id="platform-benefits" v-model="form.benefits" rows="3" class="field-input" maxlength="2000" /></div>
            <div class="sm:col-span-2"><label for="platform-features" class="admin-label">Fitur utama (satu per baris)</label><textarea id="platform-features" v-model="form.features" rows="3" class="field-input" maxlength="2000" /></div>
          </div>
        </section>

        <section class="border-t border-admin-border pt-6">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-[14px] font-bold uppercase tracking-[0.12em] text-unu-green">Modul terintegrasi</h3>
            <AppButton variant="secondary" size="sm" @click="addModule"><template #left><Plus :size="13" /></template>Tambah Modul</AppButton>
          </div>
          <p class="mt-2 text-[13px] leading-5 text-admin-muted">Modul tampil di halaman detail produk induk. Tidak perlu membuat produk terpisah.</p>
          <div v-if="form.modules.length" class="mt-4 space-y-3">
            <div v-for="(module, index) in form.modules" :key="index" class="rounded-lg border border-admin-border bg-slate-50 p-3">
              <div class="grid gap-3 sm:grid-cols-[1fr_100px_auto] sm:items-end">
                <div><label class="admin-label">Nama modul</label><input v-model="module.name" class="field-input" maxlength="120" /></div>
                <div><label class="admin-label">Urutan</label><input v-model.number="module.order" type="number" class="field-input" /></div>
                <button type="button" class="grid h-10 w-10 place-items-center rounded-lg text-red-700 hover:bg-red-50" aria-label="Hapus modul" @click="removeModule(index)"><X :size="15" /></button>
              </div>
              <div class="mt-3"><label class="admin-label">Deskripsi</label><input v-model="module.description" class="field-input" maxlength="500" /></div>
              <label class="mt-3 inline-flex items-center gap-2 text-[13px] font-medium"><input v-model="module.active" type="checkbox" class="h-4 w-4 accent-unu-green" /> Modul aktif</label>
            </div>
          </div>
          <p v-else class="mt-4 rounded-lg border border-dashed border-admin-border p-4 text-[13px] text-admin-muted">Belum ada modul.</p>
        </section>

        <section class="border-t border-admin-border pt-6">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-[14px] font-bold uppercase tracking-[0.12em] text-unu-green">Dampak & capaian</h3>
            <AppButton variant="secondary" size="sm" @click="addMetric"><template #left><Plus :size="13" /></template>Tambah Capaian</AppButton>
          </div>
          <p class="mt-2 text-[13px] leading-5 text-admin-muted">Cantumkan sumber dan periode agar angka tidak dibaca sebagai data real-time.</p>
          <div v-if="form.metrics.length" class="mt-4 space-y-3">
            <div v-for="(metric, index) in form.metrics" :key="index" class="rounded-lg border border-admin-border bg-slate-50 p-3">
              <div class="grid gap-3 sm:grid-cols-[110px_80px_1fr_auto] sm:items-end">
                <div><label class="admin-label">Nilai</label><input v-model.number="metric.value" type="number" class="field-input" /></div>
                <div><label class="admin-label">Suffix</label><input v-model="metric.suffix" class="field-input" maxlength="12" placeholder="%, +" /></div>
                <div><label class="admin-label">Label</label><input v-model="metric.label" class="field-input" maxlength="160" /></div>
                <button type="button" class="grid h-10 w-10 place-items-center rounded-lg text-red-700 hover:bg-red-50" aria-label="Hapus capaian" @click="removeMetric(index)"><X :size="15" /></button>
              </div>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <div><label class="admin-label">Periode</label><input v-model="metric.period" class="field-input" maxlength="80" placeholder="Data 2026" /></div>
                <div><label class="admin-label">Sumber</label><input v-model="metric.source" class="field-input" maxlength="200" /></div>
              </div>
            </div>
          </div>
          <p v-else class="mt-4 rounded-lg border border-dashed border-admin-border p-4 text-[13px] text-admin-muted">Belum ada capaian terkait.</p>
        </section>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="modalOpen = false">Batal</AppButton>
          <AppButton :loading="saving" @click="save">Simpan Produk</AppButton>
        </div>
      </template>
    </ModalDialog>

    <ModalDialog :model-value="Boolean(deleteTarget)" title="Hapus Produk Ekosistem?" size="sm" @update:model-value="deleteTarget = null">
      <p class="text-[14px] leading-6 text-slate-600">Produk akan dihapus permanen beserta modul dan capaian yang tersimpan di dalamnya. Tindakan ini tidak dapat dibatalkan.</p>
      <div v-if="deleteTarget" class="mt-4 rounded-lg border border-admin-border bg-slate-50 px-4 py-3">
        <p class="text-[14px] font-semibold text-admin-text">{{ deleteTarget.name }}</p>
        <p class="mt-1 text-[13px] text-admin-muted">{{ deleteTarget.category }} · {{ deleteTarget.status }}</p>
        <p class="mt-1 text-[12px] text-admin-muted">Publikasi: {{ deleteTarget.published ? 'ON' : 'OFF' }} · {{ deleteTarget.audiences.length ? deleteTarget.audiences.join(', ') : 'Sasaran belum diisi' }}</p>
      </div>
      <p v-if="deleteTarget?.published" class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-5 text-amber-900">Produk ini sedang dipublikasikan dan akan langsung hilang dari halaman publik.</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="deleteTarget = null">Batal</AppButton>
          <AppButton variant="danger" :loading="deletingProduct" @click="deleteProduct">Hapus Produk</AppButton>
        </div>
      </template>
    </ModalDialog>

    <ModalDialog v-model="categoryModalOpen" title="Kategori Ekosistem" description="Kategori utama menentukan pengelompokan produk pada halaman publik." size="md">
      <div class="grid gap-5 sm:grid-cols-[1fr_1fr]">
        <div>
          <p class="text-[14px] font-semibold">Kategori tersedia</p>
          <div v-if="categoryDeleteTarget" class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p class="text-[13px] leading-5 text-red-900">Hapus kategori <strong>{{ categoryDeleteTarget.name }}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
            <div class="mt-3 flex gap-2">
              <AppButton size="sm" variant="secondary" @click="categoryDeleteTarget = null">Batal</AppButton>
              <AppButton size="sm" variant="danger" :loading="deletingCategory" @click="deleteCategory">Hapus</AppButton>
            </div>
          </div>
          <div v-if="categories.length" class="mt-3 divide-y divide-admin-border rounded-lg border border-admin-border">
            <div v-for="item in categories" :key="item.id" class="flex items-center justify-between gap-3 px-3 py-2.5">
              <div class="min-w-0">
                <p class="text-[14px] font-medium">{{ item.name }}</p>
                <p class="text-[12px] text-admin-muted">{{ item.platformCount }} produk · urutan {{ item.order }} · {{ item.active ? 'aktif' : 'nonaktif' }}</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button type="button" class="text-[12px] font-semibold text-unu-green" @click="editCategory(item)">Edit</button>
                <button type="button" class="text-[12px] font-semibold text-red-700 disabled:cursor-not-allowed disabled:text-slate-300" :disabled="item.platformCount > 0" :title="item.platformCount > 0 ? 'Pindahkan produk ke kategori lain sebelum menghapus.' : 'Hapus kategori'" @click="categoryDeleteTarget = item">Hapus</button>
              </div>
            </div>
          </div>
          <p v-else class="mt-3 rounded-lg border border-dashed border-admin-border p-4 text-[13px] text-admin-muted">Belum ada kategori.</p>
          <p class="mt-3 text-[12px] leading-5 text-admin-muted">Kategori yang masih digunakan tidak dapat dihapus.</p>
        </div>
        <div class="rounded-lg border border-admin-border bg-slate-50 p-4">
          <p class="text-[14px] font-semibold">{{ categoryForm.id ? 'Edit Kategori' : 'Tambah Kategori' }}</p>
          <div v-if="categoryError" class="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-900">{{ categoryError }}</div>
          <div class="mt-3"><label for="category-name" class="admin-label">Nama kategori</label><input id="category-name" v-model="categoryForm.name" class="field-input" maxlength="100" /></div>
          <div class="mt-3"><label for="category-description" class="admin-label">Deskripsi</label><textarea id="category-description" v-model="categoryForm.description" rows="3" class="field-input" maxlength="500" /></div>
          <div class="mt-3"><label for="category-order" class="admin-label">Urutan</label><input id="category-order" v-model.number="categoryForm.order" type="number" class="field-input" /></div>
          <label class="mt-3 flex items-center gap-2 text-[13px] font-medium"><input v-model="categoryForm.active" type="checkbox" class="h-4 w-4 accent-unu-green" /> Kategori aktif</label>
          <div class="mt-4 flex gap-2">
            <AppButton size="sm" :loading="categorySaving" @click="saveCategory">{{ categoryForm.id ? 'Simpan Perubahan' : 'Tambah' }}</AppButton>
            <AppButton v-if="categoryForm.id" size="sm" variant="secondary" @click="resetCategoryForm">Batal</AppButton>
          </div>
        </div>
      </div>
      <template #footer><div class="flex justify-end"><AppButton variant="secondary" @click="categoryModalOpen = false">Tutup</AppButton></div></template>
    </ModalDialog>
  </div>
</template>

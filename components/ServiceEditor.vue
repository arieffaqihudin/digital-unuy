<script setup lang="ts">
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Layers,
  Save,
  Settings2
} from 'lucide-vue-next'
import type { DocumentDTO, FormField, ServiceDTO } from '~/shared/types'
import { SERVICE_CATEGORIES } from '~/shared/types'

const props = defineProps<{ serviceId?: string }>()
const router = useRouter()
const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()

const loading = ref(Boolean(props.serviceId))
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const documents = ref<DocumentDTO[]>([])
const formVersion = ref(1)
const fields = ref<FormField[]>([])

const form = reactive({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: 'Sistem Informasi',
  icon: 'layers',
  active: false,
  acceptsRequests: true,
  featured: false,
  order: 0,
  estimatedDuration: '',
  targetUsers: '',
  requirements: '',
  requiredDocuments: '',
  procedure: '',
  documentIds: [] as string[]
})

const iconOptions = [
  { value: 'mail', label: 'Email' },
  { value: 'code', label: 'Kode' },
  { value: 'server', label: 'Server' },
  { value: 'layers', label: 'Layanan' },
  { value: 'headphones', label: 'Bantuan' },
  { value: 'network', label: 'Integrasi' },
  { value: 'globe', label: 'Web' },
  { value: 'shield', label: 'Keamanan' },
  { value: 'grid', label: 'Portal' },
  { value: 'book', label: 'Panduan' },
  { value: 'users', label: 'Pengguna' },
  { value: 'workflow', label: 'Proses' },
  { value: 'database', label: 'Data' },
  { value: 'monitor', label: 'Aplikasi' }
]

async function loadDocuments() {
  try {
    const data = await requestFetch<{ items: DocumentDTO[] }>('/api/admin/documents', {
      query: { pageSize: 48 }
    })
    documents.value = data.items
  } catch {
    documents.value = []
  }
}

async function loadService() {
  if (!props.serviceId) return
  loading.value = true
  try {
    const data = await requestFetch<{ service: ServiceDTO & { documentIds: string[]; fields: FormField[] } }>(
      `/api/admin/services/${props.serviceId}`
    )
    const service = data.service
    Object.assign(form, {
      name: service.name,
      slug: service.slug,
      shortDescription: service.shortDescription,
      description: service.description,
      category: service.category,
      icon: service.icon,
      active: service.active,
      acceptsRequests: service.acceptsRequests,
      featured: service.featured,
      order: service.order,
      estimatedDuration: service.estimatedDuration || '',
      targetUsers: (service.targetUsers || []).join('\n'),
      requirements: (service.requirements || []).join('\n'),
      requiredDocuments: (service.requiredDocuments || []).join('\n'),
      procedure: (service.procedure || []).join('\n'),
      documentIds: service.documentIds || []
    })
    fields.value = service.fields || []
    formVersion.value = service.formVersion || 1
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Layanan gagal dimuat.'
  } finally {
    loading.value = false
  }
}

await Promise.all([loadService(), loadDocuments()])

const lineArray = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

function toggleDocument(id: string) {
  if (form.documentIds.includes(id)) form.documentIds = form.documentIds.filter((item) => item !== id)
  else form.documentIds = [...form.documentIds, id]
}

function validateLocal() {
  if (form.name.trim().length < 3) return 'Nama layanan minimal 3 karakter.'
  if (form.shortDescription.trim().length < 10) return 'Ringkasan layanan minimal 10 karakter.'
  if (form.description.trim().length < 20) return 'Deskripsi layanan minimal 20 karakter.'
  if (!fields.value.length) return 'Tambahkan minimal satu field formulir.'
  for (const field of fields.value) {
    if (!field.label?.trim()) return 'Semua field harus memiliki label.'
    if (!/^[a-z][a-z0-9_]{1,49}$/.test(field.key)) return `Key field "${field.label}" tidak valid.`
    if (['select', 'radio'].includes(field.type) && !(field.options || []).length) {
      return `Field "${field.label}" membutuhkan pilihan.`
    }
  }
  return ''
}

async function save() {
  errorMessage.value = ''
  successMessage.value = ''
  const localError = validateLocal()
  if (localError) {
    errorMessage.value = localError
    toast.warning('Periksa formulir', localError)
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form,
      slug: form.slug.trim() || undefined,
      targetUsers: lineArray(form.targetUsers),
      requirements: lineArray(form.requirements),
      requiredDocuments: lineArray(form.requiredDocuments),
      procedure: lineArray(form.procedure),
      fields: fields.value.map((field, index) => ({ ...field, order: index }))
    }
    if (props.serviceId) {
      const data = await api<{ service: ServiceDTO & { fields: FormField[] } }>(`/api/admin/services/${props.serviceId}`, {
        method: 'PATCH',
        body: payload
      })
      fields.value = data.service.fields || fields.value
      formVersion.value = data.service.formVersion || formVersion.value
      successMessage.value = 'Perubahan layanan berhasil disimpan.'
      toast.success('Layanan diperbarui', formVersion.value > 1 ? `Formulir versi ${formVersion.value} aktif.` : undefined)
    } else {
      const data = await api<{ service: ServiceDTO }>('/api/admin/services', {
        method: 'POST',
        body: payload
      })
      toast.success('Layanan dibuat')
      await navigateTo(`/admin/layanan/${data.service.id}`)
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal menyimpan layanan.'
    toast.error('Gagal menyimpan', errorMessage.value)
  } finally {
    saving.value = false
  }
}

useSeoMeta({ title: props.serviceId ? 'Edit Layanan' : 'Tambah Layanan', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink to="/admin/layanan" class="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-charcoal"><ArrowLeft :size="14" /> Semua layanan</NuxtLink>
      <div v-if="props.serviceId && form.slug" class="flex items-center gap-3">
        <span class="text-[10px] text-ink-muted">Formulir v{{ formVersion }}</span>
        <NuxtLink :to="`/layanan/${form.slug}`" target="_blank" class="inline-flex items-center gap-1 text-xs font-semibold text-gold-dark hover:underline">Preview <ExternalLink :size="12" /></NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="space-y-4"><div class="skeleton h-40 rounded-2xl" /><div class="skeleton h-96 rounded-2xl" /></div>

    <div v-else class="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-start">
      <div class="space-y-5">
        <div v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">{{ successMessage }}</div>

        <section class="admin-card p-5">
          <div class="flex items-center gap-2"><Layers :size="17" class="text-gold-dark" /><h3 class="text-sm font-semibold">Informasi layanan</h3></div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label for="service-name" class="admin-label">Nama layanan <span class="text-red-700">*</span></label>
              <input id="service-name" v-model="form.name" class="field-input" maxlength="160" placeholder="Contoh: Pembuatan Email Institusi" />
            </div>
            <div>
              <label for="service-slug" class="admin-label">Slug URL</label>
              <input id="service-slug" v-model="form.slug" class="field-input font-mono text-xs" placeholder="otomatis dari nama" maxlength="90" />
              <p class="field-help">Kosongkan untuk dibuat otomatis. Perubahan slug memengaruhi tautan publik.</p>
            </div>
            <div>
              <label for="service-category" class="admin-label">Kategori <span class="text-red-700">*</span></label>
              <select id="service-category" v-model="form.category" class="field-input">
                <option v-for="category in SERVICE_CATEGORIES" :key="category" :value="category">{{ category }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label for="service-short" class="admin-label">Ringkasan singkat <span class="text-red-700">*</span></label>
              <textarea id="service-short" v-model="form.shortDescription" rows="2" class="field-input" maxlength="280" placeholder="Ringkasan yang tampil di kartu katalog…" />
              <p class="field-help">Maksimal 280 karakter.</p>
            </div>
            <div class="sm:col-span-2">
              <label for="service-description" class="admin-label">Deskripsi lengkap <span class="text-red-700">*</span></label>
              <textarea id="service-description" v-model="form.description" rows="5" class="field-input" placeholder="Jelaskan tujuan dan cakupan layanan…" />
            </div>
            <div>
              <label for="service-duration" class="admin-label">Estimasi waktu</label>
              <input id="service-duration" v-model="form.estimatedDuration" class="field-input" placeholder="Contoh: 3–5 hari kerja" maxlength="100" />
            </div>
            <div>
              <label for="service-order" class="admin-label">Urutan tampil</label>
              <input id="service-order" v-model.number="form.order" type="number" class="field-input" />
            </div>
            <div class="sm:col-span-2">
              <label for="service-icon" class="admin-label">Ikon</label>
              <div class="flex flex-wrap gap-2">
                <label v-for="icon in iconOptions" :key="icon.value" class="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-medium" :class="form.icon === icon.value ? 'border-charcoal bg-ivory' : 'border-line-warm bg-white'">
                  <input v-model="form.icon" type="radio" :value="icon.value" class="sr-only" />
                  <IconTile :name="icon.value" size="sm" tone="sage" />
                  {{ icon.label }}
                </label>
              </div>
            </div>
          </div>
        </section>

        <section class="admin-card p-5">
          <div class="flex items-center gap-2"><FileText :size="17" class="text-gold-dark" /><h3 class="text-sm font-semibold">Konten pendukung</h3></div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label for="service-targets" class="admin-label">Sasaran pengguna <span class="font-normal normal-case text-ink-muted">(satu per baris)</span></label>
              <textarea id="service-targets" v-model="form.targetUsers" rows="4" class="field-input" placeholder="Mahasiswa&#10;Dosen&#10;Tenaga kependidikan" />
            </div>
            <div>
              <label for="service-requirements" class="admin-label">Persyaratan <span class="font-normal normal-case text-ink-muted">(satu per baris)</span></label>
              <textarea id="service-requirements" v-model="form.requirements" rows="4" class="field-input" placeholder="Persyaratan pertama…" />
            </div>
            <div>
              <label for="service-docs-required" class="admin-label">Dokumen diperlukan <span class="font-normal normal-case text-ink-muted">(satu per baris)</span></label>
              <textarea id="service-docs-required" v-model="form.requiredDocuments" rows="4" class="field-input" placeholder="Dokumen pertama…" />
            </div>
            <div>
              <label for="service-procedure" class="admin-label">Prosedur pengajuan <span class="font-normal normal-case text-ink-muted">(satu langkah per baris)</span></label>
              <textarea id="service-procedure" v-model="form.procedure" rows="4" class="field-input" placeholder="Langkah pertama…" />
            </div>
          </div>
        </section>

        <section class="admin-card p-5">
          <div class="flex items-center gap-2"><Settings2 :size="17" class="text-gold-dark" /><h3 class="text-sm font-semibold">Formulir</h3></div>
          <div class="mt-4"><ServiceFormBuilder v-model="fields" /></div>
        </section>

        <section class="admin-card p-5">
          <div class="flex items-center gap-2"><FileText :size="17" class="text-gold-dark" /><h3 class="text-sm font-semibold">SOP & panduan terkait</h3></div>
          <p class="mt-1 text-[11px] text-ink-muted">Pilih dokumen publik yang relevan. Dokumen harus diterbitkan agar tampil di halaman layanan.</p>
          <div v-if="documents.length" class="mt-4 grid gap-2 sm:grid-cols-2">
            <label v-for="doc in documents" :key="doc.id" class="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line-warm px-3 py-2.5 text-xs">
              <input type="checkbox" class="mt-0.5 h-4 w-4 accent-charcoal" :checked="form.documentIds.includes(doc.id)" @change="toggleDocument(doc.id)" />
              <span class="min-w-0"><span class="block truncate font-semibold">{{ doc.title }}</span><span class="mt-0.5 block text-[10px] text-ink-muted">{{ doc.category }} · {{ doc.published ? 'Publik' : 'Draft' }}</span></span>
            </label>
          </div>
          <p v-else class="mt-3 text-xs text-ink-muted">Belum ada dokumen yang dapat dihubungkan.</p>
        </section>
      </div>

      <aside class="space-y-4 xl:sticky xl:top-24">
        <div class="rounded-2xl border border-line-warm bg-white p-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Publikasi</p>
          <div class="mt-4 space-y-3">
            <label class="flex cursor-pointer items-start gap-3 text-xs">
              <input v-model="form.active" type="checkbox" class="mt-0.5 h-4 w-4 accent-charcoal" />
              <span><span class="block font-semibold">Aktif di katalog publik</span><span class="mt-0.5 block text-[10px] leading-4 text-ink-muted">Layanan nonaktif tidak tampil di katalog dan tidak dapat diajukan.</span></span>
            </label>
            <label class="flex cursor-pointer items-start gap-3 text-xs">
              <input v-model="form.acceptsRequests" type="checkbox" class="mt-0.5 h-4 w-4 accent-charcoal" />
              <span><span class="block font-semibold">Menerima permohonan</span><span class="mt-0.5 block text-[10px] leading-4 text-ink-muted">Jika nonaktif, hanya informasi layanan yang ditampilkan.</span></span>
            </label>
            <label class="flex cursor-pointer items-start gap-3 text-xs">
              <input v-model="form.featured" type="checkbox" class="mt-0.5 h-4 w-4 accent-charcoal" />
              <span><span class="block font-semibold">Tampil sebagai unggulan</span><span class="mt-0.5 block text-[10px] leading-4 text-ink-muted">Maksimal enam layanan unggulan ditampilkan di beranda.</span></span>
            </label>
          </div>
          <AppButton class="mt-5" block :loading="saving" @click="save"><template #left><Save :size="15" /></template>Simpan Layanan</AppButton>
          <p class="mt-2 text-center text-[10px] text-ink-muted">Perubahan formulir membuat versi baru, bukan menimpa snapshot lama.</p>
        </div>

        <div class="rounded-2xl border border-line-warm bg-ivory p-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-dark">Ringkasan</p>
          <dl class="mt-3 space-y-2.5 text-xs">
            <div class="flex justify-between gap-3"><dt class="text-ink-muted">Field formulir</dt><dd class="font-semibold">{{ fields.length }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-ink-muted">Dokumen terkait</dt><dd class="font-semibold">{{ form.documentIds.length }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-ink-muted">Versi formulir</dt><dd class="font-semibold">{{ formVersion }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-ink-muted">Status</dt><dd class="font-semibold">{{ form.active ? 'Aktif' : 'Nonaktif' }}</dd></div>
          </dl>
        </div>

        <div class="rounded-2xl border border-line-warm bg-white p-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-dark">Catatan</p>
          <p class="mt-2 text-xs leading-5 text-ink-muted">Aktifkan layanan hanya setelah formulir dan konten pendukung siap. Status pengajuan tidak otomatis berarti disetujui.</p>
        </div>
      </aside>
    </div>
  </div>
</template>

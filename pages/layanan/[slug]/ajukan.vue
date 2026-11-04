<script setup lang="ts">
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Info,
  Loader2,
  Save,
  ShieldCheck
} from 'lucide-vue-next'
import type { DocumentDTO, FormField, ServiceDTO } from '~/shared/types'

definePageMeta({ middleware: 'auth' })

interface ServiceResponse {
  service: ServiceDTO & { fields?: FormField[]; relatedDocuments?: DocumentDTO[] }
}

interface SubmitResult {
  duplicate: boolean
  ticketNumber: string
  requestId: string
  status: string
  trackingUrl?: string
  emailStatus: string
}

const route = useRoute()
const router = useRouter()
const { data, error } = await useAsyncData<ServiceResponse>(`request-service-${route.params.slug}`, () =>
  $fetch<ServiceResponse>(`/api/services/${route.params.slug}`)
)
const service = computed(() => data.value?.service)

if (!service.value) {
  throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.', fatal: true })
}
if (!service.value.active || !service.value.acceptsRequests) {
  throw createError({ statusCode: 409, statusMessage: 'Layanan ini sedang tidak menerima permohonan.', fatal: true })
}

const fields = computed<FormField[]>(() => [...(service.value?.fields || [])].sort((a, b) => a.order - b.order))
const form = reactive<Record<string, unknown>>({})
const files = reactive<Record<string, File | null>>({})
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref<SubmitResult | null>(null)
const submitError = ref('')
const draftMessage = ref('')
const draftLoaded = ref(false)
const draftSaving = ref(false)
const idempotencyKey = ref(
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
)
let draftTimer: ReturnType<typeof setTimeout> | null = null
let suppressDraft = true

for (const field of fields.value) {
  form[field.key] = field.type === 'checkbox' ? false : ''
}

const { settings } = useSite()
const { formatFileSize } = useFormat()
const api = useApi()
const toast = useToast()

function visible(field: FormField) {
  if (!field.showIf?.fieldKey) return true
  const normalized = String(form[field.showIf.fieldKey] ?? '')
  return normalized === String(field.showIf.equals ?? '')
}

const visibleFields = computed(() => fields.value.filter(visible))
const hasFileFields = computed(() => visibleFields.value.some((field) => field.type === 'file'))

onMounted(async () => {
  try {
    const draft = await $fetch<{ data: Record<string, unknown>; updatedAt: string | null }>(
      `/api/requests/drafts/${route.params.slug}`
    )
    if (draft.updatedAt) {
      for (const [key, value] of Object.entries(draft.data)) {
        if (key in form) form[key] = value
      }
      draftMessage.value = `Draft dipulihkan · ${new Date(draft.updatedAt).toLocaleString('id-ID')}`
      toast.info('Draft dipulihkan', 'Isian formulir terakhir berhasil dimuat.')
    }
  } catch {
    // Draft restoration is optional.
  } finally {
    draftLoaded.value = true
    setTimeout(() => {
      suppressDraft = false
    }, 300)
  }
})

watch(
  form,
  () => {
    if (suppressDraft || !draftLoaded.value || submitted.value) return
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = setTimeout(saveDraft, 1100)
  },
  { deep: true }
)

async function saveDraft() {
  if (submitting.value || submitted.value) return
  draftSaving.value = true
  try {
    const payload: Record<string, unknown> = {}
    for (const field of fields.value) {
      if (field.type !== 'file' && field.key in form) payload[field.key] = form[field.key]
    }
    const result = await api<{ savedAt: string }>(`/api/requests/drafts/${route.params.slug}`, {
      method: 'PUT',
      body: { data: payload }
    })
    draftMessage.value = `Draft tersimpan otomatis · ${new Date(result.savedAt).toLocaleTimeString('id-ID')}`
  } catch {
    draftMessage.value = 'Draft belum tersimpan. Periksa koneksi.'
  } finally {
    draftSaving.value = false
  }
}

function validate() {
  const next: Record<string, string> = {}
  for (const field of visibleFields.value) {
    if (field.type === 'file') {
      if (field.required && !files[field.key]) next[field.key] = `${field.label} wajib dilampirkan.`
      continue
    }
    if (field.type === 'checkbox') {
      if (field.required && form[field.key] !== true) next[field.key] = `${field.label} wajib disetujui.`
      continue
    }
    const value = String(form[field.key] ?? '').trim()
    if (field.required && !value) {
      next[field.key] = `${field.label} wajib diisi.`
      continue
    }
    if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      next[field.key] = 'Alamat email tidak valid.'
      continue
    }
    if (value && field.maxLength && value.length > field.maxLength) {
      next[field.key] = `${field.label} maksimal ${field.maxLength} karakter.`
    }
  }
  errors.value = next
  return Object.keys(next).length === 0
}

function onFile(field: FormField, file: File | null) {
  errors.value[field.key] = ''
  if (!file) {
    files[field.key] = null
    return
  }
  const maxMB = Math.min(field.fileMaxMB || 10, 10)
  if (file.size > maxMB * 1024 * 1024) {
    errors.value[field.key] = `Ukuran file maksimal ${maxMB} MB.`
    files[field.key] = null
    return
  }
  if (field.accept?.length && !field.accept.includes(file.type)) {
    errors.value[field.key] = 'Tipe file tidak diizinkan untuk field ini.'
    files[field.key] = null
    return
  }
  files[field.key] = file
}

async function submit() {
  submitError.value = ''
  if (!validate()) {
    toast.warning('Periksa formulir', 'Beberapa isian belum lengkap atau tidak valid.')
    document.querySelector('[aria-invalid="true"], .field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  submitting.value = true
  if (draftTimer) clearTimeout(draftTimer)
  try {
    const formData = new FormData()
    const payload: Record<string, unknown> = {}
    for (const field of visibleFields.value) {
      if (field.type === 'file') continue
      payload[field.key] = field.type === 'checkbox' ? form[field.key] === true : form[field.key] ?? ''
    }
    formData.append('payload', JSON.stringify(payload))
    for (const field of visibleFields.value) {
      if (field.type === 'file' && files[field.key]) {
        formData.append(field.key, files[field.key] as File)
      }
    }

    const result = await api<SubmitResult>(`/api/services/${route.params.slug}/requests`, {
      method: 'POST',
      body: formData,
      headers: { 'x-idempotency-key': idempotencyKey.value }
    })
    submitted.value = result
    toast.success('Permohonan terkirim', `Nomor tiket ${result.ticketNumber}.`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      await api(`/api/requests/drafts/${route.params.slug}`, { method: 'DELETE' })
    } catch {
      // Draft cleanup failure does not affect the submitted request.
    }
  } catch (error: any) {
    const serverErrors = error?.data?.data?.errors || error?.data?.errors
    if (serverErrors && typeof serverErrors === 'object') {
      errors.value = serverErrors
      toast.warning('Periksa formulir', 'Terdapat isian yang perlu diperbaiki.')
      await nextTick()
      document.querySelector('[aria-invalid="true"], .field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      submitError.value =
        error?.data?.statusMessage || 'Permohonan gagal dikirim. Periksa koneksi Anda lalu coba lagi.'
      toast.error('Gagal mengirim', submitError.value)
    }
  } finally {
    submitting.value = false
  }
}

async function copyTracking() {
  if (!submitted.value?.trackingUrl || !import.meta.client) return
  try {
    await navigator.clipboard.writeText(submitted.value.trackingUrl)
    toast.success('Tautan disalin', 'Simpan tautan ini untuk melacak permohonan tanpa masuk.')
  } catch {
    toast.warning('Tidak dapat menyalin', 'Salin tautan secara manual dari halaman ini.')
  }
}

useSeoMeta({
  title: `Ajukan ${service.value.name}`,
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div v-if="service">
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-7 sm:py-9">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Layanan Digital', to: '/layanan' }, { label: service.name, to: `/layanan/${service.slug}` }, { label: 'Ajukan' }]" />
        <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Pengajuan layanan</p>
            <h1 class="display-2 mt-3">{{ service.name }}</h1>
            <p class="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">Lengkapi formulir berikut. Seluruh isian divalidasi di server sebelum permohonan dibuat.</p>
          </div>
          <NuxtLink :to="`/layanan/${service.slug}`" class="inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-4 hover:text-gold-dark hover:underline">
            <ArrowLeft :size="14" aria-hidden="true" /> Kembali ke detail layanan
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div v-if="submitted" class="mx-auto max-w-3xl">
          <div class="overflow-hidden rounded-3xl border border-line-warm bg-white shadow-soft">
            <div class="bg-charcoal px-6 py-8 text-white sm:px-8">
              <span class="grid h-12 w-12 place-items-center rounded-2xl bg-sage text-charcoal">
                <CheckCircle2 :size="25" aria-hidden="true" />
              </span>
              <h2 class="mt-5 text-2xl font-semibold text-white sm:text-3xl">Permohonan berhasil diajukan</h2>
              <p class="mt-2 text-sm leading-6 text-white/60">Simpan nomor tiket dan tautan pelacakan berikut. Jangan bagikan tautan pelacakan kepada pihak lain.</p>
            </div>
            <div class="p-6 sm:p-8">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-xl border border-line-warm bg-ivory p-4">
                  <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">Nomor tiket</p>
                  <p class="mt-2 break-all text-lg font-bold tracking-wide">{{ submitted.ticketNumber }}</p>
                </div>
                <div class="rounded-xl border border-line-warm bg-ivory p-4">
                  <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">Status awal</p>
                  <p class="mt-2 text-lg font-bold">Diajukan</p>
                </div>
              </div>

              <div
                v-if="submitted.emailStatus === 'failed'"
                class="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-900"
              >
                <AlertCircle :size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
                <p>Email notifikasi gagal dikirim. Permohonan tetap tersimpan; gunakan tautan pelacakan di bawah atau hubungi administrator.</p>
              </div>
              <div
                v-else-if="submitted.emailStatus === 'simulated'"
                class="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"
              >
                <Info :size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
                <p>Lingkungan pengembangan: email disimpan di outbox lokal, bukan dikirim ke alamat sebenarnya. Tautan pelacakan tetap dapat digunakan.</p>
              </div>

              <div v-if="submitted.trackingUrl" class="mt-6">
                <p class="field-label">Tautan pelacakan aman</p>
                <div class="flex flex-col gap-2 sm:flex-row">
                  <input :value="submitted.trackingUrl" readonly class="field-input flex-1 text-xs" aria-label="Tautan pelacakan permohonan" />
                  <AppButton variant="secondary" @click="copyTracking">Salin tautan</AppButton>
                </div>
                <p class="field-help">Tautan ini juga dikirim ke email akun Anda jika konfigurasi email aktif.</p>
              </div>

              <div class="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <AppButton :to="`/permohonan-saya/${submitted.requestId}`" size="lg">Lihat Permohonan <template #right><ArrowRight :size="15" /></template></AppButton>
                <AppButton to="/permohonan-saya" variant="secondary" size="lg">Semua Permohonan Saya</AppButton>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="grid gap-8 lg:grid-cols-[1fr_330px] lg:items-start">
          <form novalidate class="rounded-2xl border border-line-warm bg-white p-5 shadow-card sm:p-7" @submit.prevent="submit">
            <div class="flex items-start justify-between gap-4 border-b border-line-warm pb-5">
              <div>
                <h2 class="text-lg font-semibold">Formulir permohonan</h2>
                <p class="mt-1 text-xs leading-5 text-ink-muted">Field bertanda <span class="font-bold text-red-700">*</span> wajib diisi.</p>
              </div>
              <span class="rounded-full bg-sage-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wide">{{ visibleFields.length }} field</span>
            </div>

            <div v-if="submitError" class="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-900" role="alert">
              <AlertCircle :size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{{ submitError }}</p>
            </div>

            <div class="mt-6 grid gap-5 sm:grid-cols-2">
              <div
                v-for="field in visibleFields"
                :key="field.key"
                :class="field.type === 'textarea' || field.type === 'file' || field.type === 'checkbox' || field.type === 'radio' ? 'sm:col-span-2' : ''"
              >
                <FormField
                  :field="field"
                  v-model="form[field.key]"
                  :error="errors[field.key]"
                  :disabled="submitting"
                  @update:file="onFile(field, $event)"
                />
              </div>
            </div>

            <div class="mt-7 flex flex-col gap-3 border-t border-line-warm pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2 text-[11px] text-ink-muted">
                <Loader2 v-if="draftSaving" :size="13" class="animate-spin" aria-hidden="true" />
                <Save v-else :size="13" aria-hidden="true" />
                <span>{{ draftMessage || 'Draft isian disimpan otomatis.' }}</span>
              </div>
              <div class="flex flex-col gap-2 sm:flex-row">
                <AppButton :to="`/layanan/${service.slug}`" variant="secondary">Batal</AppButton>
                <AppButton type="submit" :loading="submitting" size="lg">
                  Kirim Permohonan
                  <template #right><ArrowRight :size="16" /></template>
                </AppButton>
              </div>
            </div>
          </form>

          <aside class="space-y-4 lg:sticky lg:top-36">
            <div class="rounded-2xl border border-line-warm bg-ivory p-5">
              <div class="flex items-center gap-2">
                <ClipboardCheck :size="17" class="text-gold-dark" aria-hidden="true" />
                <h2 class="text-sm font-semibold">Sebelum mengirim</h2>
              </div>
              <ul class="mt-4 space-y-3 text-xs leading-5 text-ink-muted">
                <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />Pastikan data identitas dan unit kerja benar.</li>
                <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />Lampiran yang didukung: PDF, PNG, JPG, WEBP, DOCX, XLSX, ZIP.</li>
                <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />File lampiran tidak disimpan dalam draft, unggah ulang saat mengirim.</li>
                <li v-if="hasFileFields" class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />Total lampiran maksimal 12 MB.</li>
              </ul>
            </div>

            <div class="rounded-2xl border border-line-warm bg-white p-5">
              <div class="flex items-center gap-2">
                <Clock3 :size="16" class="text-gold-dark" aria-hidden="true" />
                <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">Estimasi waktu</p>
              </div>
              <p class="mt-2 text-sm font-semibold">{{ service.estimatedDuration || 'Sesuai hasil kajian' }}</p>
              <p class="mt-2 text-xs leading-5 text-ink-muted">Estimasi dapat berubah sesuai kelengkapan dokumen dan tingkat urgensi.</p>
            </div>

            <div class="rounded-2xl border border-line-warm bg-white p-5">
              <div class="flex items-center gap-2">
                <ShieldCheck :size="16" class="text-gold-dark" aria-hidden="true" />
                <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">Keamanan data</p>
              </div>
              <p class="mt-2 text-xs leading-5 text-ink-muted">Jangan pernah mengirim kata sandi melalui formulir. Lampiran hanya dapat diakses oleh Anda dan petugas yang berwenang.</p>
            </div>

            <div v-if="service.requirements?.length" class="rounded-2xl border border-line-warm bg-white p-5">
              <div class="flex items-center gap-2">
                <FileText :size="16" class="text-gold-dark" aria-hidden="true" />
                <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">Persyaratan</p>
              </div>
              <ul class="mt-3 space-y-2">
                <li v-for="item in service.requirements" :key="item" class="flex gap-2 text-xs leading-5 text-ink-muted">
                  <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" aria-hidden="true" />{{ item }}
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>

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
const regularFields = computed(() => visibleFields.value.filter((field) => field.type !== 'file'))
const fileFields = computed(() => visibleFields.value.filter((field) => field.type === 'file'))
const hasFileFields = computed(() => fileFields.value.length > 0)

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
          <NuxtLink :to="`/layanan/${service.slug}`" class="inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-4 hover:text-unu-green hover:underline">
            <ArrowLeft :size="14" aria-hidden="true" /> Kembali ke detail layanan
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div v-if="submitted" class="mx-auto max-w-3xl">
          <div class="overflow-hidden rounded-3xl border border-line-warm bg-white shadow-soft">
            <div class="bg-unu-green-dark px-6 py-8 text-white sm:px-8">
              <span class="grid h-12 w-12 place-items-center rounded-2xl bg-unu-green-soft text-unu-green">
                <CheckCircle2 :size="25" aria-hidden="true" />
              </span>
              <h2 class="mt-5 text-2xl font-semibold text-white sm:text-3xl">Permohonan berhasil diajukan</h2>
              <p class="mt-2 text-sm leading-6 text-white/60">Simpan nomor tiket dan tautan pelacakan berikut. Jangan bagikan tautan pelacakan kepada pihak lain.</p>
            </div>
            <div class="p-6 sm:p-8">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-xl border border-line-warm bg-ivory p-4">
                  <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-muted">Nomor tiket</p>
                  <p class="mt-2 break-all text-lg font-bold tracking-wide">{{ submitted.ticketNumber }}</p>
                </div>
                <div class="rounded-xl border border-line-warm bg-ivory p-4">
                  <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-muted">Status awal</p>
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

        <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,820px)_300px] lg:justify-center lg:items-start">
          <form novalidate class="rounded-xl border border-line-warm bg-white p-5 sm:p-7" @submit.prevent="submit">
            <div class="flex items-start justify-between gap-4 border-b border-line-warm pb-5">
              <div>
                <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">Formulir</p>
                <h2 class="mt-1 text-lg font-semibold">{{ service.name }}</h2>
                <p class="mt-1 text-[14px] leading-5 text-slate-500">Field bertanda <span class="font-bold text-red-700">*</span> wajib diisi.</p>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-slate-500">{{ visibleFields.length }} field</span>
            </div>

            <div v-if="submitError" class="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-900" role="alert">
              <AlertCircle :size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{{ submitError }}</p>
            </div>

            <fieldset class="mt-7">
              <legend class="mb-4 text-[14px] font-bold uppercase tracking-[0.14em] text-slate-500">Data permohonan</legend>
              <div class="grid gap-5 sm:grid-cols-2">
                <div
                  v-for="field in regularFields"
                  :key="field.key"
                  :class="field.type === 'textarea' || field.type === 'checkbox' || field.type === 'radio' ? 'sm:col-span-2' : ''"
                >
                  <FormField
                    :field="field"
                    v-model="form[field.key]"
                    :error="errors[field.key]"
                    :disabled="submitting"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset v-if="fileFields.length" class="mt-8 border-t border-line-warm pt-6">
              <legend class="mb-4 text-[14px] font-bold uppercase tracking-[0.14em] text-slate-500">Lampiran</legend>
              <div class="space-y-5">
                <FormField
                  v-for="field in fileFields"
                  :key="field.key"
                  :field="field"
                  v-model="form[field.key]"
                  :error="errors[field.key]"
                  :disabled="submitting"
                  @update:file="onFile(field, $event)"
                />
              </div>
            </fieldset>

            <div class="mt-8 flex flex-col gap-3 border-t border-line-warm pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2 text-[12px] text-slate-500">
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

          <aside class="lg:sticky lg:top-28">
            <div class="overflow-hidden rounded-xl border border-line-warm bg-white">
              <div class="border-b border-line-warm bg-soft-white px-5 py-4">
                <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Ringkasan pengajuan</p>
                <p class="mt-1 text-sm font-semibold">{{ service.category }}</p>
              </div>
              <div class="p-5">
                <div class="flex items-start gap-3">
                  <Clock3 :size="15" class="mt-0.5 shrink-0 text-unu-green" aria-hidden="true" />
                  <div>
                    <p class="text-[12px] font-semibold uppercase tracking-wide text-slate-400">Estimasi waktu</p>
                    <p class="mt-0.5 text-sm font-semibold">{{ service.estimatedDuration || 'Sesuai hasil kajian' }}</p>
                  </div>
                </div>

                <ul class="mt-5 space-y-3 border-t border-line-warm pt-5 text-[14px] leading-5 text-slate-600">
                  <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-unu-green" aria-hidden="true" />Pastikan data identitas dan unit kerja benar.</li>
                  <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-unu-green" aria-hidden="true" />Lampiran: PDF, PNG, JPG, WEBP, DOCX, XLSX, ZIP.</li>
                  <li class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-unu-green" aria-hidden="true" />Lampiran tidak disimpan dalam draft.</li>
                  <li v-if="hasFileFields" class="flex gap-2.5"><span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-unu-green" aria-hidden="true" />Total lampiran maksimal 12 MB.</li>
                </ul>

                <div class="mt-5 flex gap-3 border-t border-line-warm pt-5">
                  <ShieldCheck :size="15" class="mt-0.5 shrink-0 text-unu-green" aria-hidden="true" />
                  <p class="text-[12px] leading-5 text-slate-500">Jangan mengirim kata sandi. Lampiran hanya dapat diakses oleh Anda dan petugas berwenang.</p>
                </div>

                <div v-if="service.requirements?.length" class="mt-5 border-t border-line-warm pt-5">
                  <p class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400"><FileText :size="13" /> Persyaratan</p>
                  <ul class="mt-2.5 space-y-2">
                    <li v-for="item in service.requirements" :key="item" class="flex gap-2 text-[12px] leading-5 text-slate-500">
                      <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />{{ item }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>

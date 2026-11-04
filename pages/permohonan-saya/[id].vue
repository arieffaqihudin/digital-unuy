<script setup lang="ts">
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  MessageSquare,
  Send,
  ShieldCheck
} from 'lucide-vue-next'
import type { RequestDetailDTO } from '~/shared/types'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const { formatDateTime, formatFileSize } = useFormat()

const request = ref<RequestDetailDTO | null>(null)
const loading = ref(true)
const failure = ref('')
const responseMessage = ref('')
const commentMessage = ref('')
const completionFile = ref<File | null>(null)
const sendingResponse = ref(false)
const sendingComment = ref(false)

async function load() {
  loading.value = true
  failure.value = ''
  try {
    const data = await requestFetch<{ request: RequestDetailDTO }>(`/api/requests/${route.params.id}`)
    request.value = data.request
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Permohonan tidak ditemukan atau Anda tidak memiliki akses.'
  } finally {
    loading.value = false
  }
}

await load()

if (!request.value && !loading.value) {
  throw createError({ statusCode: 404, statusMessage: failure.value || 'Permohonan tidak ditemukan.', fatal: true })
}

const entries = computed(() => {
  if (!request.value) return []
  return request.value.formSnapshot.fields
    .filter((field) => field.type !== 'file')
    .map((field) => ({
      key: field.key,
      label: field.label,
      value:
        typeof request.value?.data[field.key] === 'boolean'
          ? request.value.data[field.key]
            ? 'Ya'
            : 'Tidak'
          : String(request.value?.data[field.key] ?? '—')
    }))
})

function attachmentsFor(key: string) {
  return request.value?.attachments.filter((attachment) => attachment.fieldKey === key) || []
}

async function submitCompletion() {
  if (!request.value) return
  if (responseMessage.value.trim().length < 5) {
    toast.warning('Keterangan terlalu singkat', 'Tuliskan minimal 5 karakter.')
    return
  }
  sendingResponse.value = true
  try {
    if (completionFile.value) {
      const formData = new FormData()
      formData.append('file', completionFile.value)
      await api(`/api/requests/${request.value.id}/attachments`, {
        method: 'POST',
        body: formData
      })
    }
    await api(`/api/requests/${request.value.id}/respond`, {
      method: 'POST',
      body: { message: responseMessage.value }
    })
    toast.success('Kelengkapan terkirim', 'Permohonan dikembalikan ke tahap verifikasi.')
    responseMessage.value = ''
    completionFile.value = null
    await load()
  } catch (error: any) {
    toast.error('Gagal mengirim', error?.data?.statusMessage || 'Coba lagi beberapa saat.')
  } finally {
    sendingResponse.value = false
  }
}

async function submitComment() {
  if (!request.value) return
  if (commentMessage.value.trim().length < 3) {
    toast.warning('Pesan terlalu singkat', 'Tuliskan minimal 3 karakter.')
    return
  }
  sendingComment.value = true
  try {
    await api(`/api/requests/${request.value.id}/comments`, {
      method: 'POST',
      body: { message: commentMessage.value }
    })
    commentMessage.value = ''
    toast.success('Pesan terkirim')
    await load()
  } catch (error: any) {
    toast.error('Gagal mengirim pesan', error?.data?.statusMessage || 'Coba lagi beberapa saat.')
  } finally {
    sendingComment.value = false
  }
}

useSeoMeta({ title: request.value ? `Permohonan ${request.value.ticketNumber}` : 'Detail Permohonan', robots: 'noindex, nofollow' })
</script>

<template>
  <div>
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-7 sm:py-9">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Permohonan Saya', to: '/permohonan-saya' }, { label: request?.ticketNumber || 'Detail' }]" />
        <div v-if="request" class="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">{{ request.serviceName }}</p>
            <h1 class="display-2 mt-2 tracking-wide">{{ request.ticketNumber }}</h1>
            <p class="mt-2 text-xs text-ink-muted">Diajukan {{ formatDateTime(request.createdAt) }} · Diperbarui {{ formatDateTime(request.updatedAt) }}</p>
          </div>
          <div class="flex flex-col items-start gap-3 sm:items-end">
            <StatusBadge :status="request.status" :substatus="request.substatus" size="md" />
            <NuxtLink to="/permohonan-saya" class="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-charcoal"><ArrowLeft :size="13" /> Semua permohonan</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div v-if="loading" class="space-y-4">
          <div class="skeleton h-36 rounded-2xl" />
          <div class="skeleton h-64 rounded-2xl" />
        </div>
        <div v-else-if="failure" class="mx-auto max-w-xl">
          <EmptyState title="Permohonan tidak dapat dibuka" :description="failure">
            <AppButton to="/permohonan-saya" variant="secondary">Kembali</AppButton>
          </EmptyState>
        </div>

        <div v-else-if="request" class="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div class="space-y-6">
            <div v-if="request.substatus" class="rounded-2xl border-2 border-gold/50 bg-gold/10 p-5">
              <div class="flex items-start gap-3">
                <Clock3 :size="20" class="mt-0.5 shrink-0 text-gold-dark" aria-hidden="true" />
                <div>
                  <h2 class="text-base font-semibold">Permohonan menunggu kelengkapan Anda</h2>
                  <p class="mt-2 text-sm leading-6 text-ink-muted">{{ request.requestedCompletionNote || 'Petugas meminta kelengkapan tambahan.' }}</p>
                  <form class="mt-4" @submit.prevent="submitCompletion">
                    <label for="completion-message" class="field-label">Keterangan kelengkapan</label>
                    <textarea id="completion-message" v-model="responseMessage" rows="4" class="field-input" placeholder="Tuliskan keterangan atau data tambahan yang diminta…" required :disabled="sendingResponse" />
                    <div class="mt-3">
                      <label class="field-label">Lampiran kelengkapan (opsional)</label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.zip"
                        class="block w-full rounded-xl border border-line-warm bg-white p-2.5 text-xs"
                        :disabled="sendingResponse"
                        @change="completionFile = ($event.target as HTMLInputElement).files?.[0] || null"
                      />
                      <p class="field-help">Maksimal 10 MB. Lampiran hanya dapat diakses oleh Anda dan petugas berwenang.</p>
                    </div>
                    <div class="mt-3 flex items-center justify-between gap-3">
                      <p class="text-[14px] text-ink-muted">Kirim keterangan setelah lampiran siap.</p>
                      <AppButton type="submit" :loading="sendingResponse">Kirim Kelengkapan</AppButton>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div v-if="request.status === 'Selesai'" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div class="flex items-start gap-3">
                <CheckCircle2 :size="20" class="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
                <div><h2 class="text-base font-semibold text-emerald-950">Permohonan selesai</h2><p class="mt-2 text-sm leading-6 text-emerald-900">{{ request.resolutionSummary }}</p></div>
              </div>
            </div>

            <div v-if="request.status === 'Ditolak'" class="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div class="flex items-start gap-3">
                <AlertCircle :size="20" class="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
                <div><h2 class="text-base font-semibold text-red-950">Permohonan ditolak</h2><p class="mt-2 text-sm leading-6 text-red-900">{{ request.rejectionReason }}</p></div>
              </div>
            </div>

            <div class="rounded-2xl border border-line-warm bg-white p-5 sm:p-6">
              <h2 class="text-base font-semibold">Data yang diajukan</h2>
              <dl class="mt-4 grid gap-2 sm:grid-cols-2">
                <div v-for="entry in entries" :key="entry.key" class="rounded-xl border border-line-warm bg-ivory px-3.5 py-3">
                  <dt class="text-[12px] font-bold uppercase tracking-wide text-ink-muted">{{ entry.label }}</dt>
                  <dd class="mt-1 whitespace-pre-line break-words text-sm">{{ entry.value || '—' }}</dd>
                </div>
              </dl>
            </div>

            <div class="rounded-2xl border border-line-warm bg-white p-5 sm:p-6">
              <h2 class="text-base font-semibold">Lampiran</h2>
              <div v-if="request.attachments.length" class="mt-4 space-y-2">
                <a
                  v-for="attachment in request.attachments"
                  :key="attachment.id"
                  :href="`/api/requests/attachments/${attachment.id}`"
                  class="flex items-center gap-3 rounded-xl border border-line-warm bg-ivory px-3.5 py-3 transition hover:border-charcoal/25"
                >
                  <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white"><FileText :size="16" class="text-gold-dark" aria-hidden="true" /></span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-xs font-semibold">{{ attachment.originalName }}</span>
                    <span class="mt-0.5 block text-[12px] text-ink-muted">{{ attachment.fieldKey === 'hasil_penyelesaian' ? 'Hasil dari petugas' : attachment.fieldKey === 'kelengkapan_pemohon' ? 'Kelengkapan dari pemohon' : 'Lampiran permohonan' }} · {{ formatFileSize(attachment.size) }}</span>
                  </span>
                  <Download :size="15" class="shrink-0 text-ink-muted" aria-hidden="true" />
                </a>
              </div>
              <p v-else class="mt-3 text-sm text-ink-muted">Tidak ada lampiran pada permohonan ini.</p>
            </div>

            <div class="rounded-2xl border border-line-warm bg-white p-5 sm:p-6">
              <h2 class="text-base font-semibold">Timeline status</h2>
              <ol class="mt-5 space-y-5">
                <li v-for="(entry, index) in request.timeline" :key="entry.id" class="relative flex gap-4">
                  <span v-if="index < request.timeline.length - 1" class="absolute left-[11px] top-6 h-[calc(100%-1rem)] w-px bg-line-warm" aria-hidden="true" />
                  <span class="relative z-10 mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-warm bg-white text-[12px] font-bold text-gold-dark">{{ index + 1 }}</span>
                  <div class="pb-1">
                    <p class="text-sm font-semibold">{{ entry.status }}<span v-if="entry.substatus" class="ml-2 text-xs font-normal text-ink-muted">{{ entry.substatus }}</span></p>
                    <p v-if="entry.note" class="mt-1 text-xs leading-5 text-ink-muted">{{ entry.note }}</p>
                    <p class="mt-1 text-[12px] text-ink-muted/70">{{ formatDateTime(entry.createdAt) }} · {{ entry.actorName }}</p>
                  </div>
                </li>
              </ol>
            </div>

            <div class="rounded-2xl border border-line-warm bg-white p-5 sm:p-6">
              <div class="flex items-center gap-2"><MessageSquare :size="17" class="text-gold-dark" aria-hidden="true" /><h2 class="text-base font-semibold">Komunikasi</h2></div>
              <div v-if="request.comments.length" class="mt-4 space-y-3">
                <div v-for="comment in request.comments" :key="comment.id" class="rounded-xl border border-line-warm bg-ivory p-3.5">
                  <p class="text-xs leading-6">{{ comment.message }}</p>
                  <p class="mt-2 text-[12px] text-ink-muted">{{ comment.authorName }} · {{ formatDateTime(comment.createdAt) }}</p>
                </div>
              </div>
              <p v-else class="mt-3 text-sm text-ink-muted">Belum ada komunikasi publik pada permohonan ini.</p>
              <form class="mt-5" @submit.prevent="submitComment">
                <label for="comment-message" class="field-label">Tambahkan pesan</label>
                <textarea id="comment-message" v-model="commentMessage" rows="3" class="field-input" placeholder="Tuliskan pertanyaan atau informasi tambahan…" required :disabled="sendingComment" />
                <div class="mt-3 flex justify-end">
                  <AppButton type="submit" :loading="sendingComment"><template #left><Send :size="14" /></template>Kirim Pesan</AppButton>
                </div>
              </form>
            </div>
          </div>

          <aside class="space-y-4 lg:sticky lg:top-36">
            <div class="rounded-2xl border border-line-warm bg-ivory p-5">
              <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-gold-dark">Ringkasan</p>
              <dl class="mt-4 space-y-3 text-sm">
                <div class="flex items-start justify-between gap-4 border-b border-line-warm pb-3"><dt class="text-ink-muted">Layanan</dt><dd class="text-right font-semibold">{{ request.serviceName }}</dd></div>
                <div class="flex items-start justify-between gap-4 border-b border-line-warm pb-3"><dt class="text-ink-muted">Petugas</dt><dd class="text-right font-semibold">{{ request.assignedToName || 'Belum ditugaskan' }}</dd></div>
                <div class="flex items-start justify-between gap-4"><dt class="text-ink-muted">Versi formulir</dt><dd class="text-right font-semibold">{{ request.formSnapshot.version }}</dd></div>
              </dl>
            </div>
            <div class="rounded-2xl border border-line-warm bg-white p-5">
              <div class="flex items-center gap-2 text-xs font-semibold"><ShieldCheck :size="15" class="text-gold-dark" aria-hidden="true" /> Catatan privat</div>
              <p class="mt-2 text-xs leading-5 text-ink-muted">Catatan internal petugas tidak ditampilkan di halaman ini. Hanya catatan yang ditujukan untuk pemohon yang terlihat.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  PlayCircle,
  Send,
  ShieldAlert,
  UploadCloud,
  UserRoundCheck,
  XCircle
} from 'lucide-vue-next'
import type { RequestDetailDTO, FormField } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const { formatDateTime, formatFileSize } = useFormat()

const request = ref<RequestDetailDTO | null>(null)
const requester = ref<{ id: string; name: string; email: string; active: boolean } | null>(null)
const assignees = ref<{ id: string; name: string; email: string; role: string }[]>([])
const loading = ref(true)
const failure = ref('')
const busy = ref(false)

const activeAction = ref<'verify' | 'start' | 'request_info' | 'complete' | 'reject' | null>(null)
const note = ref('')
const publicNote = ref('')
const reason = ref('')
const resolution = ref('')
const assignedTo = ref('')
const commentText = ref('')
const commentVisibility = ref<'internal' | 'public'>('internal')
const resultFile = ref<File | null>(null)

async function load() {
  loading.value = true
  failure.value = ''
  try {
    const data = await requestFetch<{
      request: RequestDetailDTO
      requester: typeof requester.value
      assignees: typeof assignees.value
    }>(`/api/admin/requests/${route.params.id}`)
    request.value = data.request
    requester.value = data.requester
    assignees.value = data.assignees
    assignedTo.value = data.assignees.find((a) => a.name === data.request.assignedToName)?.id || ''
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Permohonan tidak ditemukan.'
  } finally {
    loading.value = false
  }
}

await load()

if (!request.value && !loading.value) {
  throw createError({ statusCode: 404, statusMessage: failure.value || 'Permohonan tidak ditemukan.', fatal: true })
}

const isTerminal = computed(() => ['Selesai', 'Ditolak'].includes(request.value?.status || ''))
const canVerify = computed(() => request.value?.status === 'Diajukan' && !request.value?.substatus)
const canStart = computed(() => request.value?.status === 'Diverifikasi' && !request.value?.substatus)
const canComplete = computed(() => request.value?.status === 'Diproses' && !request.value?.substatus)
const canRequestInfo = computed(() => !isTerminal.value && !request.value?.substatus)
const canReject = computed(() => !isTerminal.value)
const entries = computed(() => {
  if (!request.value) return []
  return request.value.formSnapshot.fields
    .filter((field: FormField) => field.type !== 'file')
    .map((field: FormField) => ({
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

function openAction(action: typeof activeAction.value) {
  activeAction.value = action
  note.value = ''
  publicNote.value = ''
  reason.value = ''
  resolution.value = ''
}

async function runAction() {
  if (!request.value || !activeAction.value) return
  busy.value = true
  try {
    const action = activeAction.value
    const body: Record<string, unknown> = { action }
    if (action === 'complete') {
      body.resolutionSummary = resolution.value
      body.note = note.value
    } else if (action === 'reject') {
      body.reason = reason.value
      body.note = note.value
    } else {
      body.note = note.value
    }
    if (publicNote.value.trim()) body.publicNote = publicNote.value
    const result = await api<{ status: string; emailStatus: string; warning?: string }>(
      `/api/admin/requests/${request.value.id}`,
      { method: 'PATCH', body }
    )
    if (result.warning) toast.warning('Tersimpan dengan catatan', result.warning)
    else if (result.emailStatus === 'simulated') toast.success('Status diperbarui', 'Email notifikasi disimulasikan di outbox pengembangan.')
    else if (result.emailStatus === 'sent') toast.success('Status diperbarui', 'Email notifikasi telah dikirim.')
    else toast.success('Status diperbarui')
    activeAction.value = null
    await load()
  } catch (error: any) {
    toast.error('Aksi gagal', error?.data?.statusMessage || 'Periksa status terbaru permohonan.')
  } finally {
    busy.value = false
  }
}

async function assign() {
  if (!request.value) return
  busy.value = true
  try {
    await api(`/api/admin/requests/${request.value.id}`, {
      method: 'PATCH',
      body: { action: 'assign', assignedTo: assignedTo.value || null }
    })
    toast.success('Penugasan diperbarui')
    await load()
  } catch (error: any) {
    toast.error('Gagal menugaskan', error?.data?.statusMessage || 'Coba lagi.')
  } finally {
    busy.value = false
  }
}

async function addComment() {
  if (!request.value) return
  if (commentText.value.trim().length < 2) {
    toast.warning('Catatan terlalu singkat')
    return
  }
  busy.value = true
  try {
    await api(`/api/admin/requests/${request.value.id}`, {
      method: 'PATCH',
      body: { action: 'comment', note: commentText.value, visibility: commentVisibility.value }
    })
    commentText.value = ''
    toast.success(commentVisibility.value === 'internal' ? 'Catatan internal ditambahkan' : 'Catatan untuk pemohon ditambahkan')
    await load()
  } catch (error: any) {
    toast.error('Gagal menambahkan catatan', error?.data?.statusMessage || 'Coba lagi.')
  } finally {
    busy.value = false
  }
}

async function uploadResult() {
  if (!request.value || !resultFile.value) return
  busy.value = true
  try {
    const formData = new FormData()
    formData.append('file', resultFile.value)
    await api(`/api/admin/requests/${request.value.id}/attachments`, {
      method: 'POST',
      body: formData
    })
    resultFile.value = null
    toast.success('Lampiran hasil diunggah')
    await load()
  } catch (error: any) {
    toast.error('Unggah gagal', error?.data?.statusMessage || 'Periksa tipe dan ukuran file.')
  } finally {
    busy.value = false
  }
}

const actionTitle = computed(() => {
  const titles = {
    verify: 'Verifikasi permohonan',
    start: 'Mulai proses',
    request_info: 'Minta kelengkapan',
    complete: 'Selesaikan permohonan',
    reject: 'Tolak permohonan'
  }
  return activeAction.value ? titles[activeAction.value] : ''
})

useSeoMeta({ title: 'Detail Permohonan', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <NuxtLink to="/admin/permohonan" class="inline-flex items-center gap-1.5 text-xs font-semibold text-admin-muted hover:text-admin-text"><ArrowLeft :size="14" /> Semua permohonan</NuxtLink>
      <StatusBadge v-if="request" :status="request.status" :substatus="request.substatus" size="md" />
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="skeleton h-32 rounded-xl" />
      <div class="skeleton h-72 rounded-xl" />
    </div>
    <div v-else-if="failure" class="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">{{ failure }}</div>

    <template v-else-if="request">
      <div class="rounded-xl border border-admin-border bg-white p-5 sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-unu-green">{{ request.serviceName }}</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-wide">{{ request.ticketNumber }}</h2>
            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-admin-muted">
              <span>Diajukan {{ formatDateTime(request.createdAt) }}</span>
              <span>Diperbarui {{ formatDateTime(request.updatedAt) }}</span>
              <span>Form v{{ request.formSnapshot.version }}</span>
            </div>
            <div v-if="requester" class="mt-3 inline-flex items-center gap-2 rounded-lg border border-admin-border bg-slate-50 px-3 py-2 text-xs">
              <UserRoundCheck :size="14" class="text-unu-green" aria-hidden="true" />
              <span class="font-semibold">{{ requester.name }}</span>
              <span class="text-admin-muted">{{ requester.email }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton v-if="canVerify" size="sm" @click="openAction('verify')"><template #left><CheckCircle2 :size="14" /></template>Verifikasi</AppButton>
            <AppButton v-if="canStart" size="sm" @click="openAction('start')"><template #left><PlayCircle :size="14" /></template>Mulai Proses</AppButton>
            <AppButton v-if="canRequestInfo" size="sm" variant="secondary" @click="openAction('request_info')">Minta Kelengkapan</AppButton>
            <AppButton v-if="canComplete" size="sm" @click="openAction('complete')">Selesaikan</AppButton>
            <AppButton v-if="canReject" size="sm" variant="danger" @click="openAction('reject')">Tolak</AppButton>
          </div>
        </div>

        <div v-if="request.substatus" class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-admin-muted">
          <strong class="text-admin-text">Menunggu kelengkapan pemohon.</strong> {{ request.requestedCompletionNote }}
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-[1fr_350px] xl:items-start">
        <div class="space-y-5">
          <div class="rounded-xl border border-admin-border bg-white p-5">
            <h3 class="text-sm font-semibold">Data permohonan</h3>
            <dl class="mt-4 grid gap-2 sm:grid-cols-2">
              <div v-for="entry in entries" :key="entry.key" class="rounded-xl border border-admin-border bg-slate-50 px-3.5 py-3">
                <dt class="text-[12px] font-bold uppercase tracking-wide text-admin-muted">{{ entry.label }}</dt>
                <dd class="mt-1 whitespace-pre-line break-words text-sm">{{ entry.value || '—' }}</dd>
              </div>
            </dl>
          </div>

          <div class="rounded-xl border border-admin-border bg-white p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h3 class="text-sm font-semibold">Lampiran</h3>
              <div v-if="!isTerminal" class="flex flex-wrap items-center gap-2">
                <label class="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-admin-border bg-white px-3 text-xs font-semibold transition hover:border-slate-300">
                  <Paperclip :size="13" aria-hidden="true" /> Pilih hasil
                  <input type="file" class="sr-only" @change="resultFile = ($event.target as HTMLInputElement).files?.[0] || null" />
                </label>
                <AppButton v-if="resultFile" size="sm" :loading="busy" @click="uploadResult"><template #left><UploadCloud :size="13" /></template>Unggah</AppButton>
                <span v-if="resultFile" class="max-w-[160px] truncate text-[12px] text-admin-muted">{{ resultFile.name }}</span>
              </div>
            </div>
            <div v-if="request.attachments.length" class="mt-4 space-y-2">
              <a v-for="attachment in request.attachments" :key="attachment.id" :href="`/api/requests/attachments/${attachment.id}`" class="flex items-center gap-3 rounded-xl border border-admin-border bg-slate-50 px-3.5 py-3 transition hover:border-slate-300">
                <FileText :size="16" class="shrink-0 text-unu-green" aria-hidden="true" />
                <span class="min-w-0 flex-1"><span class="block truncate text-xs font-semibold">{{ attachment.originalName }}</span><span class="mt-0.5 block text-[12px] text-admin-muted">{{ attachment.fieldKey === 'hasil_penyelesaian' ? 'Hasil petugas' : 'Lampiran pemohon' }} · {{ formatFileSize(attachment.size) }}</span></span>
                <Download :size="14" class="text-admin-muted" aria-hidden="true" />
              </a>
            </div>
            <p v-else class="mt-3 text-sm text-admin-muted">Tidak ada lampiran.</p>
          </div>

          <div class="rounded-xl border border-admin-border bg-white p-5">
            <h3 class="text-sm font-semibold">Timeline</h3>
            <ol class="mt-4 space-y-4">
              <li v-for="(entry, index) in request.timeline" :key="entry.id" class="flex gap-3">
                <span class="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-admin-border text-[12px] font-bold text-unu-green">{{ index + 1 }}</span>
                <div><p class="text-xs font-semibold">{{ entry.status }}<span v-if="entry.substatus" class="font-normal text-admin-muted"> · {{ entry.substatus }}</span></p><p v-if="entry.note" class="mt-1 text-[14px] leading-5 text-admin-muted">{{ entry.note }}</p><p class="mt-1 text-[12px] text-admin-muted/70">{{ formatDateTime(entry.createdAt) }} · {{ entry.actorName }}</p></div>
              </li>
            </ol>
          </div>

          <div class="rounded-xl border border-admin-border bg-white p-5">
            <h3 class="flex items-center gap-2 text-sm font-semibold"><MessageSquare :size="15" class="text-unu-green" /> Catatan & komunikasi</h3>
            <div v-if="request.comments.length" class="mt-4 space-y-2.5">
              <div v-for="comment in request.comments" :key="comment.id" class="rounded-xl border p-3.5" :class="comment.visibility === 'internal' ? 'border-amber-200 bg-amber-50' : 'border-admin-border bg-slate-50'">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[12px] font-bold uppercase tracking-wide" :class="comment.visibility === 'internal' ? 'text-amber-800' : 'text-admin-muted'">{{ comment.visibility === 'internal' ? 'Internal' : 'Untuk pemohon' }}</span>
                  <span class="text-[12px] text-admin-muted">{{ formatDateTime(comment.createdAt) }}</span>
                </div>
                <p class="mt-2 whitespace-pre-line text-xs leading-6">{{ comment.message }}</p>
                <p class="mt-1 text-[12px] text-admin-muted">{{ comment.authorName }}</p>
              </div>
            </div>
            <p v-else class="mt-3 text-sm text-admin-muted">Belum ada catatan.</p>
            <form class="mt-4 space-y-2.5 border-t border-admin-border pt-4" @submit.prevent="addComment">
              <textarea v-model="commentText" rows="3" class="field-input" placeholder="Tulis catatan…" required :disabled="busy" />
              <div class="flex flex-wrap items-center justify-between gap-2">
                <select v-model="commentVisibility" class="field-input w-auto min-h-[44px] text-xs">
                  <option value="internal">Catatan internal</option>
                  <option value="public">Dapat dilihat pemohon</option>
                </select>
                <AppButton type="submit" size="sm" :loading="busy"><template #left><Send :size="13" /></template>Simpan Catatan</AppButton>
              </div>
            </form>
          </div>
        </div>

        <aside class="space-y-4 xl:sticky xl:top-24">
          <div class="rounded-xl border border-admin-border bg-white p-5">
            <h3 class="text-sm font-semibold">Penugasan</h3>
            <select v-model="assignedTo" class="field-input mt-3">
              <option value="">Belum ditugaskan</option>
              <option v-for="person in assignees" :key="person.id" :value="person.id">{{ person.name }} · {{ person.role }}</option>
            </select>
            <AppButton size="sm" class="mt-2" :loading="busy" @click="assign">Simpan Penugasan</AppButton>
          </div>

          <div class="rounded-xl border border-admin-border bg-slate-50 p-5">
            <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-unu-green">Keputusan</p>
            <div v-if="isTerminal" class="mt-3">
              <p class="text-sm font-semibold">Permohonan telah ditutup</p>
              <p class="mt-1 text-xs leading-5 text-admin-muted">{{ request.status === 'Selesai' ? request.resolutionSummary : request.rejectionReason }}</p>
            </div>
            <p v-else class="mt-2 text-xs leading-5 text-admin-muted">Status hanya dapat diubah mengikuti alur yang valid. Setiap perubahan dicatat di timeline dan audit log.</p>
          </div>

          <div class="rounded-xl border border-admin-border bg-white p-5">
            <div class="flex items-center gap-2"><ShieldAlert :size="15" class="text-unu-green" /><p class="text-xs font-semibold">Alur status</p></div>
            <ol class="mt-3 space-y-2 text-[14px] leading-5 text-admin-muted">
              <li><strong class="text-admin-text">Diajukan</strong> → verifikasi atau tolak</li>
              <li><strong class="text-admin-text">Diverifikasi</strong> → mulai proses</li>
              <li><strong class="text-admin-text">Diproses</strong> → minta kelengkapan, selesaikan, atau tolak</li>
            </ol>
          </div>
        </aside>
      </div>
    </template>

    <ModalDialog
      :model-value="Boolean(activeAction)"
      :title="actionTitle"
      description="Perubahan status dicatat pada timeline dan audit log."
      @update:model-value="activeAction = null"
    >
      <div class="space-y-4">
        <div v-if="activeAction === 'complete'">
          <label for="resolution" class="field-label">Ringkasan hasil <span class="text-red-700">*</span></label>
          <textarea id="resolution" v-model="resolution" rows="4" class="field-input" placeholder="Jelaskan hasil penyelesaian…" required />
          <p class="field-help">Wajib diisi minimal 10 karakter dan akan terlihat oleh pemohon.</p>
        </div>
        <div v-if="activeAction === 'reject'">
          <label for="reason" class="field-label">Alasan penolakan <span class="text-red-700">*</span></label>
          <textarea id="reason" v-model="reason" rows="4" class="field-input" placeholder="Jelaskan alasan penolakan…" required />
          <p class="field-help">Wajib diisi minimal 10 karakter dan akan terlihat oleh pemohon.</p>
        </div>
        <div>
          <label for="action-note" class="field-label">{{ activeAction === 'request_info' ? 'Rincian kelengkapan yang diminta' : 'Catatan status (opsional)' }}</label>
          <textarea id="action-note" v-model="note" rows="4" class="field-input" :required="activeAction === 'request_info'" :placeholder="activeAction === 'request_info' ? 'Jelaskan data atau dokumen yang perlu dilengkapi…' : 'Catatan untuk pemohon…'" />
        </div>
        <div>
          <label for="public-note" class="field-label">Catatan tambahan untuk pemohon (opsional)</label>
          <textarea id="public-note" v-model="publicNote" rows="2" class="field-input" placeholder="Pesan singkat yang ditampilkan di detail permohonan…" />
        </div>
        <div class="flex justify-end gap-2 border-t border-admin-border pt-4">
          <AppButton variant="secondary" @click="activeAction = null">Batal</AppButton>
          <AppButton :variant="activeAction === 'reject' ? 'danger' : 'primary'" :loading="busy" @click="runAction">
            <template #left><CheckCircle2 v-if="activeAction !== 'reject'" :size="14" /><XCircle v-else :size="14" /></template>
            Simpan Perubahan
          </AppButton>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

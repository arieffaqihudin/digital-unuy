<script setup lang="ts">
import { AlertCircle, ArrowRight, Clock3, FileText, LockKeyhole, Search, ShieldCheck } from 'lucide-vue-next'
import type { RequestDetailDTO } from '~/shared/types'

const route = useRoute()
const router = useRouter()
const ticket = ref(String(route.query.ticket || '').toUpperCase())
const token = ref(String(route.query.token || ''))
const loading = ref(false)
const errorMessage = ref('')
const request = ref<RequestDetailDTO | null>(null)
const api = useApi()
const { formatDateTime, formatDate, formatFileSize } = useFormat()

async function track() {
  errorMessage.value = ''
  request.value = null
  if (!ticket.value || !token.value) {
    errorMessage.value = 'Masukkan nomor tiket dan token akses dari email Anda.'
    return
  }
  loading.value = true
  try {
    const result = await api<{ request: RequestDetailDTO }>('/api/track', {
      method: 'POST',
      body: { ticket: ticket.value, token: token.value }
    })
    request.value = result.request
    if (import.meta.client) {
      router.replace({ query: { ticket: ticket.value } })
    }
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage || 'Permohonan tidak ditemukan. Periksa nomor tiket dan token akses.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (ticket.value && token.value) track()
})

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

useSeoMeta({ title: 'Lacak Permohonan', robots: 'noindex, nofollow' })
</script>

<template>
  <div>
    <PublicPageHeader
      eyebrow="Pelacakan Aman"
      title="Lacak Permohonan"
      description="Masukkan nomor tiket dan token akses yang dikirim ke email Anda. Token tidak dapat ditebak dan hanya berlaku untuk permohonan terkait."
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Lacak Permohonan' }]"
    >
      <template #aside>
        <div class="flex max-w-[250px] items-start gap-2.5 text-[14px] leading-5 text-slate-500">
          <ShieldCheck :size="15" class="mt-0.5 shrink-0 text-unu-green" aria-hidden="true" />
          <p>Nomor tiket saja tidak cukup untuk membuka data. Token melindungi informasi pribadi dan lampiran Anda.</p>
        </div>
      </template>
    </PublicPageHeader>

    <section class="section-space bg-soft-white">
      <div class="page-shell">
        <form class="mx-auto max-w-2xl rounded-xl border border-line-warm bg-white p-5 sm:p-6" @submit.prevent="track">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="track-ticket" class="field-label">Nomor tiket</label>
              <input id="track-ticket" v-model="ticket" class="field-input uppercase" placeholder="UNU-DTD-…" autocomplete="off" required />
            </div>
            <div>
              <label for="track-token" class="field-label">Token akses</label>
              <div class="relative">
                <LockKeyhole :size="15" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                <input id="track-token" v-model="token" type="password" class="field-input pl-9" placeholder="Token dari email" autocomplete="off" required />
              </div>
            </div>
          </div>
          <div v-if="errorMessage" class="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-5 text-red-900" role="alert">
            <AlertCircle :size="15" class="mt-0.5 shrink-0" aria-hidden="true" /><p>{{ errorMessage }}</p>
          </div>
          <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-[14px] text-ink-muted">Token dikirim ke email pemohon saat permohonan dibuat.</p>
            <AppButton type="submit" :loading="loading">Lacak <template #right><ArrowRight :size="15" /></template></AppButton>
          </div>
        </form>

        <div v-if="request" class="mx-auto mt-8 max-w-4xl space-y-5">
          <div class="rounded-2xl border border-line-warm bg-white p-5 sm:p-7">
            <div class="flex flex-col gap-4 border-b border-line-warm pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">{{ request.serviceName }}</p>
                <h2 class="mt-2 text-xl font-semibold">{{ request.ticketNumber }}</h2>
                <p class="mt-1 text-xs text-ink-muted">Diajukan {{ formatDateTime(request.createdAt) }}</p>
              </div>
              <StatusBadge :status="request.status" :substatus="request.substatus" size="md" />
            </div>

            <div v-if="request.substatus" class="mt-5 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm leading-6">
              <Clock3 :size="18" class="mt-0.5 shrink-0 text-gold-dark" aria-hidden="true" />
              <div>
                <p class="font-semibold">Tindakan diperlukan dari Anda</p>
                <p class="mt-1 text-xs leading-5 text-ink-muted">{{ request.requestedCompletionNote || 'Permohonan menunggu kelengkapan dari pemohon.' }}</p>
                <NuxtLink :to="`/masuk?redirect=${encodeURIComponent(`/permohonan-saya/${request.id}`)}`" class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark underline underline-offset-4">Masuk untuk melengkapi <ArrowRight :size="12" /></NuxtLink>
              </div>
            </div>

            <div v-if="request.status === 'Ditolak'" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
              <p class="font-semibold">Alasan penolakan</p>
              <p class="mt-1 text-xs">{{ request.rejectionReason }}</p>
            </div>
            <div v-if="request.status === 'Selesai'" class="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
              <p class="font-semibold">Ringkasan hasil</p>
              <p class="mt-1 text-xs">{{ request.resolutionSummary }}</p>
            </div>

            <div class="mt-6">
              <h3 class="text-sm font-semibold">Data yang diajukan</h3>
              <dl class="mt-3 grid gap-2 sm:grid-cols-2">
                <div v-for="entry in entries" :key="entry.key" class="rounded-xl border border-line-warm bg-ivory px-3.5 py-3">
                  <dt class="text-[12px] font-bold uppercase tracking-wide text-ink-muted">{{ entry.label }}</dt>
                  <dd class="mt-1 whitespace-pre-line break-words text-sm">{{ entry.value || '—' }}</dd>
                </div>
              </dl>
            </div>

            <div v-if="request.formSnapshot.fields.some((f) => f.type === 'file')" class="mt-6">
              <h3 class="text-sm font-semibold">Lampiran</h3>
              <div class="mt-3 space-y-2">
                <div v-for="field in request.formSnapshot.fields.filter((f) => f.type === 'file')" :key="field.key">
                  <div v-if="attachmentsFor(field.key).length">
                    <div v-for="attachment in attachmentsFor(field.key)" :key="attachment.id" class="flex items-center gap-3 rounded-lg border border-line-warm bg-ivory px-3 py-2.5">
                      <FileText :size="15" class="text-gold-dark" aria-hidden="true" />
                      <span class="min-w-0 flex-1 truncate text-xs font-medium">{{ attachment.originalName }}</span>
                      <span class="text-[12px] text-ink-muted">{{ formatFileSize(attachment.size) }}</span>
                    </div>
                  </div>
                  <p v-else class="text-xs text-ink-muted">{{ field.label }}: tidak ada lampiran.</p>
                </div>
              </div>
              <p class="mt-2 text-[14px] leading-5 text-ink-muted">Unduhan lampiran memerlukan masuk ke akun pemohon.</p>
            </div>
          </div>

          <div class="rounded-2xl border border-line-warm bg-white p-5 sm:p-7">
            <h3 class="text-base font-semibold">Riwayat status</h3>
            <ol class="mt-4 space-y-4">
              <li v-for="entry in request.timeline" :key="entry.id" class="flex gap-3">
                <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <div>
                  <p class="text-sm font-semibold">{{ entry.status }}<span v-if="entry.substatus" class="font-normal text-ink-muted"> · {{ entry.substatus }}</span></p>
                  <p v-if="entry.note" class="mt-1 text-xs leading-5 text-ink-muted">{{ entry.note }}</p>
                  <p class="mt-1 text-[12px] text-ink-muted/70">{{ formatDateTime(entry.createdAt) }} · {{ entry.actorName }}</p>
                </div>
              </li>
            </ol>
          </div>

          <div v-if="request.comments.length" class="rounded-2xl border border-line-warm bg-white p-5 sm:p-7">
            <h3 class="text-base font-semibold">Komunikasi</h3>
            <div class="mt-4 space-y-3">
              <div v-for="comment in request.comments" :key="comment.id" class="rounded-xl border border-line-warm bg-ivory p-3.5">
                <p class="text-xs leading-6">{{ comment.message }}</p>
                <p class="mt-2 text-[12px] text-ink-muted">{{ comment.authorName }} · {{ formatDateTime(comment.createdAt) }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 rounded-2xl border border-line-warm bg-ivory p-5 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-ink-muted">Ingin menambahkan keterangan atau mengunggah ulang lampiran?</p>
            <AppButton :to="`/masuk?redirect=${encodeURIComponent(`/permohonan-saya/${request.id}`)}`" size="sm">Masuk ke Permohonan Saya</AppButton>
          </div>
        </div>

        <div v-else-if="!loading" class="mx-auto mt-8 max-w-2xl">
          <div class="rounded-2xl border border-dashed border-line-warm bg-white/60 p-6 text-center">
            <span class="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-sage-soft"><Search :size="20" aria-hidden="true" /></span>
            <p class="mt-3 text-sm font-semibold">Hasil pelacakan akan tampil di sini</p>
            <p class="mt-1 text-xs text-ink-muted">Gunakan tautan dari email atau masukkan nomor tiket dan token secara manual.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

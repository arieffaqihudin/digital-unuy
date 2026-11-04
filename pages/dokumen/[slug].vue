<script setup lang="ts">
import { ArrowLeft, Download, ExternalLink, FileText, Info } from 'lucide-vue-next'
import type { DocumentDTO } from '~/shared/types'

interface DocumentResponse {
  document: DocumentDTO
}

const route = useRoute()
const { data } = await useAsyncData<DocumentResponse>(`document-${route.params.slug}`, () =>
  $fetch<DocumentResponse>(`/api/documents/${route.params.slug}`)
)
const doc = computed(() => data.value?.document)
if (!doc.value) throw createError({ statusCode: 404, statusMessage: 'Dokumen tidak ditemukan.', fatal: true })
const { formatDate, formatFileSize } = useFormat()
const canPreview = computed(() => doc.value?.fileName?.toLowerCase().endsWith('.pdf'))

useSeoMeta({
  title: doc.value?.title || 'Dokumen',
  description: doc.value?.description || `${doc.value?.category} dari Direktorat Tim Transformasi Digital UNU Yogyakarta.`,
  ogTitle: `${doc.value?.title} · UNU Yogyakarta`,
  ogDescription: doc.value?.description,
  ogType: 'article'
})
</script>

<template>
  <div v-if="doc">
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Panduan & Dokumen', to: '/dokumen' }, { label: doc.title }]" />
        <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_330px] lg:items-start">
          <div>
            <span class="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-dark">{{ doc.category }}</span>
            <h1 class="display-2 mt-5 max-w-3xl">{{ doc.title }}</h1>
            <p v-if="doc.description" class="body-lg mt-4 max-w-2xl">{{ doc.description }}</p>
            <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
              <span>Versi {{ doc.version }}</span>
              <span v-if="doc.effectiveDate">Berlaku {{ formatDate(doc.effectiveDate) }}</span>
              <span>Diperbarui {{ formatDate(doc.updatedAt) }}</span>
              <span v-if="doc.fileSize">{{ formatFileSize(doc.fileSize) }}</span>
            </div>
          </div>
          <aside class="rounded-2xl border border-line-warm bg-white p-5">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Unduhan resmi</p>
            <p class="mt-2 text-xs leading-5 text-ink-muted">Pastikan Anda menggunakan versi terbaru yang diterbitkan melalui portal ini.</p>
            <a
              :href="`/api/documents/${doc.slug}/download`"
              class="mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-4 text-sm font-semibold text-white transition hover:bg-gold hover:text-charcoal"
            >
              <Download :size="16" aria-hidden="true" /> Unduh dokumen
            </a>
            <a
              :href="`/api/documents/${doc.slug}/download?preview=1`"
              target="_blank"
              rel="noopener"
              class="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-line-warm bg-white px-4 text-sm font-semibold transition hover:border-charcoal/30"
            >
              <ExternalLink :size="15" aria-hidden="true" /> Buka di tab baru
            </a>
          </aside>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell grid gap-8 lg:grid-cols-[1fr_330px] lg:items-start">
        <div>
          <div v-if="canPreview" class="overflow-hidden rounded-2xl border border-line-warm bg-ivory">
            <div class="flex items-center justify-between border-b border-line-warm bg-white px-4 py-3">
              <div class="flex items-center gap-2 text-xs font-semibold"><FileText :size="15" class="text-gold-dark" aria-hidden="true" /> Pratinjau PDF</div>
              <span class="text-[10px] text-ink-muted">{{ doc.fileName }}</span>
            </div>
            <iframe
              :src="`/api/documents/${doc.slug}/download?preview=1#view=FitH`"
              :title="`Pratinjau ${doc.title}`"
              class="h-[70vh] min-h-[480px] w-full bg-ivory"
            />
          </div>
          <div v-else class="rounded-2xl border border-line-warm bg-ivory p-8 text-center">
            <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white"><FileText :size="22" class="text-gold-dark" aria-hidden="true" /></span>
            <p class="mt-4 text-sm font-semibold">Pratinjau langsung tidak tersedia untuk format ini.</p>
            <p class="mt-1 text-xs text-ink-muted">Unduh dokumen untuk membukanya dengan aplikasi yang sesuai.</p>
            <a :href="`/api/documents/${doc.slug}/download`" class="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-charcoal px-4 text-sm font-semibold text-white">
              <Download :size="15" aria-hidden="true" /> Unduh dokumen
            </a>
          </div>
        </div>

        <aside class="space-y-4">
          <div v-if="doc.services?.length" class="rounded-2xl border border-line-warm bg-white p-5">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Layanan terkait</p>
            <ul class="mt-3 space-y-2">
              <li v-for="service in doc.services" :key="service.id">
                <NuxtLink :to="`/layanan/${service.slug}`" class="flex items-center justify-between gap-3 rounded-lg border border-line-warm px-3 py-2.5 text-xs font-semibold transition hover:border-charcoal/30">
                  {{ service.name }} <ArrowLeft :size="12" class="rotate-180" aria-hidden="true" />
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="rounded-2xl border border-line-warm bg-ivory p-5">
            <div class="flex items-center gap-2 text-xs font-semibold"><Info :size="15" class="text-gold-dark" aria-hidden="true" /> Catatan akses</div>
            <p class="mt-2 text-xs leading-5 text-ink-muted">Dokumen ini dinyatakan publik. Jika dokumen ditarik dari publikasi, tautan unduhan akan berhenti berfungsi.</p>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

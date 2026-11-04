<script setup lang="ts">
import { ArrowRight, CheckCircle2, Clock3, FileText, Info, ListChecks, Users } from 'lucide-vue-next'
import type { DocumentDTO, FormField, ServiceDTO } from '~/shared/types'
import { serviceLd } from '~/shared/seo-schema'

interface ServiceResponse {
  service: ServiceDTO & { fields?: FormField[]; relatedDocuments?: DocumentDTO[] }
}

const route = useRoute()
const { data, error } = await useAsyncData<ServiceResponse>(`service-${route.params.slug}`, () =>
  $fetch<ServiceResponse>(`/api/services/${route.params.slug}`)
)

const service = computed(() => data.value?.service)
const { formatDate } = useFormat()
const { settings } = useSite()
const runtimeConfig = useRuntimeConfig()

if (!service.value) {
  throw createError({ statusCode: 404, statusMessage: 'Layanan tidak ditemukan.', fatal: true })
}

const canRequest = computed(() => Boolean(service.value?.active && service.value?.acceptsRequests))

const siteBase = String(runtimeConfig.public.siteUrl || '').replace(/\/+$/, '')
usePageSeo(() => {
  const name = service.value?.name || 'Detail Layanan'
  return {
    title: `${/^layanan\b/i.test(name) ? name : `Layanan ${name}`} | UNU Yogyakarta`,
    description: service.value?.shortDescription,
    seo: service.value?.seo,
    breadcrumbs: [
      { name: 'Beranda', to: '/' },
      { name: 'Layanan Digital', to: '/layanan' },
      { name, to: `/layanan/${service.value?.slug}` }
    ],
    jsonLd: [
      serviceLd(siteBase, {
        url: `${siteBase}/layanan/${service.value?.slug}`,
        name,
        description: service.value?.shortDescription || '',
        audience: service.value?.targetUsers,
        category: service.value?.category
      })
    ],
    modifiedTime: service.value?.updatedAt
  }
})
</script>

<template>
  <div v-if="service">
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10 lg:py-12">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Layanan Digital', to: '/layanan' }, { label: service.name }]" />
        <div class="mt-8 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-dark">{{ service.category }}</span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold uppercase tracking-wide"
                :class="service.active && service.acceptsRequests ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-line-warm bg-white text-ink-muted'"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ service.active ? (service.acceptsRequests ? 'Menerima permohonan' : 'Layanan informasi') : 'Layanan nonaktif' }}
              </span>
            </div>
            <h1 class="display-1 mt-5 max-w-3xl">{{ service.name }}</h1>
            <p class="body-lg mt-5 max-w-2xl">{{ service.description }}</p>

            <div v-if="!service.active" class="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <Info :size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
              <p>Layanan ini sedang tidak aktif. Pengajuan baru dinonaktifkan sampai layanan diaktifkan kembali oleh administrator.</p>
            </div>
            <div v-else-if="!service.acceptsRequests" class="mt-6 flex items-start gap-3 rounded-xl border border-line-warm bg-white p-4 text-sm leading-6 text-ink-muted">
              <Info :size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
              <p>Layanan ini saat ini hanya menyediakan informasi dan belum menerima permohonan daring.</p>
            </div>
          </div>

          <aside class="lg:sticky lg:top-36">
            <div class="rounded-2xl border border-line-warm bg-white p-5 shadow-card sm:p-6">
              <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-gold-dark">Ringkasan layanan</p>
              <dl class="mt-4 space-y-3 text-sm">
                <div class="flex items-start justify-between gap-4 border-b border-line-warm pb-3">
                  <dt class="text-ink-muted">Estimasi waktu</dt>
                  <dd class="text-right font-semibold">{{ service.estimatedDuration || 'Sesuai kajian' }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4 border-b border-line-warm pb-3">
                  <dt class="text-ink-muted">Versi formulir</dt>
                  <dd class="text-right font-semibold">{{ service.formVersion || 1 }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="text-ink-muted">Diperbarui</dt>
                  <dd class="text-right font-semibold">{{ formatDate(service.updatedAt) }}</dd>
                </div>
              </dl>
              <AppButton
                v-if="canRequest"
                :to="`/layanan/${service.slug}/ajukan`"
                size="lg"
                block
                class="mt-6"
              >
                Ajukan Layanan <template #right><ArrowRight :size="16" /></template>
              </AppButton>
              <button v-else disabled class="mt-6 inline-flex min-h-[50px] w-full cursor-not-allowed items-center justify-center rounded-xl border border-line-warm bg-ivory px-5 text-sm font-semibold text-ink-muted">
                Pengajuan tidak tersedia
              </button>
              <p class="mt-3 text-center text-[14px] leading-5 text-ink-muted">Tidak perlu membuat akun. Simpan ID permohonan setelah mengirim.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell grid gap-12 lg:grid-cols-[1fr_340px] lg:items-start">
        <div class="min-w-0 space-y-10">
          <section v-if="service.targetUsers?.length">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-lg bg-sage-soft"><Users :size="17" aria-hidden="true" /></span>
              <h2 class="text-xl font-semibold">Sasaran pengguna</h2>
            </div>
            <ul class="mt-4 grid gap-2 sm:grid-cols-2">
              <li v-for="item in service.targetUsers" :key="item" class="flex items-start gap-2.5 rounded-xl border border-line-warm bg-ivory px-4 py-3 text-sm leading-6">
                <CheckCircle2 :size="15" class="mt-0.5 shrink-0 text-gold-dark" aria-hidden="true" />{{ item }}
              </li>
            </ul>
          </section>

          <section v-if="service.requirements?.length">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-lg bg-sage-soft"><ListChecks :size="17" aria-hidden="true" /></span>
              <h2 class="text-xl font-semibold">Persyaratan</h2>
            </div>
            <ul class="mt-4 space-y-2.5">
              <li v-for="(item, index) in service.requirements" :key="item" class="flex gap-3 text-sm leading-7 text-ink-muted">
                <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <span><span class="mr-2 text-[12px] font-bold text-ink-muted/60">{{ String(index + 1).padStart(2, '0') }}</span>{{ item }}</span>
              </li>
            </ul>
          </section>

          <section v-if="service.requiredDocuments?.length">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-lg bg-sage-soft"><FileText :size="17" aria-hidden="true" /></span>
              <h2 class="text-xl font-semibold">Dokumen yang diperlukan</h2>
            </div>
            <div class="mt-4 grid gap-2">
              <div v-for="item in service.requiredDocuments" :key="item" class="flex items-center gap-3 rounded-xl border border-line-warm bg-ivory px-4 py-3 text-sm">
                <FileText :size="15" class="shrink-0 text-gold-dark" aria-hidden="true" />{{ item }}
              </div>
            </div>
          </section>

          <section v-if="service.procedure?.length">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-lg bg-sage-soft"><Clock3 :size="17" aria-hidden="true" /></span>
              <h2 class="text-xl font-semibold">Prosedur pengajuan</h2>
            </div>
            <ol class="mt-5 space-y-0">
              <li v-for="(item, index) in service.procedure" :key="item" class="relative flex gap-4 pb-6 last:pb-0">
                <span v-if="index < service.procedure.length - 1" class="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-line-warm" aria-hidden="true" />
                <span class="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-warm bg-white text-[12px] font-bold text-gold-dark">{{ index + 1 }}</span>
                <p class="pt-1 text-sm leading-7 text-ink-muted">{{ item }}</p>
              </li>
            </ol>
          </section>

          <section v-if="service.relatedDocuments?.length">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-xl font-semibold">SOP dan panduan terkait</h2>
              <NuxtLink to="/dokumen" class="inline-flex min-h-[44px] items-center text-xs font-semibold underline-offset-4 hover:text-unu-green hover:underline">Semua dokumen</NuxtLink>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <NuxtLink
                v-for="doc in service.relatedDocuments"
                :key="doc.id"
                :to="`/dokumen/${doc.slug}`"
                class="group rounded-xl border border-line-warm bg-white p-4 transition hover:border-charcoal/30"
              >
                <p class="text-[12px] font-bold uppercase tracking-wide text-gold-dark">{{ doc.category }}</p>
                <p class="mt-1.5 text-sm font-semibold leading-6 group-hover:text-unu-green">{{ doc.title }}</p>
                <p class="mt-2 text-[14px] text-ink-muted">Versi {{ doc.version }} · {{ formatDate(doc.updatedAt) }}</p>
              </NuxtLink>
            </div>
          </section>
        </div>

        <aside class="space-y-4 lg:sticky lg:top-36">
          <div class="rounded-2xl bg-charcoal p-5 text-white sm:p-6">
            <p class="eyebrow-light">Butuh bantuan?</p>
            <p class="mt-3 text-sm leading-7 text-white/65">Jika persyaratan atau alur layanan belum jelas, sampaikan pertanyaan melalui kontak resmi direktorat.</p>
            <p v-if="settings.contactEmail" class="mt-3 break-all text-xs text-sage">{{ settings.contactEmail }}</p>
            <AppButton to="/dokumen" variant="light" size="sm" class="mt-5">Baca panduan</AppButton>
          </div>
          <div class="rounded-2xl border border-line-warm bg-white p-5">
            <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-gold-dark">Status pengajuan</p>
            <p class="mt-3 text-sm leading-7 text-ink-muted">Status pengajuan tidak otomatis berarti usulan disetujui. Administrator akan melakukan kajian dan menyampaikan tindak lanjut melalui portal.</p>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

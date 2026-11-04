<script setup lang="ts">
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  Layers3,
  MoveRight,
  Sparkles
} from 'lucide-vue-next'
import type {
  ArticleDTO,
  DigitalPlatformDTO,
  DocumentDTO,
  ProgramDTO,
  ServiceDTO,
  MetricDTO,
  SiteSettingsDTO
} from '~/shared/types'

interface HomeResponse {
  settings: SiteSettingsDTO
  services: ServiceDTO[]
  platforms: DigitalPlatformDTO[]
  programs: ProgramDTO[]
  documents: DocumentDTO[]
  articles: ArticleDTO[]
  metrics: MetricDTO[]
  counts: { services: number; platforms: number }
}

const { data, pending, error } = await useAsyncData<HomeResponse>('home', () => $fetch('/api/home'))
const home = computed(() => data.value)
const { formatDate } = useFormat()

const heroTitle = computed(
  () => home.value?.settings.hero.title || 'Mendorong Transformasi Digital UNU Yogyakarta'
)
const heroDescription = computed(
  () =>
    home.value?.settings.hero.description ||
    'Mengembangkan ekosistem digital yang terintegrasi, memperkuat tata kelola teknologi informasi, dan menghadirkan layanan digital yang mendukung pendidikan, penelitian, pengabdian, serta pengelolaan universitas.'
)

const programStatusClass = (status: string) => {
  if (status === 'Selesai') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'Berjalan') return 'border-sky-200 bg-sky-50 text-sky-800'
  return 'border-amber-200 bg-amber-50 text-amber-900'
}

useSeoMeta({
  title: 'Portal Transformasi Digital UNU Yogyakarta',
  description:
    'Satu pintu layanan digital, informasi ekosistem teknologi, panduan, dan publikasi Direktorat Tim Transformasi Digital Universitas Nahdlatul Ulama Yogyakarta.',
  ogTitle: 'Portal Transformasi Digital UNU Yogyakarta',
  ogDescription:
    'Layanan digital, ekosistem teknologi, dokumentasi, dan publikasi Direktorat Tim Transformasi Digital UNU Yogyakarta.',
  ogType: 'website'
})

const runtimeConfig = useRuntimeConfig()
useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: home.value?.settings.universityName || 'Universitas Nahdlatul Ulama Yogyakarta',
        department: {
          '@type': 'Organization',
          name: home.value?.settings.directorateName || 'Direktorat Tim Transformasi Digital'
        },
        url: runtimeConfig.public.siteUrl
      })
    }
  ]
}))
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-line-warm bg-ivory">
      <div class="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-sage/25 blur-3xl" aria-hidden="true" />
      <div class="page-shell relative grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:py-24">
        <div class="animate-fade-up">
          <p class="eyebrow">
            <span class="h-px w-6 bg-current" aria-hidden="true" />
            {{ home?.settings.hero.eyebrow || 'Transformasi Digital' }}
          </p>
          <h1 class="display-1 mt-5 max-w-3xl">
            {{ heroTitle }}
          </h1>
          <p class="body-lg mt-6 max-w-2xl">{{ heroDescription }}</p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <AppButton :to="home?.settings.hero.primaryUrl || '/layanan'" size="lg">
              {{ home?.settings.hero.primaryLabel || 'Jelajahi Layanan Digital' }}
              <template #right><ArrowRight :size="16" aria-hidden="true" /></template>
            </AppButton>
            <AppButton :to="home?.settings.hero.secondaryUrl || '/tentang'" variant="secondary" size="lg">
              {{ home?.settings.hero.secondaryLabel || 'Mengenal Direktorat' }}
            </AppButton>
          </div>

          <div class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line-warm pt-6">
            <div v-if="home?.counts.services">
              <p class="text-2xl font-semibold tracking-tight">{{ home.counts.services }}</p>
              <p class="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Layanan terdaftar</p>
            </div>
            <div v-if="home?.counts.services && home?.counts.platforms" class="h-9 w-px bg-line-warm" aria-hidden="true" />
            <div v-if="home?.counts.platforms">
              <p class="text-2xl font-semibold tracking-tight">{{ home.counts.platforms }}</p>
              <p class="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">Platform tercatat</p>
            </div>
            <NuxtLink to="/lacak" class="ml-auto inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold underline-offset-4 hover:text-gold-dark hover:underline">
              Punya nomor tiket? <span class="text-gold-dark">Lacak di sini</span>
              <ArrowUpRight :size="13" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>

        <div class="relative mx-auto w-full max-w-[540px] animate-fade-up lg:mx-0">
          <div class="absolute -left-3 -top-3 h-24 w-24 rounded-2xl border border-gold/30 sm:-left-5 sm:-top-5" aria-hidden="true" />
          <div class="relative overflow-hidden rounded-[28px] bg-charcoal p-5 text-white shadow-soft sm:p-7">
            <div class="absolute inset-0 public-grid-pattern opacity-50" aria-hidden="true" />
            <div class="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-sage/20" aria-hidden="true" />
            <div class="relative">
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-sage">
                  <Sparkles :size="12" aria-hidden="true" /> Digital Service Portal
                </span>
                <span class="flex h-2 w-2 rounded-full bg-sage" aria-hidden="true" />
              </div>
              <p class="mt-9 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Satu pintu layanan TI</p>
              <h2 class="mt-3 max-w-sm text-2xl font-semibold leading-snug text-white sm:text-3xl">
                Dari permohonan hingga penyelesaian, terpantau dalam satu alur.
              </h2>

              <div class="mt-8 space-y-2.5">
                <div
                  v-for="(service, index) in home?.services.slice(0, 3)"
                  :key="service.id"
                  class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3 transition hover:border-white/20 hover:bg-white/[0.09]"
                >
                  <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-sm font-bold text-sage">0{{ index + 1 }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-semibold text-white">{{ service.name }}</p>
                    <p class="mt-0.5 truncate text-[10px] text-white/40">{{ service.category }}</p>
                  </div>
                  <ArrowUpRight :size="14" class="shrink-0 text-white/30" aria-hidden="true" />
                </div>
              </div>

              <div class="mt-6 flex items-center justify-between rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
                <span class="text-[11px] font-medium text-gold-soft">Ajukan layanan secara daring</span>
                <NuxtLink to="/layanan" class="inline-flex min-h-[44px] items-center gap-1.5 text-[11px] font-bold text-white underline-offset-4 hover:underline">
                  Mulai <MoveRight :size="13" aria-hidden="true" />
                </NuxtLink>
              </div>
            </div>
          </div>
          <div class="absolute -bottom-5 -right-2 hidden rounded-xl border border-line-warm bg-white px-4 py-3 shadow-soft sm:block" aria-hidden="true">
            <p class="text-[9px] font-bold uppercase tracking-[0.18em] text-gold-dark">Status layanan</p>
            <p class="mt-1 flex items-center gap-1.5 text-xs font-semibold"><span class="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Terpantau & tercatat</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space border-b border-line-warm bg-white">
      <div class="page-shell">
        <SectionHeading
          eyebrow="Satu Pintu"
          title="Layanan Digital"
          description="Satu pintu untuk berbagai kebutuhan teknologi informasi di lingkungan UNU Yogyakarta."
        >
          <template #action>
            <AppButton to="/layanan" variant="secondary">Lihat Semua Layanan <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </SectionHeading>

        <div v-if="pending" class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton v-for="index in 6" :key="index" />
        </div>
        <EmptyState
          v-else-if="error"
          class="mt-10"
          title="Layanan belum dapat dimuat"
          description="Silakan muat ulang halaman beberapa saat lagi."
        />
        <div v-else-if="home?.services.length" class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard v-for="service in home.services" :key="service.id" :service="service" />
        </div>
        <EmptyState
          v-else
          class="mt-10"
          title="Belum ada layanan yang dipublikasikan"
          description="Administrator dapat menambahkan layanan melalui dashboard."
        />
      </div>
    </section>

    <section class="section-space overflow-hidden bg-charcoal text-white">
      <div class="page-shell grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <p class="eyebrow-light"><span class="h-px w-6 bg-current" aria-hidden="true" />Tentang Direktorat</p>
          <h2 class="display-2 mt-4 max-w-xl text-white">Transformasi digital untuk universitas yang lebih baik</h2>
          <p class="mt-6 max-w-xl text-base leading-8 text-white/60">
            Direktorat Tim Transformasi Digital berperan mendorong tata kelola teknologi informasi yang tertib, integrasi sistem dan data, digitalisasi proses bisnis, pengembangan sistem informasi, serta pendampingan transformasi digital di seluruh unit kerja.
          </p>
          <p class="mt-4 max-w-xl text-base leading-8 text-white/60">
            Pendekatan dilakukan secara bertahap: memahami kebutuhan, menyiapkan fondasi, membangun solusi, lalu memastikan layanan dapat digunakan secara berkelanjutan.
          </p>
          <div class="mt-8">
            <AppButton to="/tentang" variant="light">Tentang Kami <template #right><ArrowRight :size="15" /></template></AppButton>
          </div>
        </div>
        <div class="relative">
          <div class="absolute -right-4 -top-4 h-28 w-28 rounded-full border border-sage/20" aria-hidden="true" />
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="(item, index) in [
                'Tata kelola teknologi informasi',
                'Digitalisasi proses bisnis',
                'Integrasi sistem dan data',
                'Pengembangan sistem informasi',
                'Infrastruktur dan layanan digital',
                'Pendampingan transformasi'
              ]"
              :key="item"
              class="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-gold/40 hover:bg-white/[0.07]"
            >
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-sage">0{{ index + 1 }}</span>
              <p class="mt-4 text-sm font-semibold leading-6 text-white/85">{{ item }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-ivory">
      <div class="page-shell">
        <SectionHeading
          eyebrow="Ekosistem Digital"
          title="Ekosistem Digital UNU"
          description="Platform digital yang tercatat resmi di lingkungan universitas, lengkap dengan status implementasi dan unit pengelola."
        >
          <template #action>
            <AppButton to="/ekosistem-digital" variant="secondary">Jelajahi Ekosistem <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </SectionHeading>
        <div v-if="home?.platforms.length" class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PlatformCard v-for="platform in home.platforms" :key="platform.id" :platform="platform" />
        </div>
        <EmptyState v-else class="mt-10" title="Ekosistem digital belum dicatat" description="Data platform akan tampil setelah ditambahkan melalui CMS." />
      </div>
    </section>

    <section class="section-space border-y border-line-warm bg-white">
      <div class="page-shell">
        <SectionHeading
          eyebrow="Program & Inisiatif"
          title="Kerja transformasi yang terarah"
          description="Inisiatif yang menghubungkan kebutuhan unit kerja dengan fondasi teknologi universitas."
        />
        <div v-if="home?.programs.length" class="mt-10 divide-y divide-line-warm border-y border-line-warm">
          <article
            v-for="(program, index) in home.programs"
            :key="program.id"
            class="group grid gap-4 py-6 sm:grid-cols-[48px_1fr_auto] sm:items-start sm:gap-6"
          >
            <span class="text-[11px] font-bold text-gold-dark">0{{ index + 1 }}</span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">{{ program.category }}</span>
                <span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold" :class="programStatusClass(program.status)">
                  <span class="h-1 w-1 rounded-full bg-current" aria-hidden="true" />{{ program.status }}
                </span>
              </div>
              <h3 class="mt-2 text-lg font-semibold leading-snug transition group-hover:text-gold-dark">{{ program.title }}</h3>
              <p class="mt-1.5 max-w-2xl text-sm leading-6 text-ink-muted">{{ program.summary }}</p>
            </div>
            <CircleDot :size="18" class="mt-1 hidden text-gold sm:block" :stroke-width="1.5" aria-hidden="true" />
          </article>
        </div>
        <EmptyState v-else class="mt-10" title="Program belum dipublikasikan" description="Program dan inisiatif dapat dikelola melalui dashboard admin." />
      </div>
    </section>

    <section class="section-space bg-ivory">
      <div class="page-shell">
        <SectionHeading
          eyebrow="Dokumentasi & Panduan"
          title="Rujukan layanan yang jelas"
          description="SOP, panduan, kebijakan, dan formulir yang membantu sivitas memahami alur layanan."
        >
          <template #action>
            <AppButton to="/dokumen" variant="secondary">Lihat Semua Dokumen <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </SectionHeading>
        <div v-if="home?.documents.length" class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DocumentCard v-for="document in home.documents" :key="document.id" :document="document" />
        </div>
        <EmptyState v-else class="mt-10" title="Belum ada dokumen publik" description="Dokumen yang telah diterbitkan akan tampil di sini." />
      </div>
    </section>

    <section class="section-space border-y border-line-warm bg-white">
      <div class="page-shell">
        <div class="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Capaian Transformasi</p>
            <h2 class="display-2 mt-4">Capaian yang dapat dipertanggungjawabkan</h2>
            <p class="body-lg mt-5">
              Statistik operasional hanya ditampilkan setelah terverifikasi. Bila angka belum tersedia, capaian disampaikan melalui narasi dan milestone agar tidak menyesatkan.
            </p>
            <div class="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-warm bg-ivory px-3.5 py-2 text-[11px] font-medium text-ink-muted">
              <Layers3 :size="14" class="text-gold-dark" aria-hidden="true" />
              Metrik dikelola melalui CMS
            </div>
          </div>

          <div v-if="home?.metrics.length" class="grid gap-3 sm:grid-cols-2">
            <div v-for="metric in home.metrics" :key="metric.label" class="rounded-2xl border border-line-warm bg-ivory p-5">
              <p class="text-3xl font-semibold tracking-tight">{{ metric.value }}<span v-if="metric.unit" class="ml-1 text-base font-medium text-ink-muted">{{ metric.unit }}</span></p>
              <p class="mt-2 text-xs font-semibold">{{ metric.label }}</p>
              <p v-if="metric.description" class="mt-1 text-[11px] leading-5 text-ink-muted">{{ metric.description }}</p>
              <p class="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                <Check :size="10" aria-hidden="true" /> Terverifikasi
              </p>
            </div>
          </div>
          <div v-else class="rounded-2xl border border-line-warm bg-ivory p-6 sm:p-8">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Fokus capaian</p>
            <div class="mt-4 space-y-4">
              <div v-for="(program, index) in home?.programs.slice(0, 3)" :key="program.id" class="flex gap-4">
                <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-warm bg-white text-[10px] font-bold text-gold-dark">{{ index + 1 }}</span>
                <div>
                  <p class="text-sm font-semibold">{{ program.title }}</p>
                  <p class="mt-1 text-xs leading-5 text-ink-muted">{{ program.summary }}</p>
                </div>
              </div>
              <p v-if="!home?.programs.length" class="text-sm leading-7 text-ink-muted">
                Capaian akan dicatat setelah tersedia data operasional yang terverifikasi.
              </p>
            </div>
            <p class="mt-6 border-t border-line-warm pt-4 text-[11px] leading-5 text-ink-muted">
              Belum ada metrik terverifikasi yang dipublikasikan. Angka tidak ditampilkan untuk menghindari klaim yang tidak berdasar.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-ivory">
      <div class="page-shell">
        <SectionHeading
          eyebrow="Publikasi"
          title="Catatan dari transformasi digital"
          description="Kabar, pembelajaran, dan pembaruan dari Direktorat Tim Transformasi Digital."
        >
          <template #action>
            <AppButton to="/publikasi" variant="secondary">Semua Publikasi <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </SectionHeading>
        <div v-if="home?.articles.length" class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="article in home.articles" :key="article.id" :article="article" />
        </div>
        <EmptyState v-else class="mt-10" title="Belum ada publikasi" description="Publikasi yang diterbitkan akan tampil di sini." />
      </div>
    </section>

    <section class="bg-white pb-16 pt-4 sm:pb-20">
      <div class="page-shell">
        <div class="relative overflow-hidden rounded-[28px] bg-charcoal px-6 py-10 text-white sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div class="absolute inset-0 public-grid-pattern opacity-40" aria-hidden="true" />
          <div class="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-sage/20" aria-hidden="true" />
          <div class="relative max-w-2xl">
            <p class="eyebrow-light"><span class="h-px w-6 bg-current" aria-hidden="true" />Mulai dari sini</p>
            <h2 class="display-3 mt-4 text-white">Butuh layanan digital untuk unit atau kegiatan Anda?</h2>
            <p class="mt-4 text-sm leading-7 text-white/60">Pilih layanan, lengkapi formulir, dan pantau prosesnya. Setiap permohonan memiliki nomor tiket dan riwayat status yang tercatat.</p>
          </div>
          <div class="relative mt-7 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <AppButton to="/layanan" variant="light" size="lg">Ajukan Layanan</AppButton>
            <AppButton to="/dokumen" variant="ghost" size="lg" class="border-white/20 text-white hover:bg-white/10">Baca Panduan</AppButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

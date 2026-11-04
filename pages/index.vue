<script setup lang="ts">
import { ArrowRight, ArrowUpRight, Check, MoveUpRight } from 'lucide-vue-next'
import type {
  ArticleDTO,
  DigitalPlatformDTO,
  DocumentDTO,
  MetricDTO,
  ProgramDTO,
  ServiceDTO,
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
const featuredPlatform = computed(() => home.value?.platforms?.[0] || null)
const remainingPlatforms = computed(() => home.value?.platforms?.slice(1, 6) || [])
const featuredArticle = computed(() => home.value?.articles?.[0] || null)
const secondaryArticles = computed(() => home.value?.articles?.slice(1, 3) || [])
const { formatDate } = useFormat()

const description = computed(
  () =>
    home.value?.settings.hero.description ||
    'Menghadirkan layanan dan ekosistem digital yang terintegrasi untuk mendukung tata kelola, pembelajaran, dan pengembangan universitas.'
)
const headline = computed(
  () => home.value?.settings.hero.title || 'Mendorong Transformasi Digital UNU Yogyakarta'
)

const platformStatusClass = (status: string) => {
  if (status === 'Aktif') return 'border-white/15 bg-white/10 text-white'
  if (status === 'Pilot') return 'border-sky-200 bg-sky-50 text-sky-800'
  if (status === 'Tidak Aktif') return 'border-slate-200 bg-slate-50 text-slate-500'
  return 'border-amber-200 bg-amber-50 text-amber-900'
}

const programStatusClass = (status: string) => {
  if (status === 'Selesai') return 'text-unu-green'
  if (status === 'Berjalan') return 'text-gold-dark'
  return 'text-slate-400'
}

useSeoMeta({
  title: 'Portal Transformasi Digital UNU Yogyakarta',
  description:
    'Layanan digital, ekosistem teknologi, dokumentasi, dan publikasi Direktorat Tim Transformasi Digital Universitas Nahdlatul Ulama Yogyakarta.',
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
    <!-- Hero: editorial split, no oversized dark block -->
    <section class="relative overflow-hidden border-b border-line-warm bg-ivory">
      <div class="page-shell relative py-10 sm:py-12 lg:py-16">
        <div class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div class="animate-fade-up">
            <p class="eyebrow"><span class="h-px w-7 bg-current" aria-hidden="true" />Direktorat Tim Transformasi Digital</p>
            <h1 class="display-1 mt-5 max-w-[620px] text-editorial">{{ headline }}</h1>
            <p class="mt-5 max-w-[560px] text-[15px] leading-7 text-slate-600 sm:text-[16.5px] sm:leading-8">{{ description }}</p>

            <div class="mt-7 flex flex-col gap-3 sm:flex-row">
              <AppButton :to="home?.settings.hero.primaryUrl || '/layanan'" size="lg">
                {{ home?.settings.hero.primaryLabel || 'Jelajahi Layanan' }}
                <template #right><ArrowRight :size="16" aria-hidden="true" /></template>
              </AppButton>
              <AppButton :to="home?.settings.hero.secondaryUrl || '/tentang'" variant="secondary" size="lg">
                {{ home?.settings.hero.secondaryLabel || 'Tentang Direktorat' }}
              </AppButton>
            </div>

            <dl class="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line-warm pt-5">
              <div class="flex items-baseline gap-2">
                <dt class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">Layanan</dt>
                <dd class="text-lg font-semibold tabular-nums">{{ home?.counts.services || '—' }}</dd>
              </div>
              <div class="h-5 w-px bg-line-warm" aria-hidden="true" />
              <div class="flex items-baseline gap-2">
                <dt class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">Platform tercatat</dt>
                <dd class="text-lg font-semibold tabular-nums">{{ home?.counts.platforms || '—' }}</dd>
              </div>
              <NuxtLink to="/lacak" class="ml-auto inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-slate-600 underline-offset-4 hover:text-unu-green hover:underline">
                Lacak permohonan <ArrowUpRight :size="13" aria-hidden="true" />
              </NuxtLink>
            </dl>
          </div>

          <div class="mx-auto w-full max-w-[480px] animate-fade-up lg:mr-0">
            <CampusDigitalVisual
              :service-count="home?.counts.services || 0"
              :platform-count="home?.counts.platforms || 0"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Layanan: compact index cards -->
    <section class="section-space bg-soft-white">
      <div class="page-shell">
        <SectionHeading
          eyebrow="Satu Pintu"
          title="Layanan Digital"
          description="Temukan layanan teknologi informasi untuk mendukung kebutuhan akademik dan operasional universitas."
        >
          <template #action>
            <AppButton to="/layanan" variant="secondary">Lihat Semua Layanan <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </SectionHeading>

        <div v-if="pending" class="mt-9 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="index in 6" :key="index" class="skeleton h-56 rounded-xl" />
        </div>
        <EmptyState v-else-if="error" class="mt-9" title="Layanan belum dapat dimuat" description="Silakan muat ulang halaman beberapa saat lagi." />
        <div v-else-if="home?.services.length" class="mt-9 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard v-for="(service, index) in home.services" :key="service.id" :service="service" :index="index + 1" />
        </div>
        <EmptyState v-else class="mt-9" title="Belum ada layanan" description="Administrator dapat menambahkan layanan melalui dashboard." />
      </div>
    </section>

    <!-- Tentang: editorial dark section, not a card grid -->
    <section class="relative overflow-hidden bg-[#1F2A23] text-white">
      <div class="absolute inset-0 opacity-[0.05]" aria-hidden="true">
        <div class="h-full w-full public-grid-pattern" />
      </div>
      <div class="page-shell relative grid gap-12 py-16 md:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:py-24">
        <div>
          <p class="eyebrow-light"><span class="h-px w-7 bg-current" aria-hidden="true" />Tentang Direktorat</p>
          <h2 class="display-2 mt-5 max-w-md text-white">Transformasi digital untuk universitas yang lebih baik.</h2>
          <p class="mt-5 max-w-md text-[14.5px] leading-7 text-white/60">
            Kami menghubungkan kebutuhan layanan, tata kelola, dan teknologi agar pekerjaan universitas berjalan lebih tertib dan mudah diakses.
          </p>
          <AppButton to="/tentang" variant="light" class="mt-7">Mengenal Direktorat <template #right><ArrowRight :size="15" /></template></AppButton>
        </div>

        <div class="lg:pt-2">
          <p class="max-w-xl text-[17px] leading-8 text-white/80">
            Direktorat bekerja di ruang antara kebutuhan sivitas akademika dan kemampuan teknologi: memahami proses, menyiapkan fondasi, lalu memastikan layanan dapat digunakan secara berkelanjutan.
          </p>
          <div class="mt-9 border-t border-white/10">
            <div
              v-for="(item, index) in [
                'Tata kelola teknologi informasi',
                'Digitalisasi proses bisnis universitas',
                'Integrasi sistem dan data',
                'Pengembangan sistem informasi',
                'Infrastruktur dan layanan digital',
                'Pendampingan transformasi unit kerja'
              ]"
              :key="item"
              class="flex items-baseline gap-5 border-b border-white/10 py-4"
            >
              <span class="text-[12px] font-semibold tabular-nums text-sage/70">{{ String(index + 1).padStart(2, '0') }}</span>
              <p class="text-[14px] font-medium text-white/80">{{ item }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ekosistem: product showcase, visually distinct from service catalog -->
    <section class="section-space bg-ivory">
      <div class="page-shell">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div class="max-w-2xl">
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Ekosistem Digital</p>
            <h2 class="display-2 mt-3">Platform yang menyusun layanan kampus</h2>
            <p class="body-copy mt-3">Bukan formulir permohonan, melainkan sistem dan platform yang tersedia atau sedang dikembangkan di lingkungan universitas.</p>
          </div>
          <NuxtLink to="/ekosistem-digital" class="link-arrow">Lihat direktori <ArrowUpRight :size="14" aria-hidden="true" /></NuxtLink>
        </div>

        <div v-if="featuredPlatform" class="mt-9 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <article class="relative overflow-hidden rounded-2xl bg-[#244B36] p-7 text-white sm:p-9">
            <div class="absolute inset-0 public-grid-pattern opacity-30" aria-hidden="true" />
            <div class="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
            <div class="relative flex h-full flex-col">
              <div class="flex items-center justify-between gap-3">
                <span class="text-[12px] font-bold uppercase tracking-[0.18em] text-sage">Platform unggulan</span>
                <span class="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-white/80">{{ featuredPlatform.status }}</span>
              </div>
              <div class="mt-14 flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-white/45">
                <span>{{ featuredPlatform.category }}</span>
                <span class="h-1 w-1 rounded-full bg-white/30" aria-hidden="true" />
                <span>{{ featuredPlatform.updatedAt ? formatDate(featuredPlatform.updatedAt) : '' }}</span>
              </div>
              <h3 class="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[38px]">{{ featuredPlatform.name }}</h3>
              <p class="mt-4 max-w-lg text-[14px] leading-7 text-white/65">{{ featuredPlatform.description }}</p>
              <div class="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
                <div class="text-[14px] leading-5 text-white/50">
                  <p>{{ featuredPlatform.unit || 'Unit pengelola belum dicatat' }}</p>
                  <p class="mt-0.5">{{ featuredPlatform.audience }}</p>
                </div>
                <a v-if="featuredPlatform.url" :href="featuredPlatform.url" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-[44px] items-center gap-1.5 text-[12px] font-semibold text-white underline-offset-4 hover:underline">
                  Kunjungi platform <ArrowUpRight :size="13" aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>

          <div class="rounded-2xl border border-line-warm bg-white px-5 sm:px-6">
            <div class="flex items-center justify-between border-b border-line-warm py-4">
              <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-500">Platform lainnya</p>
              <span class="text-[12px] tabular-nums text-slate-400">{{ String(remainingPlatforms.length).padStart(2, '0') }}</span>
            </div>
            <div v-if="remainingPlatforms.length">
              <article v-for="(platform, index) in remainingPlatforms" :key="platform.id" class="group flex items-start gap-4 border-b border-line-warm py-4 last:border-b-0">
                <span class="mt-1 text-[12px] font-semibold tabular-nums text-slate-300">{{ String(index + 2).padStart(2, '0') }}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-[14px] font-semibold">{{ platform.name }}</h3>
                    <span class="rounded-full border px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide" :class="platformStatusClass(platform.status)">{{ platform.status }}</span>
                  </div>
                  <p class="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-500">{{ platform.description }}</p>
                </div>
                <a v-if="platform.url" :href="platform.url" target="_blank" rel="noopener noreferrer" class="mt-1 text-slate-400 transition group-hover:text-unu-green" :aria-label="`Buka ${platform.name}`">
                  <ArrowUpRight :size="14" aria-hidden="true" />
                </a>
              </article>
            </div>
            <p v-else class="py-10 text-center text-sm text-slate-500">Belum ada platform lain yang dicatat.</p>
            <NuxtLink to="/ekosistem-digital" class="inline-flex min-h-[48px] w-full items-center justify-between border-t border-line-warm text-[14px] font-semibold text-slate-500 transition hover:text-unu-green">
              Buka seluruh direktori <ArrowRight :size="14" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
        <EmptyState v-else class="mt-9" title="Ekosistem digital belum dicatat" description="Data platform akan tampil setelah ditambahkan melalui CMS." />
      </div>
    </section>

    <!-- Program: editorial list with a strong left rail -->
    <section id="program" class="section-space scroll-mt-24 bg-white">
      <div class="page-shell grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
        <div class="lg:sticky lg:top-28 lg:self-start">
          <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Program & Inisiatif</p>
          <h2 class="display-2 mt-3 max-w-sm">Kerja transformasi yang terarah.</h2>
          <p class="body-copy mt-3 max-w-sm">Inisiatif yang menghubungkan kebutuhan unit kerja dengan fondasi teknologi universitas.</p>
          <div class="mt-6 flex items-center gap-2 text-[12px] text-slate-500">
            <span class="h-1.5 w-1.5 rounded-full bg-unu-green" aria-hidden="true" />
            {{ home?.programs.length || 0 }} inisiatif ditampilkan
          </div>
        </div>

        <div v-if="home?.programs.length" class="border-t border-line-warm">
          <NuxtLink
            v-for="(program, index) in home.programs"
            :key="program.id"
            :to="`/program/${program.slug}`"
            class="group grid gap-3 border-b border-line-warm py-6 sm:grid-cols-[42px_1fr_auto] sm:items-start sm:gap-6"
          >
            <span class="text-[12px] font-semibold tabular-nums text-slate-300">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <div class="flex flex-wrap items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]">
                <span class="text-slate-400">{{ program.category }}</span>
                <span class="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                <span :class="programStatusClass(program.status)">{{ program.status }}</span>
              </div>
              <h3 class="mt-2 text-[19px] font-semibold leading-snug tracking-[-0.02em] transition group-hover:text-unu-green">{{ program.title }}</h3>
              <p class="mt-1.5 max-w-2xl text-[14px] leading-6 text-slate-600">{{ program.summary }}</p>
            </div>
            <MoveUpRight :size="16" class="mt-1 hidden text-slate-300 transition group-hover:text-unu-green sm:block" aria-hidden="true" />
          </NuxtLink>
        </div>
        <EmptyState v-else title="Program belum dipublikasikan" description="Program dan inisiatif dapat dikelola melalui dashboard admin." />
      </div>
    </section>

    <!-- Dokumentasi: knowledge center rows -->
    <section class="section-space bg-soft-white">
      <div class="page-shell grid gap-10 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16">
        <div class="lg:sticky lg:top-28 lg:self-start">
          <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Dokumentasi</p>
          <h2 class="display-2 mt-3 max-w-xs">Rujukan yang jelas.</h2>
          <p class="body-copy mt-3 max-w-xs">SOP, panduan, dan kebijakan untuk memahami alur layanan sebelum mengajukan.</p>
          <AppButton to="/dokumen" variant="secondary" class="mt-6">Buka Dokumentasi</AppButton>
        </div>
        <div class="rounded-xl border border-line-warm bg-white px-5 sm:px-6">
          <div class="flex items-center justify-between border-b border-line-warm py-4">
            <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-500">Dokumen terbaru</p>
            <NuxtLink to="/dokumen" class="text-[12px] font-semibold text-unu-green underline-offset-4 hover:underline">Lihat semua</NuxtLink>
          </div>
          <div v-if="home?.documents.length">
            <DocumentCard v-for="document in home.documents" :key="document.id" :document="document" />
          </div>
          <EmptyState v-else class="m-4" title="Belum ada dokumen publik" description="Dokumen yang diterbitkan akan tampil di sini." compact />
        </div>
      </div>
    </section>

    <!-- Metrics only when verified data exists -->
    <section v-if="home?.metrics.length" class="border-y border-line-warm bg-white">
      <div class="page-shell py-12 sm:py-14">
        <div class="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
          <div>
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Capaian Transformasi</p>
            <h2 class="display-3 mt-3">Ukuran yang dapat dipertanggungjawabkan.</h2>
            <p class="mt-2 text-[12px] leading-6 text-slate-500">Hanya metrik terverifikasi yang ditampilkan.</p>
          </div>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="metric in home.metrics.slice(0, 4)" :key="metric.label" class="border-t-2 border-unu-green pt-4">
              <p class="text-3xl font-semibold tracking-[-0.03em]">{{ metric.value }}<span v-if="metric.unit" class="ml-1 text-sm font-medium text-slate-500">{{ metric.unit }}</span></p>
              <p class="mt-2 text-[14px] font-semibold leading-5">{{ metric.label }}</p>
              <p class="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide text-unu-green"><Check :size="10" /> Terverifikasi</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Publikasi: featured editorial layout -->
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

        <div v-if="featuredArticle" class="mt-9 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <ArticleCard :article="featuredArticle" variant="featured" />
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <ArticleCard v-for="article in secondaryArticles" :key="article.id" :article="article" variant="compact" />
            <div v-if="!secondaryArticles.length" class="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-line-warm text-sm text-slate-500">
              Publikasi lain akan tampil di sini.
            </div>
          </div>
        </div>
        <EmptyState v-else class="mt-9" title="Belum ada publikasi" description="Publikasi yang diterbitkan akan tampil di sini." />
      </div>
    </section>

    <!-- Closing CTA -->
    <section class="bg-[#244B36]">
      <div class="page-shell relative overflow-hidden py-14 sm:py-16">
        <div class="absolute inset-0 public-grid-pattern opacity-25" aria-hidden="true" />
        <div class="absolute -right-24 -top-32 h-72 w-72 rounded-full border border-white/10" aria-hidden="true" />
        <div class="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="eyebrow-light"><span class="h-px w-6 bg-current" aria-hidden="true" />Mulai dari sini</p>
            <h2 class="display-2 mt-4 text-white">Ada kebutuhan digital untuk unit atau kegiatan Anda?</h2>
            <p class="mt-3 max-w-xl text-[14px] leading-7 text-white/60">Pilih layanan, lengkapi formulir, dan pantau setiap tahap melalui nomor tiket yang tercatat.</p>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <AppButton to="/layanan" variant="light" size="lg">Ajukan Layanan</AppButton>
            <AppButton to="/dokumen" variant="ghost" size="lg" class="border-white/20 text-white hover:bg-white/10">Baca Panduan</AppButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

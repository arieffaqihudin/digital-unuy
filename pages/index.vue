<script setup lang="ts">
import { ArrowRight, ArrowUpRight, MoveUpRight } from 'lucide-vue-next'
import type {
  ArticleDTO,
  DigitalPlatformDTO,
  DocumentDTO,
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
  counts: { services: number; platforms: number }
}

const { data, pending, error } = await useAsyncData<HomeResponse>('home', () => $fetch('/api/home'))
const home = computed(() => data.value)
const featuredPlatform = computed(() => home.value?.platforms?.[0] || null)
const remainingPlatforms = computed(() => home.value?.platforms?.slice(1, 6) || [])
const featuredArticle = computed(() => home.value?.articles?.[0] || null)
const secondaryArticles = computed(() => home.value?.articles?.slice(1, 3) || [])
const { formatDate } = useFormat()


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
    <HomeHero />
    <HomeImpactPreview />
    <HomeApproach />

    <!-- Ekosistem: product showcase, visually distinct from service catalog -->
    <section class="section-space bg-ivory">
      <div class="page-shell">
        <HomeSectionHead
          eyebrow="Ekosistem Digital"
          title="Platform yang menyusun layanan kampus."
          description="Sistem dan platform yang tersedia atau sedang dikembangkan di lingkungan universitas."
        >
          <template #action>
            <NuxtLink to="/ekosistem-digital" class="link-arrow">Lihat direktori <ArrowUpRight :size="14" aria-hidden="true" /></NuxtLink>
          </template>
        </HomeSectionHead>
        <div v-if="featuredPlatform" class="mt-10 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
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
        <EmptyState v-else class="mt-10" title="Ekosistem digital belum dicatat" description="Data platform akan tampil setelah ditambahkan melalui CMS." />
      </div>
    </section>

    <!-- Layanan: compact index cards -->
    <section class="section-space bg-white" aria-labelledby="services-title">
      <div class="page-shell">
        <HomeSectionHead
          eyebrow="Layanan Digital"
          title="Satu pintu untuk kebutuhan layanan digital."
          description="Temukan layanan teknologi informasi untuk mendukung kebutuhan akademik dan operasional universitas."
        >
          <template #action>
            <AppButton to="/layanan" variant="secondary">Lihat Semua Layanan <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </HomeSectionHead>

        <div v-if="pending" class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="index in 6" :key="index" class="skeleton h-56 rounded-xl" />
        </div>
        <EmptyState v-else-if="error" class="mt-10" title="Layanan belum dapat dimuat" description="Silakan muat ulang halaman beberapa saat lagi." />
        <div v-else-if="home?.services.length" class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard v-for="(service, index) in home.services" :key="service.id" :service="service" :index="index + 1" />
        </div>
        <EmptyState v-else class="mt-10" title="Belum ada layanan" description="Administrator dapat menambahkan layanan melalui dashboard." />
      </div>
    </section>

    <HomeCaseStudy />

    <!-- Program: editorial list with a strong left rail -->
    <section id="program" class="section-space scroll-mt-24 bg-ivory">
      <div class="page-shell grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
        <div class="lg:sticky lg:top-28 lg:self-start">
          <p class="eyebrow-editorial">Program & Inisiatif</p>
          <h2 class="section-title mt-4 max-w-sm">Kerja transformasi yang terarah.</h2>
          <p class="mt-4 max-w-sm text-[16px] leading-[1.7] text-slate-600">Inisiatif yang menghubungkan kebutuhan unit kerja dengan fondasi teknologi universitas.</p>
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

    <HomeTeam />

    <!-- Dokumentasi: knowledge center rows -->
    <section class="section-space bg-soft-white">
      <div class="page-shell grid gap-10 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16">
        <div class="lg:sticky lg:top-28 lg:self-start">
          <p class="eyebrow-editorial">Dokumentasi & Panduan</p>
          <h2 class="section-title mt-4 max-w-xs">Rujukan yang jelas.</h2>
          <p class="mt-4 max-w-xs text-[16px] leading-[1.7] text-slate-600">SOP, panduan, dan kebijakan untuk memahami alur layanan sebelum mengajukan.</p>
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

    <!-- Publikasi: featured editorial layout -->
    <section class="section-space bg-ivory">
      <div class="page-shell">
        <HomeSectionHead
          eyebrow="Publikasi"
          title="Catatan dari transformasi digital."
          description="Kabar, pembelajaran, dan pembaruan dari Direktorat Tim Transformasi Digital."
        >
          <template #action>
            <AppButton to="/publikasi" variant="secondary">Semua Publikasi <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </HomeSectionHead>

        <div v-if="featuredArticle" class="mt-10 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <ArticleCard :article="featuredArticle" variant="featured" />
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <ArticleCard v-for="article in secondaryArticles" :key="article.id" :article="article" variant="compact" />
            <div v-if="!secondaryArticles.length" class="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-line-warm text-sm text-slate-500">
              Publikasi lain akan tampil di sini.
            </div>
          </div>
        </div>
        <EmptyState v-else class="mt-10" title="Belum ada publikasi" description="Publikasi yang diterbitkan akan tampil di sini." />
      </div>
    </section>

  </div>
</template>

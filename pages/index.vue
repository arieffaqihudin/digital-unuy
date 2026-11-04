<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { organizationLd, websiteLd } from '~/shared/seo-schema'
import type {
  ArticleDTO,
  DigitalPlatformDTO,
  DocumentDTO,
  PlatformCategoryDTO,
  ServiceDTO,
  SiteSettingsDTO
} from '~/shared/types'

interface HomeResponse {
  settings: SiteSettingsDTO
  services: ServiceDTO[]
  platforms: DigitalPlatformDTO[]
  platformCategories: PlatformCategoryDTO[]
  documents: DocumentDTO[]
  articles: ArticleDTO[]
  counts: { services: number; platforms: number }
}

const { data, pending, error } = await useAsyncData<HomeResponse>('home', () => $fetch('/api/home'))
const home = computed(() => data.value)
const { formatDate } = useFormat()




const runtimeConfig = useRuntimeConfig()
const { settings } = useSite()
usePageSeo(() => ({
  title: 'Transformasi Digital UNU Yogyakarta | Ekosistem & Layanan Digital',
  description:
    'Jelajahi ekosistem digital UNU Yogyakarta, mulai dari layanan akademik, Green Team, OBA, hingga layanan teknologi informasi universitas.',
  jsonLd: [
    organizationLd(runtimeConfig.public.siteUrl.replace(/\/+$/, ''), home.value?.settings || settings.value),
    websiteLd(runtimeConfig.public.siteUrl.replace(/\/+$/, ''))
  ]
}))
</script>

<template>
  <div>
    <HomeHero />
    <HomeApproach />
    <HomeEcosystem :platforms="home?.platforms || []" :categories="home?.platformCategories || []" />
    <HomeImpact />
    <HomeRecognition />

    <section class="section-space bg-white" aria-labelledby="services-title">
      <div class="page-shell">
        <HomeSectionHead eyebrow="Layanan Digital" title="Satu pintu untuk kebutuhan layanan digital." title-id="services-title">
          <template #action>
            <AppButton to="/layanan" variant="secondary">Lihat Semua Layanan <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </HomeSectionHead>

        <div v-if="pending" class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="index in 6" :key="index" class="skeleton h-[112px] rounded-xl" />
        </div>
        <EmptyState v-else-if="error" class="mt-10" title="Layanan belum dapat dimuat" description="Silakan muat ulang halaman beberapa saat lagi." />
        <div v-else-if="home?.services.length" class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="(service, index) in home.services" :key="service.id" v-reveal="index * 60">
            <HomeServiceTile :service="service" />
          </div>
        </div>
        <EmptyState v-else class="mt-10" title="Belum ada layanan" description="Administrator dapat menambahkan layanan melalui dashboard." />
      </div>
    </section>

    <HomeProcess />

    <HomeTeam />

    <section class="section-space bg-soft-white" aria-labelledby="knowledge-title">
      <div class="page-shell">
        <div v-reveal class="max-w-2xl">
          <p class="eyebrow-editorial">Sumber Daya</p>
          <h2 id="knowledge-title" class="section-title mt-4">Wawasan &amp; Sumber Daya</h2>
          <p class="mt-4 max-w-xl text-[16px] leading-[1.65] text-slate-600">
            Panduan dan publikasi untuk memahami arah, praktik, serta perkembangan transformasi digital kampus.
          </p>
        </div>

        <div class="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div v-reveal>
            <div class="flex flex-wrap items-end justify-between gap-4 border-b border-line-warm pb-4">
              <div>
                <p class="eyebrow-editorial">Panduan & Dokumen</p>
                <h3 id="docs-title" class="mt-2 text-[22px] font-semibold leading-[1.25] tracking-[-0.025em]">Rujukan yang jelas.</h3>
              </div>
              <NuxtLink to="/dokumen" class="link-arrow shrink-0">Lihat Semua Panduan <ArrowRight :size="14" aria-hidden="true" /></NuxtLink>
            </div>
            <div v-if="home?.documents.length">
              <NuxtLink
                v-for="document in home.documents"
                :key="document.id"
                :to="`/dokumen/${document.slug}`"
                class="group flex items-center gap-4 border-b border-line-warm py-4"
              >
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center gap-2 text-[12px] leading-5 text-slate-500">
                    <span class="font-semibold uppercase tracking-[0.12em] text-gold-dark">{{ document.category }}</span>
                    <span class="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                    <span>{{ formatDate(document.updatedAt) }}</span>
                  </span>
                  <span class="mt-1.5 block text-[16px] font-semibold leading-snug tracking-[-0.015em] transition-colors duration-micro group-hover:text-unu-green">{{ document.title }}</span>
                </span>
                <ArrowRight :size="15" class="shrink-0 text-slate-400 transition duration-hover ease-unu group-hover:translate-x-1 group-hover:text-unu-green" aria-hidden="true" />
              </NuxtLink>
            </div>
            <EmptyState v-else title="Belum ada dokumen publik" description="Dokumen yang diterbitkan akan tampil di sini." compact />
          </div>

          <div v-reveal="80">
            <div class="flex flex-wrap items-end justify-between gap-4 border-b border-line-warm pb-4">
              <div>
                <p class="eyebrow-editorial">Publikasi</p>
                <h3 id="publications-title" class="mt-2 text-[22px] font-semibold leading-[1.25] tracking-[-0.025em]">Catatan dari transformasi digital.</h3>
              </div>
              <NuxtLink to="/publikasi" class="link-arrow shrink-0">Lihat Semua Publikasi <ArrowRight :size="14" aria-hidden="true" /></NuxtLink>
            </div>
            <div v-if="home?.articles.length">
              <NuxtLink
                v-for="article in home.articles.slice(0, 3)"
                :key="article.id"
                :to="`/publikasi/${article.slug}`"
                class="group flex items-center gap-4 border-b border-line-warm py-4"
              >
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center gap-2 text-[12px] leading-5 text-slate-500">
                    <span class="font-semibold uppercase tracking-[0.12em] text-gold-dark">{{ article.category }}</span>
                    <span class="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                    <span>{{ formatDate(article.publishedAt) }}</span>
                  </span>
                  <span class="mt-1.5 block text-[16px] font-semibold leading-snug tracking-[-0.015em] transition-colors duration-micro group-hover:text-unu-green">{{ article.title }}</span>
                </span>
                <ArrowRight :size="15" class="shrink-0 text-slate-400 transition duration-hover ease-unu group-hover:translate-x-1 group-hover:text-unu-green" aria-hidden="true" />
              </NuxtLink>
            </div>
            <EmptyState v-else title="Belum ada publikasi" description="Publikasi yang diterbitkan akan tampil di sini." compact />
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

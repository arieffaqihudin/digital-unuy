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
const featuredArticle = computed(() => home.value?.articles?.[0] || null)
const secondaryArticles = computed(() => home.value?.articles?.slice(1, 3) || [])
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
    <HomeImpact />
    <HomeApproach />
    <HomeEcosystem :platforms="home?.platforms || []" :categories="home?.platformCategories || []" />

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

    <section class="section-space bg-soft-white" aria-labelledby="docs-title">
      <div class="page-shell grid gap-10 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16">
        <div v-reveal class="lg:sticky lg:top-28 lg:self-start">
          <p class="eyebrow-editorial">Dokumentasi & Panduan</p>
          <h2 id="docs-title" class="section-title mt-4 max-w-xs">Rujukan yang jelas.</h2>
          <AppButton to="/dokumen" variant="secondary" class="mt-6">Buka Dokumentasi</AppButton>
        </div>
        <div v-if="home?.documents.length" class="border-t border-line-warm">
          <div v-for="(document, index) in home.documents" :key="document.id" v-reveal="index * 60">
            <NuxtLink
              :to="`/dokumen/${document.slug}`"
              class="group flex items-center gap-4 border-b border-line-warm py-5"
            >
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center gap-2 text-[12px] leading-5 text-slate-600">
                  <span class="font-semibold uppercase tracking-[0.12em] text-gold-dark">{{ document.category }}</span>
                  <span class="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                  <span>{{ formatDate(document.updatedAt) }}</span>
                </span>
                <span class="mt-1.5 block text-[17px] font-semibold leading-snug tracking-[-0.015em] transition-colors duration-micro group-hover:text-unu-green">{{ document.title }}</span>
              </span>
              <span class="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-slate-600 transition-colors duration-micro group-hover:text-unu-green">
                Baca <ArrowRight :size="14" class="transition-transform duration-hover ease-unu group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </NuxtLink>
          </div>
        </div>
        <EmptyState v-else title="Belum ada dokumen publik" description="Dokumen yang diterbitkan akan tampil di sini." compact />
      </div>
    </section>

    <section class="section-space bg-ivory" aria-labelledby="publications-title">
      <div class="page-shell">
        <HomeSectionHead eyebrow="Publikasi" title="Catatan dari transformasi digital." title-id="publications-title">
          <template #action>
            <AppButton to="/publikasi" variant="secondary">Semua Publikasi <template #right><ArrowRight :size="14" /></template></AppButton>
          </template>
        </HomeSectionHead>

        <div v-if="featuredArticle" class="mt-10 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div v-reveal>
            <ArticleCard :article="featuredArticle" variant="featured" hide-excerpt />
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div v-for="(article, index) in secondaryArticles" :key="article.id" v-reveal="(index + 1) * 90">
              <ArticleCard :article="article" variant="compact" hide-excerpt />
            </div>
          </div>
        </div>
        <EmptyState v-else class="mt-10" title="Belum ada publikasi" description="Publikasi yang diterbitkan akan tampil di sini." />
      </div>
    </section>
  </div>
</template>

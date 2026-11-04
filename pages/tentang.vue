<script setup lang="ts">
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-vue-next'
import type { DigitalPlatformDTO, PlatformCategoryDTO, TeamMemberDTO } from '~/shared/types'

interface PageResponse {
  page: {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    seoTitle: string
    seoDescription: string
    updatedAt: string
  }
}

interface TeamResponse {
  groups: { id: string; name: string; order: number; members: TeamMemberDTO[] }[]
  ungrouped: TeamMemberDTO[]
  total: number
}

interface PlatformResponse {
  items: DigitalPlatformDTO[]
  total: number
  categories: PlatformCategoryDTO[]
  audiences: { name: string; count: number }[]
}

const { data } = await useAsyncData('about-content', async () => {
  const safe = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn()
    } catch {
      return null
    }
  }
  const [pageResponse, teamResponse, platformResponse] = await Promise.all([
    safe(() => $fetch<PageResponse>('/api/pages/tentang-kami')),
    safe(() => $fetch<TeamResponse>('/api/team')),
    safe(() => $fetch<PlatformResponse>('/api/platforms', { query: { pageSize: 48 } }))
  ])
  return {
    page: pageResponse?.page || null,
    team: teamResponse,
    platforms: platformResponse
  }
})

const { settings } = useSite()
const { formatDate, formatNumber } = useFormat()

const page = computed(() => data.value?.page || null)
const categories = computed(() => data.value?.platforms?.categories || [])
const aboutMetrics = [
  { value: 88, suffix: '%', label: 'Portofolio perkuliahan otomatis', period: 'Semester Genap 2025/2026' },
  { value: 652, label: 'Ijazah diterbitkan', period: 'Data 2025' },
  { value: 2141, label: 'Dokumen digital dikelola', period: 'Data 2026' }
]

const featuredMembers = computed(() => {
  const picks: TeamMemberDTO[] = []
  for (const group of data.value?.team?.groups || []) {
    const member = group.members[0]
    if (member) picks.push(member)
    if (picks.length === 4) break
  }
  if (!picks.length) picks.push(...(data.value?.team?.ungrouped || []).slice(0, 4))
  return picks.slice(0, 4)
})

const showcaseOrder = [
  'sistem-informasi-oba',
  'portal-pegawai-green-team',
  'sistem-ijazah-generator',
  'sistem-tata-kelola-skpi',
  'sistem-informasi-tata-kelola-labsos',
  'website-builder'
]
const showcaseProducts = computed(() => {
  const items = data.value?.platforms?.items || []
  const bySlug = new Map(items.map((item) => [item.slug, item]))
  const ordered = showcaseOrder.map((slug) => bySlug.get(slug)).filter(Boolean) as DigitalPlatformDTO[]
  for (const item of items) {
    if (ordered.length >= 6) break
    if (!ordered.some((candidate) => candidate.id === item.id)) ordered.push(item)
  }
  return ordered.slice(0, 6)
})
const activeProductIndex = ref(0)
const activeProduct = computed(() => showcaseProducts.value[activeProductIndex.value] || showcaseProducts.value[0] || null)
const statusClasses: Record<string, string> = {
  'Sudah Rilis': 'border-unu-green/20 bg-unu-green-soft text-unu-green-dark',
  'Pilot / Beta': 'border-sky-200 bg-sky-50 text-sky-800',
  'Dalam Pengembangan': 'border-amber-200 bg-amber-50 text-amber-900'
}

function selectProduct(index: number) {
  activeProductIndex.value = index
}

useSeoMeta({
  title: page.value?.seoTitle || 'Tentang Direktorat',
  description:
    page.value?.seoDescription ||
    page.value?.excerpt ||
    'Peran Direktorat Tim Transformasi Digital Universitas Nahdlatul Ulama Yogyakarta dalam tata kelola TI, integrasi data, dan layanan digital.',
  ogTitle: page.value?.seoTitle || 'Tentang Direktorat Tim Transformasi Digital',
  ogDescription: page.value?.seoDescription || page.value?.excerpt || 'Mengenal peran dan fokus kerja transformasi digital UNU Yogyakarta.',
  ogType: 'article'
})
</script>

<template>
  <div>
    <!-- 01 — Purpose -->
    <section class="overflow-hidden bg-ivory" aria-labelledby="about-title">
      <div class="page-shell pb-14 pt-8 sm:pb-20 sm:pt-10 lg:pb-24 lg:pt-12">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Tentang Kami' }]" />

        <div class="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:items-end lg:gap-16">
          <div v-reveal>
            <p class="eyebrow-editorial">Tentang Direktorat</p>
            <h1 id="about-title" class="mt-5 max-w-[800px] text-[2.25rem] font-bold leading-[1.08] tracking-[-0.04em] text-charcoal sm:text-[3.25rem] lg:text-[3.75rem]">
              Teknologi Bukan Tujuan.
              <span class="text-gold-text">Perubahanlah Tujuannya.</span>
            </h1>
          </div>
          <div v-reveal="100" class="max-w-sm lg:justify-self-end lg:pb-2">
            <p class="text-[16px] leading-[1.65] text-slate-600 sm:text-[17px]">
              Transformasi digital dimulai dari memahami kebutuhan kampus, bukan sekadar membangun aplikasi.
            </p>
            <p class="mt-5 text-[11px] font-semibold uppercase leading-5 tracking-[0.14em] text-slate-400">
              {{ settings.directorateName }} · {{ settings.universityName }}
            </p>
          </div>
        </div>

        <figure v-reveal="160" class="mt-10 lg:mt-14">
          <div class="group overflow-hidden rounded-2xl bg-charcoal/5">
            <img
              src="/images/home/campus-digital-ecosystem.webp"
              srcset="/images/home/campus-digital-ecosystem-836.webp 836w, /images/home/campus-digital-ecosystem.webp 1400w"
              sizes="(min-width: 1024px) 1264px, 100vw"
              alt="Gedung Universitas Nahdlatul Ulama Yogyakarta terhubung dengan layanan dan sistem digital kampus"
              width="1400"
              height="788"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              class="aspect-[1672/941] w-full object-cover object-center transition duration-image ease-unu group-hover:scale-[1.02]"
            />
          </div>
          <figcaption class="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] leading-5 text-slate-500">
            <span>Gedung UNU Yogyakarta dan ekosistem layanan digital.</span>
            <span v-if="page">Diperbarui {{ formatDate(page.updatedAt) }}</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- 02 — Approach -->
    <section class="section-space bg-white" aria-labelledby="approach-title">
      <div class="page-shell">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end lg:gap-16">
          <div v-reveal>
            <p class="eyebrow-editorial">Pendekatan Kami</p>
            <h2 id="approach-title" class="section-title mt-4 max-w-md">Tiga Siklus. Satu Ekosistem.</h2>
          </div>
          <p v-reveal="80" class="max-w-xl text-[16px] leading-[1.7] text-slate-600 lg:justify-self-end">
            Kami memetakan perjalanan mahasiswa, dosen dan pegawai, serta institusi untuk menentukan di mana teknologi paling dibutuhkan.
          </p>
        </div>
        <AboutCycles class="mt-12 lg:mt-16" />
      </div>
    </section>

    <!-- 03 — What we build -->
    <section class="section-space bg-ivory" aria-labelledby="build-title">
      <div class="page-shell">
        <div v-reveal class="max-w-3xl">
          <p class="eyebrow-editorial">Yang Kami Bangun</p>
          <h2 id="build-title" class="section-title mt-4">Dari Kebutuhan Nyata Menjadi Sistem yang Terhubung.</h2>
          <p class="mt-4 max-w-2xl text-[16px] leading-[1.7] text-slate-600">
            Ekosistem digital dikembangkan untuk mendukung proses akademik, operasional, pengabdian, dan kebutuhan lintas unit.
          </p>
        </div>

        <div v-if="categories.length" v-reveal="80" class="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="(category, index) in categories" :key="category.id" class="border-t border-charcoal/15 pt-3">
            <span class="text-[11px] font-bold tabular-nums text-gold-dark">{{ String(index + 1).padStart(2, '0') }}</span>
            <p class="mt-1.5 text-[15px] font-semibold leading-5 text-charcoal">{{ category.name }}</p>
            <p class="mt-1 text-[12px] text-slate-500">{{ category.platformCount || 0 }} produk</p>
          </div>
        </div>

        <div v-if="activeProduct" class="mt-10">
          <div class="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
            <div role="tablist" aria-label="Produk yang dibangun" class="flex min-w-max gap-1 border-b border-charcoal/15">
              <button
                v-for="(product, index) in showcaseProducts"
                :id="`about-product-tab-${product.id}`"
                :key="product.id"
                type="button"
                role="tab"
                :aria-selected="activeProductIndex === index"
                :aria-controls="`about-product-panel-${product.id}`"
                :tabindex="activeProductIndex === index ? 0 : -1"
                class="relative min-h-[44px] whitespace-nowrap px-3.5 py-3 text-[14px] font-semibold transition-colors duration-micro sm:px-4"
                :class="activeProductIndex === index ? 'text-charcoal' : 'text-slate-500 hover:text-charcoal'"
                @click="selectProduct(index)"
              >
                {{ product.name }}
                <span class="absolute inset-x-3 -bottom-px h-0.5 origin-left bg-unu-green transition-transform duration-reveal ease-unu" :class="activeProductIndex === index ? 'scale-x-100' : 'scale-x-0'" aria-hidden="true" />
              </button>
            </div>
          </div>

          <Transition name="swap" mode="out-in">
            <div
              :id="`about-product-panel-${activeProduct.id}`"
              :key="activeProduct.id"
              role="tabpanel"
              :aria-labelledby="`about-product-tab-${activeProduct.id}`"
              class="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-center lg:gap-14"
            >
              <div class="aspect-[16/10] overflow-hidden rounded-2xl border border-line-warm bg-white">
                <PlatformVisual :platform="activeProduct" eager />
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-dark">{{ activeProduct.category }}</span>
                  <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide" :class="statusClasses[activeProduct.status] || 'border-line-warm bg-white text-slate-600'">
                    <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                    {{ activeProduct.status }}
                  </span>
                </div>
                <h3 class="mt-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[34px]">{{ activeProduct.name }}</h3>
                <p class="mt-4 text-[16px] leading-[1.65] text-slate-600">{{ activeProduct.description }}</p>
                <ul v-if="activeProduct.audiences.length" class="mt-5 flex flex-wrap gap-2">
                  <li v-for="audience in activeProduct.audiences" :key="audience" class="rounded-full border border-line-warm bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600">{{ audience }}</li>
                </ul>
                <NuxtLink :to="`/ekosistem-digital/${activeProduct.slug}`" class="link-arrow mt-6">
                  Lihat Detail Produk <ArrowUpRight :size="14" aria-hidden="true" />
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </div>

        <div v-else v-reveal class="mt-10 rounded-2xl border border-dashed border-line-warm bg-white p-8 text-center text-[14px] text-slate-500">
          Produk ekosistem belum tersedia.
        </div>

        <div v-reveal class="mt-10">
          <AppButton to="/ekosistem-digital" variant="secondary">
            Jelajahi Ekosistem Digital
            <template #right><ArrowRight :size="15" aria-hidden="true" /></template>
          </AppButton>
        </div>
      </div>
    </section>

    <!-- 04 — How we work -->
    <section class="section-space bg-white" aria-labelledby="process-title">
      <div class="page-shell">
        <div v-reveal class="max-w-4xl">
          <p class="eyebrow-editorial">Cara Kami Bekerja</p>
          <h2 id="process-title" class="section-title mt-4">Memahami. Membangun. Mengimplementasikan. Mengevaluasi.</h2>
        </div>
        <AboutProcess class="mt-12 lg:mt-16" />
      </div>
    </section>

    <!-- 05 — Impact -->
    <section class="section-space bg-ivory" aria-labelledby="about-impact-title">
      <div class="page-shell">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end lg:gap-16">
          <div v-reveal>
            <p class="eyebrow-editorial">Dampak Transformasi</p>
            <h2 id="about-impact-title" class="section-title mt-4 max-w-lg">Yang Kami Bangun Harus Memberi Dampak.</h2>
          </div>
          <p v-reveal="80" class="max-w-xl text-[16px] leading-[1.7] text-slate-600 lg:justify-self-end">
            Angka historis dari presentasi transformasi digital, ditampilkan dengan periode yang jelas dan bukan sebagai data real-time.
          </p>
        </div>

        <dl class="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10">
          <div v-for="(metric, index) in aboutMetrics" :key="metric.label" v-reveal="index * 80" class="border-t border-charcoal/15 pt-5">
            <dd class="metric-figure">{{ formatNumber(metric.value) }}<span v-if="metric.suffix" class="ml-0.5 text-[0.55em] text-gold-text">{{ metric.suffix }}</span></dd>
            <dt class="mt-3 text-[15px] font-semibold leading-5 text-charcoal">{{ metric.label }}</dt>
            <dd class="mt-1 text-[12px] leading-5 text-slate-500">{{ metric.period }}</dd>
          </div>
        </dl>

        <div v-reveal class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-charcoal/15 pt-5">
          <p class="max-w-xl text-[12px] leading-5 text-slate-500">Sumber: presentasi Transformasi Digital UNU Yogyakarta. Bukan data real-time.</p>
          <NuxtLink to="/#dampak" class="link-arrow">Lihat Dampak Transformasi <ArrowUpRight :size="14" aria-hidden="true" /></NuxtLink>
        </div>
      </div>
    </section>

    <!-- 06 — People -->
    <section v-if="featuredMembers.length" class="section-space bg-white" aria-labelledby="people-title">
      <div class="page-shell">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div v-reveal>
            <p class="eyebrow-editorial">Tim Transformasi Digital</p>
            <h2 id="people-title" class="section-title mt-4">Di Balik Sistem, Ada Manusia.</h2>
          </div>
          <NuxtLink to="/tentang-kami/tim" class="link-arrow">
            Kenali Tim Kami <ArrowRight :size="14" aria-hidden="true" />
          </NuxtLink>
        </div>
        <div class="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
          <div v-for="(member, index) in featuredMembers" :key="member.id" v-reveal="index * 70">
            <TeamMemberCard :member="member" compact />
          </div>
        </div>
      </div>
    </section>

    <!-- 07 — Closing -->
    <section class="bg-charcoal text-white" aria-labelledby="about-cta-title">
      <div class="page-shell py-14 sm:py-16 lg:py-20">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
          <div v-reveal>
            <p class="eyebrow-editorial !text-sage">Mulai dari kebutuhan Anda</p>
            <h2 id="about-cta-title" class="mt-4 max-w-2xl text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.5rem]">
              Punya Kebutuhan Digital untuk Unit Anda?
            </h2>
            <p class="mt-4 max-w-xl text-[16px] leading-[1.65] text-white/70">
              Mari diskusikan kebutuhan sistem dan layanan digital yang mendukung pekerjaan Anda.
            </p>
          </div>
          <AppButton to="/layanan" size="lg">
            Ajukan Layanan
            <template #right><ArrowRight :size="16" aria-hidden="true" /></template>
          </AppButton>
        </div>
      </div>
    </section>

    <!-- Secondary official information -->
    <section class="bg-white">
      <div class="page-shell py-8 sm:py-10">
        <details class="group border-t border-line-warm pt-5">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-4">
            <span>
              <span class="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Informasi resmi</span>
              <span class="mt-1 block text-[15px] font-semibold text-charcoal">Peran, fokus kerja, dan batasan informasi</span>
            </span>
            <span class="flex shrink-0 items-center gap-2 text-[12px] text-slate-500">
              <span v-if="page">Diperbarui {{ formatDate(page.updatedAt) }}</span>
              <ChevronDown :size="16" class="transition group-open:rotate-180" aria-hidden="true" />
            </span>
          </summary>
          <div v-if="page?.content" class="prose-unu mt-6 max-w-3xl" v-html="page.content" />
          <p v-else class="mt-6 max-w-3xl text-[15px] leading-7 text-slate-600">
            Informasi resmi belum tersedia melalui CMS.
          </p>
        </details>
      </div>
    </section>
  </div>
</template>

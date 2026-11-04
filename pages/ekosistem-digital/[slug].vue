<script setup lang="ts">
import { ArrowLeft, ArrowUpRight } from 'lucide-vue-next'
import type { DigitalPlatformDTO } from '~/shared/types'
import { softwareLd } from '~/shared/seo-schema'

const route = useRoute()
const slug = String(route.params.slug || '')
const { data, error } = await useAsyncData<{ platform: DigitalPlatformDTO }>(`platform-${slug}`, () =>
  $fetch(`/api/platforms/${slug}`)
)
if (error.value || !data.value?.platform) {
  throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })
}
const platform = data.value.platform
const activeModules = computed(() => platform.modules.filter((module) => module.active).sort((a, b) => a.order - b.order))
const featureLines = computed(() => platform.features.split('\n').map((line) => line.trim()).filter(Boolean))
const statusClasses: Record<string, string> = {
  'Sudah Rilis': 'border-unu-green/20 bg-unu-green-soft text-unu-green-dark',
  'Pilot / Beta': 'border-sky-200 bg-sky-50 text-sky-800',
  'Dalam Pengembangan': 'border-amber-200 bg-amber-50 text-amber-900'
}

const siteBase = String(useRuntimeConfig().public.siteUrl || '').replace(/\/+$/, '')
usePageSeo({
  title: `${platform.name} | Ekosistem Digital UNU Yogyakarta`,
  description: platform.description,
  seo: platform.seo,
  image: platform.thumbnail || platform.gallery[0] || undefined,
  breadcrumbs: [
    { name: 'Beranda', to: '/' },
    { name: 'Ekosistem Digital', to: '/ekosistem-digital' },
    { name: platform.name, to: `/ekosistem-digital/${platform.slug}` }
  ],
  jsonLd: [
    softwareLd(siteBase, {
      url: `${siteBase}/ekosistem-digital/${platform.slug}`,
      name: platform.name,
      description: platform.description,
      image: platform.thumbnail || platform.gallery[0],
      category: platform.category,
      appUrl: platform.url
    })
  ],
  modifiedTime: platform.updatedAt
})
</script>

<template>
  <div>
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-7 sm:py-9 lg:py-11">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Ekosistem Digital', to: '/ekosistem-digital' }, { label: platform.name }]" />
        <div class="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />{{ platform.category }}</p>
            <h1 class="display-1 mt-4">{{ platform.name }}</h1>
            <p class="body-lg mt-4 max-w-2xl">{{ platform.description }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 lg:justify-end">
            <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide" :class="statusClasses[platform.status] || 'border-admin-border bg-slate-50 text-slate-600'">
              <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {{ platform.status }}
            </span>
            <AppButton v-if="platform.url" :href="platform.url" target="_blank" rel="noopener noreferrer" size="sm">
              Buka Produk <template #right><ArrowUpRight :size="14" aria-hidden="true" /></template>
            </AppButton>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell">
        <div class="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12">
          <div class="overflow-hidden rounded-2xl border border-line-warm bg-white">
            <div class="aspect-[16/10]">
              <PlatformVisual :platform="platform" eager />
            </div>
          </div>

          <aside class="space-y-6">
            <div v-if="platform.audiences.length">
              <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">Sasaran pengguna</p>
              <ul class="mt-3 flex flex-wrap gap-2">
                <li v-for="audience in platform.audiences" :key="audience" class="rounded-full border border-line-warm bg-soft-white px-3 py-1.5 text-[13px] font-medium text-slate-700">{{ audience }}</li>
              </ul>
            </div>
            <div v-if="platform.unit">
              <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">Unit pengelola</p>
              <p class="mt-2 text-[15px] leading-6 text-slate-700">{{ platform.unit }}</p>
            </div>
            <div>
              <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">Kategori</p>
              <p class="mt-2 text-[15px] leading-6 text-slate-700">{{ platform.category }}</p>
            </div>
            <div v-if="platform.benefits">
              <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">Manfaat utama</p>
              <p class="mt-2 text-[15px] leading-7 text-slate-700">{{ platform.benefits }}</p>
            </div>
          </aside>
        </div>

        <div class="mt-10 grid gap-8 border-t border-line-warm pt-10 lg:mt-14 lg:grid-cols-2 lg:gap-12">
          <div v-if="platform.problem">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em]">Permasalahan yang diselesaikan</h2>
            <p class="mt-3 text-[15px] leading-7 text-slate-600">{{ platform.problem }}</p>
          </div>
          <div v-if="platform.solution">
            <h2 class="text-[20px] font-semibold tracking-[-0.02em]">Solusi</h2>
            <p class="mt-3 text-[15px] leading-7 text-slate-600">{{ platform.solution }}</p>
          </div>
        </div>

        <div v-if="activeModules.length" class="mt-10 border-t border-line-warm pt-10">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="eyebrow">Modul terintegrasi</p>
              <h2 class="section-title mt-3">Modul di dalam {{ platform.name }}</h2>
            </div>
            <span class="text-[13px] text-slate-500">{{ activeModules.length }} modul aktif</span>
          </div>
          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <div v-for="module in activeModules" :key="module.id || module.name" class="rounded-xl border border-line-warm bg-soft-white p-5">
              <p class="text-[16px] font-semibold text-charcoal">{{ module.name }}</p>
              <p v-if="module.description" class="mt-1.5 text-[14px] leading-6 text-slate-600">{{ module.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="featureLines.length" class="mt-10 border-t border-line-warm pt-10">
          <h2 class="text-[20px] font-semibold tracking-[-0.02em]">Fitur utama</h2>
          <ul class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="feature in featureLines" :key="feature" class="flex items-start gap-2 text-[15px] leading-6 text-slate-600">
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />{{ feature }}
            </li>
          </ul>
        </div>

        <div v-if="platform.metrics.length" class="mt-10 border-t border-line-warm pt-10">
          <p class="eyebrow">Dampak & capaian</p>
          <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="metric in platform.metrics" :key="`${metric.label}-${metric.period}`" class="border-t border-charcoal/15 pt-4">
              <p class="metric-figure-sm">{{ metric.value }}<span v-if="metric.suffix" class="ml-0.5 text-[0.55em] text-gold-text">{{ metric.suffix }}</span></p>
              <p class="mt-2 text-[14px] font-semibold leading-5 text-charcoal">{{ metric.label }}</p>
              <p class="mt-1 text-[12px] leading-5 text-slate-500">{{ metric.period }}<template v-if="metric.source"> · {{ metric.source }}</template></p>
            </div>
          </div>
        </div>

        <div v-if="platform.gallery.length" class="mt-10 border-t border-line-warm pt-10">
          <h2 class="text-[20px] font-semibold tracking-[-0.02em]">Tampilan lain</h2>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <img v-for="image in platform.gallery" :key="image" :src="image" :alt="`Tampilan ${platform.name}`" loading="lazy" class="w-full rounded-xl border border-line-warm object-cover" />
          </div>
        </div>

        <div class="mt-10 border-t border-line-warm pt-6">
          <NuxtLink to="/ekosistem-digital" class="inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-unu-green hover:underline">
            <ArrowLeft :size="14" aria-hidden="true" /> Kembali ke Ekosistem Digital
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

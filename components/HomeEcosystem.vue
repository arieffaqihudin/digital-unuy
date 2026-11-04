<script setup lang="ts">
import { ArrowRight, ArrowUpRight } from 'lucide-vue-next'
import type { DigitalPlatformDTO, PlatformCategoryDTO } from '~/shared/types'

const props = defineProps<{ platforms: DigitalPlatformDTO[]; categories: PlatformCategoryDTO[] }>()

const featured = computed(() => props.platforms.find((platform) => platform.featured) || props.platforms[0] || null)
const statusClasses: Record<string, string> = {
  'Sudah Rilis': 'border-unu-green/20 bg-unu-green-soft text-unu-green-dark',
  'Pilot / Beta': 'border-sky-200 bg-sky-50 text-sky-800',
  'Dalam Pengembangan': 'border-amber-200 bg-amber-50 text-amber-900'
}
</script>

<template>
  <section class="section-space bg-ivory" aria-labelledby="ecosystem-title">
    <div class="page-shell">
      <HomeSectionHead eyebrow="Ekosistem Digital" title="Satu ekosistem, empat lapis layanan." title-id="ecosystem-title">
        <template #action>
          <NuxtLink to="/ekosistem-digital" class="link-arrow">Lihat seluruh ekosistem <ArrowUpRight :size="14" aria-hidden="true" /></NuxtLink>
        </template>
      </HomeSectionHead>

      <div class="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-stretch lg:gap-12">
        <div v-if="featured" v-reveal class="min-w-0">
          <NuxtLink :to="`/ekosistem-digital/${featured.slug}`" class="group block overflow-hidden rounded-2xl border border-line-warm bg-white transition duration-hover ease-unu hover:border-unu-green/35">
            <div class="aspect-[16/10] overflow-hidden">
              <PlatformVisual :platform="featured" eager class="transition duration-image ease-unu group-hover:scale-[1.015]" />
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line-warm px-5 py-4">
              <div class="min-w-0">
                <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-dark">Produk unggulan</p>
                <p class="mt-1 truncate text-[18px] font-semibold tracking-[-0.02em]">{{ featured.name }}</p>
              </div>
              <span class="inline-flex items-center gap-1 text-[13px] font-semibold text-unu-green">Lihat detail <ArrowRight :size="13" aria-hidden="true" /></span>
            </div>
          </NuxtLink>
        </div>

        <div v-else v-reveal class="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-line-warm bg-white p-8 text-center text-[14px] text-slate-500">
          Produk unggulan belum tersedia.
        </div>

        <div v-if="featured" v-reveal="100" class="flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-dark">{{ featured.category }}</span>
              <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide" :class="statusClasses[featured.status] || 'border-admin-border bg-slate-50 text-slate-600'">
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ featured.status }}
              </span>
            </div>
            <h3 class="mt-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[34px]">{{ featured.name }}</h3>
            <p class="mt-4 text-[16px] leading-[1.65] text-slate-600">{{ featured.description }}</p>
            <ul v-if="featured.audiences.length" class="mt-5 flex flex-wrap gap-2">
              <li v-for="audience in featured.audiences" :key="audience" class="rounded-full border border-line-warm bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600">{{ audience }}</li>
            </ul>
            <AppButton :to="`/ekosistem-digital/${featured.slug}`" class="mt-6">
              Lihat Produk
              <template #right><ArrowRight :size="15" aria-hidden="true" /></template>
            </AppButton>
          </div>

          <div v-if="featured.modules.length" class="mt-8 border-t border-charcoal/15 pt-5">
            <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Modul terintegrasi</p>
            <p class="mt-2 text-[14px] leading-6 text-slate-600">{{ featured.modules.filter((module) => module.active).map((module) => module.name).join(' · ') }}</p>
          </div>
        </div>
      </div>

      <div v-if="categories.length" v-reveal class="mt-12 border-t border-charcoal/15 pt-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Empat kategori ekosistem</p>
          <NuxtLink to="/ekosistem-digital" class="link-arrow">Jelajahi semua <ArrowUpRight :size="13" aria-hidden="true" /></NuxtLink>
        </div>
        <div class="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <NuxtLink
            v-for="(category, index) in categories"
            :key="category.id"
            :to="{ path: '/ekosistem-digital', query: { category: category.slug } }"
            class="group border-t border-charcoal/15 pt-3"
          >
            <span class="text-[11px] font-bold tabular-nums text-gold-dark">{{ String(index + 1).padStart(2, '0') }}</span>
            <p class="mt-1.5 text-[15px] font-semibold leading-5 text-charcoal transition-colors duration-micro group-hover:text-unu-green">{{ category.name }}</p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

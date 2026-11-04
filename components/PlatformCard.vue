<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { DigitalPlatformDTO } from '~/shared/types'

const props = withDefaults(defineProps<{ platform: DigitalPlatformDTO; index?: number; featured?: boolean }>(), {
  index: 0,
  featured: false
})

const detailPath = computed(() => `/ekosistem-digital/${props.platform.slug}`)
const statusClasses: Record<string, string> = {
  'Sudah Rilis': 'border-unu-green/20 bg-unu-green-soft text-unu-green-dark',
  'Pilot / Beta': 'border-sky-200 bg-sky-50 text-sky-800',
  'Dalam Pengembangan': 'border-amber-200 bg-amber-50 text-amber-900'
}
const audienceLabel = computed(() => props.platform.audiences.slice(0, 2).join(' · '))
</script>

<template>
  <article
    class="group overflow-hidden border border-line-warm bg-white transition duration-hover ease-unu hover:border-unu-green/35"
    :class="featured ? 'grid rounded-2xl lg:grid-cols-[1.08fr_1fr]' : 'flex h-full flex-col rounded-xl'"
  >
    <NuxtLink :to="detailPath" :aria-label="`Lihat detail ${platform.name}`" class="block overflow-hidden" :class="featured ? 'aspect-[16/10] lg:aspect-auto lg:h-full' : 'aspect-[16/10]'">
      <PlatformVisual :platform="platform" :eager="featured" overlay-label class="transition duration-image ease-unu group-hover:scale-[1.015]" />
    </NuxtLink>

    <div class="flex flex-1 flex-col p-5" :class="featured ? 'sm:p-6 lg:p-8' : ''">
      <h3 class="sr-only">{{ platform.name }}</h3>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
          :class="statusClasses[platform.status] || 'border-admin-border bg-slate-50 text-slate-600'"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          {{ platform.status }}
        </span>
      </div>

      <p class="mb-5 mt-3 line-clamp-2 text-[14px] leading-6 text-slate-600 sm:text-[15px]">{{ platform.description }}</p>

      <div class="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-line-warm pt-4" :class="featured ? 'mt-6' : 'mt-5'">
        <p v-if="audienceLabel" class="min-w-0 truncate text-[12px] leading-5 text-slate-500">{{ audienceLabel }}</p>
        <NuxtLink :to="detailPath" class="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-[14px] font-semibold text-unu-green hover:underline">
          Lihat Detail <ArrowUpRight :size="13" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

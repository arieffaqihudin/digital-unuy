<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { DigitalPlatformDTO } from '~/shared/types'

defineProps<{ platform: DigitalPlatformDTO; index?: number }>()

const statusClasses: Record<string, string> = {
  Aktif: 'border-unu-green/20 bg-unu-green-soft text-unu-green-dark',
  Pilot: 'border-sky-200 bg-sky-50 text-sky-800',
  'Dalam Pengembangan': 'border-amber-200 bg-amber-50 text-amber-900',
  'Tidak Aktif': 'border-slate-200 bg-slate-50 text-slate-500'
}
</script>

<template>
  <article class="group flex h-full flex-col rounded-xl border border-line-warm bg-white p-5 transition hover:border-unu-green/30">
    <div class="flex items-start justify-between gap-3">
      <span class="text-[12px] font-bold uppercase tracking-[0.14em] text-gold-dark">{{ platform.category }}</span>
      <span
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide"
        :class="statusClasses[platform.status]"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {{ platform.status }}
      </span>
    </div>
    <div class="mt-5 flex items-start gap-3">
      <span class="text-[14px] font-semibold tabular-nums text-slate-300">{{ index ? String(index).padStart(2, '0') : '—' }}</span>
      <div class="min-w-0">
        <h3 class="text-[17px] font-semibold leading-snug tracking-[-0.02em]">{{ platform.name }}</h3>
        <p class="mt-2 line-clamp-3 text-[14px] leading-6 text-slate-600">{{ platform.description }}</p>
      </div>
    </div>
    <div class="mt-auto flex items-end justify-between gap-3 border-t border-line-warm pt-4">
      <div class="min-w-0">
        <p class="truncate text-[12px] uppercase tracking-wide text-slate-400">{{ platform.unit || 'Unit pengelola belum diisi' }}</p>
        <p v-if="platform.audience" class="mt-1 truncate text-[12px] text-slate-500">{{ platform.audience }}</p>
      </div>
      <a
        v-if="platform.url"
        :href="platform.url"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-[14px] font-semibold text-unu-green hover:underline"
        :aria-label="`Buka ${platform.name} di tab baru`"
      >
        Kunjungi <ArrowUpRight :size="12" aria-hidden="true" />
      </a>
    </div>
  </article>
</template>

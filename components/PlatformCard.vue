<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { DigitalPlatformDTO } from '~/shared/types'

defineProps<{ platform: DigitalPlatformDTO }>()

const statusClasses: Record<string, string> = {
  Aktif: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Pilot: 'border-sky-200 bg-sky-50 text-sky-800',
  'Dalam Pengembangan': 'border-amber-200 bg-amber-50 text-amber-900',
  'Tidak Aktif': 'border-line-warm bg-ivory text-ink-muted'
}
</script>

<template>
  <article class="group flex h-full flex-col rounded-2xl border border-line-warm bg-white p-5 transition hover:border-charcoal/20">
    <div class="flex items-start justify-between gap-3">
      <IconTile :name="platform.icon" size="sm" tone="light" />
      <span
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
        :class="statusClasses[platform.status]"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {{ platform.status }}
      </span>
    </div>
    <p class="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">{{ platform.category }}</p>
    <h3 class="mt-1.5 text-base font-semibold leading-snug">{{ platform.name }}</h3>
    <p class="mt-2 flex-1 text-sm leading-6 text-ink-muted">{{ platform.description }}</p>
    <div class="mt-4 flex items-end justify-between gap-3 border-t border-line-warm pt-3.5">
      <div class="min-w-0">
        <p v-if="platform.unit" class="truncate text-[11px] text-ink-muted">{{ platform.unit }}</p>
        <p v-if="platform.audience" class="mt-0.5 truncate text-[11px] text-ink-muted/75">{{ platform.audience }}</p>
      </div>
      <a
        v-if="platform.url"
        :href="platform.url"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-xs font-semibold underline-offset-4 hover:text-gold-dark hover:underline"
        :aria-label="`Buka ${platform.name} di tab baru`"
      >
        Kunjungi <ArrowUpRight :size="13" aria-hidden="true" />
      </a>
    </div>
  </article>
</template>

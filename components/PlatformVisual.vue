<script setup lang="ts">
import type { DigitalPlatformDTO } from '~/shared/types'

const props = withDefaults(defineProps<{ platform: DigitalPlatformDTO; eager?: boolean; compact?: boolean }>(), {
  eager: false,
  compact: false
})



const palettes = [
  { background: '#EDF2E8', accent: '#337449', ink: '#1C1A1A', line: 'rgba(51,116,73,0.16)' },
  { background: '#F4EEDC', accent: '#9A6D08', ink: '#1C1A1A', line: 'rgba(191,139,21,0.18)' },
  { background: '#EEF0DE', accent: '#5C6A38', ink: '#1C1A1A', line: 'rgba(92,106,56,0.16)' },
  { background: '#E8EFEA', accent: '#245B37', ink: '#1C1A1A', line: 'rgba(36,91,55,0.16)' }
]
const palette = computed(() => palettes[Math.max(0, Math.min(palettes.length - 1, (props.platform.categoryOrder || 1) - 1))])
const orderLabel = computed(() => String(props.platform.categoryOrder || 1).padStart(2, '0'))
</script>

<template>
  <div class="relative h-full w-full overflow-hidden" :style="{ backgroundColor: palette.background }">
    <img
      v-if="platform.thumbnail"
      :src="platform.thumbnail"
      :alt="`Tampilan ${platform.name}`"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="h-full w-full object-cover object-top"
    />
    <div v-else class="absolute inset-0">
      <div
        class="absolute inset-0"
        :style="{
          backgroundImage: `linear-gradient(${palette.line} 1px, transparent 1px), linear-gradient(90deg, ${palette.line} 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
          opacity: 0.5
        }"
        aria-hidden="true"
      />
      <div class="absolute -right-10 top-8 h-48 w-48 rounded-full border" :style="{ borderColor: palette.line }" aria-hidden="true" />
      <div class="absolute -right-2 top-16 h-32 w-32 rounded-full border" :style="{ borderColor: palette.line }" aria-hidden="true" />
      <span class="absolute right-4 top-1 text-[76px] font-bold leading-none tabular-nums" :style="{ color: palette.accent, opacity: 0.14 }" aria-hidden="true">{{ orderLabel }}</span>
      <div class="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-charcoal/[0.08] to-transparent" aria-hidden="true" />
      <div class="relative flex h-full flex-col justify-between" :class="compact ? 'p-4' : 'p-5 sm:p-6'">
        <div class="flex items-start justify-between gap-4">
          <span class="text-[10px] font-bold uppercase tracking-[0.18em]" :style="{ color: palette.accent }">Ekosistem Digital</span>
        </div>
        <div>
          <div class="h-1.5 w-10 rounded-full" :style="{ backgroundColor: palette.accent }" aria-hidden="true" />
          <p class="mt-3 text-[11px] font-semibold uppercase leading-4 tracking-[0.14em]" :style="{ color: palette.accent }">{{ platform.category }}</p>
          <p class="mt-1 text-[19px] font-semibold leading-[1.2] tracking-[-0.02em] text-charcoal sm:text-[21px]">{{ platform.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

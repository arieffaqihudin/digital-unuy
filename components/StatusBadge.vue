<script setup lang="ts">
import { STATUS_META, type RequestStatus } from '~/shared/types'

const props = withDefaults(
  defineProps<{
    status: RequestStatus
    substatus?: string
    size?: 'sm' | 'md'
  }>(),
  { substatus: '', size: 'sm' }
)

const meta = computed(() => STATUS_META[props.status] || STATUS_META.Diajukan)
const classes = computed(() => {
  const tones = {
    neutral: 'border-line-warm bg-ivory text-ink-muted',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    danger: 'border-red-200 bg-red-50 text-red-900'
  }
  return tones[meta.value.tone]
})
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-1.5">
    <span
      class="inline-flex items-center gap-1.5 rounded-full border font-semibold"
      :class="[classes, size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs']"
    >
      <span aria-hidden="true">{{ meta.symbol }}</span>
      {{ status }}
    </span>
    <span
      v-if="substatus"
      class="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold-dark"
    >
      <span aria-hidden="true">◷</span>
      {{ substatus }}
    </span>
  </span>
</template>

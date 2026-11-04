<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description?: string
    compact?: boolean
  }>(),
  { description: '', compact: false }
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-warm bg-white/60 text-center"
    :class="compact ? 'px-5 py-10' : 'px-6 py-16'"
  >
    <span class="grid h-12 w-12 place-items-center rounded-2xl bg-sage-soft text-charcoal">
      <Inbox :size="22" :stroke-width="1.7" aria-hidden="true" />
    </span>
    <h3 class="mt-4 text-base font-semibold">{{ title }}</h3>
    <p v-if="description" class="mt-1.5 max-w-md text-sm leading-6 text-ink-muted">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>

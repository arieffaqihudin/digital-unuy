<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    description?: string
    align?: 'left' | 'center'
    inverse?: boolean
  }>(),
  { eyebrow: '', description: '', align: 'left', inverse: false }
)
</script>

<template>
  <div
    class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
    :class="align === 'center' ? 'text-center md:flex-col md:items-center' : ''"
  >
    <div :class="align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'">
      <p v-if="eyebrow" :class="inverse ? 'eyebrow-light' : 'eyebrow'">
        <span class="h-px w-5 bg-current" aria-hidden="true" />
        {{ eyebrow }}
      </p>
      <h2 class="display-2 mt-3" :class="inverse ? 'text-white' : ''">{{ title }}</h2>
      <p v-if="description" class="body-lg mt-4" :class="inverse ? 'text-white/65' : ''">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>

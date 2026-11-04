<script setup lang="ts">
withDefaults(defineProps<{ eyebrow: string; title: string; description?: string }>(), {
  description: ''
})
</script>

<template>
  <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
    <div class="max-w-[640px]">
      <p class="eyebrow-editorial">{{ eyebrow }}</p>
      <h2 class="section-title mt-4">{{ title }}</h2>
      <p v-if="description" class="mt-4 text-[16px] leading-[1.7] text-slate-600">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>

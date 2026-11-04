<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    description?: string
    breadcrumbs: { label: string; to?: string }[]
    wide?: boolean
  }>(),
  { description: '', wide: false }
)
</script>

<template>
  <section class="border-b border-line-warm bg-ivory">
    <div :class="wide ? 'page-shell-wide' : 'page-shell'" class="py-7 sm:py-9 lg:py-11">
      <Breadcrumbs :items="breadcrumbs" />
      <div class="mt-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
        <div class="max-w-3xl">
          <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />{{ eyebrow }}</p>
          <h1 class="display-1 mt-4">{{ title }}</h1>
          <p v-if="description" class="body-lg mt-4 max-w-2xl">{{ description }}</p>
        </div>
        <div v-if="$slots.aside" class="hidden lg:block lg:pb-1">
          <slot name="aside" />
        </div>
      </div>
    </div>
  </section>
</template>

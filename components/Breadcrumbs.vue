<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'

defineProps<{
  items: { label: string; to?: string }[]
}>()
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`" class="flex items-center gap-1.5">
        <NuxtLink v-if="item.to && index < items.length - 1" :to="item.to" class="transition hover:text-charcoal">
          {{ item.label }}
        </NuxtLink>
        <span v-else :class="index === items.length - 1 ? 'font-semibold text-charcoal' : ''" aria-current="page">
          {{ item.label }}
        </span>
        <ChevronRight
          v-if="index < items.length - 1"
          :size="12"
          class="text-ink-muted/50"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

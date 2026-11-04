<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{ 'update:page': [value: number] }>()

const pages = computed(() => {
  const total = props.totalPages
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const start = Math.max(1, Math.min(props.page - 2, total - 4))
  return Array.from({ length: 5 }, (_, index) => start + index)
})

function go(page: number) {
  if (page < 1 || page > props.totalPages || page === props.page) return
  emit('update:page', page)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
    <button
      type="button"
      class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line-warm bg-white text-charcoal transition hover:border-unu-green/40 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="page <= 1"
      aria-label="Halaman sebelumnya"
      @click="go(page - 1)"
    >
      <ChevronLeft :size="16" aria-hidden="true" />
    </button>
    <button
      v-for="item in pages"
      :key="item"
      type="button"
      class="inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition"
      :class="
        item === page
          ? 'border-unu-green bg-unu-green text-white'
          : 'border-line-warm bg-white text-charcoal hover:border-unu-green/40'
      "
      :aria-current="item === page ? 'page' : undefined"
      @click="go(item)"
    >
      {{ item }}
    </button>
    <button
      type="button"
      class="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line-warm bg-white text-charcoal transition hover:border-unu-green/40 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="page >= totalPages"
      aria-label="Halaman berikutnya"
      @click="go(page + 1)"
    >
      <ChevronRight :size="16" aria-hidden="true" />
    </button>
  </nav>
</template>

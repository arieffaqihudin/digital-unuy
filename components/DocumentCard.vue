<script setup lang="ts">
import { ArrowDownToLine, ArrowUpRight } from 'lucide-vue-next'
import type { DocumentDTO } from '~/shared/types'

withDefaults(
  defineProps<{
    document: DocumentDTO
    variant?: 'row' | 'card'
  }>(),
  { variant: 'row' }
)
const { formatDate, formatFileSize } = useFormat()
</script>

<template>
  <article
    class="group bg-white transition"
    :class="
      variant === 'row'
        ? 'border-b border-line-warm py-5 last:border-b-0'
        : 'flex h-full flex-col rounded-xl border border-line-warm p-5 hover:border-unu-green/30'
    "
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2 text-[12px]">
          <span class="font-bold uppercase tracking-[0.14em] text-gold-dark">{{ document.category }}</span>
          <span class="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
          <span class="text-slate-500">Diperbarui {{ formatDate(document.updatedAt) }}</span>
        </div>
        <h3 class="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.015em]">
          <NuxtLink :to="`/dokumen/${document.slug}`" class="transition group-hover:text-unu-green">{{ document.title }}</NuxtLink>
        </h3>
        <p v-if="document.description" class="mt-1.5 line-clamp-2 max-w-2xl text-[14px] leading-6 text-slate-600">{{ document.description }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
          <span>Versi {{ document.version }}</span>
          <span v-if="document.fileSize">· {{ formatFileSize(document.fileSize) }}</span>
          <span v-if="document.services?.length">· {{ document.services.length }} layanan terkait</span>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-4 sm:pt-1">
        <NuxtLink :to="`/dokumen/${document.slug}`" class="inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-slate-500 hover:text-unu-green">
          Baca <ArrowUpRight :size="12" aria-hidden="true" />
        </NuxtLink>
        <a
          :href="`/api/documents/${document.slug}/download`"
          class="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-line-warm bg-white px-3 text-[14px] font-semibold text-charcoal transition hover:border-unu-green/30 hover:text-unu-green"
        >
          <ArrowDownToLine :size="13" aria-hidden="true" /> Unduh
        </a>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Download, FileText, ShieldCheck } from 'lucide-vue-next'
import type { DocumentDTO } from '~/shared/types'

defineProps<{ document: DocumentDTO }>()
const { formatDate, formatFileSize } = useFormat()
</script>

<template>
  <article class="flex h-full flex-col rounded-2xl border border-line-warm bg-white p-5 transition hover:border-charcoal/20">
    <div class="flex items-start justify-between gap-3">
      <span class="grid h-10 w-10 place-items-center rounded-xl bg-sage-soft text-charcoal">
        <FileText :size="19" :stroke-width="1.7" aria-hidden="true" />
      </span>
      <span class="inline-flex items-center gap-1 rounded-full border border-line-warm bg-ivory px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
        <ShieldCheck :size="11" aria-hidden="true" /> Publik
      </span>
    </div>
    <p class="mt-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gold-dark">{{ document.category }}</p>
    <h3 class="mt-1.5 text-base font-semibold leading-snug">
      <NuxtLink :to="`/dokumen/${document.slug}`" class="transition hover:text-gold-dark">{{ document.title }}</NuxtLink>
    </h3>
    <p v-if="document.description" class="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-ink-muted">{{ document.description }}</p>
    <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
      <span>Versi {{ document.version }}</span>
      <span class="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
      <span>{{ formatDate(document.updatedAt) }}</span>
      <span v-if="document.fileSize" class="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
      <span v-if="document.fileSize">{{ formatFileSize(document.fileSize) }}</span>
    </div>
    <div class="mt-2 flex items-center gap-4 border-t border-line-warm pt-1">
      <NuxtLink :to="`/dokumen/${document.slug}`" class="inline-flex min-h-[44px] items-center text-xs font-semibold underline-offset-4 hover:text-gold-dark hover:underline">Lihat dokumen</NuxtLink>
      <a
        :href="`/api/documents/${document.slug}/download`"
        class="ml-auto inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold underline-offset-4 hover:text-gold-dark hover:underline"
      >
        <Download :size="13" aria-hidden="true" /> Unduh
      </a>
    </div>
  </article>
</template>

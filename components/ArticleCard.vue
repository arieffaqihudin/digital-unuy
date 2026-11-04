<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { ArticleDTO } from '~/shared/types'

defineProps<{ article: ArticleDTO; featured?: boolean }>()
const { formatDate } = useFormat()
</script>

<template>
  <article class="group flex h-full flex-col overflow-hidden rounded-2xl border border-line-warm bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-charcoal/20">
    <NuxtLink :to="`/publikasi/${article.slug}`" class="block overflow-hidden" tabindex="-1" aria-hidden="true">
      <div v-if="article.thumbnail" class="aspect-[16/9] overflow-hidden bg-ivory">
        <img
          :src="article.thumbnail"
          :alt="`Thumbnail ${article.title}`"
          loading="lazy"
          class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div v-else class="relative aspect-[16/9] overflow-hidden bg-charcoal">
        <div class="absolute inset-0 public-grid-pattern opacity-40" />
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-sage/20" />
        <div class="absolute bottom-4 left-5 right-5 flex items-end justify-between">
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-sage">{{ article.category }}</span>
          <span class="h-8 w-8 rounded-full border border-gold/50 bg-gold/10" />
        </div>
      </div>
    </NuxtLink>
    <div class="flex flex-1 flex-col p-5 sm:p-6">
      <div class="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
        <span class="rounded-full bg-sage-soft px-2.5 py-1 font-bold uppercase tracking-wide text-charcoal">{{ article.category }}</span>
        <span>{{ formatDate(article.publishedAt) }}</span>
      </div>
      <h3 class="mt-3 text-lg font-semibold leading-snug">
        <NuxtLink :to="`/publikasi/${article.slug}`" class="transition group-hover:text-gold-dark">{{ article.title }}</NuxtLink>
      </h3>
      <p class="mt-2.5 flex-1 text-sm leading-6 text-ink-muted">{{ article.excerpt }}</p>
      <NuxtLink
        :to="`/publikasi/${article.slug}`"
        class="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold underline-offset-4 hover:text-gold-dark hover:underline"
      >
        Baca publikasi <ArrowUpRight :size="13" aria-hidden="true" />
      </NuxtLink>
    </div>
  </article>
</template>

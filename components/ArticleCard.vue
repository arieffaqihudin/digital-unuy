<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { ArticleDTO } from '~/shared/types'

withDefaults(
  defineProps<{
    article: ArticleDTO
    variant?: 'default' | 'featured' | 'compact'
    hideExcerpt?: boolean
  }>(),
  { variant: 'default', hideExcerpt: false }
)
const { formatDate } = useFormat()
</script>

<template>
  <article
    class="group flex h-full overflow-hidden border border-line-warm bg-white transition duration-300 hover:border-unu-green/30"
    :class="
      variant === 'featured'
        ? 'flex-col rounded-2xl lg:flex-row'
        : variant === 'compact'
          ? 'flex-col rounded-xl sm:flex-row'
          : 'flex-col rounded-xl'
    "
  >
    <NuxtLink
      :to="`/publikasi/${article.slug}`"
      class="block shrink-0 overflow-hidden"
      :class="variant === 'featured' ? 'lg:w-[48%]' : variant === 'compact' ? 'sm:w-[132px]' : ''"
      tabindex="-1"
      aria-hidden="true"
    >
      <div
        v-if="article.thumbnail"
        class="aspect-[16/10] overflow-hidden bg-ivory"
        :class="variant === 'featured' ? 'lg:h-full lg:aspect-auto' : variant === 'compact' ? 'sm:h-full sm:aspect-auto' : ''"
      >
        <img
          :src="article.thumbnail"
          :alt="`Thumbnail ${article.title}`"
          loading="lazy"
          class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div
        v-else
        class="relative overflow-hidden bg-charcoal"
        :class="
          variant === 'featured'
            ? 'aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[360px]'
            : variant === 'compact'
              ? 'aspect-[4/3] sm:h-full sm:aspect-auto sm:min-h-[142px]'
              : 'aspect-[16/9]'
        "
      >
        <div class="absolute inset-0 public-grid-pattern opacity-40" />
        <div class="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-sage/20" />
        <div class="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <span class="text-[12px] font-bold uppercase tracking-[0.2em] text-sage">{{ article.category }}</span>
          <span class="text-[12px] font-semibold text-white/25">TD / {{ formatDate(article.publishedAt, { month: '2-digit', year: 'numeric' }) }}</span>
        </div>
      </div>
    </NuxtLink>

    <div
      class="flex flex-1 flex-col"
      :class="variant === 'featured' ? 'p-5 sm:p-6 lg:justify-center lg:p-8' : variant === 'compact' ? 'p-4' : 'p-5 sm:p-6'"
    >
      <div class="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
        <span class="font-bold uppercase tracking-[0.14em] text-gold-dark">{{ article.category }}</span>
        <span class="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
        <span>{{ formatDate(article.publishedAt) }}</span>
      </div>
      <h3
        class="mt-2.5 font-semibold leading-[1.3] tracking-[-0.02em] transition group-hover:text-unu-green"
        :class="variant === 'featured' ? 'text-2xl sm:text-[30px]' : variant === 'compact' ? 'text-[15px]' : 'text-[19px]'"
      >
        <NuxtLink :to="`/publikasi/${article.slug}`">{{ article.title }}</NuxtLink>
      </h3>
      <p
        v-if="!hideExcerpt"
        class="mt-2 text-slate-600"
        :class="variant === 'featured' ? 'max-w-xl text-[14px] leading-7' : 'line-clamp-2 text-[12px] leading-5'"
      >
        {{ article.excerpt }}
      </p>
      <NuxtLink
        :to="`/publikasi/${article.slug}`"
        class="mt-auto inline-flex min-h-[44px] items-center gap-1.5 pt-3 text-[12px] font-semibold text-slate-500 underline-offset-4 transition hover:text-unu-green hover:underline"
      >
        Baca publikasi <ArrowUpRight :size="12" aria-hidden="true" />
      </NuxtLink>
    </div>
  </article>
</template>

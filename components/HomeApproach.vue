<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import { approachContent } from '~/shared/home-content'
</script>

<template>
  <section class="section-space bg-white" aria-labelledby="approach-title">
    <div class="page-shell">
      <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div class="max-w-[640px]">
          <p class="eyebrow-editorial">{{ approachContent.eyebrow }}</p>
          <h2 id="approach-title" class="section-title mt-4">{{ approachContent.heading }}</h2>
          <p class="mt-4 text-[16px] leading-[1.7] text-slate-600">{{ approachContent.description }}</p>
        </div>
        <NuxtLink to="/tentang" class="link-arrow shrink-0">
          Mengenal Direktorat <ArrowUpRight :size="14" aria-hidden="true" />
        </NuxtLink>
      </div>

      <ol class="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
        <li
          v-for="(cycle, index) in approachContent.cycles"
          :key="cycle.title"
          class="relative pl-9 md:pl-0 md:pr-10 md:pt-10"
        >
          <span
            class="absolute left-[7px] top-4 w-px bg-charcoal/20 md:inset-x-0 md:left-0 md:top-0 md:h-px md:w-auto"
            :class="index < approachContent.cycles.length - 1 ? '-bottom-10 md:bottom-auto' : 'bottom-0 md:bottom-auto'"
            aria-hidden="true"
          />
          <span
            class="absolute left-0 top-1 grid h-[15px] w-[15px] place-items-center rounded-full border border-gold bg-white md:-top-[7px]"
            aria-hidden="true"
          >
            <span class="h-[5px] w-[5px] rounded-full bg-gold" />
          </span>
          <p class="text-[13px] font-semibold tabular-nums text-gold-dark">{{ String(index + 1).padStart(2, '0') }}</p>
          <h3 class="mt-2 text-[22px] font-semibold leading-[1.25] tracking-[-0.02em]">{{ cycle.title }}</h3>
          <p class="mt-3 max-w-[340px] text-[15px] leading-[1.65] text-slate-600">{{ cycle.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Hammer, PencilRuler, Rocket, Search } from 'lucide-vue-next'
import { processContent } from '~/shared/home-content'

const icons = { search: Search, design: PencilRuler, build: Hammer, launch: Rocket } as const
</script>

<template>
  <section class="section-space bg-ivory" aria-labelledby="process-title">
    <div class="page-shell grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
      <div v-reveal class="lg:sticky lg:top-28 lg:self-start">
        <p class="eyebrow-editorial">{{ processContent.eyebrow }}</p>
        <h2 id="process-title" class="section-title mt-4 max-w-md">{{ processContent.heading }}</h2>
        <p class="mt-5 max-w-sm text-[16px] leading-[1.65] text-slate-600">{{ processContent.narrative }}</p>
      </div>

      <ol class="relative min-w-0">
        <!-- connector -->
        <span class="flow-rail absolute bottom-[72px] left-[27px] top-10 w-px origin-top bg-gradient-to-b from-gold/70 via-gold/40 to-gold/10 sm:left-[35px]" aria-hidden="true" />
        <li v-for="(step, index) in processContent.steps" :key="step.title" v-reveal="index * 90" class="relative flex gap-5 pb-9 last:pb-0 sm:gap-7">
          <span class="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/60 bg-white text-unu-green sm:h-[72px] sm:w-[72px]">
            <component :is="icons[step.icon as keyof typeof icons]" :size="24" :stroke-width="1.6" aria-hidden="true" />
          </span>
          <div class="min-w-0 flex-1 pt-1">
            <div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
              <span class="text-[40px] font-semibold leading-none tabular-nums tracking-[-0.05em] text-gold/80 sm:text-[56px]">{{ String(index + 1).padStart(2, '0') }}</span>
              <h3 class="break-words text-[19px] font-semibold leading-snug tracking-[-0.02em] sm:text-[22px]">{{ step.title }}</h3>
            </div>
            <p class="mt-2 max-w-md text-[15px] leading-6 text-slate-600">{{ step.text }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

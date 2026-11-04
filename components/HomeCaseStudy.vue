<script setup lang="ts">
import { caseStudyContent } from '~/shared/home-content'

const study = caseStudyContent
const percent = Math.round((study.produced / study.total) * 100)
const fill = `${((study.produced / study.total) * 100).toFixed(1)}%`
const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value)
</script>

<template>
  <section class="bg-charcoal text-white" aria-labelledby="case-title">
    <div class="page-shell grid gap-12 py-16 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:py-24">
      <div v-reveal class="max-w-[520px]">
        <p class="eyebrow-editorial !text-sage">{{ study.eyebrow }}</p>
        <h2 id="case-title" class="section-title mt-4 !text-white">{{ study.heading }}</h2>
        <p class="mt-5 text-[16px] leading-[1.7] text-white/70">{{ study.description }}</p>
        <img
          v-if="study.image"
          :src="study.image.src"
          :alt="study.image.alt"
          loading="lazy"
          class="mt-8 w-full rounded-xl border border-white/10"
        />
      </div>

      <div v-reveal="120">
        <p class="metric-figure !text-white" style="font-size: clamp(4.5rem, 3rem + 7vw, 8.5rem)">
          {{ percent }}<span class="ml-1 text-[0.5em] text-gold-soft">%</span>
        </p>
        <div class="mt-8" role="img" :aria-label="`${study.produced} dari ${study.total} portofolio dihasilkan otomatis`">
          <div class="h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div class="bar-fill h-full rounded-full bg-gold-soft" :style="{ width: fill }" />
          </div>
          <div class="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[14px] leading-6">
            <p class="font-semibold text-white">
              {{ formatNumber(study.produced) }} dari {{ formatNumber(study.total) }} portofolio
            </p>
            <p class="text-white/70">{{ study.period }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

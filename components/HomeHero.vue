<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { heroContent, impactContent, impactMetrics } from '~/shared/home-content'

const router = useRouter()
const visual = heroContent.visual
const impactPageAvailable = computed(() => router.resolve(impactContent.cta.to).matched.length > 0)
const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value)

useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      type: 'image/webp',
      href: visual.src,
      imagesrcset: visual.srcset,
      imagesizes: '(min-width: 1024px) 55vw, 92vw',
      fetchpriority: 'high'
    }
  ]
})
</script>

<template>
  <section class="relative overflow-hidden bg-ivory pb-16 sm:pb-20 lg:pb-24" aria-labelledby="hero-title">
    <div class="mx-auto w-full max-w-[1360px] px-5 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
      <div class="grid items-center gap-10 lg:min-h-[480px] lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)] lg:gap-14 xl:gap-16">
        <!-- Left: editorial copy -->
        <div class="max-w-[600px]">
          <p class="eyebrow-editorial animate-fade-up">{{ heroContent.eyebrow }}</p>

          <h1 id="hero-title" class="hero-title mt-4 animate-fade-up [animation-delay:80ms]">
            {{ heroContent.headline.lead }}
            <span class="hero-accent">{{ heroContent.headline.accent }}</span>
          </h1>

          <p class="mt-5 max-w-[560px] animate-fade-up text-[16px] leading-[1.6] text-slate-600 [animation-delay:160ms] sm:text-[17px]">
            {{ heroContent.supporting }}
          </p>

          <div class="mt-8 flex w-full animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:w-auto sm:flex-row">
            <AppButton :to="heroContent.primaryCta.to" variant="primary" size="lg">
              {{ heroContent.primaryCta.label }}
              <template #right><ArrowRight :size="16" aria-hidden="true" /></template>
            </AppButton>
            <AppButton :to="heroContent.secondaryCta.to" variant="secondary" size="lg">
              {{ heroContent.secondaryCta.label }}
            </AppButton>
          </div>
        </div>

        <!-- Right: Digital Campus Ecosystem visual -->
        <figure class="mx-auto w-full max-w-[620px] animate-fade-up [animation-delay:200ms] lg:max-w-none">
          <img
            :src="visual.src"
            :srcset="visual.srcset"
            sizes="(min-width: 1024px) 55vw, 92vw"
            :alt="visual.alt"
            :width="visual.width"
            :height="visual.height"
            fetchpriority="high"
            decoding="async"
            class="block h-auto w-full overflow-hidden rounded-2xl object-contain ring-1 ring-charcoal/5"
          />
        </figure>
      </div>

      <!-- Impact preview, continuation of the hero -->
      <div class="mx-auto mt-12 max-w-[1180px] sm:mt-16">
        <div v-reveal class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p id="impact-title" class="eyebrow-editorial">{{ impactContent.eyebrow }}</p>
          <NuxtLink v-if="impactPageAvailable" :to="impactContent.cta.to" class="link-arrow">
            {{ impactContent.cta.label }} <ArrowRight :size="14" aria-hidden="true" />
          </NuxtLink>
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-x-6 sm:gap-x-8 lg:grid-cols-4">
          <div
            v-for="(metric, index) in impactMetrics"
            :key="metric.label"
            v-reveal="index * 80"
            class="flex flex-col border-t border-charcoal/15 pb-6 pt-4"
          >
            <dd class="metric-figure-sm order-1">
              {{ formatNumber(metric.value) }}<span v-if="metric.suffix" class="ml-0.5 text-[0.55em] text-gold-text">{{ metric.suffix }}</span>
            </dd>
            <dt class="order-2 mt-2 text-[14px] font-semibold leading-[1.35] text-charcoal sm:text-[15px]">{{ metric.label }}</dt>
            <dd class="order-3 mt-0.5 text-[12px] leading-5 text-slate-600">
              {{ metric.period }}<template v-if="metric.detail"> · {{ metric.detail }}</template>
            </dd>
          </div>
        </dl>
        <p class="text-[12px] leading-5 text-slate-600">{{ impactContent.source }}</p>
      </div>
    </div>
  </section>
</template>

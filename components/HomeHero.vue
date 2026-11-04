<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { heroContent } from '~/shared/home-content'

const visual = heroContent.visual

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
  <section class="relative overflow-hidden bg-ivory pb-14 sm:pb-16 lg:pb-20" aria-labelledby="hero-title">
    <div class="page-shell pt-12 sm:pt-16 lg:pt-20">
      <div class="grid items-center gap-10 lg:min-h-[500px] lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] lg:gap-14 xl:gap-20">
        <!-- Left: editorial copy -->
        <div class="max-w-[600px]">
          <p class="eyebrow-editorial enter">{{ heroContent.eyebrow }}</p>

          <h1 id="hero-title" class="hero-title enter mt-4" style="--enter-delay: 50ms">
            {{ heroContent.headline.lead }}
            <span class="hero-accent">{{ heroContent.headline.accent }}</span>
          </h1>

          <p class="enter mt-5 max-w-[540px] text-[16px] leading-[1.6] text-slate-600 sm:text-[17px]" style="--enter-delay: 100ms">
            {{ heroContent.supporting }}
          </p>

          <div class="enter mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row" style="--enter-delay: 150ms">
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
        <figure class="enter-visual relative w-full max-w-[640px] lg:max-w-none lg:justify-self-end">
          <img
            :src="visual.src"
            :srcset="visual.srcset"
            sizes="(min-width: 1024px) 55vw, 92vw"
            :alt="visual.alt"
            :width="visual.width"
            :height="visual.height"
            fetchpriority="high"
            decoding="async"
            class="block h-auto w-full rounded-2xl object-contain"
            style="mask-image: linear-gradient(to bottom, #000 90%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, #000 90%, transparent 100%)"
          />
        </figure>
      </div>
    </div>
  </section>
</template>

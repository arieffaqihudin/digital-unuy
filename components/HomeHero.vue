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
      imagesizes: '(min-width: 1280px) 1180px, 100vw',
      fetchpriority: 'high'
    }
  ]
})
</script>

<template>
  <section class="relative overflow-hidden bg-ivory" aria-labelledby="hero-title">
    <div class="mx-auto w-full max-w-[1360px] px-5 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
      <div class="mx-auto flex max-w-[1180px] flex-col items-center text-center">
        <p class="eyebrow-editorial animate-fade-up">{{ heroContent.eyebrow }}</p>

        <h1 id="hero-title" class="hero-title mt-5 animate-fade-up [animation-delay:80ms] sm:mt-6">
          Transformasi Digital UNU Yogyakarta untuk Menghadirkan Layanan yang
          <span class="hero-accent whitespace-nowrap">Lebih Baik</span>, Operasional yang
          <span class="hero-accent whitespace-nowrap">Lebih Efisien</span>, dan Kinerja Institusi yang
          <span class="hero-accent whitespace-nowrap">Lebih Terukur</span>
        </h1>

        <p class="mt-6 max-w-[700px] animate-fade-up text-[16px] [animation-delay:160ms] leading-[1.7] text-slate-600 sm:text-[18px]">
          {{ heroContent.supporting }}
        </p>

        <div class="mt-8 flex w-full animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:w-auto sm:flex-row">
          <AppButton :to="heroContent.primaryCta.to" variant="dark" size="lg">
            {{ heroContent.primaryCta.label }}
            <template #right><ArrowRight :size="16" aria-hidden="true" /></template>
          </AppButton>
          <AppButton :to="heroContent.secondaryCta.to" variant="primary" size="lg">
            {{ heroContent.secondaryCta.label }}
          </AppButton>
        </div>
      </div>

      <figure class="mx-auto mt-10 max-w-[1180px] animate-fade-up [animation-delay:340ms] sm:mt-14">
        <div
          class="hero-visual-mask overflow-hidden rounded-t-2xl border border-b-0 border-line-warm bg-white shadow-[0_30px_80px_-50px_rgba(28,26,26,0.4)]"
        >
          <img
            :src="visual.src"
            :srcset="visual.srcset"
            sizes="(min-width: 1280px) 1180px, 100vw"
            :alt="visual.alt"
            :width="visual.width"
            :height="visual.height"
            fetchpriority="high"
            decoding="async"
            class="block h-[400px] w-full object-cover object-left-top md:h-auto"
          />
        </div>
        <figcaption class="mt-3 text-center text-[12px] leading-5 text-slate-600">
          Tangkapan layar · {{ visual.caption }}
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.hero-visual-mask {
  -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 58%, transparent 100%);
}

@media (max-width: 767px) {
  .hero-visual-mask {
    -webkit-mask-image: linear-gradient(to bottom, #000 58%, transparent 100%),
      linear-gradient(to right, #000 82%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 58%, transparent 100%),
      linear-gradient(to right, #000 82%, transparent 100%);
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
  }
}
</style>

<script setup lang="ts">
import { heroContent } from '~/shared/home-content'

const { building, screens } = heroContent.visual
const [layanan, dokumen, lacak] = screens

useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      type: 'image/webp',
      href: building.src,
      imagesrcset: building.srcset,
      imagesizes: '(min-width: 1024px) 600px, 92vw',
      fetchpriority: 'high'
    }
  ]
})

const frame =
  'overflow-hidden rounded-lg border border-white/80 bg-white shadow-[0_28px_50px_-26px_rgba(28,26,26,0.5),0_0_0_1px_rgba(28,26,26,0.06)] lg:rounded-xl'
</script>

<template>
  <figure class="mx-auto max-w-[1280px]">
    <div class="relative mx-auto aspect-[4/4.1] w-full md:aspect-[1200/660]">
      <!-- Anchor: the campus building -->
      <div
        class="absolute bottom-0 left-[2%] w-[96%] animate-fade-up [animation-delay:340ms] md:left-[25%] md:w-[50%]"
      >
        <img
          :src="building.src"
          :srcset="building.srcset"
          sizes="(min-width: 768px) 600px, 96vw"
          :alt="building.alt"
          :width="building.width"
          :height="building.height"
          fetchpriority="high"
          decoding="async"
          class="block h-auto w-full"
        />
      </div>

      <!-- Layer 1: service catalogue (left) -->
      <div
        class="absolute bottom-[6%] left-0 z-10 w-[56%] animate-fade-up [animation-delay:520ms] md:bottom-auto md:left-[2%] md:top-[31%] md:w-[35%]"
      >
        <div :class="frame" class="[transform:perspective(1400px)_rotateY(10deg)_rotateX(1deg)]">
          <img :src="layanan.src" :alt="layanan.alt" width="1080" height="585" decoding="async" class="block h-auto w-full" />
        </div>
      </div>

      <!-- Layer 2: documentation (right, upper) -->
      <div
        class="absolute right-[2%] top-[5%] z-10 hidden w-[32%] animate-fade-up [animation-delay:620ms] md:block"
      >
        <div :class="frame" class="[transform:perspective(1400px)_rotateY(-10deg)_rotateX(1deg)]">
          <img :src="dokumen.src" :alt="dokumen.alt" width="1080" height="585" decoding="async" class="block h-auto w-full" />
        </div>
      </div>

      <!-- Layer 3: tracking (right, lower) -->
      <div
        class="absolute bottom-[10%] right-[5%] z-10 hidden w-[29%] animate-fade-up [animation-delay:720ms] lg:block"
      >
        <div :class="frame" class="[transform:perspective(1400px)_rotateY(-8deg)_rotateX(1deg)]">
          <img :src="lacak.src" :alt="lacak.alt" width="1080" height="585" decoding="async" class="block h-auto w-full" />
        </div>
      </div>
    </div>
  </figure>
</template>

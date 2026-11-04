<script setup lang="ts">
import { GraduationCap, Landmark, UsersRound } from 'lucide-vue-next'

const cycles = [
  {
    icon: GraduationCap,
    title: 'Mahasiswa',
    text: 'Dari pendaftaran hingga menjadi alumni.'
  },
  {
    icon: UsersRound,
    title: 'Dosen & Pegawai',
    text: 'Dari pengangkatan hingga purna tugas.'
  },
  {
    icon: Landmark,
    title: 'Institusi',
    text: 'Dari perencanaan hingga akreditasi.'
  }
]

const root = ref<HTMLElement | null>(null)
const animate = ref(false)
const drawn = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!root.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    drawn.value = true
    return
  }
  if (root.value.getBoundingClientRect().top < window.innerHeight * 0.9) {
    drawn.value = true
    return
  }
  animate.value = true
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      drawn.value = true
      observer?.disconnect()
      observer = null
    },
    { threshold: 0.25 }
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    ref="root"
    class="about-cycles relative"
    :data-animate="animate ? 'true' : undefined"
    :class="drawn ? 'is-drawn' : ''"
  >
    <div class="absolute bottom-6 left-6 top-6 w-px bg-gold/30 lg:hidden" aria-hidden="true" />

    <svg class="pointer-events-none absolute inset-x-0 top-0 hidden h-16 w-full lg:block" viewBox="0 0 1000 64" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path
        class="cycle-line"
        d="M 70 32 C 220 -4 330 68 500 32 S 780 -4 930 32"
        stroke="#BF8B15"
        stroke-opacity=".55"
        stroke-width="1.5"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <ol class="relative grid gap-9 lg:grid-cols-3 lg:gap-10">
      <li
        v-for="(cycle, index) in cycles"
        :key="cycle.title"
        class="cycle-node relative flex gap-5 lg:block"
        :style="{ '--cycle-delay': `${index * 120}ms` }"
      >
        <div class="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-unu-green/25 bg-white text-unu-green lg:h-16 lg:w-16">
          <component :is="cycle.icon" :size="22" :stroke-width="1.6" aria-hidden="true" />
        </div>
        <div class="min-w-0 lg:mt-6">
          <p class="text-[11px] font-bold tabular-nums tracking-[0.14em] text-gold-dark">0{{ index + 1 }}</p>
          <h3 class="mt-1.5 text-[21px] font-semibold leading-[1.25] tracking-[-0.02em] text-charcoal">{{ cycle.title }}</h3>
          <p class="mt-2 max-w-[280px] text-[15px] leading-6 text-slate-600">{{ cycle.text }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.cycle-line {
  stroke-dashoffset: 0;
}

.about-cycles[data-animate='true'] .cycle-line {
  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;
  transition: stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1) 120ms;
}

.about-cycles[data-animate='true'].is-drawn .cycle-line {
  stroke-dashoffset: 0;
}

.about-cycles[data-animate='true'] .cycle-node {
  opacity: 0.001;
  transform: translateY(12px);
  transition:
    opacity 480ms cubic-bezier(0.22, 1, 0.36, 1) var(--cycle-delay),
    transform 480ms cubic-bezier(0.22, 1, 0.36, 1) var(--cycle-delay);
}

.about-cycles[data-animate='true'].is-drawn .cycle-node {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .about-cycles[data-animate='true'] .cycle-line,
  .about-cycles[data-animate='true'] .cycle-node {
    opacity: 1;
    transform: none;
    transition: none;
    stroke-dashoffset: 0;
  }
}
</style>

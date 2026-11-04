<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { caseStudyContent, impactContent, impactMetrics } from '~/shared/home-content'

const router = useRouter()
const impactPageAvailable = computed(() => router.resolve(impactContent.cta.to).matched.length > 0)
const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value)

const lead = impactMetrics[0]
const rest = impactMetrics.slice(1)
const study = caseStudyContent
const fill = `${((study.produced / study.total) * 100).toFixed(1)}%`

// Count-up: once, short, final value always equals source; skipped for reduced motion.
const root = ref<HTMLElement | null>(null)
const shown = ref<number[]>(impactMetrics.map((metric) => metric.value))
let observer: IntersectionObserver | null = null
let frame = 0

onMounted(() => {
  if (!root.value || !('IntersectionObserver' in window)) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (root.value.getBoundingClientRect().top < window.innerHeight * 0.6) return

  shown.value = impactMetrics.map(() => 0)
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer?.disconnect()
      observer = null
      const duration = 900
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        shown.value = impactMetrics.map((metric) => Math.round(metric.value * eased))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    },
    { threshold: 0.3 }
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <section id="dampak" ref="root" class="scroll-mt-24 bg-charcoal text-white" aria-labelledby="impact-title">
    <div class="page-shell py-16 md:py-20 lg:py-28">
      <div v-reveal class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 id="impact-title" class="eyebrow-editorial !text-sage">{{ impactContent.eyebrow }}</h2>
        <NuxtLink v-if="impactPageAvailable" :to="impactContent.cta.to" class="link-arrow !text-white hover:!text-gold-soft">
          {{ impactContent.cta.label }} <ArrowRight :size="14" aria-hidden="true" />
        </NuxtLink>
      </div>

      <!-- Focal point: 88% -->
      <div class="mt-10 grid items-end gap-8 lg:mt-14 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-20">
        <div v-reveal>
          <p
            class="font-semibold tabular-nums leading-[0.9] tracking-[-0.05em] text-white"
            style="font-size: clamp(6rem, 3rem + 14vw, 13rem)"
            :aria-label="`${lead.value}${lead.suffix || ''}`"
          >
            {{ formatNumber(shown[0]) }}<span class="ml-1 text-[0.45em] text-gold-soft">{{ lead.suffix }}</span>
          </p>
        </div>
        <div v-reveal="100" class="max-w-[460px] pb-2">
          <p class="text-[20px] font-semibold leading-snug tracking-[-0.02em] sm:text-[22px]">{{ study.heading }}</p>
          <p class="mt-2 text-[14px] leading-6 text-white/70">
            {{ lead.detail }} portofolio · {{ lead.period }}
          </p>
          <div class="mt-6" role="img" :aria-label="`${study.produced} dari ${study.total} portofolio dihasilkan otomatis`">
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div class="bar-fill h-full rounded-full bg-gold-soft" :style="{ width: fill }" />
            </div>
          </div>
        </div>
      </div>

      <!-- Supporting metrics: editorial row -->
      <dl class="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-3 lg:mt-20">
        <div v-for="(metric, index) in rest" :key="metric.label" v-reveal="index * 90" class="flex flex-col border-t border-white/20 pt-5">
          <dt class="order-2 mt-3 text-[15px] font-semibold leading-snug">{{ metric.label }}</dt>
          <dd class="order-1 text-[40px] font-semibold tabular-nums leading-none tracking-[-0.04em] sm:text-[44px] lg:text-[52px]">
            {{ formatNumber(shown[index + 1]) }}
          </dd>
          <dd class="order-3 mt-0.5 text-[12px] leading-5 text-white/60">{{ metric.period }}</dd>
        </div>
      </dl>
      <p class="mt-10 text-[12px] leading-5 text-white/50">{{ impactContent.source }}</p>
    </div>
  </section>
</template>

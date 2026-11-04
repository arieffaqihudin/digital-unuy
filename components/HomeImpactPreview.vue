<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { impactContent, impactMetrics } from '~/shared/home-content'

const router = useRouter()
const impactPageAvailable = computed(() => router.resolve(impactContent.cta.to).matched.length > 0)
const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value)
</script>

<template>
  <section class="bg-ivory pb-16 pt-6 sm:pb-20 lg:pb-28" aria-labelledby="impact-title">
    <div class="page-shell">
      <div class="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div class="max-w-[560px]">
          <p class="eyebrow-editorial">{{ impactContent.eyebrow }}</p>
          <h2 id="impact-title" class="section-title mt-4">{{ impactContent.heading }}</h2>
          <p class="mt-5 text-[16px] leading-[1.7] text-slate-600">{{ impactContent.description }}</p>
          <AppButton v-if="impactPageAvailable" :to="impactContent.cta.to" variant="dark" class="mt-8">
            {{ impactContent.cta.label }}
            <template #right><ArrowRight :size="15" aria-hidden="true" /></template>
          </AppButton>
        </div>

        <div>
          <dl class="grid gap-x-10 sm:grid-cols-2">
            <div
              v-for="metric in impactMetrics"
              :key="metric.label"
              class="border-t border-charcoal/15 pb-8 pt-5"
            >
              <dd class="metric-figure">
                {{ formatNumber(metric.value) }}<span v-if="metric.suffix" class="ml-0.5 text-[0.55em] text-gold-text">{{ metric.suffix }}</span>
              </dd>
              <dt class="mt-3 text-[15px] font-semibold leading-[1.4] text-charcoal">{{ metric.label }}</dt>
              <dd class="mt-1 text-[13px] leading-5 text-slate-600">
                {{ metric.period }}<template v-if="metric.detail"> — {{ metric.detail }}.</template>
              </dd>
            </div>
          </dl>
          <p class="border-t border-charcoal/15 pt-4 text-[12px] leading-5 text-slate-600">{{ impactContent.source }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

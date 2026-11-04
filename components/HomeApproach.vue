<script setup lang="ts">
import { GraduationCap, Landmark, Users } from 'lucide-vue-next'
import { approachContent } from '~/shared/home-content'

const icons = { academic: GraduationCap, users: Users, landmark: Landmark } as const
</script>

<template>
  <section class="section-space bg-white" aria-labelledby="approach-title">
    <div class="page-shell">
      <div v-reveal class="mx-auto max-w-[720px] text-center">
        <p class="eyebrow-editorial">{{ approachContent.eyebrow }}</p>
        <h2 id="approach-title" class="section-title mt-4">{{ approachContent.heading }}</h2>
      </div>

      <div v-reveal class="relative mx-auto mt-12 max-w-[1000px] md:mt-16 md:pt-[64px]">
        <!-- Loop line joining the first and third cycle (desktop) -->
        <svg
          class="flow-arc pointer-events-none absolute left-0 top-0 hidden h-[64px] w-full md:block"
          viewBox="0 0 100 64"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M16.67 64 C16.67 -8 83.33 -8 83.33 64"
            stroke="#BF8B15"
            stroke-opacity="0.7"
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <p
          class="absolute left-1/2 top-[2px] hidden -translate-x-1/2 bg-white px-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-dark md:block"
        >
          {{ approachContent.loopLabel }}
        </p>

        <ol class="grid gap-10 md:grid-cols-3 md:gap-0">
          <li
            v-for="(cycle, index) in approachContent.cycles"
            :key="cycle.title"
            class="relative flex items-start gap-5 md:flex-col md:items-center md:text-center"
          >
            <!-- Connector to the next cycle -->
            <span
              v-if="index < approachContent.cycles.length - 1"
              class="flow-line absolute left-[35px] top-[72px] h-[calc(100%-32px)] w-px bg-gold/60 md:left-[calc(50%+72px)] md:top-[56px] md:h-px md:w-[calc(100%-144px)]"
              :style="{ '--flow-delay': `${300 + index * 250}ms` }"
              aria-hidden="true"
            />

            <span
              class="flow-node relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full border border-gold/60 bg-white text-unu-green md:h-28 md:w-28"
              :style="{ '--flow-delay': `${index * 200}ms` }"
              aria-hidden="true"
            >
              <span class="absolute inset-[6px] rounded-full bg-unu-green-soft md:inset-2" />
              <component :is="icons[cycle.icon as keyof typeof icons]" class="relative h-7 w-7 md:h-9 md:w-9" :stroke-width="1.6" />
            </span>

            <div class="min-w-0 pt-1 md:mt-5 md:px-4 md:pt-0">
              <p class="text-[12px] font-semibold tabular-nums text-gold-dark">{{ String(index + 1).padStart(2, '0') }}</p>
              <h3 class="mt-1 text-[20px] font-semibold leading-[1.25] tracking-[-0.02em] md:text-[22px]">{{ cycle.title }}</h3>
              <p class="mt-1.5 text-[15px] leading-6 text-slate-600">{{ cycle.text }}</p>
              <ul class="mt-3 flex flex-wrap gap-2 md:justify-center">
                <li
                  v-for="example in cycle.examples"
                  :key="example"
                  class="rounded-full border border-line-warm bg-ivory px-3 py-1 text-[12px] font-medium leading-5 text-slate-700"
                >
                  {{ example }}
                </li>
              </ul>
            </div>
          </li>
        </ol>
      </div>

      <p v-reveal class="mt-10 text-center md:hidden">
        <span class="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-dark">{{ approachContent.loopLabel }}</span>
      </p>
      <div v-reveal class="mt-8 text-center md:mt-12">
        <NuxtLink to="/tentang" class="link-arrow">Mengenal Direktorat →</NuxtLink>
      </div>
    </div>
  </section>
</template>

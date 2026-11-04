<script setup lang="ts">
import { GraduationCap, Landmark, Users } from 'lucide-vue-next'
import { approachContent } from '~/shared/home-content'

withDefaults(defineProps<{ hideLink?: boolean; tag?: 'h1' | 'h2' }>(), { hideLink: false, tag: 'h2' })

const icons = { academic: GraduationCap, users: Users, landmark: Landmark } as const
const selected = ref(0)
const chosen = computed(() => approachContent.cycles[selected.value])
</script>

<template>
  <section class="section-space bg-white" aria-labelledby="approach-title">
    <div class="page-shell">
      <div v-reveal class="mx-auto max-w-[720px] text-center">
        <p class="eyebrow-editorial">{{ approachContent.eyebrow }}</p>
        <component :is="tag" id="approach-title" class="section-title mt-4">{{ approachContent.heading }}</component>
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

            <button
              type="button"
              class="flow-node group relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full border bg-white transition-[border-color,box-shadow,color] duration-hover ease-unu md:h-28 md:w-28"
              :class="selected === index ? 'border-unu-green text-unu-green shadow-[0_0_0_4px_rgba(51,116,73,0.12)]' : 'border-gold/60 text-unu-green/70 hover:border-unu-green hover:text-unu-green'"
              :style="{ '--flow-delay': `${index * 200}ms` }"
              :aria-pressed="selected === index"
              :aria-label="`Tampilkan ringkasan siklus ${cycle.title}`"
              @click="selected = index"
            >
              <span
                class="absolute inset-[6px] rounded-full transition-colors duration-hover ease-unu md:inset-2"
                :class="selected === index ? 'bg-unu-green-soft' : 'bg-ivory'"
              />
              <component :is="icons[cycle.icon as keyof typeof icons]" class="relative h-7 w-7 md:h-9 md:w-9" :stroke-width="1.6" aria-hidden="true" />
            </button>

            <div class="min-w-0 pt-1 md:mt-5 md:px-4 md:pt-0">
              <p class="text-[12px] font-semibold tabular-nums text-gold-dark">{{ String(index + 1).padStart(2, '0') }}</p>
              <h3 class="mt-1 text-[20px] font-semibold leading-[1.25] tracking-[-0.02em] transition-colors duration-hover md:text-[22px]" :class="selected === index ? 'text-charcoal' : 'text-charcoal/75'">{{ cycle.title }}</h3>
              <p class="mt-1.5 text-[15px] leading-6 text-slate-600">{{ cycle.text }}</p>
            </div>
          </li>
        </ol>

        <!-- Selected cycle summary -->
        <div class="mt-10 border-t border-line-warm pt-6 md:mt-12" aria-live="polite">
          <Transition name="swap" mode="out-in">
            <div :key="chosen.title" class="flex flex-wrap items-baseline gap-x-6 gap-y-3 md:justify-center">
              <p class="text-[13px] font-semibold uppercase tracking-[0.14em] text-unu-green">{{ chosen.title }}</p>
              <ul class="flex flex-wrap gap-2">
                <li
                  v-for="example in chosen.examples"
                  :key="example"
                  class="rounded-full border border-unu-green/25 bg-unu-green-soft px-3.5 py-1.5 text-[13px] font-medium leading-5 text-unu-green-dark"
                >
                  {{ example }}
                </li>
              </ul>
            </div>
          </Transition>
        </div>
      </div>

      <p v-reveal class="mt-10 text-center md:hidden">
        <span class="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-dark">{{ approachContent.loopLabel }}</span>
      </p>
      <div v-if="!hideLink" v-reveal class="mt-8 text-center md:mt-12">
        <NuxtLink to="/tentang" class="link-arrow">Mengenal Direktorat →</NuxtLink>
      </div>
    </div>
  </section>
</template>

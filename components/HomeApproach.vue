<script setup lang="ts">
import { ArrowRight, GraduationCap, Landmark, Sparkles, Users } from 'lucide-vue-next'
import { approachContent } from '~/shared/home-content'

withDefaults(defineProps<{ hideLink?: boolean; tag?: 'h1' | 'h2' }>(), { hideLink: false, tag: 'h2' })

const icons = { academic: GraduationCap, users: Users, landmark: Landmark } as const
const selected = ref<number | null>(null)
const toggle = (index: number) => (selected.value = selected.value === index ? null : index)

// Desktop composition on a 1000 x 560 canvas: node centres.
const hub = { x: 500, y: 270 }
const nodes = [
  { x: 170, y: 95 },
  { x: 830, y: 95 },
  { x: 500, y: 470 }
]
const pct = (n: { x: number; y: number }) => ({ left: `${n.x / 10}%`, top: `${(n.y / 560) * 100}%` })
// Cross links between cycles (interdependence), drawn behind the nodes.
const cross = [
  [0, 1],
  [1, 2],
  [2, 0]
]
const active = (index: number) => selected.value === index
const dim = (index: number) => selected.value !== null && selected.value !== index
</script>

<template>
  <section class="section-space bg-white" aria-labelledby="approach-title">
    <div class="page-shell">
      <div v-reveal class="mx-auto max-w-[720px] text-center">
        <p class="eyebrow-editorial">{{ approachContent.eyebrow }}</p>
        <component :is="tag" id="approach-title" class="section-title mt-4">{{ approachContent.heading }}</component>
      </div>

      <!-- Desktop: hub with three cycles around it -->
      <div v-reveal class="relative mx-auto mt-14 hidden h-[560px] max-w-[900px] lg:block xl:max-w-[1000px]">
        <svg class="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path
            v-for="([a, b], i) in cross"
            :key="`c${i}`"
            :d="`M${nodes[a].x} ${nodes[a].y} L${nodes[b].x} ${nodes[b].y}`"
            stroke="#BF8B15"
            stroke-opacity="0.45"
            stroke-width="1.25"
            stroke-dasharray="4 6"
            vector-effect="non-scaling-stroke"
          />
          <path
            v-for="(node, i) in nodes"
            :key="`s${i}`"
            :d="`M${hub.x} ${hub.y} L${node.x} ${node.y}`"
            class="flow-draw"
            stroke-dasharray="1"
            :stroke="active(i) ? '#337449' : '#BF8B15'"
            :stroke-opacity="active(i) ? 1 : 0.8"
            :stroke-width="active(i) ? 2 : 1.5"
            vector-effect="non-scaling-stroke"
            pathLength="1"
            :style="{ '--flow-delay': `${250 + i * 150}ms`, transition: 'stroke 220ms, stroke-width 220ms, stroke-opacity 220ms' }"
          />
        </svg>

        <!-- Hub -->
        <div class="flow-node absolute z-10 -translate-x-1/2 -translate-y-1/2" :style="pct(hub)">
          <div class="grid h-[168px] w-[168px] place-items-center rounded-full bg-unu-green p-5 text-center text-white shadow-soft ring-8 ring-unu-green-soft">
            <div>
              <Sparkles :size="20" :stroke-width="1.6" class="mx-auto text-gold-soft" aria-hidden="true" />
              <p class="mt-2 text-[16px] font-semibold leading-[1.2] tracking-[-0.01em]">{{ approachContent.hub.label }}</p>
            </div>
          </div>
        </div>

        <!-- Cycles -->
        <button
          v-for="(cycle, index) in approachContent.cycles"
          :key="cycle.title"
          type="button"
          class="flow-node absolute z-10 w-[288px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-5 text-left transition-[border-color,box-shadow,opacity] duration-hover ease-unu hover:border-unu-green/60"
          :class="[active(index) ? 'border-unu-green shadow-[0_0_0_4px_rgba(51,116,73,0.12)]' : 'border-line-warm shadow-card', dim(index) ? 'opacity-60' : '']"
          :style="{ ...pct(nodes[index]), '--flow-delay': `${index * 150}ms` }"
          :aria-pressed="active(index)"
          @click="toggle(index)"
        >
          <span class="flex items-center gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-unu-green-soft text-unu-green">
              <component :is="icons[cycle.icon as keyof typeof icons]" :size="20" :stroke-width="1.6" aria-hidden="true" />
            </span>
            <span>
              <span class="block text-[12px] font-semibold tabular-nums text-gold-dark">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="block text-[19px] font-semibold leading-tight tracking-[-0.02em]">{{ cycle.title }}</span>
            </span>
          </span>
          <span class="mt-3 block text-[14px] leading-5 text-slate-600">{{ cycle.text }}</span>
          <span class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="item in cycle.capabilities"
              :key="item"
              class="rounded-full border px-2.5 py-1 text-[12px] font-medium leading-4 transition-colors duration-hover"
              :class="active(index) ? 'border-unu-green/30 bg-unu-green-soft text-unu-green-dark' : 'border-line-warm bg-ivory text-slate-700'"
            >{{ item }}</span>
          </span>
        </button>
      </div>

      <!-- Mobile / tablet: vertical connected -->
      <div v-reveal class="mx-auto mt-12 max-w-[560px] lg:hidden">
        <div class="flex items-center gap-4 rounded-2xl bg-unu-green p-5 text-white">
          <Sparkles :size="22" :stroke-width="1.6" class="shrink-0 text-gold-soft" aria-hidden="true" />
          <div>
            <p class="text-[17px] font-semibold leading-tight">{{ approachContent.hub.label }}</p>
            <p class="mt-1 text-[13px] leading-5 text-white/75">{{ approachContent.hub.note }}</p>
          </div>
        </div>
        <ol class="relative ml-6 border-l-2 border-gold/60 pb-1 pt-1">
          <li v-for="(cycle, index) in approachContent.cycles" :key="cycle.title" class="relative pl-7 pt-6">
            <span class="absolute -left-[13px] top-[34px] grid h-6 w-6 place-items-center rounded-full border-2 border-gold bg-white" aria-hidden="true">
              <span class="h-2 w-2 rounded-full bg-gold" />
            </span>
            <div class="rounded-2xl border border-line-warm bg-white p-4 shadow-card">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-unu-green-soft text-unu-green">
                  <component :is="icons[cycle.icon as keyof typeof icons]" :size="20" :stroke-width="1.6" aria-hidden="true" />
                </span>
                <h3 class="text-[18px] font-semibold leading-tight tracking-[-0.02em]">{{ cycle.title }}</h3>
              </div>
              <p class="mt-2.5 text-[14px] leading-5 text-slate-600">{{ cycle.text }}</p>
              <ul class="mt-3 flex flex-wrap gap-1.5">
                <li v-for="item in cycle.capabilities" :key="item" class="rounded-full border border-line-warm bg-ivory px-2.5 py-1 text-[12px] font-medium leading-4 text-slate-700">{{ item }}</li>
              </ul>
            </div>
          </li>
        </ol>
      </div>

      <div v-if="!hideLink" v-reveal class="mt-12 text-center">
        <NuxtLink :to="approachContent.cta.to" class="link-arrow">{{ approachContent.cta.label }} <ArrowRight :size="14" aria-hidden="true" /></NuxtLink>
      </div>
    </div>
  </section>
</template>

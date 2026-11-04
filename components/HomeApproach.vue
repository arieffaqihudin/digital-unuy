<script setup lang="ts">
import { ArrowRight, ChevronDown, GraduationCap, Landmark, UsersRound } from 'lucide-vue-next'
import { approachContent } from '~/shared/home-content'

const icons = { academic: GraduationCap, users: UsersRound, landmark: Landmark } as const
const openIndex = ref<number | null>(0)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <section class="section-space bg-white" aria-labelledby="approach-title">
    <div class="page-shell grid gap-10 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] lg:items-start lg:gap-14 xl:gap-16">
      <!-- Editorial copy -->
      <div v-reveal class="max-w-[440px] lg:pt-2">
        <p class="eyebrow-editorial">{{ approachContent.eyebrow }}</p>
        <h2 id="approach-title" class="mt-4 text-[2rem] font-semibold leading-[1.16] tracking-[-0.03em] text-charcoal sm:text-[2.25rem] lg:text-[2.5rem]">
          {{ approachContent.heading }}
        </h2>
        <p class="mt-5 text-[16px] leading-[1.65] text-slate-600">
          Kami membangun sistem berdasarkan perjalanan mahasiswa, dosen dan pegawai, serta kebutuhan institusi.
        </p>
        <NuxtLink :to="approachContent.cta.to" class="link-arrow mt-6">
          {{ approachContent.cta.label }} <ArrowRight :size="14" aria-hidden="true" />
        </NuxtLink>
      </div>

      <!-- Interactive ecosystem panel -->
      <div v-reveal="80" class="rounded-[20px] border border-line-warm bg-[#F7F4E8] p-6 sm:p-7 lg:p-8">
        <div class="border-b border-line-warm pb-4">
          <h3 class="text-[17px] font-semibold leading-6 tracking-[-0.01em] text-charcoal">{{ approachContent.hub.label }}</h3>
          <p class="mt-1 text-[13px] leading-5 text-slate-500">{{ approachContent.hub.note }}</p>
        </div>

        <div class="mt-3 space-y-2.5">
          <div
            v-for="(cycle, index) in approachContent.cycles"
            :key="cycle.title"
            class="rounded-[14px] border transition-[border-color,background-color] duration-200 ease-unu"
            :class="openIndex === index ? 'border-unu-green bg-white' : 'border-line-warm bg-white/55 hover:border-unu-green/35 hover:bg-white'"
          >
            <button
              :id="`approach-trigger-${index}`"
              type="button"
              class="flex w-full items-start gap-3.5 px-4 py-4 text-left sm:px-5"
              :aria-expanded="openIndex === index"
              :aria-controls="`approach-panel-${index}`"
              @click="toggle(index)"
            >
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-unu-green/20 bg-unu-green-soft text-unu-green">
                <component :is="icons[cycle.icon as keyof typeof icons]" :size="19" :stroke-width="1.7" aria-hidden="true" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-[17px] font-semibold leading-6 tracking-[-0.01em] text-charcoal">{{ cycle.title }}</span>
                <span class="mt-0.5 block text-[14px] leading-5 text-slate-500">{{ cycle.text }}</span>
              </span>
              <ChevronDown
                :size="17"
                class="mt-1.5 shrink-0 text-slate-400 transition-transform duration-300 ease-unu"
                :class="openIndex === index ? 'rotate-180 text-unu-green' : ''"
                aria-hidden="true"
              />
            </button>

            <div
              :id="`approach-panel-${index}`"
              role="region"
              :aria-labelledby="`approach-trigger-${index}`"
              :aria-hidden="openIndex === index ? undefined : 'true'"
              class="grid transition-[grid-template-rows] duration-300 ease-unu"
              :class="openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="overflow-hidden">
                <div
                  class="px-4 pb-4 pt-1 sm:px-5"
                  :class="openIndex === index ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'"
                  style="transition: opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), transform 300ms cubic-bezier(0.22, 1, 0.36, 1)"
                >
                  <ul class="grid gap-2 border-t border-line-warm pt-3 sm:grid-cols-3">
                    <li v-for="item in cycle.capabilities" :key="item" class="flex items-center gap-2 text-[13px] leading-5 text-slate-600">
                      <span class="h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

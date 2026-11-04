<script setup lang="ts">
import { resolveComponent } from 'vue'
import { ArrowRight, ArrowUpRight } from 'lucide-vue-next'
import { showcaseContent } from '~/shared/home-content'
import type { DigitalPlatformDTO } from '~/shared/types'

defineProps<{ platforms: DigitalPlatformDTO[] }>()

const NuxtLinkComponent = resolveComponent('NuxtLink')
const { product, screens } = showcaseContent
const active = ref(0)
const tabRefs = ref<HTMLElement[]>([])

function select(index: number, focus = false) {
  active.value = (index + screens.length) % screens.length
  if (focus) nextTick(() => tabRefs.value[active.value]?.focus())
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    select(active.value + 1, true)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    select(active.value - 1, true)
  } else if (event.key === 'Home') {
    event.preventDefault()
    select(0, true)
  } else if (event.key === 'End') {
    event.preventDefault()
    select(screens.length - 1, true)
  }
}

const statusDot = (status: string) =>
  status === 'Aktif' ? 'bg-unu-green' : status === 'Pilot' ? 'bg-sky-500' : status === 'Tidak Aktif' ? 'bg-slate-300' : 'bg-amber-500'
</script>

<template>
  <section class="section-space bg-ivory" aria-labelledby="ecosystem-title">
    <div class="page-shell">
      <HomeSectionHead :eyebrow="showcaseContent.eyebrow" :title="showcaseContent.heading" title-id="ecosystem-title">
        <template #action>
          <NuxtLink to="/ekosistem-digital" class="link-arrow">Lihat direktori <ArrowUpRight :size="14" aria-hidden="true" /></NuxtLink>
        </template>
      </HomeSectionHead>

      <div class="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:items-center lg:gap-12">
        <div v-reveal class="min-w-0">
          <div
            :id="`showcase-panel`"
            role="tabpanel"
            :aria-labelledby="`showcase-tab-${screens[active].key}`"
            class="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line-warm bg-white shadow-[0_30px_80px_-55px_rgba(28,26,26,0.45)] md:aspect-[2160/1170]"
          >
            <img
              v-for="(screen, index) in screens"
              :key="screen.key"
              :src="screen.src"
              :srcset="screen.srcset"
              sizes="(min-width: 1024px) 700px, 100vw"
              :alt="screen.alt"
              width="2160"
              height="1170"
              loading="lazy"
              decoding="async"
              :aria-hidden="index !== active"
              class="absolute inset-0 h-full w-full object-cover object-left-top transition-opacity duration-image ease-unu"
              :class="index === active ? 'opacity-100' : 'opacity-0'"
            />
          </div>

          <div class="mt-4 flex w-full max-w-full gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Tampilan produk" @keydown="onKeydown">
            <button
              v-for="(screen, index) in screens"
              :id="`showcase-tab-${screen.key}`"
              :key="screen.key"
              :ref="(el) => { if (el) tabRefs[index] = el as HTMLElement }"
              type="button"
              role="tab"
              aria-controls="showcase-panel"
              :aria-selected="index === active"
              :tabindex="index === active ? 0 : -1"
              class="relative min-h-[44px] shrink-0 whitespace-nowrap px-3 text-[14px] sm:px-4 font-semibold transition-colors duration-micro"
              :class="index === active ? 'text-charcoal' : 'text-slate-600 hover:text-charcoal'"
              @click="select(index)"
            >
              {{ screen.tab }}
              <span
                class="absolute inset-x-3 bottom-0 h-[2px] origin-left rounded-full bg-unu-green transition-transform duration-hover ease-unu"
                :class="index === active ? 'scale-x-100' : 'scale-x-0'"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div v-reveal="120">
          <p class="eyebrow-editorial">{{ product.eyebrow }}</p>
          <h3 class="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[32px]">{{ product.name }}</h3>
          <dl class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px]">
            <div class="flex items-center gap-2">
              <dt class="sr-only">Cluster</dt>
              <dd class="font-medium text-slate-700">{{ product.cluster }}</dd>
            </div>
            <div class="flex items-center gap-2">
              <dt class="sr-only">Status implementasi</dt>
              <dd class="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-wide text-sky-800">
                {{ product.status }}
              </dd>
            </div>
          </dl>
          <p class="mt-5 text-[16px] leading-[1.65] text-slate-600">{{ product.summary }}</p>
          <p class="mt-3 min-h-[3rem] border-l-2 border-gold pl-3 text-[14px] leading-6 text-slate-700" aria-live="polite">
            {{ screens[active].caption }}
          </p>
          <AppButton :to="product.cta.to" class="mt-6">
            {{ product.cta.label }}
            <template #right><ArrowRight :size="15" aria-hidden="true" /></template>
          </AppButton>
        </div>
      </div>

      <div v-if="platforms.length" v-reveal class="mt-14 border-t border-charcoal/15 pt-6">
        <p class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-600">Platform lain dalam ekosistem</p>
        <ul class="no-scrollbar mt-4 flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-1 lg:overflow-visible">
          <li v-for="platform in platforms" :key="platform.id" class="w-[240px] shrink-0 snap-start lg:w-auto">
            <component
              :is="platform.url ? 'a' : NuxtLinkComponent"
              :href="platform.url || undefined"
              :to="platform.url ? undefined : '/ekosistem-digital'"
              :target="platform.url ? '_blank' : undefined"
              :rel="platform.url ? 'noopener noreferrer' : undefined"
              class="group flex min-h-[64px] items-center justify-between gap-3 rounded-lg border border-line-warm bg-white px-4 py-3 transition duration-hover ease-unu hover:border-unu-green/40 lg:rounded-none lg:border-0 lg:border-b lg:bg-transparent lg:px-0 lg:hover:border-unu-green/40"
            >
              <span class="min-w-0">
                <span class="block truncate text-[15px] font-semibold leading-5 transition-colors duration-micro group-hover:text-unu-green">{{ platform.name }}</span>
                <span class="mt-0.5 flex items-center gap-1.5 text-[12px] leading-5 text-slate-600">
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusDot(platform.status)" aria-hidden="true" />
                  {{ platform.status }} · {{ platform.category }}
                </span>
              </span>
              <ArrowUpRight :size="14" class="shrink-0 text-slate-400 transition duration-hover ease-unu group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-unu-green" aria-hidden="true" />
            </component>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-vue-next'
import type { DigitalPlatformDTO, PlatformCategoryDTO } from '~/shared/types'

const props = defineProps<{ platforms: DigitalPlatformDTO[]; categories: PlatformCategoryDTO[] }>()

const statusClasses: Record<string, string> = {
  'Sudah Rilis': 'border-unu-green/20 bg-unu-green-soft text-unu-green-dark',
  'Pilot / Beta': 'border-sky-200 bg-sky-50 text-sky-800',
  'Dalam Pengembangan': 'border-amber-200 bg-amber-50 text-amber-900'
}

// Featured product first, then CMS order.
const items = computed(() => [...props.platforms].sort((a, b) => Number(b.featured) - Number(a.featured)))
const active = ref(0)
const direction = ref(1)
const current = computed(() => items.value[active.value] || null)
const tabRefs = ref<HTMLElement[]>([])

function select(index: number, focus = false) {
  const count = items.value.length
  if (!count) return
  const next = (index + count) % count
  direction.value = next >= active.value ? 1 : -1
  active.value = next
  if (focus) nextTick(() => tabRefs.value[next]?.focus())
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    select(active.value + 1, true)
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    select(active.value - 1, true)
  } else if (event.key === 'Home') {
    event.preventDefault()
    select(0, true)
  } else if (event.key === 'End') {
    event.preventDefault()
    select(items.value.length - 1, true)
  }
}

// Touch swipe on the visual (horizontal only; vertical scroll is untouched).
let touchX = 0
let touchY = 0
const onTouchStart = (event: TouchEvent) => {
  touchX = event.touches[0].clientX
  touchY = event.touches[0].clientY
}
const onTouchEnd = (event: TouchEvent) => {
  const dx = event.changedTouches[0].clientX - touchX
  const dy = event.changedTouches[0].clientY - touchY
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) select(active.value + (dx < 0 ? 1 : -1))
}
</script>

<template>
  <section class="section-space bg-ivory" aria-labelledby="ecosystem-title">
    <div class="page-shell">
      <HomeSectionHead
        eyebrow="Ekosistem Digital"
        title="Produk digital yang dibangun untuk kampus."
        description="Ekosistem digital UNU dikelompokkan ke dalam empat kategori utama agar lebih mudah dipahami dan dijelajahi."
        title-id="ecosystem-title"
      >
        <template #action>
          <NuxtLink to="/ekosistem-digital" class="link-arrow">Lihat seluruh ekosistem <ArrowUpRight :size="14" aria-hidden="true" /></NuxtLink>
        </template>
      </HomeSectionHead>

      <nav v-if="categories.length" v-reveal class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Empat kategori ekosistem digital">
        <NuxtLink
          v-for="(category, index) in categories"
          :key="category.id"
          :to="{ path: '/ekosistem-digital', query: { category: category.slug } }"
          class="group relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-xl border p-4 transition-[border-color,background-color,box-shadow] duration-hover ease-unu hover:border-unu-green/60 hover:bg-white"
          :class="current?.categorySlug === category.slug ? 'border-unu-green bg-white shadow-card' : 'border-line-warm bg-white/50'"
          :aria-current="current?.categorySlug === category.slug ? 'true' : undefined"
        >
          <span class="flex items-start justify-between">
            <span class="text-[32px] font-semibold leading-none tabular-nums tracking-[-0.04em] transition-colors duration-hover" :class="current?.categorySlug === category.slug ? 'text-unu-green' : 'text-gold/80'">{{ String(index + 1).padStart(2, '0') }}</span>
            <ArrowUpRight :size="16" class="text-slate-400 transition duration-hover ease-unu group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-unu-green" aria-hidden="true" />
          </span>
          <span class="mt-4 text-[15px] font-semibold leading-5 text-charcoal">{{ category.name }}</span>
        </NuxtLink>
      </nav>

      <div v-if="current" class="mt-12 lg:mt-14">
        <!-- Product tabs -->
        <div class="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          <div role="tablist" aria-label="Produk ekosistem digital" class="flex min-w-max gap-1 border-b border-charcoal/15" @keydown="onKeydown">
            <button
              v-for="(item, index) in items"
              :id="`eco-tab-${item.id}`"
              :key="item.id"
              :ref="(el) => { if (el) tabRefs[index] = el as HTMLElement }"
              type="button"
              role="tab"
              :aria-selected="active === index"
              :aria-controls="`eco-panel-${item.id}`"
              :tabindex="active === index ? 0 : -1"
              class="relative min-h-[44px] whitespace-nowrap px-3.5 py-3 text-[14px] font-semibold transition-colors duration-micro sm:px-4"
              :class="active === index ? 'text-charcoal' : 'text-slate-500 hover:text-charcoal'"
              @click="select(index)"
            >
              {{ item.name }}
              <span
                class="absolute inset-x-3 -bottom-px h-0.5 origin-left bg-unu-green transition-transform duration-reveal ease-unu"
                :class="active === index ? 'scale-x-100' : 'scale-x-0'"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)] lg:items-center lg:gap-14">
          <!-- Visual (about 60%) -->
          <div class="min-w-0">
            <div
              class="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line-warm bg-white"
              @touchstart.passive="onTouchStart"
              @touchend.passive="onTouchEnd"
            >
              <div
                v-for="(item, index) in items"
                :id="`eco-panel-${item.id}`"
                :key="item.id"
                role="tabpanel"
                :aria-labelledby="`eco-tab-${item.id}`"
                :aria-hidden="active !== index"
                :inert="active !== index || undefined"
                class="showcase-panel absolute inset-0"
                :data-active="active === index"
                :style="{ '--shift': `${direction * 18}px` }"
              >
                <PlatformVisual :platform="item" :eager="index === 0" class="transition-transform duration-image ease-unu" />
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between gap-4">
              <p class="text-[13px] tabular-nums text-slate-500" aria-live="polite">
                <span class="font-semibold text-charcoal">{{ String(active + 1).padStart(2, '0') }}</span> / {{ String(items.length).padStart(2, '0') }}
              </p>
              <div class="flex gap-2">
                <button type="button" class="grid h-11 w-11 place-items-center rounded-full border border-charcoal/20 bg-white text-charcoal transition-colors duration-micro hover:border-unu-green hover:text-unu-green" aria-label="Produk sebelumnya" @click="select(active - 1)">
                  <ArrowLeft :size="16" aria-hidden="true" />
                </button>
                <button type="button" class="grid h-11 w-11 place-items-center rounded-full border border-charcoal/20 bg-white text-charcoal transition-colors duration-micro hover:border-unu-green hover:text-unu-green" aria-label="Produk berikutnya" @click="select(active + 1)">
                  <ArrowRight :size="16" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <!-- Info (about 40%) -->
          <div class="min-w-0">
            <Transition name="swap" mode="out-in">
              <div :key="current.id">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-dark">{{ current.category }}</span>
                  <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide" :class="statusClasses[current.status] || 'border-admin-border bg-slate-50 text-slate-600'">
                    <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                    {{ current.status }}
                  </span>
                </div>
                <h3 class="mt-4 text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[34px]">{{ current.name }}</h3>
                <p class="mt-4 line-clamp-4 text-[16px] leading-[1.65] text-slate-600">{{ current.description }}</p>
                <AppButton :to="`/ekosistem-digital/${current.slug}`" class="mt-6">
                  Lihat Produk
                  <template #right><ArrowRight :size="15" aria-hidden="true" /></template>
                </AppButton>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div v-else class="mt-10 flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-line-warm bg-white p-8 text-center text-[14px] text-slate-500">
        Produk belum tersedia.
      </div>

    </div>
  </section>
</template>

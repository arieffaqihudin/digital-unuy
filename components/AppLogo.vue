<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    inverse?: boolean
    compact?: boolean
    to?: string
    logoUrl?: string
  }>(),
  { inverse: false, compact: false, to: '/', logoUrl: '' }
)

const { settings } = useSite()
const resolvedLogo = computed(() => props.logoUrl || settings.value.logoUrl)
</script>

<template>
  <NuxtLink :to="to" class="group inline-flex min-h-[44px] items-center gap-3" aria-label="Beranda Direktorat Transformasi Digital UNU Yogyakarta">
    <span
      v-if="resolvedLogo"
      class="grid h-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-white px-2"
      aria-hidden="true"
    >
      <img :src="resolvedLogo" alt="" class="h-8 w-auto max-w-[110px] object-contain" loading="lazy" />
    </span>
    <span
      v-else
      class="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border transition group-hover:-translate-y-0.5"
      :class="inverse ? 'border-white/20 bg-white text-charcoal' : 'border-charcoal bg-charcoal text-ivory'"
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" class="h-6 w-6" fill="none">
        <path d="M8 27V20.5L14 24V31L8 27Z" :fill="inverse ? '#1C1A1A' : '#C99517'" />
        <path d="M14 20.5V14L20 17.5V24L14 20.5Z" :fill="inverse ? '#C99517' : '#FAF8ED'" />
        <path d="M20 17.5V11L26 14.5V21L20 17.5Z" :fill="inverse ? '#1C1A1A' : '#D7D49A'" />
        <path d="M26 14.5V8L32 11.5V18L26 14.5Z" :fill="inverse ? '#C99517' : '#FAF8ED'" />
        <path d="M8 31L14 27L20 31L26 27L32 31" :stroke="inverse ? '#1C1A1A' : '#C99517'" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <span v-if="!compact" class="min-w-0">
      <span
        class="block text-[10px] font-bold uppercase leading-none tracking-[0.17em]"
        :class="inverse ? 'text-sage' : 'text-gold-dark'"
      >UNU Yogyakarta</span>
      <span
        class="mt-1 block text-[13px] font-bold leading-tight sm:text-sm"
        :class="inverse ? 'text-white' : 'text-charcoal'"
      >Transformasi Digital</span>
    </span>
  </NuxtLink>
</template>

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
const resolvedLogo = computed(() => props.logoUrl || settings.value.logoUrl || '/unu-logo.png')
</script>

<template>
  <NuxtLink
    :to="to"
    class="group inline-flex min-h-[44px] shrink-0 items-center gap-3"
    aria-label="Beranda Direktorat Transformasi Digital UNU Yogyakarta"
  >
    <img
      :src="resolvedLogo"
      alt=""
      class="h-10 w-10 shrink-0 object-contain transition group-hover:-translate-y-0.5 sm:h-11 sm:w-11"
      :class="inverse ? 'brightness-0 invert' : ''"
    />
    <span v-if="!compact" class="min-w-0 shrink-0">
      <span
        class="site-brand-title block"
        :class="inverse ? 'text-white' : 'text-charcoal'"
      >Transformasi Digital</span>
      <span
        class="site-brand-subtitle mt-1 block"
        :class="inverse ? 'text-sage' : 'text-unu-green'"
      >UNU Yogyakarta</span>
    </span>
  </NuxtLink>
</template>

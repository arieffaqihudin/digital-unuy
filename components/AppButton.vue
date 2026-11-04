<script setup lang="ts">
import { computed, resolveComponent } from 'vue'

const props = withDefaults(
  defineProps<{
    to?: string
    href?: string
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'accent' | 'dark' | 'ghost' | 'danger' | 'light'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    block: false
  }
)

const NuxtLinkComponent = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLinkComponent : props.href ? 'a' : 'button'))
const isDisabled = computed(() => props.disabled || props.loading)

const variants = {
  primary:
    'bg-unu-green text-white border-unu-green hover:bg-unu-green-dark hover:border-unu-green-dark active:translate-y-px disabled:bg-unu-green/40 disabled:border-transparent',
  secondary:
    'bg-white text-charcoal border-slate-300 hover:border-slate-400 hover:bg-soft-white active:translate-y-px disabled:text-charcoal/40',
  accent:
    'bg-gold text-charcoal border-gold hover:bg-gold-dark hover:text-white hover:border-gold-dark active:translate-y-px disabled:bg-gold/40 disabled:border-transparent',
  dark:
    'bg-charcoal text-white border-charcoal hover:bg-charcoal-soft active:translate-y-px disabled:bg-charcoal/40 disabled:border-transparent',
  ghost:
    'bg-transparent text-charcoal border-transparent hover:bg-charcoal/5 active:bg-charcoal/10 disabled:text-charcoal/40',
  danger:
    'bg-red-700 text-white border-red-700 hover:bg-red-800 active:translate-y-px disabled:bg-red-700/40 disabled:border-transparent',
  light:
    'bg-white text-charcoal border-white hover:bg-ivory active:translate-y-px disabled:bg-white/40 disabled:border-transparent'
}

const sizes = {
  sm: 'min-h-[44px] px-3.5 py-2 text-[14px] gap-1.5 rounded-lg',
  md: 'min-h-[46px] px-5 py-2.5 text-[14px] gap-2 rounded-lg',
  lg: 'min-h-[52px] px-6 py-3 text-[15px] sm:text-[16px] gap-2 rounded-lg'
}

function onClick(event: MouseEvent) {
  if (isDisabled.value) {
    event.preventDefault()
    event.stopPropagation()
  }
}
</script>

<template>
  <component
    :is="tag"
    :to="isDisabled ? undefined : to"
    :href="isDisabled ? undefined : href"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? isDisabled : undefined"
    :aria-disabled="isDisabled || undefined"
    :tabindex="isDisabled && tag !== 'button' ? -1 : undefined"
    class="btn-nudge inline-flex items-center justify-center border font-semibold transition duration-200 disabled:cursor-not-allowed"
    :class="[variants[variant], sizes[size], block ? 'w-full' : '']"
    @click="onClick"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot v-else name="left" />
    <slot />
    <slot name="right" />
  </component>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    description?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { description: '', size: 'md' }
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const panel = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null
const titleId = `dialog-title-${Math.random().toString(36).slice(2, 9)}`

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event: KeyboardEvent) {
  if (!props.modelValue) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !panel.value) return
  const focusable = panel.value.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!import.meta.client) return
    if (open) {
      lastFocused = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      panel.value?.querySelector<HTMLElement>('button, a, input, textarea, select')?.focus()
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
      lastFocused?.focus()
    }
  }
)

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeydown)
  }
})

const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[80] flex items-end justify-center bg-charcoal/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
        @click.self="close"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line-warm bg-ivory shadow-soft sm:rounded-3xl"
          :class="widths[size]"
        >
          <div class="flex items-start justify-between gap-4 border-b border-line-warm px-5 py-4 sm:px-6">
            <div>
              <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-xs leading-5 text-ink-muted">{{ description }}</p>
            </div>
            <button
              type="button"
              class="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-muted transition hover:bg-charcoal/5 hover:text-charcoal"
              aria-label="Tutup dialog"
              @click="close"
            >
              <X :size="18" aria-hidden="true" />
            </button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <slot />
          </div>
          <div v-if="$slots.footer" class="border-t border-line-warm bg-white/60 px-5 py-4 sm:px-6">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

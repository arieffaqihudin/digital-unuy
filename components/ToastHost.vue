<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-vue-next'

const { toasts, remove } = useToast()

const tones = {
  success: { icon: CheckCircle2, classes: 'border-emerald-200 bg-emerald-50 text-emerald-950', iconClass: 'text-emerald-700' },
  error: { icon: AlertCircle, classes: 'border-red-200 bg-red-50 text-red-950', iconClass: 'text-red-700' },
  warning: { icon: TriangleAlert, classes: 'border-amber-200 bg-amber-50 text-amber-950', iconClass: 'text-amber-700' },
  info: { icon: Info, classes: 'border-sky-200 bg-sky-50 text-sky-950', iconClass: 'text-sky-700' }
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]" aria-live="polite" aria-atomic="false">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="translate-x-3 opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-3.5 shadow-soft"
        :class="tones[toast.tone].classes"
      >
        <component :is="tones[toast.tone].icon" :size="18" class="mt-0.5 shrink-0" :class="tones[toast.tone].iconClass" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold leading-5">{{ toast.title }}</p>
          <p v-if="toast.message" class="mt-1 text-xs leading-5 opacity-80">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="grid h-7 w-7 shrink-0 place-items-center rounded-md opacity-70 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Tutup notifikasi"
          @click="remove(toast.id)"
        >
          <X :size="14" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

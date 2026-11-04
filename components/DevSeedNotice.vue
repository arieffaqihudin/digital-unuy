<script setup lang="ts">
import { FlaskConical, X } from 'lucide-vue-next'

const visible = ref(true)
const { settings } = useSite()
</script>

<template>
  <div
    v-if="settings.devSeedMode && visible"
    class="border-b border-gold/30 bg-gold/10 text-charcoal"
    role="status"
  >
    <div class="page-shell flex items-center gap-3 py-2 text-[11px] leading-5 sm:text-xs">
      <FlaskConical :size="14" class="shrink-0 text-gold-dark" aria-hidden="true" />
      <p class="flex-1">
        <strong>Lingkungan pengembangan.</strong> Sebagian konten merupakan data contoh dan bukan data operasional resmi.
      </p>
      <button type="button" class="grid h-11 w-11 shrink-0 place-items-center rounded-md hover:bg-charcoal/5" aria-label="Tutup pemberitahuan" @click="visible = false">
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

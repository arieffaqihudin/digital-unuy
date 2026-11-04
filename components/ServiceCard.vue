<script setup lang="ts">
import { ArrowRight, Clock3 } from 'lucide-vue-next'
import type { ServiceDTO } from '~/shared/types'

defineProps<{ service: ServiceDTO; compact?: boolean }>()
</script>

<template>
  <article class="group flex h-full flex-col rounded-2xl border border-line-warm bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-charcoal/20 sm:p-6">
    <div class="flex items-start justify-between gap-3">
      <IconTile :name="service.icon" />
      <span
        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
        :class="
          service.active && service.acceptsRequests
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-line-warm bg-ivory text-ink-muted'
        "
      >
        <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {{ service.active ? (service.acceptsRequests ? 'Menerima permohonan' : 'Informasi layanan') : 'Nonaktif' }}
      </span>
    </div>
    <p class="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-dark">{{ service.category }}</p>
    <h3 class="mt-2 text-lg font-semibold leading-snug">
      <NuxtLink :to="`/layanan/${service.slug}`" class="transition group-hover:text-gold-dark">
        {{ service.name }}
      </NuxtLink>
    </h3>
    <p class="mt-2.5 flex-1 text-sm leading-6 text-ink-muted">{{ service.shortDescription }}</p>
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-warm pt-1">
      <NuxtLink :to="`/layanan/${service.slug}`" class="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold underline-offset-4 transition hover:text-gold-dark hover:underline">
        Lihat detail <ArrowRight :size="14" aria-hidden="true" />
      </NuxtLink>
      <NuxtLink
        v-if="service.active && service.acceptsRequests"
        :to="`/layanan/${service.slug}/ajukan`"
        class="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-charcoal px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-gold hover:text-charcoal"
      >
        Ajukan
      </NuxtLink>
      <span v-else-if="service.estimatedDuration" class="inline-flex items-center gap-1 text-[11px] text-ink-muted">
        <Clock3 :size="12" aria-hidden="true" /> {{ service.estimatedDuration }}
      </span>
    </div>
  </article>
</template>

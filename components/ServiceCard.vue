<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { ServiceDTO } from '~/shared/types'

defineProps<{ service: ServiceDTO; index?: number; compact?: boolean }>()
</script>

<template>
  <article
    class="group relative flex h-full flex-col rounded-xl border border-line-warm bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-unu-green/35 sm:p-6"
  >
    <div class="flex items-start justify-between gap-3">
      <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">{{ service.category }}</p>
      <span v-if="index" class="text-[12px] font-semibold tabular-nums text-slate-400">{{ String(index).padStart(2, '0') }}</span>
    </div>

    <h3 class="mt-4 text-[19px] font-semibold leading-[1.28] tracking-[-0.02em]">
      <NuxtLink :to="`/layanan/${service.slug}`" class="transition group-hover:text-unu-green">
        {{ service.name }}
      </NuxtLink>
    </h3>
    <p class="mt-2.5 line-clamp-3 flex-1 text-[14px] leading-6 text-slate-600">{{ service.shortDescription }}</p>

    <div class="mt-5 flex items-center justify-between gap-3 border-t border-line-warm pt-3">
      <span class="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="service.active && service.acceptsRequests ? 'bg-unu-green' : 'bg-slate-300'"
          aria-hidden="true"
        />
        {{ service.active ? (service.acceptsRequests ? 'Menerima permohonan' : 'Informasi layanan') : 'Nonaktif' }}
      </span>
      <div class="flex items-center gap-3">
        <NuxtLink :to="`/layanan/${service.slug}`" class="text-[14px] font-semibold text-slate-500 transition hover:text-unu-green min-h-[44px] inline-flex items-center">
          Detail
        </NuxtLink>
        <NuxtLink
          v-if="service.active && service.acceptsRequests"
          :to="`/layanan/${service.slug}/ajukan`"
          class="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-unu-green-soft px-3 text-[14px] font-bold text-unu-green transition hover:bg-unu-green hover:text-white"
        >
          Ajukan <ArrowRight :size="12" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

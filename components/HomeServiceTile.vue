<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { ServiceDTO } from '~/shared/types'

defineProps<{ service: ServiceDTO }>()
</script>

<template>
  <NuxtLink
    :to="`/layanan/${service.slug}`"
    class="group flex h-full items-start gap-4 rounded-xl border border-line-warm bg-white p-5 transition duration-hover ease-unu hover:-translate-y-0.5 hover:border-unu-green/40 hover:shadow-card"
  >
    <IconTile :name="service.icon" tone="green" />
    <span class="min-w-0 flex-1">
      <span class="block text-[18px] font-semibold leading-[1.3] tracking-[-0.015em] transition-colors duration-micro group-hover:text-unu-green">{{ service.name }}</span>
      <span class="mt-1.5 line-clamp-2 text-[14px] leading-6 text-slate-600">{{ service.shortDescription }}</span>
    </span>
    <ArrowRight
      :size="16"
      class="mt-1 shrink-0 text-slate-400 transition duration-hover ease-unu group-hover:translate-x-1 group-hover:text-unu-green"
      aria-hidden="true"
    />
  </NuxtLink>
</template>

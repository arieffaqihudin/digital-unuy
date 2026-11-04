<script setup lang="ts">
import type { TeamMemberDTO } from '~/shared/types'

const props = withDefaults(defineProps<{ member: TeamMemberDTO; compact?: boolean }>(), { compact: false })
const initials = computed(() =>
  props.member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
)
</script>

<template>
  <article class="group">
    <div class="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EAE5D7] ring-1 ring-line-warm">
      <img
        v-if="member.photoUrl"
        :src="member.photoUrl"
        :alt="`Foto ${member.name}`"
        loading="lazy"
        class="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.015]"
      />
      <div v-else class="flex h-full flex-col items-center justify-center gap-3 text-center">
        <span class="grid h-14 w-14 place-items-center rounded-full bg-ivory/80 text-xl font-bold text-unu-green">{{ initials || 'TD' }}</span>
        <span class="px-4 text-[12px] font-medium text-slate-500">Foto belum tersedia</span>
      </div>
    </div>
    <div class="pt-4">
      <h3 class="text-[18px] font-semibold leading-[1.3] tracking-[-0.015em] text-charcoal">{{ member.name }}</h3>
      <p class="mt-1 text-[14px] leading-5 text-slate-600">{{ member.position }}</p>
      <p v-if="member.bio && !compact" class="mt-2.5 line-clamp-3 text-[14px] leading-6 text-slate-500">{{ member.bio }}</p>
    </div>
  </article>
</template>

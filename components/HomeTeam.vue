<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { TeamMemberDTO } from '~/shared/types'

interface TeamResponse {
  groups: { id: string; name: string; members: TeamMemberDTO[] }[]
  ungrouped: TeamMemberDTO[]
  total: number
}

const { data } = await useAsyncData<TeamResponse | null>('home-team', () =>
  $fetch<TeamResponse>('/api/team').catch(() => null)
)

const groups = computed(() => (data.value?.groups || []).filter((group) => group.members.length))
// Real photos first, then leadership order; never more than 4 on the homepage.
const members = computed(() => {
  const all = [...groups.value.flatMap((group) => group.members), ...(data.value?.ungrouped || [])]
  const withPhoto = all.filter((member) => member.photoUrl)
  const without = all.filter((member) => !member.photoUrl)
  return [...withPhoto, ...without].slice(0, 4)
})
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
const offsets = ['', 'lg:mt-14', 'lg:mt-6', 'lg:mt-20']
</script>

<template>
  <section v-if="members.length" class="section-space bg-white" aria-labelledby="team-title">
    <div class="page-shell grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <div v-reveal class="lg:self-center">
        <p class="eyebrow-editorial">Tim Transformasi Digital</p>
        <h2 id="team-title" class="section-title mt-4 max-w-md">Orang-orang di balik transformasi.</h2>
        <ul v-if="groups.length" class="mt-8 max-w-sm border-t border-charcoal/15">
          <li v-for="group in groups" :key="group.id" class="flex items-baseline justify-between border-b border-line-warm py-3">
            <span class="text-[15px] font-semibold">{{ group.name }}</span>
            <span class="text-[13px] tabular-nums text-slate-500">{{ group.members.length }} orang</span>
          </li>
        </ul>
        <NuxtLink to="/tentang-kami/tim" class="link-arrow mt-6">Lihat seluruh tim <ArrowRight :size="14" aria-hidden="true" /></NuxtLink>
      </div>

      <div class="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
        <figure v-for="(member, index) in members" :key="member.id" v-reveal="index * 70" class="group" :class="offsets[index]">
          <div class="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#EAE5D7]">
            <img
              v-if="member.photoUrl"
              :src="member.photoUrl"
              :alt="`Foto ${member.name}`"
              loading="lazy"
              class="h-full w-full object-cover object-center transition-transform duration-image ease-unu group-hover:scale-[1.03]"
            />
            <div v-else class="grid h-full place-items-center" aria-hidden="true">
              <span class="text-[56px] font-semibold leading-none tracking-[-0.05em] text-unu-green/25">{{ initials(member.name) }}</span>
            </div>
          </div>
          <figcaption class="pt-3">
            <p class="text-[16px] font-semibold leading-snug tracking-[-0.01em]">{{ member.name }}</p>
            <p class="mt-0.5 text-[13px] leading-5 text-slate-600">{{ member.position }}</p>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

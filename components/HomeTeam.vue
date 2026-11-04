<script setup lang="ts">
import type { TeamMemberDTO } from '~/shared/types'

interface TeamResponse {
  groups: { members: TeamMemberDTO[] }[]
  ungrouped: TeamMemberDTO[]
  total: number
}

const { data } = await useAsyncData<TeamResponse | null>('home-team', () =>
  $fetch<TeamResponse>('/api/team').catch(() => null)
)
const members = computed(() => {
  const all = [...(data.value?.groups.flatMap((group) => group.members) || []), ...(data.value?.ungrouped || [])]
  return all.sort((a, b) => a.order - b.order).slice(0, 4)
})
</script>

<template>
  <section v-if="members.length" class="section-space bg-white" aria-labelledby="team-title">
    <div class="page-shell">
      <HomeSectionHead
        eyebrow="Tim Transformasi Digital"
        title="Orang-orang di balik transformasi."
        description="Tim yang merancang, membangun, dan merawat layanan digital universitas."
      >
        <template #action>
          <NuxtLink to="/tentang-kami/tim" class="link-arrow">Lihat seluruh tim →</NuxtLink>
        </template>
      </HomeSectionHead>
      <div class="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
        <TeamMemberCard v-for="member in members" :key="member.id" :member="member" />
      </div>
    </div>
  </section>
</template>

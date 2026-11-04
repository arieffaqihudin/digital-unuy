<script setup lang="ts">
import type { TeamMemberDTO } from '~/shared/types'

interface TeamResponse {
  groups: { id: string; name: string; slug: string; order: number; members: TeamMemberDTO[] }[]
  ungrouped: TeamMemberDTO[]
  total: number
}

const { data, pending } = await useAsyncData<TeamResponse>('team-page', () => $fetch('/api/team'))
const allMembers = computed(() => [
  ...(data.value?.groups || []).flatMap((group) => group.members),
  ...(data.value?.ungrouped || [])
])

usePageSeo({
  title: 'Tim Transformasi Digital UNU Yogyakarta | Profil Tim',
  description:
    'Kenali tim di balik pengembangan produk, layanan, dan ekosistem digital Universitas Nahdlatul Ulama Yogyakarta.',
  breadcrumbs: [{ name: 'Beranda', to: '/' }, { name: 'Tim Kami', to: '/tentang-kami/tim' }]
})
</script>

<template>
  <div>
    <PublicPageHeader
      eyebrow="Tentang Kami"
      title="Tim Transformasi Digital"
      description="Anggota yang mendukung pengembangan layanan, tata kelola, dan ekosistem digital universitas."
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Tentang Kami', to: '/tentang' }, { label: 'Tim Kami' }]"
    >
      <template #aside>
        <p class="text-[13px] text-slate-500">{{ data?.total || 0 }} anggota dipublikasikan</p>
      </template>
    </PublicPageHeader>

    <section class="section-space bg-soft-white">
      <div class="page-shell">
        <div v-if="pending" class="grid grid-cols-1 gap-x-4 gap-y-8 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="index in 8" :key="index">
            <div class="skeleton aspect-[3/4] rounded-xl" />
            <div class="skeleton mt-4 h-5 w-3/4 rounded" />
            <div class="skeleton mt-2 h-4 w-1/2 rounded" />
          </div>
        </div>

        <EmptyState
          v-else-if="!allMembers.length"
          title="Belum ada anggota tim yang dipublikasikan"
          description="Data anggota tim akan ditampilkan setelah ditambahkan dan dipublikasikan melalui CMS."
        />

        <template v-else>
          <section v-for="group in data?.groups" :key="group.id" class="mb-14 last:mb-0">
            <div class="mb-6 flex items-end justify-between gap-4 border-b border-line-warm pb-3">
              <h2 class="display-3">{{ group.name }}</h2>
              <span class="text-[12px] tabular-nums text-slate-400">{{ group.members.length }} anggota</span>
            </div>
            <div class="grid grid-cols-1 gap-x-4 gap-y-8 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <TeamMemberCard v-for="member in group.members" :key="member.id" :member="member" />
            </div>
          </section>

          <section v-if="data?.ungrouped.length">
            <div v-if="data?.groups.length" class="mb-6 flex items-end justify-between gap-4 border-b border-line-warm pb-3">
              <h2 class="display-3">Anggota</h2>
              <span class="text-[12px] tabular-nums text-slate-400">{{ data.ungrouped.length }} anggota</span>
            </div>
            <div class="grid grid-cols-1 gap-x-4 gap-y-8 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <TeamMemberCard v-for="member in data.ungrouped" :key="member.id" :member="member" />
            </div>
          </section>
        </template>
      </div>
    </section>
  </div>
</template>

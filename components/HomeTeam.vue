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
const all = computed(() => [...groups.value.flatMap((group) => group.members), ...(data.value?.ungrouped || [])])
// One dominant member (a real photo if any), two supporting from different groups.
const lead = computed(() => all.value.find((member) => member.photoUrl) || all.value[0] || null)
const supporting = computed(() => {
  const picked: TeamMemberDTO[] = []
  const pool = groups.value.map((group) => group.members.filter((member) => member.id !== lead.value?.id))
  pool.forEach((list) => list.sort((a, b) => Number(!!b.photoUrl) - Number(!!a.photoUrl)))
  // Round-robin across groups, preferring groups other than the lead's.
  for (let round = 0; picked.length < 2 && round < 3; round++) {
    for (const list of pool) {
      if (picked.length >= 2) break
      const member = list[round]
      if (member && !picked.includes(member)) picked.push(member)
    }
  }
  return picked
})
const remaining = computed(() => Math.max(0, (data.value?.total || all.value.length) - 1 - supporting.value.length))
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
</script>

<template>
  <section v-if="lead" class="section-space bg-white" aria-labelledby="team-title">
    <div class="page-shell grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <div v-reveal class="lg:self-center">
        <p class="eyebrow-editorial">Tim Transformasi Digital</p>
        <h2 id="team-title" class="section-title mt-4 max-w-md">Orang-orang di balik transformasi.</h2>
        <p class="mt-5 max-w-sm text-[16px] leading-[1.65] text-slate-600">
          Pimpinan, product, engineering, dan design bekerja dalam satu tim untuk membangun dan merawat produk digital kampus.
        </p>
        <ul v-if="groups.length" class="mt-8 max-w-sm border-t border-charcoal/15">
          <li v-for="(group, index) in groups" :key="group.id" class="flex items-baseline gap-4 border-b border-line-warm py-3">
            <span class="w-6 text-[12px] font-semibold tabular-nums text-gold-dark">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="flex-1 text-[15px] font-semibold">{{ group.name }}</span>
            <span class="text-[13px] tabular-nums text-slate-500">{{ group.members.length }}</span>
          </li>
        </ul>
        <NuxtLink to="/tentang-kami/tim" class="link-arrow mt-6">Kenali Tim Kami <ArrowRight :size="14" aria-hidden="true" /></NuxtLink>
      </div>

      <div class="grid grid-cols-5 gap-3 sm:gap-4">
        <!-- Dominant -->
        <figure v-reveal class="group col-span-5 sm:col-span-3 sm:row-span-2">
          <div class="relative h-full min-h-[320px] overflow-hidden rounded-2xl bg-[#EAE5D7] sm:min-h-[460px]">
            <img
              v-if="lead.photoUrl"
              :src="lead.photoUrl"
              :alt="`Foto ${lead.name}`"
              loading="lazy"
              class="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-image ease-unu group-hover:scale-[1.025]"
            />
            <div v-else class="absolute inset-0 grid place-items-center" aria-hidden="true">
              <span class="text-[96px] font-semibold leading-none tracking-[-0.05em] text-unu-green/25">{{ initials(lead.name) }}</span>
            </div>
            <figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/75 via-charcoal/30 to-transparent p-5 pt-16 text-white">
              <p class="text-[19px] font-semibold leading-snug tracking-[-0.015em]">{{ lead.name }}</p>
              <p class="mt-0.5 text-[13px] text-white/80">{{ lead.position }}</p>
            </figcaption>
          </div>
        </figure>

        <!-- Supporting -->
        <figure v-for="(member, index) in supporting" :key="member.id" v-reveal="(index + 1) * 90" class="group col-span-5 sm:col-span-2">
          <div class="relative aspect-[16/10] overflow-hidden rounded-2xl bg-sage-soft sm:aspect-auto sm:h-[222px]">
            <img
              v-if="member.photoUrl"
              :src="member.photoUrl"
              :alt="`Foto ${member.name}`"
              loading="lazy"
              class="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-image ease-unu group-hover:scale-[1.03]"
            />
            <div v-else class="absolute inset-0 flex flex-col justify-between p-4" aria-hidden="true">
              <span class="text-[44px] font-semibold leading-none tracking-[-0.05em] text-unu-green/30">{{ initials(member.name) }}</span>
            </div>
            <figcaption class="absolute inset-x-0 bottom-0 p-4" :class="member.photoUrl ? 'bg-gradient-to-t from-charcoal/70 to-transparent pt-12 text-white' : ''">
              <p class="text-[16px] font-semibold leading-snug">{{ member.name }}</p>
              <p class="text-[13px]" :class="member.photoUrl ? 'text-white/80' : 'text-slate-600'">{{ member.position }}</p>
            </figcaption>
          </div>
        </figure>

        <NuxtLink
          v-if="remaining > 0"
          v-reveal="270"
          to="/tentang-kami/tim"
          class="group col-span-5 flex items-center justify-between rounded-2xl border border-line-warm px-5 py-4 transition-colors duration-hover hover:border-unu-green/50 hover:bg-ivory"
        >
          <span class="text-[15px] font-semibold"><span class="tabular-nums text-unu-green">+{{ remaining }}</span> anggota tim lainnya</span>
          <ArrowRight :size="16" class="text-slate-400 transition duration-hover ease-unu group-hover:translate-x-1 group-hover:text-unu-green" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

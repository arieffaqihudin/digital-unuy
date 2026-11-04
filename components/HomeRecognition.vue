<script setup lang="ts">
import { ArrowUpRight, Award, Globe2 } from 'lucide-vue-next'

const achievements = [
  {
    id: 'silver',
    icon: Award,
    kicker: '01 · Nasional',
    display: ['SILVER', 'WINNER'],
    title: 'Anugerah Humas Diktisaintek 2025',
    meta: 'Juara II Nasional · Kategori Perguruan Tinggi Swasta · Subkategori Laman/Website',
    description: 'Pengakuan nasional atas kualitas pengelolaan website UNU Yogyakarta.',
    facts: [
      { label: 'Penyelenggara', value: 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi' },
      { label: 'Tahun', value: '2025' },
      { label: 'Penerima', value: 'UNU Yogyakarta, melalui Direktorat Komunikasi' }
    ],
    source: 'https://unu-jogja.ac.id/id/news/unu-jogja-raih-dua-penghargaan-di-anugerah-diktisaintek'
  },
  {
    id: 'wuri',
    icon: Globe2,
    kicker: '02 · Internasional',
    display: ['#6', 'WORLD RANK'],
    title: 'WURI 2026',
    meta: 'Digital and AI Transformation in Strategy and Management',
    description: 'Pengakuan internasional terhadap transformasi tata kelola digital UNU Yogyakarta melalui Green Team.',
    facts: [
      { label: 'Penyelenggara', value: 'World University Rankings for Innovation (WURI)' },
      { label: 'Tahun', value: '2026' },
      { label: 'Peringkat', value: '6 dunia pada kategori khusus' },
      { label: 'Program', value: 'Smart Campus & Digital–AI Governance Transformation' }
    ],
    source: 'https://unu-jogja.ac.id/id/news/unu-jogja-ranking-ke-303-dunia-top-100-di-11-program'
  }
]
</script>

<template>
  <section class="border-t border-gold/30 bg-charcoal-soft py-14 text-white sm:py-16 lg:py-20" aria-labelledby="recognition-title">
    <div class="page-shell">
      <div v-reveal class="max-w-2xl">
        <p class="eyebrow-editorial !text-sage">Pengakuan &amp; Prestasi</p>
        <h2 id="recognition-title" class="mt-4 text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.5rem]">
          Inovasi yang mendapat pengakuan.
        </h2>
      </div>

      <div class="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-0">
        <article
          v-for="(achievement, index) in achievements"
          :id="`recognition-${achievement.id}`"
          :key="achievement.id"
          v-reveal="index * 100"
          class="flex flex-col"
          :class="index === 0 ? 'lg:pr-10 xl:pr-14' : 'border-t border-white/15 pt-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0 xl:pl-14'"
        >
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">
            <component :is="achievement.icon" :size="15" :stroke-width="1.7" aria-hidden="true" />
            {{ achievement.kicker }}
          </div>

          <p class="mt-5 font-semibold leading-[0.9] tracking-[-0.05em]">
            <span class="block text-[clamp(3.2rem,7vw,6rem)]" :class="index === 0 ? 'text-white' : 'text-gold-soft'">{{ achievement.display[0] }}</span>
            <span
              class="block"
              :class="index === 0
                ? 'text-[clamp(3.2rem,7vw,6rem)] text-gold-soft'
                : 'mt-2 text-[clamp(1.5rem,3.5vw,2.6rem)] tracking-[-0.03em] text-white'"
            >
              {{ achievement.display[1] }}
            </span>
          </p>

          <h3 class="mt-6 max-w-lg text-[22px] font-semibold leading-[1.25] tracking-[-0.02em] text-white sm:text-[24px]">
            {{ achievement.title }}
          </h3>
          <p class="mt-2 max-w-lg text-[14px] leading-6 text-gold-soft">{{ achievement.meta }}</p>
          <p class="mt-3 max-w-lg text-[14px] leading-6 text-white/65">{{ achievement.description }}</p>

          <dl class="mt-6 max-w-lg space-y-1.5 border-t border-white/15 pt-4 text-[12px] leading-5">
            <div v-for="fact in achievement.facts" :key="fact.label" class="flex gap-2">
              <dt class="w-28 shrink-0 text-white/40">{{ fact.label }}</dt>
              <dd class="text-white/75">{{ fact.value }}</dd>
            </div>
          </dl>

          <a
            :href="achievement.source"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-5 inline-flex min-h-[44px] w-fit items-center gap-1.5 text-[13px] font-semibold text-sage transition-colors duration-micro hover:text-white"
          >
            Lihat Sumber <ArrowUpRight :size="13" aria-hidden="true" />
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

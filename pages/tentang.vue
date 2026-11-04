<script setup lang="ts">
import { ArrowRight, Compass, Database, MonitorCog, Network, ShieldCheck, Waypoints } from 'lucide-vue-next'

interface PageResponse {
  page: {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    seoTitle: string
    seoDescription: string
    updatedAt: string
  }
}

const { data } = await useAsyncData<PageResponse | null>('about-page', async () => {
  try {
    return await $fetch<PageResponse>('/api/pages/tentang-kami')
  } catch {
    return null
  }
})
const { settings } = useSite()
const { formatDate } = useFormat()

const page = computed(() => data.value?.page)
const roles = [
  { icon: Compass, title: 'Tata kelola TI', text: 'Menata kebijakan, standar, dan praktik pengelolaan teknologi informasi secara konsisten.' },
  { icon: Waypoints, title: 'Digitalisasi proses', text: 'Menyederhanakan proses bisnis universitas melalui alur kerja digital yang terukur.' },
  { icon: Network, title: 'Integrasi sistem', text: 'Menghubungkan sistem dan data agar informasi mengalir lebih utuh antarunit.' },
  { icon: MonitorCog, title: 'Pengembangan sistem', text: 'Membangun sistem informasi yang menjawab kebutuhan layanan akademik dan tata kelola.' },
  { icon: Database, title: 'Infrastruktur digital', text: 'Menyiapkan fondasi layanan digital yang andal, aman, dan berkelanjutan.' },
  { icon: ShieldCheck, title: 'Pendampingan', text: 'Mendampingi unit kerja dalam adopsi teknologi dan penguatan kapasitas digital.' }
]

useSeoMeta({
  title: page.value?.seoTitle || 'Tentang Direktorat',
  description:
    page.value?.seoDescription ||
    page.value?.excerpt ||
    'Peran Direktorat Tim Transformasi Digital Universitas Nahdlatul Ulama Yogyakarta dalam tata kelola TI, integrasi data, dan layanan digital.',
  ogTitle: page.value?.seoTitle || 'Tentang Direktorat Tim Transformasi Digital',
  ogDescription: page.value?.seoDescription || page.value?.excerpt || 'Mengenal peran dan fokus kerja transformasi digital UNU Yogyakarta.',
  ogType: 'article'
})
</script>

<template>
  <div>
    <section class="border-b border-line-warm bg-ivory">
      <div class="page-shell py-8 sm:py-10">
        <Breadcrumbs :items="[{ label: 'Beranda', to: '/' }, { label: 'Tentang Kami' }]" />
        <div class="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
          <div>
            <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Tentang Kami</p>
            <h1 class="display-1 mt-5 max-w-3xl">{{ page?.title || 'Direktorat Tim Transformasi Digital' }}</h1>
            <p class="body-lg mt-6 max-w-2xl">
              {{ page?.excerpt || 'Mendorong transformasi digital UNU Yogyakarta melalui tata kelola yang tertib, integrasi sistem dan data, serta layanan digital yang berorientasi pada kebutuhan sivitas akademika.' }}
            </p>
          </div>
          <div class="rounded-2xl border border-line-warm bg-white p-5 sm:p-6">
            <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-gold-dark">Identitas</p>
            <p class="mt-3 text-sm font-semibold">{{ settings.directorateName }}</p>
            <p class="mt-1 text-xs leading-5 text-ink-muted">{{ settings.universityName }}</p>
            <div class="mt-5 border-t border-line-warm pt-4">
              <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-muted">Pembaruan halaman</p>
              <p class="mt-1 text-xs">{{ page ? formatDate(page.updatedAt) : 'Belum tersedia' }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-space bg-white">
      <div class="page-shell grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div>
          <div v-if="page?.content" class="prose-unu" v-html="page.content" />
          <div v-else class="space-y-5 text-base leading-8 text-ink-muted">
            <p>
              Direktorat Tim Transformasi Digital berperan mendorong pemanfaatan teknologi informasi secara terencana di lingkungan Universitas Nahdlatul Ulama Yogyakarta. Fokus kerja diarahkan pada tata kelola teknologi informasi, digitalisasi proses bisnis, integrasi sistem dan data, pengembangan sistem informasi, infrastruktur layanan digital, serta pendampingan transformasi bagi unit kerja.
            </p>
            <p>
              Transformasi dijalankan secara bertahap dengan menempatkan kebutuhan pengguna sebagai titik awal. Setiap inisiatif diharapkan memiliki tujuan yang jelas, pemilik proses, dan ukuran keberhasilan yang dapat ditinjau bersama.
            </p>
            <p>
              Halaman ini tidak memuat struktur organisasi atau nama pimpinan yang belum diverifikasi. Informasi resmi akan diperbarui melalui pengelolaan konten yang sah.
            </p>
          </div>

          <div class="mt-10 rounded-2xl border border-line-warm bg-ivory p-6">
            <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-gold-dark">Prinsip kerja</p>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="flex gap-3">
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <p class="text-sm leading-6 text-ink-muted"><strong class="text-charcoal">Satu pintu.</strong> Layanan digital dihimpun agar mudah ditemukan dan diajukan.</p>
              </div>
              <div class="flex gap-3">
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <p class="text-sm leading-6 text-ink-muted"><strong class="text-charcoal">Tertib.</strong> Setiap permohonan memiliki alur, status, dan jejak audit.</p>
              </div>
              <div class="flex gap-3">
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <p class="text-sm leading-6 text-ink-muted"><strong class="text-charcoal">Terukur.</strong> Statistik hanya ditampilkan bila datanya terverifikasi.</p>
              </div>
              <div class="flex gap-3">
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <p class="text-sm leading-6 text-ink-muted"><strong class="text-charcoal">Aman.</strong> Data pribadi dan lampiran dilindungi sesuai kewenangan.</p>
              </div>
            </div>
          </div>
        </div>

        <aside class="lg:sticky lg:top-36">
          <div class="overflow-hidden rounded-2xl bg-charcoal p-6 text-white">
            <p class="eyebrow-light">Fokus kerja</p>
            <div class="mt-5 space-y-4">
              <div v-for="role in roles" :key="role.title" class="flex gap-3.5">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-sage">
                  <component :is="role.icon" :size="16" :stroke-width="1.7" aria-hidden="true" />
                </span>
                <div>
                  <p class="text-sm font-semibold">{{ role.title }}</p>
                  <p class="mt-1 text-xs leading-5 text-white/50">{{ role.text }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-line-warm bg-white p-5">
            <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-gold-dark">Kontak resmi</p>
            <div class="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
              <p v-if="settings.address">{{ settings.address }}</p>
              <p v-if="settings.contactPhone">{{ settings.contactPhone }}</p>
              <p v-if="settings.contactEmail"><a :href="`mailto:${settings.contactEmail}`" class="break-all hover:text-gold-dark">{{ settings.contactEmail }}</a></p>
              <p v-if="!settings.address && !settings.contactPhone && !settings.contactEmail">Informasi kontak belum dikonfigurasi melalui CMS.</p>
            </div>
            <AppButton to="/layanan" class="mt-5" block>Lihat Layanan Digital <template #right><ArrowRight :size="14" /></template></AppButton>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowUpRight } from 'lucide-vue-next'
import type { ProgramDTO } from '~/shared/types'

interface ProgramResponse {
  program: ProgramDTO
  related: ProgramDTO[]
}

const route = useRoute()
const { data } = await useAsyncData<ProgramResponse>(`program-${route.params.slug}`, () =>
  $fetch<ProgramResponse>(`/api/programs/${route.params.slug}`)
)
const program = computed(() => data.value?.program)
if (!program.value) throw createError({ statusCode: 404, statusMessage: 'Program tidak ditemukan.', fatal: true })
const { formatDate } = useFormat()

const statusClass = computed(() => {
  if (program.value?.status === 'Selesai') return 'border-unu-green/20 bg-unu-green-soft text-unu-green-dark'
  if (program.value?.status === 'Berjalan') return 'border-gold/30 bg-gold/10 text-gold-dark'
  return 'border-slate-200 bg-slate-50 text-slate-500'
})

usePageSeo(() => ({
  title: program.value?.title || 'Program',
  suffix: true,
  description: program.value?.summary,
  breadcrumbs: [
    { name: 'Beranda', to: '/' },
    { name: program.value?.title || 'Program', to: `/program/${program.value?.slug}` }
  ]
}))
</script>

<template>
  <div v-if="program">
    <PublicPageHeader
      eyebrow="Program & Inisiatif"
      :title="program.title"
      :description="program.summary"
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Program & Inisiatif', to: '/#program' }, { label: program.title }]"
    >
      <template #aside>
        <div class="flex flex-wrap items-center gap-3 text-[14px]">
          <span class="rounded-full border px-3 py-1.5 font-semibold" :class="statusClass">{{ program.status }}</span>
          <span class="text-slate-500">{{ program.category }}</span>
          <span class="text-slate-400">·</span>
          <span class="text-slate-500">Diperbarui {{ formatDate(program.updatedAt) }}</span>
        </div>
      </template>
    </PublicPageHeader>

    <section class="section-space bg-white">
      <div class="page-shell grid gap-10 lg:grid-cols-[1fr_280px] lg:items-start">
        <article class="min-w-0">
          <div class="prose-unu max-w-3xl" v-html="program.content || `<p>${program.summary}</p>`" />
          <NuxtLink to="/#program" class="mt-10 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-unu-green underline-offset-4 hover:underline">
            <ArrowLeft :size="14" aria-hidden="true" /> Kembali ke program
          </NuxtLink>
        </article>
        <aside class="rounded-xl border border-line-warm bg-soft-white p-5">
          <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-gold-dark">Ringkasan</p>
          <dl class="mt-4 space-y-3 text-xs">
            <div class="flex justify-between gap-3 border-b border-line-warm pb-3"><dt class="text-slate-500">Kategori</dt><dd class="text-right font-semibold">{{ program.category }}</dd></div>
            <div class="flex justify-between gap-3 border-b border-line-warm pb-3"><dt class="text-slate-500">Status</dt><dd class="text-right font-semibold">{{ program.status }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-slate-500">Diperbarui</dt><dd class="text-right font-semibold">{{ formatDate(program.updatedAt) }}</dd></div>
          </dl>
        </aside>
      </div>
    </section>

    <section v-if="data?.related.length" class="section-space border-t border-line-warm bg-ivory">
      <div class="page-shell">
        <SectionHeading eyebrow="Program lain" title="Inisiatif terkait" />
        <div class="mt-8 divide-y divide-line-warm border-y border-line-warm">
          <NuxtLink v-for="item in data.related" :key="item.id" :to="`/program/${item.slug}`" class="group grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p class="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">{{ item.category }}</p>
              <h3 class="mt-1 text-lg font-semibold transition group-hover:text-unu-green">{{ item.title }}</h3>
              <p class="mt-1 text-[14px] text-slate-600">{{ item.summary }}</p>
            </div>
            <ArrowUpRight :size="16" class="text-slate-300 transition group-hover:text-unu-green" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

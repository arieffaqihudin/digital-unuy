<script setup lang="ts">
import { ArrowRight, FileText, Globe2, Newspaper, Settings, Workflow } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const counts = ref({ platforms: 0, programs: 0, articles: 0, pages: 0 })

const { data } = await useAsyncData('admin-content-counts', async () => {
  const [platforms, programs, articles, pages] = await Promise.all([
    requestFetch<{ total: number }>('/api/admin/platforms', { query: { pageSize: 1 } }).catch(() => ({ total: 0 })),
    requestFetch<{ total: number }>('/api/admin/programs', { query: { pageSize: 1 } }).catch(() => ({ total: 0 })),
    requestFetch<{ total: number }>('/api/admin/articles', { query: { pageSize: 1 } }).catch(() => ({ total: 0 })),
    requestFetch<{ items: unknown[] }>('/api/admin/pages').catch(() => ({ items: [] }))
  ])
  counts.value = { platforms: platforms.total, programs: programs.total, articles: articles.total, pages: pages.items.length }
  return true
})

const cards = computed(() => [
  { title: 'Ekosistem Digital', to: '/admin/ekosistem', icon: Globe2, count: counts.value.platforms, description: 'Kelola platform, kategori, unit pengelola, dan status implementasi.' },
  { title: 'Program & Inisiatif', to: '/admin/program', icon: Workflow, count: counts.value.programs, description: 'Catat program transformasi beserta status dan ringkasannya.' },
  { title: 'Publikasi', to: '/admin/publikasi', icon: Newspaper, count: counts.value.articles, description: 'Kelola artikel, draft, thumbnail, dan status terbit.' },
  { title: 'Halaman & Profil', to: '/admin/halaman', icon: FileText, count: counts.value.pages, description: 'Perbarui halaman profil direktorat dan halaman kustom.' }
])

useSeoMeta({ title: 'Konten Website', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Pengelolaan</p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight">Konten Website</h2>
      <p class="mt-1 text-sm text-admin-muted">Kelola konten publik yang tampil di website direktorat.</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink v-for="card in cards" :key="card.to" :to="card.to" class="group rounded-xl border border-admin-border bg-white p-5 transition hover:border-slate-300 hover:shadow-card">
        <div class="flex items-start justify-between gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-unu-green-soft"><component :is="card.icon" :size="20" :stroke-width="1.7" aria-hidden="true" /></span>
          <span class="text-2xl font-semibold">{{ card.count }}</span>
        </div>
        <h3 class="mt-5 text-base font-semibold group-hover:text-unu-green">{{ card.title }}</h3>
        <p class="mt-1.5 text-xs leading-5 text-admin-muted">{{ card.description }}</p>
        <p class="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-unu-green">Kelola <ArrowRight :size="12" /></p>
      </NuxtLink>
    </div>

    <div class="rounded-xl border border-admin-border bg-slate-50 p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <Settings :size="18" class="mt-0.5 text-unu-green" aria-hidden="true" />
          <div><p class="text-sm font-semibold">Identitas, hero, kontak, dan metrik</p><p class="mt-1 text-xs text-admin-muted">Pengaturan global berada di menu Pengaturan agar tidak tercampur dengan konten.</p></div>
        </div>
        <AppButton to="/admin/pengaturan" variant="secondary" size="sm">Buka Pengaturan</AppButton>
      </div>
    </div>
  </div>
</template>

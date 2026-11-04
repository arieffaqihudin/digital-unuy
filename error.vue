<script setup lang="ts">
import { ArrowLeft, Home, TriangleAlert } from 'lucide-vue-next'

const props = defineProps<{ error: { statusCode: number; statusMessage?: string; message?: string } }>()
const { settings } = useSite()
const message = computed(() => {
  if (props.error.statusCode === 404) return 'Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.'
  if (props.error.statusCode === 403) return 'Anda tidak memiliki akses ke halaman ini.'
  return props.error.statusMessage || 'Terjadi kesalahan saat memuat halaman.'
})
useSeoMeta({ title: props.error.statusCode === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ivory">
    <header class="border-b border-line-warm">
      <div class="page-shell flex h-[76px] items-center"><AppLogo /></div>
    </header>
    <main class="page-shell flex flex-1 items-center justify-center py-16">
      <div class="w-full max-w-xl text-center">
        <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sage-soft text-charcoal"><TriangleAlert :size="30" aria-hidden="true" /></span>
        <p class="mt-6 text-6xl font-semibold tracking-tight text-charcoal/15">{{ error.statusCode }}</p>
        <h1 class="mt-2 text-2xl font-semibold">{{ error.statusCode === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan' }}</h1>
        <p class="mt-3 text-sm leading-6 text-ink-muted">{{ message }}</p>
        <div class="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <AppButton to="/"><template #left><Home :size="15" /></template>Kembali ke beranda</AppButton>
          <AppButton variant="secondary" @click="$router.back()"><template #left><ArrowLeft :size="15" /></template>Halaman sebelumnya</AppButton>
        </div>
        <p class="mt-8 text-[11px] text-ink-muted">Jika masalah berlanjut, hubungi administrator {{ settings.directorateName }}.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, ArrowUpRight, Search, X } from 'lucide-vue-next'
import type { SearchResultDTO } from '~/shared/types'

const open = defineModel<boolean>({ default: false })
const query = ref('')
const results = ref<SearchResultDTO[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const input = ref<HTMLInputElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const quickLinks = [
  { label: 'Layanan Digital', to: '/layanan' },
  { label: 'Ekosistem Digital', to: '/ekosistem-digital' },
  { label: 'Panduan & Dokumen', to: '/dokumen' },
  { label: 'Publikasi', to: '/publikasi' },
  { label: 'Tentang Kami', to: '/tentang' }
]

let timer: ReturnType<typeof setTimeout> | null = null
let requestId = 0
let lastFocused: HTMLElement | null = null
let previousOverflow = ''

const grouped = computed(() => {
  const order = ['service', 'platform', 'document', 'article', 'page']
  return order
    .map((type) => ({
      type,
      label: results.value.find((item) => item.type === type)?.typeLabel || '',
      items: results.value.filter((item) => item.type === type)
    }))
    .filter((group) => group.items.length)
})

function close() {
  open.value = false
}

async function runSearch(term: string) {
  const current = ++requestId
  try {
    const data = await $fetch<{ items: SearchResultDTO[]; total: number }>('/api/search', {
      query: { q: term, pageSize: 8 }
    })
    if (current !== requestId) return
    results.value = data.items
    total.value = data.total
  } catch (err: any) {
    if (current === requestId) {
      results.value = []
      total.value = 0
      error.value = err?.data?.statusMessage || 'Pencarian gagal dimuat. Coba lagi.'
    }
  } finally {
    if (current === requestId) loading.value = false
  }
}

watch(query, (value) => {
  if (timer) clearTimeout(timer)
  error.value = ''
  const term = value.trim()
  if (term.length < 2) {
    requestId += 1
    results.value = []
    total.value = 0
    loading.value = false
    return
  }
  loading.value = true
  timer = setTimeout(() => runSearch(term), 280)
})

function onKeydown(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !panel.value) return
  const focusable = panel.value.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(open, async (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) {
    lastFocused = document.activeElement as HTMLElement
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    input.value?.focus()
    return
  }
  document.body.style.overflow = previousOverflow
  document.removeEventListener('keydown', onKeydown)
  if (timer) clearTimeout(timer)
  requestId += 1
  query.value = ''
  results.value = []
  total.value = 0
  loading.value = false
  error.value = ''
  lastFocused?.focus()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (import.meta.client) {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = previousOverflow
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[110] flex items-start justify-center bg-charcoal/55 p-4 backdrop-blur-sm sm:p-6"
        @click.self="close"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-search-title"
          class="mt-[5vh] flex max-h-[86dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line-warm bg-white shadow-soft sm:mt-[8vh]"
        >
          <div class="flex items-center gap-3 border-b border-line-warm px-4 py-3 sm:px-5">
            <Search :size="18" class="shrink-0 text-slate-400" aria-hidden="true" />
            <h2 id="global-search-title" class="sr-only">Pencarian global</h2>
            <label for="global-search-input" class="sr-only">Cari layanan, aplikasi, panduan</label>
            <input
              ref="input"
              id="global-search-input"
              v-model="query"
              type="search"
              class="min-h-[44px] min-w-0 flex-1 border-0 bg-transparent text-[16px] text-charcoal outline-none placeholder:text-slate-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Cari layanan, aplikasi, panduan..."
              autocomplete="off"
              spellcheck="false"
              @keydown.esc.prevent="close"
            />
            <span class="hidden shrink-0 rounded border border-line-warm px-1.5 py-0.5 text-[11px] text-slate-400 sm:inline">Esc</span>
            <button
              type="button"
              class="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-charcoal"
              aria-label="Tutup pencarian"
              @click="close"
            >
              <X :size="17" aria-hidden="true" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <div v-if="loading" class="space-y-2 p-4">
              <div v-for="index in 4" :key="index" class="skeleton h-16 rounded-lg" />
            </div>

            <div v-else-if="error" class="p-6 text-center">
              <p class="text-[14px] font-semibold text-charcoal">Pencarian belum berhasil</p>
              <p class="mt-1 text-[13px] leading-5 text-slate-500">{{ error }}</p>
            </div>

            <template v-else-if="query.trim().length >= 2">
              <template v-if="results.length">
                <div v-for="group in grouped" :key="group.type">
                  <p class="sticky top-0 border-b border-line-warm bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:px-5">{{ group.label }}</p>
                  <SearchResultRow v-for="result in group.items" :key="result.id" :result="result" :query="query" compact @click="close" />
                </div>
                <NuxtLink
                  :to="{ path: '/pencarian', query: { q: query.trim() } }"
                  class="flex min-h-[48px] items-center justify-between gap-3 border-t border-line-warm px-4 text-[14px] font-semibold text-unu-green transition hover:bg-soft-white sm:px-5"
                  @click="close"
                >
                  <span>Lihat semua hasil</span>
                  <span class="flex items-center gap-1 text-[12px] font-medium text-slate-500">{{ total }} hasil <ArrowRight :size="13" aria-hidden="true" /></span>
                </NuxtLink>
              </template>
              <div v-else class="p-8 text-center">
                <p class="text-[15px] font-semibold text-charcoal">Tidak ada hasil</p>
                <p class="mt-1 text-[13px] leading-5 text-slate-500">Coba kata kunci lain seperti nama layanan, panduan, atau topik publikasi.</p>
              </div>
            </template>

            <div v-else class="p-4 sm:p-5">
              <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Jelajahi konten</p>
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <NuxtLink
                  v-for="link in quickLinks"
                  :key="link.to"
                  :to="link.to"
                  class="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-line-warm px-3.5 text-[14px] font-medium text-slate-700 transition hover:border-unu-green/35 hover:bg-soft-white hover:text-unu-green"
                  @click="close"
                >
                  {{ link.label }}
                  <ArrowUpRight :size="13" class="text-slate-400" aria-hidden="true" />
                </NuxtLink>
              </div>
            </div>
          </div>

          <div class="border-t border-line-warm px-4 py-2.5 text-[11px] leading-5 text-slate-400 sm:px-5">
            Ketik minimal 2 karakter · Esc untuk menutup
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

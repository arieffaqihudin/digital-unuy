<script setup lang="ts">
import { FilterX, Search } from 'lucide-vue-next'
import type { DocumentDTO } from '~/shared/types'

const search = ref('')
const category = ref('')
const page = ref(1)
const pending = ref(true)
const failure = ref('')
const result = ref<{ items: DocumentDTO[]; total: number; page: number; pageSize: number; categories: string[] } | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  pending.value = true
  failure.value = ''
  try {
    result.value = await $fetch('/api/documents', {
      query: {
        q: search.value || undefined,
        category: category.value || undefined,
        page: page.value,
        pageSize: 12
      }
    })
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Dokumen gagal dimuat.'
  } finally {
    pending.value = false
  }
}

await load()

watch(category, () => {
  page.value = 1
  load()
})
watch(page, load)
watch(search, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

function reset() {
  search.value = ''
  category.value = ''
  page.value = 1
  load()
}

const hasFilters = computed(() => Boolean(search.value || category.value))
const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 12))))

useSeoMeta({
  title: 'Panduan & Dokumen',
  description:
    'SOP, panduan, kebijakan, dan formulir Direktorat Tim Transformasi Digital UNU Yogyakarta. Cari dokumen publik dan unduh versi terbaru.',
  ogTitle: 'Panduan & Dokumen · UNU Yogyakarta',
  ogDescription: 'Dokumentasi layanan digital yang dapat diakses publik.'
})
</script>

<template>
  <div>
    <PublicPageHeader
      eyebrow="Knowledge Center"
      title="Panduan & Dokumen"
      description="Rujukan resmi untuk memahami prosedur, persyaratan, dan kebijakan layanan digital universitas."
      :breadcrumbs="[{ label: 'Beranda', to: '/' }, { label: 'Panduan & Dokumen' }]"
    >
      <template #aside>
        <p class="max-w-[250px] text-[14px] leading-5 text-slate-500">Hanya dokumen berstatus publik yang dapat diakses tanpa masuk.</p>
      </template>
    </PublicPageHeader>

    <section class="py-10 lg:py-12 bg-soft-white">
      <div class="page-shell">
        <div class="relative mb-8">
          <label for="doc-search" class="sr-only">Cari dokumen</label>
          <Search :size="17" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="doc-search" v-model="search" type="search" class="field-input min-h-[52px] bg-white pl-11 text-[15px]" placeholder="Cari judul atau jenis dokumen…" />
        </div>

        <div class="grid gap-8 lg:grid-cols-[190px_1fr] lg:gap-12">
          <aside class="min-w-0">
            <div class="lg:hidden">
              <label for="doc-mobile-category" class="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Kategori</label>
              <select id="doc-mobile-category" v-model="category" class="field-input mt-2 bg-white">
                <option value="">Semua dokumen</option>
                <option v-for="item in result?.categories || []" :key="item" :value="item">{{ item }}</option>
              </select>
            </div>
            <div class="hidden lg:block">
              <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Kategori</p>
              <div class="mt-3 space-y-0.5">
                <button
                  type="button"
                  class="inline-flex min-h-[44px] w-full items-center border-l-2 px-3 text-[12px] font-semibold transition"
                  :class="!category ? 'border-unu-green text-unu-green' : 'border-transparent text-slate-500 hover:text-charcoal'"
                  @click="category = ''"
                >
                  Semua dokumen
                </button>
                <button
                  v-for="item in result?.categories || []"
                  :key="item"
                  type="button"
                  class="inline-flex min-h-[44px] w-full items-center border-l-2 px-3 text-[12px] font-semibold transition"
                  :class="category === item ? 'border-unu-green text-unu-green' : 'border-transparent text-slate-500 hover:text-charcoal'"
                  @click="category = item"
                >
                  {{ item }}
                </button>
              </div>
              <button v-if="hasFilters" type="button" class="mt-3 inline-flex min-h-[44px] items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-charcoal" @click="reset">
                <FilterX :size="12" aria-hidden="true" /> Hapus filter
              </button>
            </div>
          </aside>

          <div class="min-w-0">
            <div class="flex items-center justify-between border-y border-line-warm bg-white px-5 py-3">
              <span class="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-500">{{ category || 'Semua dokumen' }}</span>
              <span class="text-[12px] tabular-nums text-slate-400">{{ result?.total ?? 0 }} dokumen</span>
            </div>

            <div v-if="pending" class="space-y-3 pt-4">
              <div v-for="index in 5" :key="index" class="skeleton h-24 rounded-lg" />
            </div>
            <EmptyState v-else-if="failure" class="mt-6" title="Dokumen belum dapat dimuat" description="Silakan coba lagi.">
              <AppButton variant="secondary" @click="load">Muat ulang</AppButton>
            </EmptyState>
            <EmptyState
              v-else-if="!result?.items.length"
              class="mt-6"
              title="Dokumen tidak ditemukan"
              :description="hasFilters ? 'Coba kata kunci atau kategori lain.' : 'Belum ada dokumen publik yang diterbitkan.'"
            >
              <AppButton v-if="hasFilters" variant="secondary" @click="reset">Hapus filter</AppButton>
            </EmptyState>
            <div v-else class="bg-white px-5">
              <DocumentCard v-for="document in result.items" :key="document.id" :document="document" />
            </div>

            <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" class="mt-9" @update:page="page = $event" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { SeoDTO } from '~/shared/seo'
import { SEO_RECOMMENDED, cleanSeoText, snippet } from '~/shared/seo'

const model = defineModel<SeoDTO>({ required: true })
const props = defineProps<{
  /** Content title / summary used when the SEO fields are left empty. */
  fallbackTitle?: string
  fallbackDescription?: string
  /** Public path of the page, used for the search-result preview URL. */
  path?: string
}>()

const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')
const host = computed(() => {
  try {
    return new URL(siteUrl).host
  } catch {
    return ''
  }
})

const previewTitle = computed(() => cleanSeoText(model.value.title, 160) || props.fallbackTitle || 'Judul halaman')
const previewDescription = computed(
  () => cleanSeoText(model.value.description, 320) || snippet(props.fallbackDescription, 160) || 'Ringkasan halaman akan tampil di sini.'
)
const previewUrl = computed(() => `${host.value || 'situs-anda'}${props.path ? ` › ${props.path.replace(/^\//, '').split('/').join(' › ')}` : ''}`)

type Level = 'empty' | 'short' | 'ok' | 'long'
function level(length: number, range: { min: number; max: number }): Level {
  if (!length) return 'empty'
  if (length < range.min) return 'short'
  if (length > range.max) return 'long'
  return 'ok'
}
const hints: Record<Level, string> = {
  empty: 'Kosong: memakai teks otomatis dari konten.',
  short: 'Agak pendek; deskripsi yang lebih lengkap membantu pembaca.',
  ok: 'Panjang sudah baik.',
  long: 'Cukup panjang; mesin pencari mungkin memotong tampilannya.'
}
const tone: Record<Level, string> = {
  empty: 'text-admin-muted',
  short: 'text-amber-700',
  ok: 'text-emerald-700',
  long: 'text-amber-700'
}
const titleLevel = computed(() => level(model.value.title.length, SEO_RECOMMENDED.title))
const descLevel = computed(() => level(model.value.description.length, SEO_RECOMMENDED.description))

const canonicalWarning = computed(() => {
  const value = model.value.canonical.trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    if (!host.value) return ''
    return url.host !== host.value ? `Canonical mengarah ke domain lain (${url.host}), bukan ${host.value}. Pastikan ini disengaja.` : ''
  } catch {
    return 'Canonical harus berupa URL lengkap, misalnya https://domain-anda/halaman.'
  }
})
</script>

<template>
  <details class="group rounded-xl border border-admin-border bg-slate-50/60 sm:col-span-2" :open="Boolean(model.title || model.description || model.image || model.canonical || model.noindex)">
    <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold marker:hidden">
      <span>SEO &amp; Tampilan Pencarian <span class="ml-1 text-[12px] font-normal text-admin-muted">(opsional)</span></span>
      <span class="text-[12px] font-normal text-admin-muted group-open:hidden">Buka</span>
      <span class="hidden text-[12px] font-normal text-admin-muted group-open:inline">Tutup</span>
    </summary>

    <div class="space-y-4 border-t border-admin-border p-4">
      <p class="text-[13px] leading-5 text-admin-muted">Semua kolom boleh dikosongkan. Jika kosong, judul dan ringkasan diambil otomatis dari konten.</p>

      <div class="rounded-lg border border-admin-border bg-white p-4" aria-label="Pratinjau hasil pencarian">
        <p class="truncate text-[12px] text-emerald-800">{{ previewUrl }}</p>
        <p class="mt-1 line-clamp-2 text-[17px] leading-snug text-[#1a0dab]">{{ previewTitle }}</p>
        <p class="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-600">{{ previewDescription }}</p>
      </div>

      <div>
        <label class="admin-label" for="seo-title">Judul untuk mesin pencari</label>
        <input id="seo-title" v-model="model.title" class="field-input" maxlength="160" placeholder="Otomatis dari judul konten" />
        <p class="mt-1 text-[12px]" :class="tone[titleLevel]">{{ model.title.length }} karakter · rekomendasi {{ SEO_RECOMMENDED.title.min }}–{{ SEO_RECOMMENDED.title.max }}. {{ hints[titleLevel] }}</p>
      </div>

      <div>
        <label class="admin-label" for="seo-desc">Deskripsi singkat</label>
        <textarea id="seo-desc" v-model="model.description" rows="3" class="field-input" maxlength="320" placeholder="Otomatis dari ringkasan konten" />
        <p class="mt-1 text-[12px]" :class="tone[descLevel]">{{ model.description.length }} karakter · rekomendasi {{ SEO_RECOMMENDED.description.min }}–{{ SEO_RECOMMENDED.description.max }}. {{ hints[descLevel] }}</p>
      </div>

      <div>
        <label class="admin-label" for="seo-image">Gambar saat dibagikan</label>
        <input id="seo-image" v-model="model.image" class="field-input" maxlength="500" placeholder="https://… atau /images/… (rasio ±1,91:1, 1200×630 px)" />
        <p class="field-help">Kosong: memakai gambar konten bila ada, atau gambar bawaan situs.</p>
      </div>

      <div>
        <label class="admin-label" for="seo-canonical">Canonical URL (khusus)</label>
        <input id="seo-canonical" v-model="model.canonical" type="url" class="field-input" maxlength="500" placeholder="Biarkan kosong kecuali ada kebutuhan khusus" />
        <p v-if="canonicalWarning" class="mt-1 text-[12px] text-amber-700" role="alert">{{ canonicalWarning }}</p>
        <p v-else class="field-help">Hanya isi bila halaman ini duplikat dari URL lain.</p>
      </div>

      <label class="flex items-start gap-3 text-sm">
        <input v-model="model.noindex" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-unu-green" />
        <span><span class="font-semibold">Jangan tampilkan di mesin pencari</span><span class="block text-[12px] text-admin-muted">Halaman tetap bisa dibuka lewat tautan, tetapi tidak dimasukkan ke sitemap dan diberi tanda noindex.</span></span>
      </label>
    </div>
  </details>
</template>

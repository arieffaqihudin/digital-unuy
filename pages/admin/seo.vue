<script setup lang="ts">
import { CheckCircle2, ExternalLink, TriangleAlert } from 'lucide-vue-next'
import { defaultSeoSettings } from '~/shared/seo'
import type { SiteSettingsDTO } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const config = useRuntimeConfig()

const settings = ref<SiteSettingsDTO | null>(null)
const loading = ref(true)
const saving = ref(false)
const form = reactive({ titleSuffix: '', defaultDescription: '', defaultOgImage: '', googleVerification: '' })
const defaults = defaultSeoSettings()

const siteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')
const isLocal = computed(() => /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/i.test(siteUrl))
const indexable = computed(() => config.public.environment === 'production' && siteUrl.startsWith('https://') && !isLocal.value)

try {
  const data = await requestFetch<{ settings: SiteSettingsDTO }>('/api/admin/settings')
  settings.value = data.settings
  Object.assign(form, data.settings.seo || {})
} catch (error: any) {
  toast.error('Gagal memuat', error?.data?.statusMessage)
} finally {
  loading.value = false
}

async function save() {
  if (!settings.value) return
  saving.value = true
  try {
    // The settings endpoint replaces whole documents, so send the loaded settings back with the new SEO block.
    const data = await api<{ settings: SiteSettingsDTO }>('/api/admin/settings', {
      method: 'PUT',
      body: { ...settings.value, seo: { ...form } }
    })
    settings.value = data.settings
    Object.assign(form, data.settings.seo || {})
    toast.success('Pengaturan SEO disimpan')
  } catch (error: any) {
    toast.error('Gagal menyimpan', error?.data?.statusMessage)
  } finally {
    saving.value = false
  }
}

useSeoMeta({ title: 'SEO & Indexing', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="max-w-3xl space-y-5">
    <div>
      <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Administrasi</p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight">SEO &amp; Indexing</h2>
      <p class="mt-1 text-sm text-admin-muted">Pengaturan bawaan untuk tampilan website di mesin pencari dan saat dibagikan.</p>
    </div>

    <div class="rounded-xl border border-admin-border bg-white p-5">
      <h3 class="text-sm font-semibold">Status indexing</h3>
      <dl class="mt-3 space-y-2 text-sm">
        <div class="flex flex-wrap gap-x-3"><dt class="w-36 text-admin-muted">URL situs</dt><dd class="font-mono text-[13px]">{{ siteUrl || '—' }}</dd></div>
        <div class="flex flex-wrap items-center gap-x-3">
          <dt class="w-36 text-admin-muted">Mesin pencari</dt>
          <dd v-if="indexable" class="inline-flex items-center gap-1.5 font-semibold text-emerald-800"><CheckCircle2 :size="15" aria-hidden="true" /> Diizinkan mengindeks</dd>
          <dd v-else class="inline-flex items-center gap-1.5 font-semibold text-amber-800"><TriangleAlert :size="15" aria-hidden="true" /> Diblokir (bukan produksi atau URL situs belum diatur)</dd>
        </div>
      </dl>
      <p class="mt-3 text-[13px] leading-5 text-admin-muted">
        URL situs diatur oleh pengelola server lewat variabel <code>NUXT_PUBLIC_SITE_URL</code> (harus https dan domain produksi). Untuk lingkungan staging yang berjalan sebagai produksi, set <code>NUXT_PUBLIC_NOINDEX=true</code>.
      </p>
      <div class="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
        <a href="/sitemap.xml" target="_blank" class="inline-flex items-center gap-1 text-unu-green hover:underline">sitemap.xml <ExternalLink :size="12" aria-hidden="true" /></a>
        <a href="/robots.txt" target="_blank" class="inline-flex items-center gap-1 text-unu-green hover:underline">robots.txt <ExternalLink :size="12" aria-hidden="true" /></a>
      </div>
    </div>

    <form class="space-y-4 rounded-xl border border-admin-border bg-white p-5" @submit.prevent="save">
      <div v-if="loading" class="skeleton h-40 rounded-lg" />
      <template v-else>
        <div>
          <label for="seo-suffix" class="admin-label">Akhiran judul halaman</label>
          <input id="seo-suffix" v-model="form.titleSuffix" class="field-input" maxlength="80" :placeholder="defaults.titleSuffix" />
          <p class="field-help">Ditambahkan pada judul konten yang tidak punya judul SEO, mis. “Nama Layanan | {{ form.titleSuffix || defaults.titleSuffix }}”.</p>
        </div>
        <div>
          <label for="seo-default-desc" class="admin-label">Deskripsi bawaan situs</label>
          <textarea id="seo-default-desc" v-model="form.defaultDescription" rows="3" class="field-input" maxlength="320" :placeholder="defaults.defaultDescription" />
          <p class="field-help">Dipakai bila halaman tidak punya deskripsi sendiri. Rekomendasi 70–160 karakter ({{ form.defaultDescription.length }}).</p>
        </div>
        <div>
          <label for="seo-default-og" class="admin-label">Gambar bawaan saat dibagikan</label>
          <input id="seo-default-og" v-model="form.defaultOgImage" class="field-input" maxlength="500" :placeholder="defaults.defaultOgImage" />
          <p class="field-help">Rasio ±1,91:1 (1200×630 px). Kosong memakai <code>/og-default.png</code>.</p>
          <img :src="form.defaultOgImage || defaults.defaultOgImage" alt="Pratinjau gambar bawaan saat dibagikan" class="mt-3 aspect-[1200/630] w-full max-w-sm rounded-lg border border-admin-border object-cover" />
        </div>
        <div>
          <label for="seo-google" class="admin-label">Kode verifikasi Google Search Console</label>
          <input id="seo-google" v-model="form.googleVerification" class="field-input font-mono text-[13px]" maxlength="120" placeholder="Hanya isi bagian content dari meta tag, bukan seluruh tag" autocomplete="off" />
          <p class="field-help">Kosongkan bila verifikasi dilakukan lewat DNS. Isi hanya dengan kode asli dari Search Console.</p>
        </div>
        <div class="flex justify-end"><AppButton type="submit" :loading="saving">Simpan</AppButton></div>
      </template>
    </form>
  </div>
</template>

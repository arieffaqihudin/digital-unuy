<script setup lang="ts">
import { AlertTriangle, Plus, Save, Send, Trash2 } from 'lucide-vue-next'
import type { SiteSettingsDTO } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const form = reactive<SiteSettingsDTO>({
  directorateName: '',
  universityName: '',
  tagline: '',
  logoUrl: '',
  description: '',
  address: '',
  contactPhone: '',
  contactEmail: '',
  notificationEmail: '',
  socials: [],
  hero: {
    eyebrow: '',
    title: '',
    description: '',
    primaryLabel: '',
    primaryUrl: '',
    secondaryLabel: '',
    secondaryUrl: ''
  },
  metrics: [],
  devSeedMode: false
})

async function load() {
  loading.value = true
  try {
    const data = await requestFetch<{ settings: SiteSettingsDTO }>('/api/admin/settings')
    Object.assign(form, data.settings)
    form.socials = data.settings.socials || []
    form.metrics = data.settings.metrics || []
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Pengaturan gagal dimuat.'
  } finally {
    loading.value = false
  }
}
await load()

function addSocial() {
  form.socials.push({ label: '', url: '' })
}
function addMetric() {
  form.metrics.push({ label: '', value: 0, unit: '', description: '', verified: false })
}

async function save() {
  errorMessage.value = ''
  saving.value = true
  try {
    await api('/api/admin/settings', { method: 'PUT', body: form })
    toast.success('Pengaturan disimpan', 'Perubahan tampil pada website publik.')
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal menyimpan pengaturan.'
    toast.error('Gagal menyimpan', errorMessage.value)
  } finally {
    saving.value = false
  }
}

useSeoMeta({ title: 'Pengaturan Sistem', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Administrasi</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">Pengaturan Sistem</h2><p class="mt-1 text-sm text-admin-muted">Identitas, hero, kontak, media sosial, dan metrik terverifikasi.</p></div>
      <AppButton :loading="saving" @click="save"><template #left><Save :size="15" /></template>Simpan Pengaturan</AppButton>
    </div>

    <div v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{{ errorMessage }}</div>
    <div v-if="loading" class="space-y-4"><div class="skeleton h-52 rounded-xl" /><div class="skeleton h-72 rounded-xl" /></div>

    <div v-else class="grid gap-5 xl:grid-cols-[1fr_340px] xl:items-start">
      <div class="space-y-5">
        <section class="admin-card p-5">
          <h3 class="text-sm font-semibold">Identitas direktorat</h3>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label class="admin-label">Nama direktorat</label><input v-model="form.directorateName" class="field-input" maxlength="160" /></div>
            <div><label class="admin-label">Nama universitas</label><input v-model="form.universityName" class="field-input" maxlength="180" /></div>
            <div class="sm:col-span-2"><label class="admin-label">Tagline</label><input v-model="form.tagline" class="field-input" maxlength="200" /></div>
            <div class="sm:col-span-2"><label class="admin-label">URL logo resmi</label><input v-model="form.logoUrl" type="url" class="field-input" placeholder="https://…" maxlength="500" /><p class="field-help">Opsional. Gunakan URL logo resmi yang tersedia. Jika kosong, portal memakai wordmark netral.</p></div>
            <div class="sm:col-span-2"><label class="admin-label">Deskripsi singkat</label><textarea v-model="form.description" rows="3" class="field-input" maxlength="800" /></div>
          </div>
        </section>

        <section class="admin-card p-5">
          <h3 class="text-sm font-semibold">Hero beranda</h3>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label class="admin-label">Eyebrow</label><input v-model="form.hero.eyebrow" class="field-input" maxlength="80" /></div>
            <div><label class="admin-label">Judul utama</label><input v-model="form.hero.title" class="field-input" maxlength="180" /></div>
            <div class="sm:col-span-2"><label class="admin-label">Deskripsi</label><textarea v-model="form.hero.description" rows="3" class="field-input" maxlength="900" /></div>
            <div><label class="admin-label">Label CTA utama</label><input v-model="form.hero.primaryLabel" class="field-input" maxlength="60" /></div>
            <div><label class="admin-label">URL CTA utama</label><input v-model="form.hero.primaryUrl" class="field-input" placeholder="/layanan" /></div>
            <div><label class="admin-label">Label CTA sekunder</label><input v-model="form.hero.secondaryLabel" class="field-input" maxlength="60" /></div>
            <div><label class="admin-label">URL CTA sekunder</label><input v-model="form.hero.secondaryUrl" class="field-input" placeholder="/tentang" /></div>
          </div>
        </section>

        <section class="admin-card p-5">
          <h3 class="text-sm font-semibold">Kontak & media sosial</h3>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2"><label class="admin-label">Alamat</label><textarea v-model="form.address" rows="2" class="field-input" maxlength="500" /></div>
            <div><label class="admin-label">Telepon</label><input v-model="form.contactPhone" class="field-input" maxlength="80" /></div>
            <div><label class="admin-label">Email kontak publik</label><input v-model="form.contactEmail" type="email" class="field-input" maxlength="180" /></div>
            <div class="sm:col-span-2"><label class="admin-label">Email notifikasi administrator</label><input v-model="form.notificationEmail" type="email" class="field-input" maxlength="180" /><p class="field-help">Digunakan untuk kebutuhan operasional dan rujukan kontak email.</p></div>
          </div>
          <div class="mt-4">
            <div class="flex items-center justify-between"><label class="admin-label mb-0">Media sosial</label><button type="button" class="text-xs font-semibold text-unu-green" @click="addSocial">Tambah</button></div>
            <div class="mt-2 space-y-2">
              <div v-for="(social, index) in form.socials" :key="index" class="flex gap-2">
                <input v-model="social.label" class="field-input flex-1" placeholder="Label" />
                <input v-model="social.url" type="url" class="field-input flex-[2]" placeholder="https://" />
                <button type="button" class="grid h-10 w-10 place-items-center rounded-lg text-red-700 hover:bg-red-50" aria-label="Hapus media sosial" @click="form.socials.splice(index, 1)"><Trash2 :size="14" /></button>
              </div>
              <p v-if="!form.socials.length" class="text-[14px] text-admin-muted">Belum ada tautan media sosial.</p>
            </div>
          </div>
        </section>

        <section class="admin-card p-5">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div><h3 class="text-sm font-semibold">Capaian transformasi</h3><p class="mt-1 text-[14px] leading-5 text-admin-muted">Hanya metrik dengan status terverifikasi yang tampil di beranda. Jangan menandai terverifikasi tanpa bukti data.</p></div>
            <button type="button" class="text-xs font-semibold text-unu-green" @click="addMetric">Tambah metrik</button>
          </div>
          <div class="mt-4 space-y-3">
            <div v-for="(metric, index) in form.metrics" :key="index" class="rounded-xl border border-admin-border bg-slate-50 p-3.5">
              <div class="grid gap-2 sm:grid-cols-[1.3fr_0.7fr_0.7fr_auto]">
                <input v-model="metric.label" class="field-input" placeholder="Nama metrik" maxlength="100" />
                <input v-model.number="metric.value" type="number" min="0" class="field-input" placeholder="Nilai" />
                <input v-model="metric.unit" class="field-input" placeholder="Satuan" maxlength="30" />
                <button type="button" class="grid h-10 w-10 place-items-center rounded-lg text-red-700 hover:bg-red-50" aria-label="Hapus metrik" @click="form.metrics.splice(index, 1)"><Trash2 :size="14" /></button>
              </div>
              <input v-model="metric.description" class="field-input mt-2" placeholder="Keterangan singkat" maxlength="200" />
              <label class="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold"><input v-model="metric.verified" type="checkbox" class="h-4 w-4 accent-unu-green" /> Terverifikasi dan boleh ditampilkan</label>
            </div>
            <p v-if="!form.metrics.length" class="rounded-lg border border-dashed border-admin-border p-4 text-center text-xs text-admin-muted">Belum ada metrik. Beranda akan menampilkan narasi capaian tanpa angka.</p>
          </div>
        </section>
      </div>

      <aside class="space-y-4 xl:sticky xl:top-24">
        <div class="rounded-xl border border-admin-border bg-white p-5">
          <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Mode pengembangan</p>
          <label class="mt-3 flex cursor-pointer items-start gap-3 text-xs">
            <input v-model="form.devSeedMode" type="checkbox" class="mt-0.5 h-4 w-4 accent-unu-green" />
            <span><span class="block font-semibold">Tampilkan label data contoh</span><span class="mt-1 block text-[12px] leading-4 text-admin-muted">Aktifkan hanya saat website memakai seed development. Matikan di produksi.</span></span>
          </label>
          <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] leading-4 text-amber-950"><AlertTriangle :size="13" class="mt-0.5 shrink-0" /> Data seed tidak boleh dianggap sebagai data operasional resmi.</div>
        </div>

        <div class="rounded-xl border border-admin-border bg-slate-50 p-5">
          <div class="flex items-center gap-2"><Send :size="15" class="text-unu-green" /><p class="text-xs font-semibold">Email delivery</p></div>
          <p class="mt-2 text-[14px] leading-5 text-admin-muted">Kredensial SMTP dikonfigurasi melalui environment variable dan tidak disimpan di database. Status pengiriman dapat dipantau di menu Notifikasi.</p>
          <NuxtLink to="/admin/notifikasi" class="mt-3 inline-flex text-[14px] font-semibold text-unu-green hover:underline">Buka log notifikasi</NuxtLink>
        </div>

        <div class="rounded-xl border border-admin-border bg-white p-5">
          <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Simpan</p>
          <p class="mt-2 text-[14px] leading-5 text-admin-muted">Perubahan pengaturan langsung memengaruhi halaman publik setelah disimpan.</p>
          <AppButton class="mt-4" block :loading="saving" @click="save"><template #left><Save :size="14" /></template>Simpan Pengaturan</AppButton>
        </div>
      </aside>
    </div>
  </div>
</template>

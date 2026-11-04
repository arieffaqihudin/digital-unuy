<script setup lang="ts">
import { Search } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const { formatDateTime } = useFormat()
const search = ref('')
const entityType = ref('')
const page = ref(1)
const loading = ref(true)
const result = ref<{
  items: { id: string; actorName: string; actorEmail: string; action: string; entityType: string; entityId: string; metadata: Record<string, unknown>; ip: string; createdAt: string }[]
  total: number
  page: number
  pageSize: number
} | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const ENTITY_LABELS: Record<string, string> = {
  User: 'Pengguna',
  Service: 'Layanan',
  ServiceRequest: 'Permohonan',
  Document: 'Dokumen',
  DigitalPlatform: 'Produk ekosistem',
  PlatformCategory: 'Kategori ekosistem',
  Program: 'Program',
  Article: 'Publikasi',
  Page: 'Halaman',
  SiteSetting: 'Pengaturan situs',
  Role: 'Hak akses',
  RequestAttachment: 'Lampiran',
  TeamMember: 'Anggota tim',
  TeamGroup: 'Kelompok tim'
}

const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Masuk ke sistem',
  'auth.logout': 'Keluar dari sistem',
  'auth.login_failed': 'Percobaan masuk gagal',
  'auth.activated': 'Mengaktifkan akun',
  'user.created': 'Menambahkan pengguna',
  'user.updated': 'Memperbarui pengguna',
  'user.activation_resent': 'Mengirim ulang undangan',
  'role.permissions_updated': 'Memperbarui hak akses',
  'request.created': 'Permohonan baru',
  'request.assigned': 'Menugaskan petugas',
  'request.verify': 'Memverifikasi permohonan',
  'request.start': 'Memulai proses permohonan',
  'request.request_info': 'Meminta kelengkapan',
  'request.complete': 'Menyelesaikan permohonan',
  'request.reject': 'Menolak permohonan',
  'request.comment_added': 'Menambahkan catatan',
  'request.completed_info': 'Pemohon melengkapi data',
  'request.completed_info_guest': 'Pemohon melengkapi data',
  'request.comment_added_guest': 'Pemohon mengirim pesan',
  'request.attachment_uploaded': 'Mengunggah lampiran',
  'request.attachment_uploaded_by_requester': 'Pemohon mengunggah lampiran',
  'request.attachment_uploaded_guest': 'Pemohon mengunggah lampiran',
  'attachment.accessed': 'Membuka lampiran',
  'service.created': 'Menambahkan layanan',
  'service.updated': 'Memperbarui layanan',
  'document.created': 'Mengunggah dokumen',
  'document.updated': 'Memperbarui dokumen',
  'document.version_uploaded': 'Mengunggah versi dokumen',
  'document.downloaded_admin': 'Mengunduh dokumen',
  'platform.created': 'Menambahkan produk ekosistem',
  'platform.updated': 'Memperbarui produk ekosistem',
  'platform_category.created': 'Menambahkan kategori ekosistem',
  'platform_category.updated': 'Memperbarui kategori ekosistem',
  'platform_category.deleted': 'Menghapus kategori ekosistem',
  'program.created': 'Menambahkan program',
  'program.updated': 'Memperbarui program',
  'article.created': 'Membuat publikasi',
  'article.updated': 'Memperbarui publikasi',
  'page.created': 'Menambahkan halaman',
  'page.updated': 'Memperbarui halaman',
  'team_member.created': 'Menambahkan anggota tim',
  'team_member.updated': 'Memperbarui anggota tim',
  'team_member.deleted': 'Menghapus anggota tim',
  'team_group.created': 'Menambahkan kelompok tim',
  'team_group.updated': 'Memperbarui kelompok tim',
  'team_group.deleted': 'Menghapus kelompok tim',
  'settings.updated': 'Memperbarui pengaturan situs'
}

const KEY_LABELS: Record<string, string> = {
  ticketNumber: 'Tiket',
  service: 'Layanan',
  fromStatus: 'Status awal',
  toStatus: 'Status akhir',
  emailStatus: 'Email',
  guest: 'Jenis pemohon',
  requesterEmail: 'Email pemohon',
  name: 'Nama',
  title: 'Judul',
  category: 'Kategori',
  published: 'Publikasi',
  publishedBefore: 'Publikasi sebelumnya',
  publishedAfter: 'Publikasi sekarang',
  active: 'Status akun',
  role: 'Peran',
  changed: 'Perubahan',
  version: 'Versi',
  visibility: 'Visibilitas',
  permissions: 'Izin',
  previous: 'Sebelumnya',
  metrics: 'Jumlah metrik',
  devSeedMode: 'Mode data contoh',
  slug: 'Alamat halaman',
  unit: 'Unit',
  group: 'Kelompok',
  order: 'Urutan',
  position: 'Jabatan',
  email: 'Email',
  status: 'Status',
  reason: 'Alasan',
  audiences: 'Sasaran pengguna',
  featured: 'Produk unggulan',
  thumbnail: 'Screenshot utama',
  gallery: 'Screenshot tambahan',
  problem: 'Permasalahan',
  solution: 'Solusi',
  benefits: 'Manfaat',
  features: 'Fitur',
  modules: 'Modul',
  metrics: 'Capaian',
  url: 'URL produk',
  platformCount: 'Jumlah produk',
  description: 'Deskripsi'
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nama',
  slug: 'Alamat halaman',
  shortDescription: 'Ringkasan',
  description: 'Deskripsi',
  category: 'Kategori',
  icon: 'Ikon',
  active: 'Status aktif',
  acceptsRequests: 'Penerimaan permohonan',
  featured: 'Layanan unggulan',
  order: 'Urutan',
  targetUsers: 'Sasaran pengguna',
  requirements: 'Persyaratan',
  requiredDocuments: 'Dokumen wajib',
  procedure: 'Prosedur',
  estimatedDuration: 'Estimasi waktu',
  fields: 'Formulir',
  documentIds: 'Dokumen terkait',
  title: 'Judul',
  summary: 'Ringkasan',
  content: 'Konten',
  status: 'Status',
  publishedAt: 'Tanggal publikasi',
  published: 'Publikasi',
  thumbnail: 'Gambar utama',
  author: 'Penulis',
  url: 'Tautan',
  audience: 'Sasaran pengguna',
  bio: 'Deskripsi singkat',
  group: 'Kelompok',
  photo: 'Foto',
  photo_removed: 'Foto dihapus',
  email: 'Email',
  role: 'Peran',
  active: 'Status akun',
  position: 'Jabatan',
  bio: 'Deskripsi singkat',
  audiences: 'Sasaran pengguna',
  featured: 'Produk unggulan',
  thumbnail: 'Screenshot utama',
  gallery: 'Screenshot tambahan',
  problem: 'Permasalahan',
  solution: 'Solusi',
  benefits: 'Manfaat',
  features: 'Fitur',
  modules: 'Modul',
  metrics: 'Capaian',
  url: 'URL produk',
  focalX: 'Fokus foto horizontal',
  focalY: 'Fokus foto vertikal',
  groupName: 'Nama kelompok',
  memberCount: 'Jumlah anggota',
  accept: 'Jenis file',
  fileMaxMB: 'Batas ukuran file',
  pattern: 'Pola validasi',
  options: 'Pilihan',
  placeholder: 'Petunjuk isian',
  helpText: 'Teks bantuan',
  required: 'Wajib diisi',
  type: 'Jenis isian',
  key: 'Kode isian'
}

const entityOptions = Object.entries(ENTITY_LABELS)

async function load() {
  loading.value = true
  try {
    result.value = await requestFetch('/api/admin/audit', {
      query: { q: search.value || undefined, entityType: entityType.value || undefined, page: page.value, pageSize: 30 }
    })
  } catch {
    result.value = null
  } finally {
    loading.value = false
  }
}
await load()
watch(entityType, () => {
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

const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 30))))

function humanize(value: string) {
  return value
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] || humanize(action)
}

function entityLabel(entity: string) {
  return ENTITY_LABELS[entity] || humanize(entity)
}

function metaValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'published' || key === 'publishedBefore' || key === 'publishedAfter') {
    return value ? 'Dipublikasikan' : 'Tidak dipublikasikan'
  }
  if (key === 'guest') return value ? 'Pemohon tanpa akun' : 'Diajukan oleh staf'
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (Array.isArray(value)) {
    if (key === 'changed') return value.map((item) => FIELD_LABELS[String(item)] || humanize(String(item))).join(', ')
    if (key === 'permissions') return value.map((item) => humanize(String(item))).join(', ')
    return value.map((item) => String(item)).join(', ')
  }
  const text = String(value)
  if (key === 'emailStatus') {
    return { sent: 'Terkirim', simulated: 'Disimulasikan di pengembangan', failed: 'Gagal dikirim', 'not-sent': 'Tidak diperlukan', 'not-resent': 'Tidak dikirim ulang' }[text] || text
  }
  if (key === 'visibility') return text === 'internal' ? 'Catatan internal' : 'Dapat dilihat pemohon'
  if (key === 'role') return text === 'superadmin' ? 'Superadmin' : text === 'admin' ? 'Admin/Petugas' : humanize(text)
  if (key === 'published') return text === 'true' ? 'Publik' : text === 'false' ? 'Tidak publik' : text
  if (key === 'active') return text === 'true' ? 'Aktif' : text === 'false' ? 'Nonaktif' : text
  if (key === 'service') return humanize(text.replaceAll('-', ' '))
  if (key === 'devSeedMode') return text === 'true' ? 'Aktif' : 'Tidak aktif'
  return text
}

function detailItems(metadata: Record<string, unknown>) {
  if (!metadata || !Object.keys(metadata).length) return []
  const ordered = ['ticketNumber', 'service', 'fromStatus', 'toStatus', 'emailStatus', 'name', 'title', 'category', 'role', 'active', 'published', 'publishedBefore', 'publishedAfter', 'status', 'changed', 'version', 'visibility', 'guest', 'requesterEmail', 'permissions', 'metrics', 'devSeedMode', 'slug', 'unit', 'group', 'order']
  const keys = [
    ...ordered.filter((key) => key in metadata),
    ...Object.keys(metadata).filter((key) => !ordered.includes(key))
  ].slice(0, 5)
  return keys
    .filter((key) => metadata[key] !== null && metadata[key] !== undefined && metadata[key] !== '')
    .map((key) => ({ key, label: KEY_LABELS[key] || humanize(key), value: metaValue(key, metadata[key]) }))
}

function metadataSummary(metadata: Record<string, unknown>) {
  const items = detailItems(metadata)
  return items.length ? items.map((item) => `${item.label}: ${item.value}`).join(' · ') : 'Tidak ada detail tambahan.'
}

useSeoMeta({ title: 'Log Aktivitas', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Administrasi</p>
      <h2 class="mt-2">Log Aktivitas</h2>
      <p class="mt-1 text-[14px] text-admin-muted">Riwayat aktivitas penting di portal, ditampilkan dengan bahasa yang mudah dipahami.</p>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-admin-border bg-white p-4 sm:flex-row">
      <div class="relative flex-1">
        <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" aria-hidden="true" />
        <input v-model="search" type="search" class="field-input pl-10" placeholder="Cari nama atau email pengguna…" aria-label="Cari log aktivitas" />
      </div>
      <select v-model="entityType" class="field-input sm:w-56" aria-label="Filter objek aktivitas">
        <option value="">Semua objek</option>
        <option v-for="[value, label] in entityOptions" :key="value" :value="value">{{ label }}</option>
      </select>
      <span class="self-center px-2 text-[14px] text-admin-muted">{{ result?.total ?? 0 }} aktivitas</span>
    </div>

    <div class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div v-if="loading" class="space-y-2 p-4">
        <div v-for="i in 5" :key="i" class="skeleton h-14 rounded-lg" />
      </div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Belum ada aktivitas" description="Aktivitas penting akan tercatat dan tampil di halaman ini." compact />
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[860px] text-left">
            <thead>
              <tr class="border-b border-admin-border bg-slate-50 text-[13px] uppercase tracking-wide text-admin-muted">
                <th class="px-5 py-3 font-semibold">Waktu</th>
                <th class="px-5 py-3 font-semibold">Pengguna</th>
                <th class="px-5 py-3 font-semibold">Aktivitas</th>
                <th class="px-5 py-3 font-semibold">Objek</th>
                <th class="px-5 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-admin-border">
              <tr v-for="item in result.items" :key="item.id" class="align-top hover:bg-slate-50/60">
                <td class="whitespace-nowrap px-5 py-4 text-[13px] text-admin-muted">{{ formatDateTime(item.createdAt) }}</td>
                <td class="px-5 py-4">
                  <p class="text-[14px] font-medium text-admin-text">{{ item.actorName || 'Sistem' }}</p>
                  <p class="mt-0.5 text-[13px] text-admin-muted">{{ item.actorEmail || 'Aktivitas sistem' }}</p>
                </td>
                <td class="px-5 py-4">
                  <p class="text-[14px] font-semibold text-admin-text">{{ actionLabel(item.action) }}</p>
                </td>
                <td class="px-5 py-4">
                  <span class="inline-flex whitespace-nowrap rounded-full border border-admin-border bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-600">{{ entityLabel(item.entityType) }}</span>
                </td>
                <td class="max-w-[360px] px-5 py-4">
                  <div v-if="detailItems(item.metadata).length" class="flex flex-wrap gap-x-3 gap-y-1.5">
                    <span v-for="detail in detailItems(item.metadata)" :key="detail.key" class="text-[13px] leading-5 text-slate-600">
                      <span class="text-admin-muted">{{ detail.label }}:</span> {{ detail.value }}
                    </span>
                  </div>
                  <span v-else class="text-[13px] text-admin-muted">Tidak ada detail tambahan.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-admin-border md:hidden">
          <div v-for="item in result.items" :key="item.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[14px] font-semibold text-admin-text">{{ actionLabel(item.action) }}</p>
                <p class="mt-0.5 text-[13px] text-admin-muted">{{ item.actorName || 'Sistem' }} · {{ formatDateTime(item.createdAt) }}</p>
              </div>
              <span class="shrink-0 rounded-full border border-admin-border bg-slate-50 px-2 py-1 text-[12px] text-slate-600">{{ entityLabel(item.entityType) }}</span>
            </div>
            <p class="mt-2 text-[13px] leading-5 text-slate-600">{{ metadataSummary(item.metadata) }}</p>
          </div>
        </div>
      </template>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="page = $event" />

    <p class="text-[14px] leading-5 text-admin-muted">Log ini mencatat perubahan penting secara otomatis. Kata sandi, token aktivasi, dan cookie tidak pernah ditampilkan.</p>
  </div>
</template>

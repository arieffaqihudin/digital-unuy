<script setup lang="ts">
import { MailPlus, Pencil, Plus, RefreshCw, Search, ShieldCheck, UserX } from 'lucide-vue-next'
import type { RoleSlug } from '~/shared/types'
import { ROLE_LABELS } from '~/shared/types'

definePageMeta({ layout: 'admin' })

interface AdminUser {
  id: string
  name: string
  email: string
  role: RoleSlug
  active: boolean
  hasPassword: boolean
  invitationPending: boolean
  lastLoginAt: string | null
  createdAt: string
}

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const { can } = useAuth()
const { formatDateTime, formatDate } = useFormat()
const search = ref('')
const roleFilter = ref('')
const activeFilter = ref('')
const page = ref(1)
const loading = ref(true)
const result = ref<{ items: AdminUser[]; total: number; page: number; pageSize: number } | null>(null)
const modalOpen = ref(false)
const editingId = ref('')
const saving = ref(false)
const busyId = ref('')
const errorMessage = ref('')
const form = reactive({ name: '', email: '', role: 'pemohon' as RoleSlug, active: false })
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  try {
    result.value = await requestFetch('/api/admin/users', {
      query: { q: search.value || undefined, role: roleFilter.value || undefined, active: activeFilter.value || undefined, page: page.value, pageSize: 20 }
    })
  } catch (error: any) {
    toast.error('Gagal memuat pengguna', error?.data?.statusMessage)
  } finally {
    loading.value = false
  }
}
await load()
watch([roleFilter, activeFilter], () => {
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

function statusLabel(user: AdminUser) {
  if (!user.active) return 'Nonaktif'
  if (!user.hasPassword) return 'Menunggu aktivasi'
  return 'Aktif'
}
function statusClass(user: AdminUser) {
  if (!user.active) return 'border-admin-border bg-slate-50 text-admin-muted'
  if (!user.hasPassword) return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-emerald-200 bg-emerald-50 text-emerald-800'
}

function openCreate() {
  editingId.value = ''
  Object.assign(form, { name: '', email: '', role: 'pemohon', active: false })
  errorMessage.value = ''
  modalOpen.value = true
}
function openEdit(user: AdminUser) {
  editingId.value = user.id
  Object.assign(form, { name: user.name, email: user.email, role: user.role, active: user.active })
  errorMessage.value = ''
  modalOpen.value = true
}

async function save() {
  errorMessage.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await api(`/api/admin/users/${editingId.value}`, {
        method: 'PATCH',
        body: { name: form.name, email: form.email, role: can('roles.manage') ? form.role : undefined }
      })
      toast.success('Data pengguna diperbarui')
    } else {
      await api('/api/admin/users', { method: 'POST', body: form })
      toast.success('Pengguna dibuat', 'Akun berstatus nonaktif. Aktifkan untuk mengirim undangan.')
    }
    modalOpen.value = false
    await load()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Gagal menyimpan pengguna.'
  } finally {
    saving.value = false
  }
}

async function toggleActive(user: AdminUser) {
  if (user.active && !window.confirm(`Nonaktifkan akun ${user.name}? Sesi aktif akan dihentikan.`)) return
  busyId.value = user.id
  try {
    const result = await api<{ emailStatus: string }>(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      body: { active: !user.active }
    })
    if (result.emailStatus === 'simulated') {
      toast.success('Akun diaktifkan', 'Email aktivasi disimpan di outbox pengembangan (.data/mail-outbox).')
    } else if (result.emailStatus === 'sent') {
      toast.success('Akun diaktifkan', 'Email aktivasi telah dikirim.')
    } else {
      toast.success(user.active ? 'Akun dinonaktifkan' : 'Akun diaktifkan')
    }
    await load()
  } catch (error: any) {
    toast.error('Gagal mengubah status', error?.data?.statusMessage || 'Periksa konfigurasi email.')
  } finally {
    busyId.value = ''
  }
}

async function resend(user: AdminUser) {
  busyId.value = user.id
  try {
    const result = await api<{ emailStatus: string }>(`/api/admin/users/${user.id}/resend`, { method: 'POST' })
    toast.success('Undangan dikirim ulang', result.emailStatus === 'simulated' ? 'Email disimpan di outbox pengembangan.' : 'Email aktivasi telah dikirim.')
    await load()
  } catch (error: any) {
    toast.error('Gagal mengirim ulang', error?.data?.statusMessage || 'Periksa konfigurasi email.')
  } finally {
    busyId.value = ''
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 20))))
useSeoMeta({ title: 'Pengguna', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Administrasi</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">Pengguna</h2><p class="mt-1 text-sm text-admin-muted">Akun baru selalu nonaktif. Aktivasi mengirim undangan sekali pakai.</p></div>
      <AppButton size="sm" @click="openCreate"><template #left><Plus :size="14" /></template>Tambah Pengguna</AppButton>
    </div>

    <div class="grid gap-3 rounded-xl border border-admin-border bg-white p-4 lg:grid-cols-[1fr_180px_180px_auto]">
      <div class="relative"><Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" /><input v-model="search" type="search" class="field-input pl-10" placeholder="Cari nama atau email…" aria-label="Cari pengguna" /></div>
      <select v-model="roleFilter" class="field-input" aria-label="Filter role"><option value="">Semua role</option><option value="superadmin">Superadmin</option><option value="admin">Admin/Petugas</option><option value="pemohon">Pemohon</option></select>
      <select v-model="activeFilter" class="field-input" aria-label="Filter status"><option value="">Semua status</option><option value="true">Aktif</option><option value="false">Nonaktif</option></select>
      <span class="self-center px-2 text-[14px] text-admin-muted">{{ result?.total ?? 0 }} pengguna</span>
    </div>

    <div class="overflow-hidden rounded-xl border border-admin-border bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 4" :key="i" class="skeleton h-14 rounded-lg" /></div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Pengguna tidak ditemukan" description="Ubah filter atau tambah pengguna baru." compact />
      <template v-else>
        <div class="hidden overflow-x-auto md:block"><table class="w-full min-w-[900px] text-left"><thead><tr class="border-b border-admin-border bg-slate-50 text-[12px] uppercase tracking-wide text-admin-muted"><th class="px-5 py-3 font-bold">Nama</th><th class="px-5 py-3 font-bold">Role</th><th class="px-5 py-3 font-bold">Status</th><th class="px-5 py-3 font-bold">Login terakhir</th><th class="px-5 py-3 font-bold">Dibuat</th><th class="px-5 py-3 text-right font-bold">Aksi</th></tr></thead><tbody class="divide-y divide-admin-border"><tr v-for="user in result.items" :key="user.id" class="hover:bg-slate-50/60"><td class="px-5 py-3.5"><p class="text-xs font-semibold">{{ user.name }}</p><p class="mt-0.5 text-[12px] text-admin-muted">{{ user.email }}</p></td><td class="px-5 py-3.5"><span class="rounded-full border border-admin-border bg-white px-2.5 py-1 text-[12px] font-bold">{{ ROLE_LABELS[user.role] }}</span></td><td class="px-5 py-3.5"><span class="rounded-full border px-2.5 py-1 text-[12px] font-bold" :class="statusClass(user)">{{ statusLabel(user) }}</span></td><td class="px-5 py-3.5 text-[12px] text-admin-muted">{{ user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Belum pernah' }}</td><td class="px-5 py-3.5 text-[12px] text-admin-muted">{{ formatDate(user.createdAt) }}</td><td class="px-5 py-3.5"><div class="flex items-center justify-end gap-2"><button type="button" class="text-xs font-semibold text-unu-green hover:underline" @click="openEdit(user)"><Pencil :size="12" class="inline" /> Edit</button><button v-if="user.active" type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-red-700" :disabled="busyId === user.id" @click="toggleActive(user)"><UserX :size="12" /> Nonaktifkan</button><button v-else type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700" :disabled="busyId === user.id" @click="toggleActive(user)"><ShieldCheck :size="12" /> Aktifkan</button><button v-if="user.invitationPending" type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-amber-800" :disabled="busyId === user.id" @click="resend(user)"><RefreshCw :size="12" /> Kirim ulang</button></div></td></tr></tbody></table></div>
        <div class="divide-y divide-admin-border md:hidden"><div v-for="user in result.items" :key="user.id" class="p-4"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ user.name }}</p><p class="mt-0.5 text-[12px] text-admin-muted">{{ user.email }}</p></div><span class="rounded-full border px-2 py-1 text-[12px] font-bold" :class="statusClass(user)">{{ statusLabel(user) }}</span></div><div class="mt-1 text-[12px] text-admin-muted">{{ ROLE_LABELS[user.role] }}</div><div class="mt-3 flex flex-wrap gap-3"><button type="button" class="text-xs font-semibold text-unu-green" @click="openEdit(user)">Edit</button><button type="button" class="text-xs font-semibold" :class="user.active ? 'text-red-700' : 'text-emerald-700'" @click="toggleActive(user)">{{ user.active ? 'Nonaktifkan' : 'Aktifkan' }}</button><button v-if="user.invitationPending" type="button" class="text-xs font-semibold text-amber-800" @click="resend(user)">Kirim ulang undangan</button></div></div></div>
      </template>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="page = $event" />

    <ModalDialog v-model="modalOpen" :title="editingId ? 'Edit Pengguna' : 'Tambah Pengguna'" :description="editingId ? 'Perubahan role dan email dicatat dalam audit log.' : 'Akun baru dibuat nonaktif. Aktifkan dari daftar untuk mengirim undangan.'">
      <div class="space-y-4">
        <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">{{ errorMessage }}</div>
        <div><label class="admin-label">Nama lengkap</label><input v-model="form.name" class="field-input" maxlength="120" /></div>
        <div><label class="admin-label">Email</label><input v-model="form.email" type="email" class="field-input" maxlength="180" :disabled="Boolean(editingId) && form.active" /><p class="field-help">Email akun aktif tidak dapat diubah tanpa verifikasi.</p></div>
        <div v-if="can('roles.manage')"><label class="admin-label">Role</label><select v-model="form.role" class="field-input"><option value="pemohon">Pemohon</option><option value="admin">Admin/Petugas</option><option value="superadmin">Superadmin</option></select><p class="field-help">Perubahan role berlaku pada permintaan berikutnya dan dicatat di audit log. Sistem mencegah perubahan role akun sendiri.</p></div>
        <div v-else class="rounded-lg border border-admin-border bg-slate-50 p-3 text-xs text-admin-muted">Anda tidak memiliki izin mengubah role.</div>
      </div>
      <template #footer><div class="flex justify-end gap-2"><AppButton variant="secondary" @click="modalOpen = false">Batal</AppButton><AppButton :loading="saving" @click="save">Simpan</AppButton></div></template>
    </ModalDialog>
  </div>
</template>

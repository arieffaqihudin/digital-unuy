<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
  X
} from 'lucide-vue-next'
import type { TeamGroupDTO, TeamMemberDTO } from '~/shared/types'

definePageMeta({ layout: 'admin' })

interface GroupWithCount extends TeamGroupDTO {
  memberCount: number
}

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()

const members = ref<TeamMemberDTO[]>([])
const groups = ref<GroupWithCount[]>([])
const loading = ref(true)
const error = ref('')

const memberModalOpen = ref(false)
const editingId = ref('')
const editingMember = ref<TeamMemberDTO | null>(null)
const savingMember = ref(false)
const memberError = ref('')
const photoFile = ref<File | null>(null)
const localPhotoPreview = ref('')
const photoInputKey = ref(0)

const memberForm = reactive({
  name: '',
  position: '',
  unit: '',
  bio: '',
  groupId: '',
  order: 0,
  published: false,
  focalX: 50,
  focalY: 50,
  removePhoto: false
})

const groupModalOpen = ref(false)
const groupForm = reactive({ id: '', name: '', order: 0 })
const groupSaving = ref(false)
const groupError = ref('')

const deleteTarget = ref<TeamMemberDTO | null>(null)
const deleting = ref(false)
const toggleBusy = ref('')
const orderBusy = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [memberData, groupData] = await Promise.all([
      requestFetch<{ items: TeamMemberDTO[] }>('/api/admin/team/members'),
      requestFetch<{ items: GroupWithCount[] }>('/api/admin/team/groups')
    ])
    members.value = memberData.items
    groups.value = groupData.items
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Data tim gagal dimuat.'
  } finally {
    loading.value = false
  }
}

await load()

const previewUrl = computed(() => {
  if (memberForm.removePhoto) return ''
  return localPhotoPreview.value || editingMember.value?.photoUrl || ''
})
const previewPosition = computed(() => `${memberForm.focalX}% ${memberForm.focalY}%`)
const initials = computed(() =>
  memberForm.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
)
const sortedMembers = computed(() => [...members.value].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)))

function revokePreview() {
  if (localPhotoPreview.value) URL.revokeObjectURL(localPhotoPreview.value)
  localPhotoPreview.value = ''
}

function openCreateMember() {
  editingId.value = ''
  editingMember.value = null
  photoFile.value = null
  revokePreview()
  Object.assign(memberForm, {
    name: '',
    position: '',
    unit: '',
    bio: '',
    groupId: '',
    order: members.value.length,
    published: false,
    focalX: 50,
    focalY: 50,
    removePhoto: false
  })
  memberError.value = ''
  photoInputKey.value += 1
  memberModalOpen.value = true
}

function openEditMember(member: TeamMemberDTO) {
  editingId.value = member.id
  editingMember.value = member
  photoFile.value = null
  revokePreview()
  Object.assign(memberForm, {
    name: member.name,
    position: member.position,
    unit: member.unit,
    bio: member.bio,
    groupId: member.groupId,
    order: member.order,
    published: member.published,
    focalX: member.focalX,
    focalY: member.focalY,
    removePhoto: false
  })
  memberError.value = ''
  photoInputKey.value += 1
  memberModalOpen.value = true
}

function closeMemberModal() {
  memberModalOpen.value = false
  photoFile.value = null
  revokePreview()
}

function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  memberError.value = ''
  if (!file) {
    photoFile.value = null
    revokePreview()
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    memberError.value = 'Foto harus berformat JPG, PNG, atau WebP.'
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    memberError.value = 'Ukuran foto maksimal 5 MB.'
    input.value = ''
    return
  }
  photoFile.value = file
  memberForm.removePhoto = false
  revokePreview()
  localPhotoPreview.value = URL.createObjectURL(file)
}

function markRemovePhoto() {
  photoFile.value = null
  memberForm.removePhoto = true
  revokePreview()
  photoInputKey.value += 1
}

async function saveMember() {
  memberError.value = ''
  if (memberForm.name.trim().length < 2) {
    memberError.value = 'Nama anggota minimal 2 karakter.'
    return
  }
  if (memberForm.position.trim().length < 2) {
    memberError.value = 'Jabatan anggota minimal 2 karakter.'
    return
  }
  savingMember.value = true
  try {
    const metadata = {
      name: memberForm.name,
      position: memberForm.position,
      unit: memberForm.unit,
      bio: memberForm.bio,
      groupId: memberForm.groupId || null,
      order: memberForm.order,
      published: memberForm.published,
      focalX: memberForm.focalX,
      focalY: memberForm.focalY,
      removePhoto: memberForm.removePhoto
    }
    const formData = new FormData()
    formData.append('metadata', JSON.stringify(metadata))
    if (photoFile.value) formData.append('photo', photoFile.value)
    if (editingId.value) {
      await api(`/api/admin/team/members/${editingId.value}`, { method: 'PATCH', body: formData })
      toast.success('Anggota diperbarui')
    } else {
      await api('/api/admin/team/members', { method: 'POST', body: formData })
      toast.success('Anggota ditambahkan')
    }
    closeMemberModal()
    await load()
  } catch (e: any) {
    memberError.value = e?.data?.statusMessage || 'Gagal menyimpan anggota.'
  } finally {
    savingMember.value = false
  }
}

async function togglePublished(member: TeamMemberDTO) {
  toggleBusy.value = member.id
  try {
    await api(`/api/admin/team/members/${member.id}`, {
      method: 'PATCH',
      body: { published: !member.published }
    })
    toast.success(member.published ? 'Anggota disembunyikan dari publik' : 'Anggota dipublikasikan')
    await load()
  } catch (e: any) {
    toast.error('Gagal mengubah status', e?.data?.statusMessage || 'Coba lagi.')
  } finally {
    toggleBusy.value = ''
  }
}

async function moveMember(member: TeamMemberDTO, direction: -1 | 1) {
  const list = sortedMembers.value
  const index = list.findIndex((item) => item.id === member.id)
  const neighbor = list[index + direction]
  if (!neighbor) return
  orderBusy.value = member.id
  try {
    await Promise.all([
      api(`/api/admin/team/members/${member.id}`, { method: 'PATCH', body: { order: neighbor.order } }),
      api(`/api/admin/team/members/${neighbor.id}`, { method: 'PATCH', body: { order: member.order } })
    ])
    await load()
  } catch (e: any) {
    toast.error('Gagal mengubah urutan', e?.data?.statusMessage || 'Coba lagi.')
  } finally {
    orderBusy.value = ''
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api(`/api/admin/team/members/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.success('Anggota dihapus')
    deleteTarget.value = null
    await load()
  } catch (e: any) {
    toast.error('Gagal menghapus', e?.data?.statusMessage || 'Coba lagi.')
  } finally {
    deleting.value = false
  }
}

function openGroupManager() {
  groupError.value = ''
  groupForm.id = ''
  groupForm.name = ''
  groupForm.order = groups.value.length
  groupModalOpen.value = true
}

function editGroup(group: GroupWithCount) {
  groupError.value = ''
  groupForm.id = group.id
  groupForm.name = group.name
  groupForm.order = group.order
}

function resetGroupForm() {
  groupForm.id = ''
  groupForm.name = ''
  groupForm.order = groups.value.length
  groupError.value = ''
}

async function saveGroup() {
  groupError.value = ''
  if (groupForm.name.trim().length < 2) {
    groupError.value = 'Nama kelompok minimal 2 karakter.'
    return
  }
  groupSaving.value = true
  try {
    if (groupForm.id) {
      await api(`/api/admin/team/groups/${groupForm.id}`, {
        method: 'PATCH',
        body: { name: groupForm.name, order: groupForm.order }
      })
      toast.success('Kelompok diperbarui')
    } else {
      await api('/api/admin/team/groups', {
        method: 'POST',
        body: { name: groupForm.name, order: groupForm.order }
      })
      toast.success('Kelompok ditambahkan')
    }
    resetGroupForm()
    await load()
  } catch (e: any) {
    groupError.value = e?.data?.statusMessage || 'Gagal menyimpan kelompok.'
  } finally {
    groupSaving.value = false
  }
}

async function deleteGroup(group: GroupWithCount) {
  if (!window.confirm(`Hapus kelompok "${group.name}"? Anggota pada kelompok ini tetap tersimpan tanpa kelompok.`)) return
  try {
    await api(`/api/admin/team/groups/${group.id}`, { method: 'DELETE' })
    toast.success('Kelompok dihapus')
    if (groupForm.id === group.id) resetGroupForm()
    await load()
  } catch (e: any) {
    toast.error('Gagal menghapus kelompok', e?.data?.statusMessage || 'Coba lagi.')
  }
}

watch(memberModalOpen, (open) => {
  if (!open) {
    photoFile.value = null
    revokePreview()
  }
})

onBeforeUnmount(revokePreview)
useSeoMeta({ title: 'Tim Kami', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Konten Website</p>
        <h2 class="mt-2">Tim Kami</h2>
        <p class="mt-1 text-[14px] text-admin-muted">Kelola anggota, kelompok, urutan, foto, dan status publikasi.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <AppButton variant="secondary" size="sm" @click="openGroupManager"><template #left><UsersRound :size="14" /></template>Kelompok Tim</AppButton>
        <AppButton size="sm" @click="openCreateMember"><template #left><Plus :size="14" /></template>Tambah Anggota</AppButton>
      </div>
    </div>

    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-900">{{ error }}</div>

    <div class="rounded-xl border border-admin-border bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
        <div>
          <p class="text-[16px] font-semibold">Daftar Anggota</p>
          <p class="mt-0.5 text-[13px] text-admin-muted">Hanya anggota berstatus publik yang tampil di website.</p>
        </div>
        <span class="rounded-full bg-unu-green-soft px-3 py-1 text-[12px] font-semibold text-unu-green">{{ members.length }} anggota</span>
      </div>

      <div v-if="loading" class="space-y-2 p-4">
        <div v-for="i in 4" :key="i" class="skeleton h-16 rounded-lg" />
      </div>

      <EmptyState v-else-if="!members.length" class="m-4" title="Belum ada anggota tim" description="Tambahkan anggota pertama untuk ditampilkan di halaman Tim Kami.">
        <AppButton size="sm" @click="openCreateMember">Tambah Anggota</AppButton>
      </EmptyState>

      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[880px] text-left">
            <thead>
              <tr class="border-b border-admin-border bg-slate-50 text-[13px] uppercase tracking-wide text-admin-muted">
                <th class="px-5 py-3 font-semibold">Anggota</th>
                <th class="px-5 py-3 font-semibold">Jabatan</th>
                <th class="px-5 py-3 font-semibold">Kelompok</th>
                <th class="px-5 py-3 font-semibold">Urutan</th>
                <th class="px-5 py-3 font-semibold">Status</th>
                <th class="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-admin-border">
              <tr v-for="member in sortedMembers" :key="member.id" class="hover:bg-slate-50/60">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3">
                    <div class="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      <img v-if="member.photoUrl" :src="member.photoUrl" :alt="member.name" class="h-full w-full object-cover" :style="{ objectPosition: `${member.focalX}% ${member.focalY}%` }" />
                      <span v-else class="grid h-full w-full place-items-center text-[12px] font-bold text-slate-400">{{ member.name.slice(0, 1) }}</span>
                    </div>
                    <div><p class="text-[14px] font-semibold">{{ member.name }}</p><p class="text-[13px] text-admin-muted">{{ member.unit || '—' }}</p></div>
                  </div>
                </td>
                <td class="px-5 py-3 text-[14px] text-slate-600">{{ member.position }}</td>
                <td class="px-5 py-3 text-[13px] text-slate-600">{{ member.groupName || 'Tanpa kelompok' }}</td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1">
                    <span class="w-6 text-[13px] tabular-nums text-admin-muted">{{ member.order }}</span>
                    <button type="button" class="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-admin-text disabled:opacity-30" :disabled="orderBusy === member.id" aria-label="Naikkan urutan" @click="moveMember(member, -1)"><ArrowUp :size="13" /></button>
                    <button type="button" class="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-admin-text disabled:opacity-30" :disabled="orderBusy === member.id" aria-label="Turunkan urutan" @click="moveMember(member, 1)"><ArrowDown :size="13" /></button>
                  </div>
                </td>
                <td class="px-5 py-3">
                  <button type="button" class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold disabled:opacity-50" :class="member.published ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-admin-border bg-slate-50 text-slate-500'" :disabled="toggleBusy === member.id" @click="togglePublished(member)">
                    <component :is="member.published ? Eye : EyeOff" :size="12" />{{ member.published ? 'Publik' : 'Nonaktif' }}
                  </button>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center justify-end gap-3">
                    <button type="button" class="text-[13px] font-semibold text-unu-green hover:underline" @click="openEditMember(member)"><Pencil :size="12" class="inline" /> Edit</button>
                    <button type="button" class="text-[13px] font-semibold text-red-700 hover:underline" @click="deleteTarget = member"><Trash2 :size="12" class="inline" /> Hapus</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="divide-y divide-admin-border md:hidden">
          <div v-for="member in sortedMembers" :key="member.id" class="p-4">
            <div class="flex items-start gap-3">
              <div class="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                <img v-if="member.photoUrl" :src="member.photoUrl" :alt="member.name" class="h-full w-full object-cover" :style="{ objectPosition: `${member.focalX}% ${member.focalY}%` }" />
                <span v-else class="grid h-full w-full place-items-center text-[14px] font-bold text-slate-400">{{ member.name.slice(0, 1) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[14px] font-semibold">{{ member.name }}</p>
                <p class="mt-0.5 text-[13px] text-slate-600">{{ member.position }}</p>
                <p class="mt-1 text-[12px] text-admin-muted">{{ member.groupName || 'Tanpa kelompok' }} · urutan {{ member.order }}</p>
              </div>
              <span class="rounded-full border px-2 py-1 text-[12px] font-semibold" :class="member.published ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-admin-border bg-slate-50 text-slate-500'">{{ member.published ? 'Publik' : 'Nonaktif' }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-4">
              <button type="button" class="text-[13px] font-semibold text-unu-green" @click="openEditMember(member)">Edit</button>
              <button type="button" class="text-[13px] font-semibold text-slate-600" @click="togglePublished(member)">{{ member.published ? 'Sembunyikan' : 'Publikasikan' }}</button>
              <button type="button" class="text-[13px] font-semibold text-slate-600" @click="moveMember(member, -1)">Naik</button>
              <button type="button" class="text-[13px] font-semibold text-slate-600" @click="moveMember(member, 1)">Turun</button>
              <button type="button" class="text-[13px] font-semibold text-red-700" @click="deleteTarget = member">Hapus</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <ModalDialog v-model="memberModalOpen" :title="editingId ? 'Edit Anggota' : 'Tambah Anggota'" description="Foto akan dioptimalkan otomatis. Data hanya tampil di publik jika status publikasi aktif." size="lg">
      <div class="grid gap-5 sm:grid-cols-[190px_1fr]">
        <div>
          <p class="admin-label">Pratinjau foto</p>
          <div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-100 ring-1 ring-admin-border">
            <img v-if="previewUrl" :src="previewUrl" alt="Pratinjau foto anggota" class="h-full w-full object-cover" :style="{ objectPosition: previewPosition }" />
            <div v-else class="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span class="grid h-12 w-12 place-items-center rounded-full bg-white text-[16px] font-bold text-slate-400">{{ initials || 'TD' }}</span>
              <span class="text-[12px] text-slate-400">Belum ada foto</span>
            </div>
          </div>
          <input :key="photoInputKey" id="team-photo" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onPhotoSelected" />
          <label for="team-photo" class="mt-3 inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-admin-border bg-white px-3 text-[13px] font-semibold text-admin-text transition hover:bg-slate-50">
            <Camera :size="14" aria-hidden="true" /> Pilih foto
          </label>
          <p class="field-help">JPG, PNG, atau WebP. Maksimal 5 MB.</p>
          <button v-if="previewUrl" type="button" class="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-red-700" @click="markRemovePhoto"><X :size="12" /> Hapus foto</button>
        </div>

        <div class="space-y-4">
          <div v-if="memberError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-900">{{ memberError }}</div>
          <div><label for="team-name" class="admin-label">Nama lengkap</label><input id="team-name" v-model="memberForm.name" class="field-input" maxlength="120" /></div>
          <div><label for="team-position" class="admin-label">Jabatan / posisi</label><input id="team-position" v-model="memberForm.position" class="field-input" maxlength="160" /></div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label for="team-unit" class="admin-label">Bidang / unit</label><input id="team-unit" v-model="memberForm.unit" class="field-input" maxlength="160" /></div>
            <div>
              <label for="team-group" class="admin-label">Kelompok tim</label>
              <select id="team-group" v-model="memberForm.groupId" class="field-input">
                <option value="">Tanpa kelompok</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
              </select>
            </div>
          </div>
          <div><label for="team-bio" class="admin-label">Deskripsi singkat</label><textarea id="team-bio" v-model="memberForm.bio" rows="3" class="field-input" maxlength="1500" /></div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div><label for="team-order" class="admin-label">Urutan tampil</label><input id="team-order" v-model.number="memberForm.order" type="number" class="field-input" /></div>
            <label class="flex min-h-[46px] cursor-pointer items-center gap-2 self-end rounded-lg border border-admin-border px-3 text-[14px] font-medium">
              <input v-model="memberForm.published" type="checkbox" class="h-4 w-4 accent-unu-green" /> Publikasikan
            </label>
          </div>
          <div class="rounded-lg border border-admin-border bg-slate-50 p-3">
            <p class="text-[12px] font-semibold uppercase tracking-wide text-admin-muted">Focal point foto</p>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <label class="text-[12px] text-slate-500">Horizontal
                <input v-model.number="memberForm.focalX" type="range" min="0" max="100" class="mt-1 w-full accent-unu-green" />
              </label>
              <label class="text-[12px] text-slate-500">Vertikal
                <input v-model.number="memberForm.focalY" type="range" min="0" max="100" class="mt-1 w-full accent-unu-green" />
              </label>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="closeMemberModal">Batal</AppButton>
          <AppButton :loading="savingMember" @click="saveMember"><template #left><Camera :size="14" /></template>Simpan Anggota</AppButton>
        </div>
      </template>
    </ModalDialog>

    <ModalDialog v-model="groupModalOpen" title="Kelompok Tim" description="Kelompok bersifat opsional. Anggota tanpa kelompok tetap dapat dipublikasikan." size="lg">
      <div class="grid gap-5 sm:grid-cols-[1fr_1fr]">
        <div>
          <p class="text-[14px] font-semibold">Kelompok tersedia</p>
          <div v-if="groups.length" class="mt-3 divide-y divide-admin-border rounded-lg border border-admin-border">
            <div v-for="group in groups" :key="group.id" class="flex items-center justify-between gap-3 px-3 py-2.5">
              <div><p class="text-[14px] font-medium">{{ group.name }}</p><p class="text-[12px] text-admin-muted">{{ group.memberCount }} anggota · urutan {{ group.order }}</p></div>
              <div class="flex gap-2">
                <button type="button" class="text-[12px] font-semibold text-unu-green" @click="editGroup(group)">Edit</button>
                <button type="button" class="text-[12px] font-semibold text-red-700" @click="deleteGroup(group)">Hapus</button>
              </div>
            </div>
          </div>
          <p v-else class="mt-3 rounded-lg border border-dashed border-admin-border p-4 text-[13px] text-admin-muted">Belum ada kelompok.</p>
        </div>
        <div class="rounded-lg border border-admin-border bg-slate-50 p-4">
          <p class="text-[14px] font-semibold">{{ groupForm.id ? 'Edit Kelompok' : 'Tambah Kelompok' }}</p>
          <div v-if="groupError" class="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-900">{{ groupError }}</div>
          <div class="mt-3"><label for="group-name" class="admin-label">Nama kelompok</label><input id="group-name" v-model="groupForm.name" class="field-input" maxlength="100" /></div>
          <div class="mt-3"><label for="group-order" class="admin-label">Urutan</label><input id="group-order" v-model.number="groupForm.order" type="number" class="field-input" /></div>
          <div class="mt-4 flex gap-2">
            <AppButton size="sm" :loading="groupSaving" @click="saveGroup">{{ groupForm.id ? 'Simpan Perubahan' : 'Tambah' }}</AppButton>
            <AppButton v-if="groupForm.id" size="sm" variant="secondary" @click="resetGroupForm">Batal</AppButton>
          </div>
        </div>
      </div>
      <template #footer><div class="flex justify-end"><AppButton variant="secondary" @click="groupModalOpen = false">Tutup</AppButton></div></template>
    </ModalDialog>

    <ModalDialog :model-value="Boolean(deleteTarget)" title="Hapus Anggota" size="sm" @update:model-value="deleteTarget = null">
      <p class="text-[14px] leading-6 text-slate-600">Hapus <strong>{{ deleteTarget?.name }}</strong>? Foto dan data anggota akan dihapus permanen.</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" @click="deleteTarget = null">Batal</AppButton>
          <AppButton variant="danger" :loading="deleting" @click="confirmDelete">Hapus</AppButton>
        </div>
      </template>
    </ModalDialog>
  </div>
</template>

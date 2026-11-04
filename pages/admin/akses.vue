<script setup lang="ts">
import { LockKeyhole, Save, ShieldCheck } from 'lucide-vue-next'
import { PERMISSION_META } from '~/shared/permissions'
import type { Permission, RoleSlug } from '~/shared/types'

definePageMeta({ layout: 'admin' })

interface RoleItem {
  slug: RoleSlug
  label: string
  description: string
  permissions: Permission[]
  locked: boolean
}

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const loading = ref(true)
const roles = ref<RoleItem[]>([])
const saving = ref('')
const selected = reactive<Record<string, Permission[]>>({})

async function load() {
  loading.value = true
  try {
    const data = await requestFetch<{ roles: RoleItem[] }>('/api/admin/roles')
    roles.value = data.roles
    for (const role of data.roles) selected[role.slug] = [...role.permissions]
  } catch (error: any) {
    toast.error('Gagal memuat role', error?.data?.statusMessage)
  } finally {
    loading.value = false
  }
}
await load()

function toggle(role: RoleItem, permission: Permission) {
  if (role.locked) return
  const list = selected[role.slug] || []
  selected[role.slug] = list.includes(permission) ? list.filter((item) => item !== permission) : [...list, permission]
}

async function save(role: RoleItem) {
  if (role.locked) return
  saving.value = role.slug
  try {
    await api(`/api/admin/roles/${role.slug}`, {
      method: 'PATCH',
      body: { permissions: selected[role.slug] || [] }
    })
    toast.success('Hak akses disimpan', 'Perubahan berlaku pada permintaan berikutnya.')
    await load()
  } catch (error: any) {
    toast.error('Gagal menyimpan', error?.data?.statusMessage || 'Coba lagi.')
  } finally {
    saving.value = ''
  }
}

const groups = computed(() => [...new Set(PERMISSION_META.map((item) => item.group))])
useSeoMeta({ title: 'Hak Akses', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Administrasi</p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight">Role & Hak Akses</h2>
      <p class="mt-1 text-sm text-admin-muted">Atur izin role non-superadmin. Server selalu memeriksa izin pada setiap endpoint.</p>
    </div>

    <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
      <strong>Prinsip least privilege.</strong> Berikan hanya izin yang benar-benar dibutuhkan. Perubahan hak akses dicatat di audit log dan tidak dapat menaikkan privilege superadmin.
    </div>

    <div v-if="loading" class="space-y-4"><div v-for="i in 2" :key="i" class="skeleton h-72 rounded-xl" /></div>

    <div v-else class="grid gap-5 xl:grid-cols-2">
      <div v-for="role in roles.filter((item) => !item.locked)" :key="role.slug" class="rounded-xl border border-admin-border bg-white">
        <div class="flex items-start justify-between gap-3 border-b border-admin-border p-5">
          <div>
            <div class="flex items-center gap-2"><ShieldCheck :size="16" class="text-unu-green" /><h3 class="text-sm font-semibold">{{ role.label }}</h3></div>
            <p class="mt-1 text-[14px] text-admin-muted">{{ role.slug === 'admin' ? 'Petugas yang menangani permohonan dan konten.' : 'Pemohon yang mengajukan dan memantau layanan.' }}</p>
          </div>
          <span class="rounded-full border border-admin-border bg-slate-50 px-2.5 py-1 text-[12px] font-bold">{{ selected[role.slug]?.length || 0 }} izin</span>
        </div>
        <div class="space-y-5 p-5">
          <div v-for="group in groups" :key="group">
            <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-admin-muted">{{ group }}</p>
            <div class="mt-2 space-y-1.5">
              <label v-for="permission in PERMISSION_META.filter((item) => item.group === group)" :key="permission.key" class="flex cursor-pointer items-start gap-3 rounded-lg border border-admin-border px-3 py-2.5 text-xs transition hover:border-slate-300">
                <input type="checkbox" class="mt-0.5 h-4 w-4 accent-unu-green" :checked="selected[role.slug]?.includes(permission.key)" @change="toggle(role, permission.key)" />
                <span><span class="block font-semibold">{{ permission.label }}</span><span class="mt-0.5 block text-[12px] leading-4 text-admin-muted">{{ permission.description }}</span></span>
              </label>
            </div>
          </div>
        </div>
        <div class="border-t border-admin-border p-4">
          <AppButton :loading="saving === role.slug" size="sm" @click="save(role)"><template #left><Save :size="13" /></template>Simpan {{ role.label }}</AppButton>
        </div>
      </div>

      <div v-for="role in roles.filter((item) => item.locked)" :key="role.slug" class="rounded-xl border border-admin-border bg-[#1F2A23] p-5 text-white">
        <div class="flex items-center gap-2"><LockKeyhole :size="16" class="text-sage" /><h3 class="text-sm font-semibold text-white">{{ role.label }}</h3></div>
        <p class="mt-2 text-xs leading-5 text-white/55">Role superadmin bersifat tetap dan memiliki seluruh izin. Ini mencegah lockout administratif.</p>
        <div class="mt-4 flex flex-wrap gap-1.5">
          <span v-for="permission in PERMISSION_META" :key="permission.key" class="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[12px] text-white/60">{{ permission.key }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

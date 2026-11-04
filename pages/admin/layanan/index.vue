<script setup lang="ts">
import { ArrowRight, Pencil, Plus, Power, Search } from 'lucide-vue-next'
import type { ServiceDTO } from '~/shared/types'

definePageMeta({ layout: 'admin' })

const requestFetch = useRequestFetch()
const api = useApi()
const toast = useToast()
const search = ref('')
const active = ref('')
const page = ref(1)
const loading = ref(true)
const failure = ref('')
const result = ref<{ items: ServiceDTO[]; total: number; page: number; pageSize: number } | null>(null)
const busyId = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

async function load() {
  loading.value = true
  failure.value = ''
  try {
    result.value = await requestFetch('/api/admin/services', {
      query: { q: search.value || undefined, active: active.value || undefined, page: page.value, pageSize: 20 }
    })
  } catch (error: any) {
    failure.value = error?.data?.statusMessage || 'Layanan gagal dimuat.'
  } finally {
    loading.value = false
  }
}
await load()
watch(active, () => {
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

async function toggle(service: ServiceDTO) {
  busyId.value = service.id
  try {
    await api(`/api/admin/services/${service.id}`, {
      method: 'PATCH',
      body: { active: !service.active }
    })
    toast.success(service.active ? 'Layanan dinonaktifkan' : 'Layanan diaktifkan', service.name)
    await load()
  } catch (error: any) {
    toast.error('Gagal mengubah status', error?.data?.statusMessage || 'Coba lagi.')
  } finally {
    busyId.value = ''
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total || 0) / (result.value?.pageSize || 20))))
useSeoMeta({ title: 'Manajemen Layanan', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Pengelolaan</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight">Layanan</h2>
        <p class="mt-1 text-sm text-ink-muted">Kelola katalog, formulir dinamis, dan ketersediaan layanan.</p>
      </div>
      <AppButton to="/admin/layanan/baru" size="sm"><template #left><Plus :size="14" /></template>Tambah Layanan</AppButton>
    </div>

    <div class="flex flex-col gap-3 rounded-2xl border border-line-warm bg-white p-4 sm:flex-row">
      <div class="relative flex-1">
        <label for="service-admin-search" class="sr-only">Cari layanan</label>
        <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input id="service-admin-search" v-model="search" type="search" class="field-input pl-10" placeholder="Cari nama atau slug layanan…" />
      </div>
      <select v-model="active" class="field-input sm:w-52" aria-label="Filter status">
        <option value="">Semua status</option>
        <option value="true">Aktif</option>
        <option value="false">Nonaktif</option>
      </select>
      <span class="self-center px-2 text-[11px] text-ink-muted">{{ result?.total ?? 0 }} layanan</span>
    </div>

    <div class="overflow-hidden rounded-2xl border border-line-warm bg-white">
      <div v-if="loading" class="space-y-2 p-4"><div v-for="i in 5" :key="i" class="skeleton h-14 rounded-lg" /></div>
      <div v-else-if="failure" class="p-8 text-center"><p class="text-sm text-red-800">{{ failure }}</p><AppButton variant="secondary" class="mt-4" @click="load">Muat ulang</AppButton></div>
      <EmptyState v-else-if="!result?.items.length" class="m-4" title="Belum ada layanan" description="Tambahkan layanan pertama dan susun formulirnya." compact>
        <AppButton to="/admin/layanan/baru">Tambah Layanan</AppButton>
      </EmptyState>

      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[800px] text-left">
            <thead><tr class="border-b border-line-warm bg-ivory text-[10px] uppercase tracking-wide text-ink-muted">
              <th class="px-5 py-3 font-bold">Nama</th><th class="px-5 py-3 font-bold">Kategori</th><th class="px-5 py-3 font-bold">Form</th><th class="px-5 py-3 font-bold">Status</th><th class="px-5 py-3 font-bold">Urutan</th><th class="px-5 py-3 text-right font-bold">Aksi</th>
            </tr></thead>
            <tbody class="divide-y divide-line-warm">
              <tr v-for="service in result.items" :key="service.id" class="hover:bg-ivory/60">
                <td class="px-5 py-3.5"><p class="text-xs font-semibold">{{ service.name }}</p><p class="mt-0.5 text-[10px] text-ink-muted">/{{ service.slug }}</p></td>
                <td class="px-5 py-3.5 text-xs">{{ service.category }}</td>
                <td class="px-5 py-3.5 text-xs">v{{ service.formVersion }}</td>
                <td class="px-5 py-3.5"><span class="rounded-full border px-2.5 py-1 text-[10px] font-bold" :class="service.active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-line-warm bg-ivory text-ink-muted'">{{ service.active ? 'Aktif' : 'Nonaktif' }}</span></td>
                <td class="px-5 py-3.5 text-xs text-ink-muted">{{ service.order }}</td>
                <td class="px-5 py-3.5"><div class="flex items-center justify-end gap-2">
                  <NuxtLink :to="`/admin/layanan/${service.id}`" class="inline-flex items-center gap-1 text-xs font-semibold text-gold-dark hover:underline"><Pencil :size="12" /> Edit</NuxtLink>
                  <button type="button" class="inline-flex items-center gap-1 text-xs font-semibold" :class="service.active ? 'text-red-700' : 'text-emerald-700'" :disabled="busyId === service.id" @click="toggle(service)"><Power :size="12" /> {{ service.active ? 'Nonaktifkan' : 'Aktifkan' }}</button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="divide-y divide-line-warm md:hidden">
          <div v-for="service in result.items" :key="service.id" class="p-4">
            <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-sm font-semibold">{{ service.name }}</p><p class="mt-0.5 text-[10px] text-ink-muted">{{ service.category }} · v{{ service.formVersion }}</p></div><span class="rounded-full border px-2 py-1 text-[9px] font-bold" :class="service.active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-line-warm bg-ivory text-ink-muted'">{{ service.active ? 'Aktif' : 'Nonaktif' }}</span></div>
            <div class="mt-3 flex flex-wrap gap-3"><NuxtLink :to="`/admin/layanan/${service.id}`" class="text-xs font-semibold text-gold-dark">Edit <ArrowRight :size="11" class="inline" /></NuxtLink><button type="button" class="text-xs font-semibold" :class="service.active ? 'text-red-700' : 'text-emerald-700'" @click="toggle(service)">{{ service.active ? 'Nonaktifkan' : 'Aktifkan' }}</button></div>
          </div>
        </div>
      </template>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="page = $event" />
  </div>
</template>

<script setup lang="ts">
import {
  BookOpen,
  ChevronLeft,
  ExternalLink,
  FileText,
  Globe2,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  PanelTop,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
  X
} from 'lucide-vue-next'
import type { Permission } from '~/shared/types'

const { user, fetchSession, logout, can } = useAuth()
const { settings, ensureSite } = useSite()
const route = useRoute()
const mobileOpen = ref(false)
const collapsed = ref(false)

await useAsyncData('admin-bootstrap', async () => {
  await Promise.all([fetchSession(), ensureSite()])
  return true
})

const menuGroups: {
  label: string
  items: { label: string; to: string; icon: any; permission?: Permission }[]
}[] = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard }
    ]
  },
  {
    label: 'Layanan',
    items: [
      { label: 'Manajemen Layanan', to: '/admin/layanan', icon: Layers, permission: 'services.manage' }
    ]
  },
  {
    label: 'Permohonan',
    items: [
      { label: 'Daftar Permohonan', to: '/admin/permohonan', icon: Inbox, permission: 'requests.read' }
    ]
  },
  {
    label: 'Konten Website',
    items: [
      { label: 'Ringkasan Konten', to: '/admin/konten', icon: PanelTop, permission: 'content.manage' },
      { label: 'Publikasi', to: '/admin/publikasi', icon: Newspaper, permission: 'content.manage' },
      { label: 'Ekosistem Digital', to: '/admin/ekosistem', icon: Globe2, permission: 'content.manage' },
      { label: 'Program', to: '/admin/program', icon: Workflow, permission: 'content.manage' },
      { label: 'Halaman & Profil', to: '/admin/halaman', icon: FileText, permission: 'content.manage' }
    ]
  },
  {
    label: 'Dokumentasi',
    items: [
      { label: 'SOP & Panduan', to: '/admin/dokumen', icon: BookOpen, permission: 'documents.manage' }
    ]
  },
  {
    label: 'Administrasi',
    items: [
      { label: 'Pengguna', to: '/admin/pengguna', icon: Users, permission: 'users.manage' },
      { label: 'Hak Akses', to: '/admin/akses', icon: ShieldCheck, permission: 'roles.manage' },
      { label: 'Pengaturan', to: '/admin/pengaturan', icon: Settings, permission: 'settings.manage' },
      { label: 'Notifikasi', to: '/admin/notifikasi', icon: Mail, permission: 'notifications.read' },
      { label: 'Audit Log', to: '/admin/audit', icon: ScrollText, permission: 'audit.read' }
    ]
  }
]

const visibleGroups = computed(() =>
  menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || can(item.permission))
    }))
    .filter((group) => group.items.length)
)

const currentLabel = computed(() => {
  const all = menuGroups.flatMap((group) => group.items)
  const match = [...all].sort((a, b) => b.to.length - a.to.length).find((item) =>
    item.to === '/admin' ? route.path === '/admin' : route.path.startsWith(item.to)
  )
  return match?.label || 'Administrasi'
})

const initials = computed(() =>
  (user.value?.name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
)

const isActive = (to: string) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  }
)

watch(mobileOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})

useSeoMeta({ robots: 'noindex, nofollow', title: computed(() => `${currentLabel.value} · Admin`) })
</script>

<template>
  <div class="admin-shell min-h-screen bg-admin-bg">
    <aside
      class="fixed inset-y-0 left-0 z-50 hidden border-r border-admin-border bg-admin-sidebar transition-[width] duration-200 lg:flex lg:flex-col"
      :class="collapsed ? 'w-[76px]' : 'w-[252px]'"
    >
      <div class="flex h-[64px] items-center border-b border-admin-border px-4" :class="collapsed ? 'justify-center' : 'justify-between'">
        <AppLogo v-if="!collapsed" />
        <NuxtLink v-else to="/admin" class="grid h-10 w-10 place-items-center rounded-lg bg-unu-green text-[12px] font-bold text-white" aria-label="Dashboard admin">TD</NuxtLink>
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-md text-admin-muted transition hover:bg-white hover:text-admin-text"
          :aria-label="collapsed ? 'Perluas sidebar' : 'Ringkas sidebar'"
          @click="collapsed = !collapsed"
        >
          <ChevronLeft :size="15" :class="collapsed ? 'rotate-180' : ''" aria-hidden="true" />
        </button>
      </div>

      <nav class="no-scrollbar flex-1 overflow-y-auto px-3 py-3" aria-label="Navigasi admin">
        <div v-for="group in visibleGroups" :key="group.label" class="mb-3">
          <p v-if="!collapsed" class="mb-1.5 px-2 text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">{{ group.label }}</p>
          <div v-else class="mx-auto mb-2 h-px w-8 bg-admin-border" />
          <ul class="space-y-0.5">
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="group relative flex min-h-[40px] items-center gap-3 rounded-md border-l-2 px-3 text-[12px] font-medium transition"
                :class="
                  isActive(item.to)
                    ? 'border-unu-green bg-white text-unu-green shadow-sm'
                    : 'border-transparent text-slate-600 hover:bg-white/70 hover:text-admin-text'
                "
                :title="collapsed ? item.label : undefined"
              >
                <component :is="item.icon" :size="16" :stroke-width="1.8" class="shrink-0" aria-hidden="true" />
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <div class="border-t border-admin-border p-3">
        <div v-if="!collapsed" class="mb-2 rounded-lg border border-admin-border bg-white p-3">
          <p class="truncate text-[14px] font-semibold text-admin-text">{{ user?.name }}</p>
          <p class="mt-0.5 truncate text-[12px] text-admin-muted">{{ user?.email }}</p>
          <p class="mt-2 inline-flex rounded-full bg-unu-green-soft px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-unu-green">
            {{ user?.role }}
          </p>
        </div>
        <div class="flex items-center" :class="collapsed ? 'justify-center' : 'justify-between'">
          <NuxtLink
            to="/"
            target="_blank"
            class="inline-flex min-h-[36px] items-center gap-2 rounded-md px-2 text-[12px] text-admin-muted transition hover:bg-white hover:text-admin-text"
            :title="collapsed ? 'Lihat website' : undefined"
          >
            <ExternalLink :size="13" aria-hidden="true" />
            <span v-if="!collapsed">Website publik</span>
          </NuxtLink>
          <button
            type="button"
            class="inline-flex min-h-[36px] items-center gap-2 rounded-md px-2 text-[12px] text-admin-muted transition hover:bg-red-50 hover:text-red-700"
            :title="collapsed ? 'Keluar' : undefined"
            @click="logout"
          >
            <LogOut :size="13" aria-hidden="true" />
            <span v-if="!collapsed">Keluar</span>
          </button>
        </div>
      </div>
    </aside>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="mobileOpen" class="fixed inset-0 z-[90] lg:hidden">
          <div class="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" @click="mobileOpen = false" />
          <aside class="absolute inset-y-0 left-0 flex w-[86%] max-w-[310px] flex-col border-r border-admin-border bg-white">
            <div class="flex h-[64px] items-center justify-between border-b border-admin-border px-4">
              <AppLogo />
              <button type="button" class="grid h-10 w-10 place-items-center rounded-lg text-admin-muted hover:bg-admin-sidebar" aria-label="Tutup menu" @click="mobileOpen = false">
                <X :size="18" aria-hidden="true" />
              </button>
            </div>
            <nav class="flex-1 overflow-y-auto px-3 py-4">
              <div v-for="group in visibleGroups" :key="group.label" class="mb-3">
                <p class="mb-1.5 px-2 text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">{{ group.label }}</p>
                <ul class="space-y-0.5">
                  <li v-for="item in group.items" :key="item.to">
                    <NuxtLink
                      :to="item.to"
                      class="flex min-h-[44px] items-center gap-3 rounded-md border-l-2 px-3 text-[14px] font-medium"
                      :class="isActive(item.to) ? 'border-unu-green bg-unu-green-soft text-unu-green' : 'border-transparent text-slate-600'"
                    >
                      <component :is="item.icon" :size="16" aria-hidden="true" />
                      {{ item.label }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </nav>
            <div class="border-t border-admin-border p-4">
              <p class="truncate text-sm font-semibold text-admin-text">{{ user?.name }}</p>
              <p class="mt-0.5 truncate text-[12px] text-admin-muted">{{ user?.email }}</p>
              <div class="mt-3 flex gap-2">
                <NuxtLink to="/" target="_blank" class="flex-1 rounded-lg border border-admin-border px-3 py-2 text-center text-[14px] text-slate-600">Website</NuxtLink>
                <button type="button" class="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[14px] font-semibold text-red-700" @click="logout">Keluar</button>
              </div>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>

    <div class="transition-[padding] duration-200" :class="collapsed ? 'lg:pl-[76px]' : 'lg:pl-[252px]'">
      <header class="sticky top-0 z-40 border-b border-admin-border bg-white">
        <div class="flex h-[64px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              class="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-admin-border bg-white lg:hidden"
              aria-label="Buka menu admin"
              @click="mobileOpen = true"
            >
              <Menu :size="18" class="text-admin-text" aria-hidden="true" />
            </button>
            <div class="min-w-0">
              <p class="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">Administrasi</p>
              <h1 class="truncate text-[15px] font-semibold text-admin-text">{{ currentLabel }}</h1>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="hidden text-[12px] font-medium text-admin-muted md:inline">{{ settings.directorateName }}</span>
            <span class="mx-1 hidden h-5 w-px bg-admin-border md:block" aria-hidden="true" />
            <NuxtLink
              to="/"
              target="_blank"
              class="grid h-9 w-9 place-items-center rounded-lg border border-admin-border bg-white text-admin-muted transition hover:text-unu-green"
              aria-label="Buka website publik"
            >
              <ExternalLink :size="15" aria-hidden="true" />
            </NuxtLink>
            <span class="grid h-9 w-9 place-items-center rounded-lg bg-unu-green text-[12px] font-bold text-white">{{ initials }}</span>
          </div>
        </div>
      </header>

      <main class="px-4 py-6 sm:px-6 lg:px-7 lg:py-7">
        <div class="mx-auto max-w-7xl">
          <slot />
        </div>
      </main>
    </div>

    <ToastHost />
  </div>
</template>

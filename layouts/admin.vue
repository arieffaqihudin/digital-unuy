<script setup lang="ts">
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  FileText,
  Globe2,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  History,
  Bell,
  Search,
  Menu,
  Newspaper,
  Users,
  UsersRound,
  X
} from 'lucide-vue-next'
import type { Permission } from '~/shared/types'

const { user, fetchSession, logout, can } = useAuth()
const { settings, ensureSite } = useSite()
const route = useRoute()
const requestFetch = useRequestFetch()
const mobileOpen = ref(false)
const collapsed = ref(false)
const accountMenuOpen = ref(false)
const accountMenu = ref<HTMLElement | null>(null)

function handleDocumentClick(event: MouseEvent) {
  if (!accountMenuOpen.value) return
  if (accountMenu.value && !accountMenu.value.contains(event.target as Node)) {
    accountMenuOpen.value = false
  }
}

await useAsyncData('admin-bootstrap', async () => {
  await Promise.all([fetchSession(), ensureSite()])
  return true
})

const { data: notificationSummary, refresh: refreshNotificationSummary } = await useAsyncData('admin-notification-summary', async () => {
  if (!can('notifications.read') || !can('requests.read')) return { actionCount: 0 }
  try {
    return await requestFetch<{ actionCount: number }>('/api/admin/notifications', {
      query: { view: 'action', page: 1, pageSize: 1 }
    })
  } catch {
    return { actionCount: 0 }
  }
})

const notificationCount = computed(() => notificationSummary.value?.actionCount || 0)

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
      { label: 'Publikasi', to: '/admin/publikasi', icon: Newspaper, permission: 'content.manage' },
      { label: 'Ekosistem Digital', to: '/admin/ekosistem', icon: Globe2, permission: 'content.manage' },
      { label: 'Halaman & Profil', to: '/admin/halaman', icon: FileText, permission: 'content.manage' },
      { label: 'Tim Kami', to: '/admin/tim', icon: UsersRound, permission: 'content.manage' }
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
      { label: 'SEO & Indexing', to: '/admin/seo', icon: Search, permission: 'settings.manage' },
      { label: 'Log Aktivitas', to: '/admin/audit', icon: History, permission: 'audit.read' }
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
    accountMenuOpen.value = false
    refreshNotificationSummary()
  }
)

watch(mobileOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (import.meta.client) document.body.style.overflow = ''
})

useSeoMeta({ robots: 'noindex, nofollow', title: computed(() => `${currentLabel.value} · Admin`) })
</script>

<template>
  <div class="admin-shell min-h-screen bg-admin-bg">
    <aside
      id="admin-sidebar"
      class="fixed inset-y-0 left-0 z-50 hidden border-r border-admin-border bg-admin-sidebar transition-[width] duration-200 lg:flex lg:flex-col"
      :class="collapsed ? 'w-[76px]' : 'w-[252px]'"
    >
      <div class="flex h-[64px] items-center border-b border-admin-border px-4" :class="collapsed ? 'justify-center' : 'justify-start'">
        <AppLogo v-if="!collapsed" />
        <AppLogo v-else compact />
      </div>

      <button
        type="button"
        class="absolute -right-3.5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-admin-border bg-white text-admin-muted shadow-sm transition hover:border-unu-green/40 hover:text-unu-green lg:grid"
        :aria-label="collapsed ? 'Perluas sidebar' : 'Ringkas sidebar'"
        :aria-expanded="!collapsed"
        aria-controls="admin-sidebar"
        :title="collapsed ? 'Perluas sidebar' : 'Ringkas sidebar'"
        @click="collapsed = !collapsed"
      >
        <ChevronLeft :size="15" :class="collapsed ? 'rotate-180' : ''" aria-hidden="true" />
      </button>

      <nav class="no-scrollbar flex-1 overflow-y-auto px-3 py-3" aria-label="Navigasi admin">
        <div v-for="group in visibleGroups" :key="group.label" class="mb-3">
          <p v-if="!collapsed" class="mb-1.5 px-2 text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">{{ group.label }}</p>
          <div v-else class="mx-auto mb-2 h-px w-8 bg-admin-border" />
          <ul class="space-y-0.5">
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="group relative flex min-h-[40px] items-center gap-3 rounded-md px-3 text-[14px] font-medium transition"
                :class="
                  isActive(item.to)
                    ? 'bg-white text-unu-green shadow-sm'
                    : 'text-slate-600 hover:bg-white/70 hover:text-admin-text'
                "
                :title="collapsed ? item.label : undefined"
              >
                <component :is="item.icon" :size="18" :stroke-width="1.8" class="shrink-0" aria-hidden="true" />
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
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
                      class="flex min-h-[44px] items-center gap-3 rounded-md px-3 text-[14px] font-medium"
                      :class="isActive(item.to) ? 'bg-unu-green-soft text-unu-green' : 'text-slate-600'"
                    >
                      <component :is="item.icon" :size="16" aria-hidden="true" />
                      {{ item.label }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </nav>
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
              <h1 class="truncate text-[18px] font-semibold text-admin-text">{{ currentLabel }}</h1>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="hidden text-[12px] font-medium text-admin-muted md:inline">{{ settings.directorateName }}</span>
            <span class="mx-1 hidden h-5 w-px bg-admin-border md:block" aria-hidden="true" />

            <NuxtLink
              v-if="can('notifications.read') && can('requests.read')"
              to="/admin/notifikasi"
              class="relative grid h-9 w-9 place-items-center rounded-lg border border-admin-border bg-white text-admin-muted transition hover:border-unu-green/30 hover:text-unu-green"
              :aria-label="notificationCount ? `Notifikasi, ${notificationCount} perlu tindakan` : 'Notifikasi'"
              title="Notifikasi"
            >
              <Bell :size="16" aria-hidden="true" />
              <span class="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white" :class="notificationCount > 0 ? '' : 'hidden'">
                {{ notificationCount > 99 ? '99+' : notificationCount }}
              </span>
            </NuxtLink>

            <div v-if="user" ref="accountMenu" class="relative">
              <button
                type="button"
                class="flex min-h-[40px] items-center gap-1.5 rounded-lg px-1 text-left transition hover:bg-admin-sidebar"
                :aria-expanded="accountMenuOpen"
                aria-haspopup="menu"
                aria-label="Menu akun"
                @click.stop="accountMenuOpen = !accountMenuOpen"
              >
                <span class="grid h-9 w-9 place-items-center rounded-lg bg-unu-green text-[12px] font-bold text-white">{{ initials }}</span>
                <ChevronDown :size="14" class="hidden text-admin-muted sm:block" aria-hidden="true" />
              </button>

              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="translate-y-1 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
                leave-active-class="transition duration-100 ease-in"
                leave-to-class="translate-y-1 opacity-0"
              >
                <div
                  v-if="accountMenuOpen"
                  class="absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-xl border border-admin-border bg-white p-2 shadow-soft"
                  role="menu"
                >
                  <div class="border-b border-admin-border px-3 pb-3 pt-2">
                    <p class="truncate text-[14px] font-semibold text-admin-text">{{ user.name }}</p>
                    <p class="mt-0.5 truncate text-[12px] text-admin-muted">{{ user.email }}</p>
                    <p class="mt-2 inline-flex rounded-full bg-unu-green-soft px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-unu-green">
                      {{ user.role }}
                    </p>
                  </div>
                  <NuxtLink
                    to="/"
                    target="_blank"
                    class="mt-1 flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-slate-600 transition hover:bg-admin-sidebar hover:text-admin-text"
                    role="menuitem"
                  >
                    <ExternalLink :size="14" aria-hidden="true" />
                    Website publik
                  </NuxtLink>
                  <button
                    type="button"
                    class="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-red-700 transition hover:bg-red-50"
                    role="menuitem"
                    @click="logout"
                  >
                    <LogOut :size="14" aria-hidden="true" />
                    Keluar
                  </button>
                </div>
              </Transition>
            </div>
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

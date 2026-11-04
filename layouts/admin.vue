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
    label: 'Operasional',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'Permohonan', to: '/admin/permohonan', icon: Inbox, permission: 'requests.read' }
    ]
  },
  {
    label: 'Pengelolaan',
    items: [
      { label: 'Layanan', to: '/admin/layanan', icon: Layers, permission: 'services.manage' },
      { label: 'Konten Website', to: '/admin/konten', icon: PanelTop, permission: 'content.manage' },
      { label: 'Publikasi', to: '/admin/publikasi', icon: Newspaper, permission: 'content.manage' },
      { label: 'Ekosistem Digital', to: '/admin/ekosistem', icon: Globe2, permission: 'content.manage' },
      { label: 'Program', to: '/admin/program', icon: Workflow, permission: 'content.manage' },
      { label: 'Halaman & Profil', to: '/admin/halaman', icon: FileText, permission: 'content.manage' },
      { label: 'Dokumentasi', to: '/admin/dokumen', icon: BookOpen, permission: 'documents.manage' }
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
  <div class="min-h-screen bg-[#F5F3E9]">
    <aside
      class="fixed inset-y-0 left-0 z-50 hidden border-r border-charcoal/10 bg-charcoal text-white transition-[width] duration-200 lg:flex lg:flex-col"
      :class="collapsed ? 'w-[76px]' : 'w-[264px]'"
    >
      <div class="flex h-[72px] items-center border-b border-white/10 px-4" :class="collapsed ? 'justify-center' : 'justify-between'">
        <AppLogo v-if="!collapsed" inverse />
        <NuxtLink v-else to="/admin" class="grid h-10 w-10 place-items-center rounded-xl bg-white text-xs font-bold text-charcoal" aria-label="Dashboard admin">TD</NuxtLink>
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
          :aria-label="collapsed ? 'Perluas sidebar' : 'Ringkas sidebar'"
          @click="collapsed = !collapsed"
        >
          <ChevronLeft :size="16" :class="collapsed ? 'rotate-180' : ''" aria-hidden="true" />
        </button>
      </div>

      <nav class="no-scrollbar flex-1 overflow-y-auto px-3 py-5" aria-label="Navigasi admin">
        <div v-for="group in visibleGroups" :key="group.label" class="mb-5">
          <p v-if="!collapsed" class="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-sage/70">{{ group.label }}</p>
          <div v-else class="mx-auto mb-2 h-px w-8 bg-white/10" />
          <ul class="space-y-0.5">
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="group flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-[12.5px] font-medium transition"
                :class="
                  isActive(item.to)
                    ? 'bg-white text-charcoal'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                "
                :title="collapsed ? item.label : undefined"
              >
                <component :is="item.icon" :size="17" :stroke-width="1.8" class="shrink-0" aria-hidden="true" />
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>

      <div class="border-t border-white/10 p-3">
        <div v-if="!collapsed" class="mb-3 rounded-xl bg-white/5 p-3">
          <p class="truncate text-xs font-semibold">{{ user?.name }}</p>
          <p class="mt-0.5 truncate text-[10px] text-white/45">{{ user?.email }}</p>
          <p class="mt-2 inline-flex rounded-full border border-sage/30 bg-sage/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sage">
            {{ user?.role }}
          </p>
        </div>
        <div class="flex items-center" :class="collapsed ? 'justify-center' : 'justify-between'">
          <NuxtLink
            to="/"
            target="_blank"
            class="inline-flex min-h-[38px] items-center gap-2 rounded-lg px-2 text-[11px] text-white/50 transition hover:bg-white/10 hover:text-white"
            :title="collapsed ? 'Lihat website' : undefined"
          >
            <ExternalLink :size="14" aria-hidden="true" />
            <span v-if="!collapsed">Lihat website</span>
          </NuxtLink>
          <button
            type="button"
            class="inline-flex min-h-[38px] items-center gap-2 rounded-lg px-2 text-[11px] text-white/50 transition hover:bg-red-500/10 hover:text-red-200"
            :title="collapsed ? 'Keluar' : undefined"
            @click="logout"
          >
            <LogOut :size="14" aria-hidden="true" />
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
          <div class="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" @click="mobileOpen = false" />
          <aside class="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col bg-charcoal text-white">
            <div class="flex h-[70px] items-center justify-between border-b border-white/10 px-4">
              <AppLogo inverse />
              <button type="button" class="grid h-10 w-10 place-items-center rounded-lg text-white/70 hover:bg-white/10" aria-label="Tutup menu" @click="mobileOpen = false">
                <X :size="18" aria-hidden="true" />
              </button>
            </div>
            <nav class="flex-1 overflow-y-auto px-3 py-4">
              <div v-for="group in visibleGroups" :key="group.label" class="mb-5">
                <p class="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-sage/70">{{ group.label }}</p>
                <ul class="space-y-0.5">
                  <li v-for="item in group.items" :key="item.to">
                    <NuxtLink
                      :to="item.to"
                      class="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium"
                      :class="isActive(item.to) ? 'bg-white text-charcoal' : 'text-white/65'"
                    >
                      <component :is="item.icon" :size="17" aria-hidden="true" />
                      {{ item.label }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </nav>
            <div class="border-t border-white/10 p-4">
              <p class="truncate text-sm font-semibold">{{ user?.name }}</p>
              <p class="mt-0.5 truncate text-[11px] text-white/45">{{ user?.email }}</p>
              <div class="mt-3 flex gap-2">
                <NuxtLink to="/" target="_blank" class="flex-1 rounded-lg border border-white/15 px-3 py-2 text-center text-xs text-white/70">Website</NuxtLink>
                <button type="button" class="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold" @click="logout">Keluar</button>
              </div>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>

    <div class="transition-[padding] duration-200" :class="collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'">
      <header class="sticky top-0 z-40 border-b border-charcoal/10 bg-[#F5F3E9]/95 backdrop-blur">
        <div class="flex h-[70px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line-warm bg-white lg:hidden"
              aria-label="Buka menu admin"
              @click="mobileOpen = true"
            >
              <Menu :size="18" class="text-charcoal" aria-hidden="true" />
            </button>
            <div class="min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark">Administrasi</p>
              <h1 class="truncate text-base font-semibold sm:text-lg">{{ currentLabel }}</h1>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <span class="hidden rounded-full border border-line-warm bg-white px-3 py-1.5 text-[10px] font-semibold text-ink-muted sm:inline-flex">
              {{ settings.directorateName }}
            </span>
            <NuxtLink
              to="/"
              target="_blank"
              class="grid h-10 w-10 place-items-center rounded-xl border border-line-warm bg-white text-ink-muted transition hover:text-charcoal"
              aria-label="Buka website publik"
            >
              <ExternalLink :size="16" aria-hidden="true" />
            </NuxtLink>
            <span class="grid h-10 w-10 place-items-center rounded-xl bg-charcoal text-[11px] font-bold text-white">{{ initials }}</span>
          </div>
        </div>
      </header>

      <main class="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div class="mx-auto max-w-7xl">
          <slot />
        </div>
      </main>
    </div>

    <ToastHost />
  </div>
</template>

<script setup lang="ts">
import { ArrowUpRight, ChevronDown, CircleUserRound, LogOut, Menu, Search, ShieldCheck, X } from 'lucide-vue-next'

const route = useRoute()
const { settings, ensureSite } = useSite()
const { user, fetchSession, logout, isStaff } = useAuth()
const mobileOpen = ref(false)
const userMenuOpen = ref(false)
const userMenu = ref<HTMLElement | null>(null)
const infoMenuOpen = ref(false)
const mobileInfoOpen = ref(false)

const navigation = [
  { label: 'Beranda', to: '/' },
  { label: 'Layanan Digital', to: '/layanan' },
  { label: 'Ekosistem Digital', to: '/ekosistem-digital' },
  {
    label: 'Informasi',
    to: '/tentang',
    activeWhen: ['/tentang', '/tentang-kami', '/dokumen', '/publikasi'],
    children: [
      { label: 'Tentang Kami', to: '/tentang' },
      { label: 'Tim Kami', to: '/tentang-kami/tim' },
      { label: 'Dampak Transformasi', to: '/#dampak' },
      { label: 'Panduan & Dokumen', to: '/dokumen' },
      { label: 'Publikasi', to: '/publikasi' }
    ]
  }
]

await useAsyncData('layout-bootstrap', async () => {
  await Promise.all([ensureSite(), fetchSession()])
  return true
})

const isActive = (item: { to: string; activeWhen?: string[] }) => {
  if (item.activeWhen?.length) return item.activeWhen.some((path) => route.path === path || route.path.startsWith(`${path}/`))
  return item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
}
const hasAdminAccess = computed(() => isStaff.value && Boolean(user.value?.permissions?.length))

function closeMobile() {
  mobileOpen.value = false
  mobileInfoOpen.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (userMenuOpen.value && userMenu.value && !userMenu.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
  if (infoMenuOpen.value) {
    const menu = document.querySelector('[data-info-menu]')
    if (menu && !menu.contains(event.target as Node)) infoMenuOpen.value = false
  }
}

function closeInfoMenu() {
  infoMenuOpen.value = false
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (infoMenuOpen.value) {
    infoMenuOpen.value = false
    return
  }
  if (userMenuOpen.value) userMenuOpen.value = false
}

async function focusFirstInfoLink() {
  await nextTick()
  document.querySelector<HTMLElement>('[data-info-menu] [role="menu"] a')?.focus()
}

watch(mobileOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    const infoNav = navigation.find((item) => item.label === 'Informasi')
    if (infoNav) mobileInfoOpen.value = isActive(infoNav)
  }
})

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
    mobileInfoOpen.value = false
    userMenuOpen.value = false
    infoMenuOpen.value = false
  }
)

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  if (import.meta.client) document.body.style.overflow = ''
})

const runtimeConfig = useRuntimeConfig()
useHead(() => ({
  link: [{ rel: 'canonical', href: `${runtimeConfig.public.siteUrl}${route.path}` }]
}))
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:bg-unu-green focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      Lewati ke konten utama
    </a>

    <header class="sticky top-0 z-50 border-b border-line-warm bg-ivory/95 backdrop-blur-md">
      <div class="page-shell flex h-16 items-center gap-4 md:h-[72px]">
        <AppLogo />

        <div class="hidden min-w-0 flex-1 justify-center lg:flex">
          <nav class="flex items-center gap-0.5" aria-label="Navigasi utama">
            <template v-for="item in navigation" :key="item.to">
              <div v-if="item.children?.length" data-info-menu class="relative">
                <button
                  type="button"
                  class="site-nav-link relative inline-flex min-h-[44px] items-center gap-1 px-2 transition"
                  :class="isActive(item) ? 'text-charcoal' : 'text-slate-500 hover:text-charcoal'"
                  :aria-expanded="infoMenuOpen"
                  aria-haspopup="menu"
                  @click.stop="infoMenuOpen = !infoMenuOpen"
                  @keydown.down.prevent="infoMenuOpen = true; focusFirstInfoLink()"
                  @keydown.esc="closeInfoMenu"
                >
                  {{ item.label }}
                  <ChevronDown :size="13" class="transition" :class="infoMenuOpen ? 'rotate-180' : ''" aria-hidden="true" />
                  <span
                    v-if="isActive(item)"
                    class="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-unu-green"
                    aria-hidden="true"
                  />
                </button>
                <Transition
                  enter-active-class="transition duration-150 ease-out"
                  enter-from-class="translate-y-1 opacity-0"
                  enter-to-class="translate-y-0 opacity-100"
                  leave-active-class="transition duration-100 ease-in"
                  leave-to-class="translate-y-1 opacity-0"
                >
                  <div
                    v-if="infoMenuOpen"
                    class="absolute right-0 top-[calc(100%+2px)] w-64 overflow-hidden rounded-xl border border-line-warm bg-white p-1.5 shadow-soft"
                    role="menu"
                    @keydown.esc="closeInfoMenu"
                  >
                    <NuxtLink
                      v-for="child in item.children"
                      :key="child.to"
                      :to="child.to"
                      class="flex min-h-[44px] items-center rounded-lg px-3 text-[14px] font-medium transition hover:bg-soft-white"
                      :class="route.path === child.to || (child.to !== '/' && route.path.startsWith(`${child.to}/`)) ? 'text-unu-green' : 'text-slate-600'"
                      role="menuitem"
                      @click="closeInfoMenu"
                    >
                      {{ child.label }}
                    </NuxtLink>
                  </div>
                </Transition>
              </div>
              <NuxtLink
                v-else
                :to="item.to"
                class="site-nav-link relative inline-flex min-h-[44px] items-center px-2 transition"
                :class="isActive(item) ? 'text-charcoal' : 'text-slate-500 hover:text-charcoal'"
              >
                {{ item.label }}
                <span
                  v-if="isActive(item)"
                  class="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-unu-green"
                  aria-hidden="true"
                />
              </NuxtLink>
            </template>
          </nav>
        </div>

        <div class="ml-2 hidden shrink-0 items-center gap-2 lg:flex">
          <NuxtLink
            to="/lacak"
            class="grid h-11 w-11 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-charcoal"
            aria-label="Lacak permohonan"
            title="Lacak permohonan"
          >
            <Search :size="17" aria-hidden="true" />
          </NuxtLink>

          <div v-if="user" ref="userMenu" class="relative">
            <button
              type="button"
              class="grid h-11 w-11 place-items-center rounded-lg border border-line-warm bg-white text-slate-500 transition hover:border-slate-300 hover:text-charcoal"
              :aria-expanded="userMenuOpen"
              aria-haspopup="menu"
              aria-label="Menu akun"
              title="Menu akun"
              @click.stop="userMenuOpen = !userMenuOpen"
            >
              <CircleUserRound :size="19" aria-hidden="true" />
            </button>
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="translate-y-1 opacity-0"
              enter-to-class="translate-y-0 opacity-100"
              leave-active-class="transition duration-100 ease-in"
              leave-to-class="translate-y-1 opacity-0"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-xl border border-line-warm bg-white p-2 shadow-soft"
                role="menu"
              >
                <NuxtLink to="/lacak" class="flex min-h-[44px] items-center rounded-lg px-3 text-[14px] font-medium transition hover:bg-soft-white" role="menuitem">
                  Permohonan Saya
                </NuxtLink>
                <NuxtLink v-if="hasAdminAccess" to="/admin" class="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-[14px] font-medium transition hover:bg-soft-white" role="menuitem">
                  <ShieldCheck :size="15" aria-hidden="true" /> Dashboard Admin
                </NuxtLink>
                <button
                  type="button"
                  class="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-red-700 transition hover:bg-red-50"
                  role="menuitem"
                  @click="logout"
                >
                  <LogOut :size="15" aria-hidden="true" /> Keluar
                </button>
              </div>
            </Transition>
          </div>
          <NuxtLink
            v-else
            to="/masuk"
            class="grid h-11 w-11 place-items-center rounded-lg border border-line-warm bg-white text-slate-500 transition hover:border-slate-300 hover:text-charcoal"
            aria-label="Masuk ke akun"
            title="Masuk ke akun"
          >
            <CircleUserRound :size="19" aria-hidden="true" />
          </NuxtLink>

          <AppButton to="/layanan" size="sm" class="site-nav-cta ml-1 whitespace-nowrap">Ajukan Layanan</AppButton>
        </div>

        <div class="ml-auto flex items-center gap-2 lg:hidden">
          <AppButton to="/layanan" size="sm" class="site-nav-cta hidden whitespace-nowrap sm:inline-flex">Ajukan Layanan</AppButton>
          <button
            type="button"
            class="grid h-11 w-11 place-items-center rounded-lg border border-line-warm bg-white text-charcoal transition hover:border-slate-300"
            :aria-expanded="mobileOpen"
            aria-controls="mobile-navigation"
            aria-label="Buka menu navigasi"
            @click="mobileOpen = true"
          >
            <Menu :size="20" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="mobileOpen" id="mobile-navigation" class="fixed inset-0 z-[90] bg-soft-white lg:hidden">
          <div class="flex h-full flex-col">
            <div class="flex h-[64px] items-center justify-between border-b border-line-warm px-5">
              <AppLogo />
              <button
                type="button"
                class="grid h-11 w-11 place-items-center rounded-lg border border-line-warm bg-white"
                aria-label="Tutup menu navigasi"
                @click="closeMobile"
              >
                <X :size="20" aria-hidden="true" />
              </button>
            </div>
            <nav class="flex-1 overflow-y-auto px-5 py-5" aria-label="Navigasi mobile">
              <ul class="space-y-0.5">
                <li v-for="(item, index) in navigation" :key="item.to">
                  <template v-if="item.children?.length">
                    <button
                      type="button"
                      class="flex min-h-[52px] w-full items-center justify-between border-l-2 px-4 text-left text-[15px] font-semibold transition"
                      :class="isActive(item) ? 'border-unu-green bg-white text-charcoal' : 'border-transparent text-slate-600 hover:bg-white/70'"
                      :aria-expanded="mobileInfoOpen"
                      @click="mobileInfoOpen = !mobileInfoOpen"
                    >
                      <span><span class="mr-3 text-[14px] font-bold tabular-nums text-slate-400">0{{ index + 1 }}</span>{{ item.label }}</span>
                      <ChevronDown :size="16" class="text-slate-400 transition" :class="mobileInfoOpen ? 'rotate-180' : ''" aria-hidden="true" />
                    </button>
                    <div v-show="mobileInfoOpen" class="ml-8 border-l border-line-warm pl-3">
                      <NuxtLink
                        v-for="child in item.children"
                        :key="child.to"
                        :to="child.to"
                        class="flex min-h-[44px] items-center text-[14px] font-medium transition"
                        :class="route.path === child.to || (child.to !== '/' && route.path.startsWith(`${child.to}/`)) ? 'text-unu-green' : 'text-slate-500 hover:text-charcoal'"
                        @click="closeMobile"
                      >
                        {{ child.label }}
                      </NuxtLink>
                    </div>
                  </template>
                  <NuxtLink
                    v-else
                    :to="item.to"
                    class="flex min-h-[52px] items-center justify-between border-l-2 px-4 text-[15px] font-semibold transition"
                    :class="isActive(item) ? 'border-unu-green bg-white text-charcoal' : 'border-transparent text-slate-600 hover:bg-white/70'"
                    @click="closeMobile"
                  >
                    <span><span class="mr-3 text-[14px] font-bold tabular-nums text-slate-400">0{{ index + 1 }}</span>{{ item.label }}</span>
                    <span v-if="isActive(item)" class="h-1.5 w-1.5 rounded-full bg-unu-green" aria-hidden="true" />
                  </NuxtLink>
                </li>
              </ul>
              <div class="my-5 h-px bg-line-warm" />
              <div class="grid gap-2">
                <AppButton to="/lacak" variant="secondary" block @click="closeMobile">{{ user ? 'Permohonan Saya' : 'Lacak Permohonan' }}</AppButton>
                <template v-if="user">
                  <AppButton v-if="hasAdminAccess" to="/admin" variant="secondary" block @click="closeMobile">Dashboard Admin</AppButton>
                  <button type="button" class="min-h-[44px] text-sm font-semibold text-red-700" @click="logout">Keluar</button>
                </template>
                <AppButton v-else to="/masuk" variant="secondary" block @click="closeMobile">Masuk</AppButton>
                <AppButton to="/layanan" block @click="closeMobile">Ajukan Layanan</AppButton>
              </div>
              <div class="mt-5 border-t border-line-warm pt-4">
                <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Kontak</p>
                <p v-if="settings.contactEmail" class="mt-2 break-all text-[14px] text-slate-600">{{ settings.contactEmail }}</p>
                <p v-else class="mt-2 text-[14px] text-slate-500">Kontak resmi belum dikonfigurasi.</p>
              </div>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>

    <main id="main-content" class="flex-1">
      <slot />
    </main>

    <footer class="mt-auto border-t-4 border-unu-green bg-charcoal text-white">
      <div class="page-shell pb-7 pt-12 lg:pt-14">
        <div class="grid gap-10 lg:grid-cols-[1.5fr_0.7fr_0.8fr]">
          <div>
            <div class="flex flex-wrap items-center gap-4" aria-label="Universitas Nahdlatul Ulama Yogyakarta">
              <img src="/unu-logo.png" alt="Logo Universitas Nahdlatul Ulama Yogyakarta" class="h-11 w-11 object-contain brightness-0 invert" />
              <span class="h-8 w-px bg-white/20" aria-hidden="true" />
              <img src="/member-logo-white.png" alt="Universitas Nahdlatul Ulama Yogyakarta" class="h-8 w-auto max-w-[170px] object-contain" />
            </div>
            <p class="mt-4 text-[14px] font-semibold text-white/80">{{ settings.directorateName }}</p>
            <p class="mt-3 max-w-md text-[14px] leading-6 text-white/55">
              {{ settings.description || 'Direktorat yang mengembangkan ekosistem digital terintegrasi dan layanan teknologi informasi Universitas Nahdlatul Ulama Yogyakarta.' }}
            </p>
            <div v-if="settings.socials.length" class="mt-5 flex flex-wrap gap-2">
              <a
                v-for="social in settings.socials"
                :key="social.url"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-[38px] items-center rounded-full border border-white/15 px-3 text-[12px] font-semibold text-white/65 transition hover:border-sage hover:text-white"
              >
                {{ social.label }}
              </a>
            </div>
            <address class="mt-7 space-y-1.5 text-[13px] not-italic leading-6 text-white/50">
              <p v-if="settings.address">{{ settings.address }}</p>
              <p v-if="settings.contactPhone">{{ settings.contactPhone }}</p>
              <p v-if="settings.contactEmail"><a :href="`mailto:${settings.contactEmail}`" class="break-all transition hover:text-white">{{ settings.contactEmail }}</a></p>
              <p v-if="!settings.address && !settings.contactPhone && !settings.contactEmail">Informasi kontak belum dikonfigurasi.</p>
            </address>
          </div>

          <div>
            <h2 class="text-[12px] font-bold uppercase tracking-[0.2em] text-sage">Portal</h2>
            <ul class="mt-3 text-[14px] text-white/65">
              <li><NuxtLink to="/layanan" class="inline-flex min-h-[44px] items-center transition hover:text-white">Katalog Layanan</NuxtLink></li>
              <li><NuxtLink to="/layanan" class="inline-flex min-h-[44px] items-center transition hover:text-white">Ajukan Layanan</NuxtLink></li>
              <li><NuxtLink to="/lacak" class="inline-flex min-h-[44px] items-center transition hover:text-white">Lacak Permohonan</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h2 class="text-[12px] font-bold uppercase tracking-[0.2em] text-sage">Informasi</h2>
            <ul class="mt-3 text-[14px] text-white/65">
              <li><NuxtLink to="/tentang" class="inline-flex min-h-[44px] items-center transition hover:text-white">Tentang Kami</NuxtLink></li>
              <li><NuxtLink to="/ekosistem-digital" class="inline-flex min-h-[44px] items-center transition hover:text-white">Ekosistem Digital</NuxtLink></li>
              <li><NuxtLink to="/dokumen" class="inline-flex min-h-[44px] items-center transition hover:text-white">Panduan & Dokumen</NuxtLink></li>
              <li><NuxtLink to="/publikasi" class="inline-flex min-h-[44px] items-center transition hover:text-white">Publikasi</NuxtLink></li>
            </ul>
            <NuxtLink to="/layanan" class="mt-4 inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-sage transition hover:text-white">
              Mulai permohonan <ArrowUpRight :size="13" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>

        <div class="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-[12px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {{ new Date().getFullYear() }} {{ settings.universityName }}. Hak cipta dilindungi.</p>
          <div class="flex flex-wrap gap-4">
            <NuxtLink to="/dokumen" class="inline-flex min-h-[44px] items-center transition hover:text-white">Kebijakan & Panduan</NuxtLink>
          </div>
        </div>
      </div>
    </footer>

    <ToastHost />
  </div>
</template>

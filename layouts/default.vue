<script setup lang="ts">
import { ChevronDown, LogOut, Menu, Search, ShieldCheck, X } from 'lucide-vue-next'

const route = useRoute()
const { settings, ensureSite } = useSite()
const { user, fetchSession, logout, isStaff } = useAuth()
const { formatDate } = useFormat()
const mobileOpen = ref(false)
const userMenuOpen = ref(false)
const userMenu = ref<HTMLElement | null>(null)

const navigation = [
  { label: 'Beranda', to: '/' },
  { label: 'Tentang Kami', to: '/tentang' },
  { label: 'Layanan Digital', to: '/layanan' },
  { label: 'Ekosistem Digital', to: '/ekosistem-digital' },
  { label: 'Panduan & Dokumen', to: '/dokumen' },
  { label: 'Publikasi', to: '/publikasi' }
]

await useAsyncData('layout-bootstrap', async () => {
  await Promise.all([ensureSite(), fetchSession()])
  return true
})

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
const initials = computed(() =>
  (user.value?.name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
)

function closeMobile() {
  mobileOpen.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (!userMenuOpen.value) return
  if (userMenu.value && !userMenu.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

watch(mobileOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
    userMenuOpen.value = false
  }
)

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
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
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:bg-charcoal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      Lewati ke konten utama
    </a>

    <DevSeedNotice />

    <header class="sticky top-0 z-50 border-b border-line-warm/90 bg-ivory/95 backdrop-blur-md">
      <div class="hidden border-b border-line-warm/70 bg-charcoal text-white/70 lg:block">
        <div class="page-shell flex h-8 items-center justify-between text-[11px]">
          <p class="tracking-wide">Portal Layanan Digital · Universitas Nahdlatul Ulama Yogyakarta</p>
          <div class="flex items-center gap-5">
            <NuxtLink to="/lacak" class="inline-flex items-center gap-1.5 transition hover:text-white">
              <Search :size="11" aria-hidden="true" /> Lacak Permohonan
            </NuxtLink>
            <NuxtLink v-if="user" to="/permohonan-saya" class="transition hover:text-white">Permohonan Saya</NuxtLink>
          </div>
        </div>
      </div>

      <div class="page-shell flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
        <AppLogo />

        <nav class="hidden items-center gap-0.5 xl:flex" aria-label="Navigasi utama">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="relative rounded-lg px-3 py-2 text-[12.5px] font-semibold transition hover:bg-charcoal/5"
            :class="isActive(item.to) ? 'text-charcoal' : 'text-ink-muted hover:text-charcoal'"
          >
            {{ item.label }}
            <span v-if="isActive(item.to)" class="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-gold" aria-hidden="true" />
          </NuxtLink>
        </nav>

        <div class="hidden items-center gap-3 md:flex">
          <div v-if="user" ref="userMenu" class="relative">
            <button
              type="button"
              class="flex min-h-[44px] items-center gap-2 rounded-xl border border-line-warm bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold transition hover:border-charcoal/30"
              :aria-expanded="userMenuOpen"
              aria-haspopup="menu"
              @click.stop="userMenuOpen = !userMenuOpen"
            >
              <span class="grid h-8 w-8 place-items-center rounded-lg bg-charcoal text-[11px] font-bold text-white">{{ initials }}</span>
              <span class="hidden max-w-[100px] truncate text-xs xl:block">{{ user.name.split(' ')[0] }}</span>
              <ChevronDown :size="14" class="text-ink-muted" aria-hidden="true" />
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
                class="absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-xl border border-line-warm bg-white p-2 shadow-soft"
                role="menu"
              >
                <div class="border-b border-line-warm px-3 pb-3 pt-2">
                  <p class="truncate text-sm font-semibold">{{ user.name }}</p>
                  <p class="mt-0.5 truncate text-[11px] text-ink-muted">{{ user.email }}</p>
                </div>
                <NuxtLink to="/permohonan-saya" class="mt-1 flex min-h-[42px] items-center rounded-lg px-3 text-sm font-medium transition hover:bg-ivory" role="menuitem">
                  Permohonan Saya
                </NuxtLink>
                <NuxtLink to="/lacak" class="flex min-h-[42px] items-center rounded-lg px-3 text-sm font-medium transition hover:bg-ivory" role="menuitem">
                  Lacak Permohonan
                </NuxtLink>
                <NuxtLink v-if="isStaff" to="/admin" class="flex min-h-[42px] items-center gap-2 rounded-lg px-3 text-sm font-medium transition hover:bg-ivory" role="menuitem">
                  <ShieldCheck :size="15" aria-hidden="true" /> Dashboard Admin
                </NuxtLink>
                <button
                  type="button"
                  class="flex min-h-[42px] w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
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
            class="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
          >
            Masuk
          </NuxtLink>
          <AppButton to="/layanan" size="sm" class="whitespace-nowrap">Ajukan Layanan</AppButton>
        </div>

        <button
          type="button"
          class="grid h-11 w-11 place-items-center rounded-xl border border-line-warm bg-white text-charcoal transition hover:border-charcoal/30 md:hidden"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-navigation"
          aria-label="Buka menu navigasi"
          @click="mobileOpen = true"
        >
          <Menu :size="20" aria-hidden="true" />
        </button>
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
        <div v-if="mobileOpen" id="mobile-navigation" class="fixed inset-0 z-[90] bg-ivory md:hidden">
          <div class="flex h-full flex-col">
            <div class="flex h-[68px] items-center justify-between border-b border-line-warm px-5">
              <AppLogo />
              <button
                type="button"
                class="grid h-11 w-11 place-items-center rounded-xl border border-line-warm bg-white"
                aria-label="Tutup menu navigasi"
                @click="closeMobile"
              >
                <X :size="20" aria-hidden="true" />
              </button>
            </div>
            <nav class="flex-1 overflow-y-auto px-5 py-6" aria-label="Navigasi mobile">
              <ul class="space-y-1">
                <li v-for="(item, index) in navigation" :key="item.to">
                  <NuxtLink
                    :to="item.to"
                    class="flex min-h-[52px] items-center justify-between rounded-xl px-4 text-base font-semibold transition"
                    :class="isActive(item.to) ? 'bg-charcoal text-white' : 'hover:bg-charcoal/5'"
                  >
                    <span><span class="mr-3 text-[10px] font-bold text-gold">0{{ index + 1 }}</span>{{ item.label }}</span>
                    <span v-if="isActive(item.to)" class="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                  </NuxtLink>
                </li>
              </ul>
              <div class="my-6 h-px bg-line-warm" />
              <div class="grid gap-2.5">
                <AppButton to="/lacak" variant="secondary" block @click="closeMobile">Lacak Permohonan</AppButton>
                <template v-if="user">
                  <AppButton to="/permohonan-saya" variant="secondary" block @click="closeMobile">Permohonan Saya</AppButton>
                  <AppButton v-if="isStaff" to="/admin" variant="secondary" block @click="closeMobile">Dashboard Admin</AppButton>
                  <button type="button" class="min-h-[44px] text-sm font-semibold text-red-700" @click="logout">Keluar</button>
                </template>
                <AppButton v-else to="/masuk" variant="secondary" block @click="closeMobile">Masuk</AppButton>
                <AppButton to="/layanan" block @click="closeMobile">Ajukan Layanan</AppButton>
              </div>
              <div class="mt-8 rounded-xl border border-line-warm bg-white p-4">
                <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-dark">Kontak</p>
                <p v-if="settings.contactEmail" class="mt-2 break-all text-xs text-ink-muted">{{ settings.contactEmail }}</p>
                <p v-else class="mt-2 text-xs text-ink-muted">Kontak resmi belum dikonfigurasi.</p>
              </div>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>

    <main id="main-content" class="flex-1">
      <slot />
    </main>

    <footer class="mt-auto bg-charcoal text-white">
      <div class="page-shell pb-8 pt-14 lg:pt-16">
        <div class="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
          <div>
            <AppLogo inverse />
            <p class="mt-5 max-w-sm text-sm leading-7 text-white/60">
              {{ settings.description || 'Direktorat yang mengembangkan ekosistem digital terintegrasi dan layanan teknologi informasi Universitas Nahdlatul Ulama Yogyakarta.' }}
            </p>
            <div v-if="settings.socials.length" class="mt-5 flex flex-wrap gap-2">
              <a
                v-for="social in settings.socials"
                :key="social.url"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-gold hover:text-white"
              >
                {{ social.label }}
              </a>
            </div>
          </div>

          <div>
            <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Layanan</h2>
            <ul class="mt-4 space-y-2.5 text-sm text-white/65">
              <li><NuxtLink to="/layanan" class="inline-flex min-h-[44px] items-center transition hover:text-white">Katalog Layanan</NuxtLink></li>
              <li><NuxtLink to="/layanan" class="inline-flex min-h-[44px] items-center transition hover:text-white">Ajukan Layanan</NuxtLink></li>
              <li><NuxtLink to="/lacak" class="inline-flex min-h-[44px] items-center transition hover:text-white">Lacak Permohonan</NuxtLink></li>
              <li><NuxtLink to="/permohonan-saya" class="inline-flex min-h-[44px] items-center transition hover:text-white">Permohonan Saya</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Informasi</h2>
            <ul class="mt-4 space-y-2.5 text-sm text-white/65">
              <li><NuxtLink to="/tentang" class="inline-flex min-h-[44px] items-center transition hover:text-white">Tentang Kami</NuxtLink></li>
              <li><NuxtLink to="/ekosistem-digital" class="inline-flex min-h-[44px] items-center transition hover:text-white">Ekosistem Digital</NuxtLink></li>
              <li><NuxtLink to="/dokumen" class="inline-flex min-h-[44px] items-center transition hover:text-white">Panduan & Dokumen</NuxtLink></li>
              <li><NuxtLink to="/publikasi" class="inline-flex min-h-[44px] items-center transition hover:text-white">Publikasi</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h2 class="text-[10px] font-bold uppercase tracking-[0.2em] text-sage">Kontak</h2>
            <address class="mt-4 space-y-2.5 text-sm not-italic leading-6 text-white/65">
              <p v-if="settings.address">{{ settings.address }}</p>
              <p v-if="settings.contactPhone">{{ settings.contactPhone }}</p>
              <p v-if="settings.contactEmail">
                <a :href="`mailto:${settings.contactEmail}`" class="break-all transition hover:text-white">{{ settings.contactEmail }}</a>
              </p>
              <p v-if="!settings.address && !settings.contactPhone && !settings.contactEmail" class="text-white/40">
                Informasi kontak belum dikonfigurasi.
              </p>
            </address>
            <div class="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/55">
              <span class="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
              Portal aktif · {{ formatDate(new Date()) }}
            </div>
          </div>
        </div>

        <div class="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {{ new Date().getFullYear() }} {{ settings.universityName }}. Hak cipta dilindungi.</p>
          <div class="flex flex-wrap gap-4">
            <NuxtLink to="/dokumen" class="inline-flex min-h-[44px] items-center transition hover:text-white">Kebijakan & Panduan</NuxtLink>
            <NuxtLink to="/masuk" class="inline-flex min-h-[44px] items-center transition hover:text-white">Akses Terbatas</NuxtLink>
          </div>
        </div>
      </div>
    </footer>

    <ToastHost />
  </div>
</template>

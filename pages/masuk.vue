<script setup lang="ts">
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-vue-next'

definePageMeta({ middleware: 'guest' })

const route = useRoute()
const { login, isStaff } = useAuth()
const { settings } = useSite()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const safeRedirect = computed(() => {
  const target = String(route.query.redirect || '')
  return target.startsWith('/') && !target.startsWith('//') ? target : ''
})

async function submit() {
  errorMessage.value = ''
  if (!email.value || !password.value) {
    errorMessage.value = 'Email dan kata sandi wajib diisi.'
    return
  }
  loading.value = true
  try {
    const user = await login(email.value.trim().toLowerCase(), password.value)
    const destination = safeRedirect.value || (['admin', 'superadmin'].includes(user.role) ? '/admin' : '/permohonan-saya')
    await navigateTo(destination)
  } catch (error: any) {
    errorMessage.value =
      error?.data?.statusMessage || 'Tidak dapat masuk. Periksa email dan kata sandi Anda.'
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Masuk', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="bg-ivory">
    <div class="page-shell grid min-h-[calc(100vh-180px)] gap-10 py-10 lg:grid-cols-[1fr_460px] lg:items-center lg:py-16">
      <div class="hidden lg:block">
        <p class="eyebrow"><span class="h-px w-6 bg-current" aria-hidden="true" />Akses terbatas</p>
        <h1 class="display-1 mt-5 max-w-2xl">Satu akun untuk layanan digital kampus.</h1>
        <p class="body-lg mt-6 max-w-xl">Masuk untuk mengajukan layanan, melengkapi data, memantau status, dan berkomunikasi dengan petugas dalam satu ruang kerja.</p>

        <div class="mt-10 grid max-w-xl gap-3">
          <div class="flex gap-3.5 rounded-xl border border-line-warm bg-white p-4">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sage-soft"><ShieldCheck :size="17" aria-hidden="true" /></span>
            <div><p class="text-sm font-semibold">Akses sesuai peran</p><p class="mt-1 text-xs leading-5 text-ink-muted">Pemohon hanya dapat membaca permohonannya sendiri. Petugas mengakses sesuai izin.</p></div>
          </div>
          <div class="flex gap-3.5 rounded-xl border border-line-warm bg-white p-4">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sage-soft"><LockKeyhole :size="17" aria-hidden="true" /></span>
            <div><p class="text-sm font-semibold">Kredensial tidak dikirim lewat email</p><p class="mt-1 text-xs leading-5 text-ink-muted">Aktivasi menggunakan tautan sekali pakai dengan masa berlaku terbatas.</p></div>
          </div>
        </div>
      </div>

      <div class="mx-auto w-full max-w-[460px]">
        <div class="rounded-3xl border border-line-warm bg-white p-6 shadow-card sm:p-8">
          <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-dark"><LockKeyhole :size="13" aria-hidden="true" />Masuk ke portal</div>
          <h2 class="mt-3 text-2xl font-semibold">Selamat datang kembali</h2>
          <p class="mt-1.5 text-sm leading-6 text-ink-muted">Gunakan akun yang telah diaktifkan administrator.</p>

          <div v-if="errorMessage" class="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-5 text-red-900" role="alert">
            <AlertCircle :size="15" class="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{{ errorMessage }}</p>
          </div>

          <form class="mt-6 space-y-4" @submit.prevent="submit">
            <div>
              <label for="login-email" class="field-label">Email</label>
              <div class="relative">
                <Mail :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                <input id="login-email" v-model="email" type="email" autocomplete="username" required class="field-input pl-10" placeholder="nama@email.ac.id" :disabled="loading" />
              </div>
            </div>
            <div>
              <label for="login-password" class="field-label">Kata sandi</label>
              <div class="relative">
                <LockKeyhole :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  class="field-input px-10"
                  placeholder="Masukkan kata sandi"
                  :disabled="loading"
                />
                <button type="button" class="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-ink-muted hover:bg-ivory" :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPassword = !showPassword">
                  <EyeOff v-if="showPassword" :size="16" aria-hidden="true" />
                  <Eye v-else :size="16" aria-hidden="true" />
                </button>
              </div>
            </div>

            <AppButton type="submit" :loading="loading" size="lg" block>
              Masuk
              <template #right><ArrowRight :size="16" /></template>
            </AppButton>
          </form>

          <p class="mt-5 text-center text-xs leading-5 text-ink-muted">
            Belum memiliki akun? Akun dibuat dan diaktifkan oleh administrator direktorat.
          </p>
        </div>

        <div v-if="settings.devSeedMode" class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900">Akun contoh pengembangan</p>
          <div class="mt-2 grid gap-1.5 text-xs leading-5 text-amber-950">
            <p><span class="font-semibold">Superadmin:</span> superadmin@digital.unu.local / Admin#Unu2026</p>
            <p><span class="font-semibold">Pemohon:</span> pemohon@digital.unu.local / Pemohon#2026</p>
          </div>
          <p class="mt-2 text-[10px] leading-4 text-amber-800">Hanya untuk lingkungan pengembangan. Nonaktifkan mode seed dan ganti kredensial sebelum produksi.</p>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3 text-xs">
          <NuxtLink to="/lacak" class="font-semibold underline-offset-4 hover:text-gold-dark hover:underline">Lacak tanpa masuk</NuxtLink>
          <NuxtLink to="/" class="text-ink-muted hover:text-charcoal">Kembali ke beranda</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

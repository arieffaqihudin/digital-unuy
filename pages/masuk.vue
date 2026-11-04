<script setup lang="ts">
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-vue-next'

definePageMeta({ middleware: 'guest', layout: 'auth' })

const route = useRoute()
const { login } = useAuth()
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
    await login(email.value.trim().toLowerCase(), password.value)
    const destination = safeRedirect.value || '/admin'
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
  <div class="w-full">
    <p class="text-[12px] font-semibold uppercase tracking-[0.15em] text-unu-green">Portal Layanan Digital</p>
    <h1 class="mt-3 text-[30px] font-bold leading-[1.2] tracking-[-0.03em] text-admin-text sm:text-[32px]">Selamat Datang</h1>
    <p class="mt-3 text-[15px] leading-[1.65] text-slate-500">
      Masuk untuk mengelola layanan, memproses permohonan, dan mengelola konten website.
    </p>

    <div
      v-if="errorMessage"
      class="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-[13px] leading-[1.55] text-red-900"
      role="alert"
    >
      <AlertCircle :size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{{ errorMessage }}</p>
    </div>

    <form class="mt-7 space-y-5" @submit.prevent="submit">
      <div>
        <label for="login-email" class="field-label">Email</label>
        <div class="relative">
          <Mail :size="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="username"
            inputmode="email"
            required
            class="field-input border-admin-border pl-11"
            placeholder="nama@email.ac.id"
            :disabled="loading"
          />
        </div>
      </div>

      <div>
        <label for="login-password" class="field-label">Kata sandi</label>
        <div class="relative">
          <LockKeyhole :size="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            class="field-input border-admin-border px-11"
            placeholder="Masukkan kata sandi"
            :disabled="loading"
          />
          <button
            type="button"
            class="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-admin-sidebar hover:text-admin-text"
            :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="17" aria-hidden="true" />
            <Eye v-else :size="17" aria-hidden="true" />
          </button>
        </div>
      </div>

      <AppButton type="submit" :loading="loading" size="lg" block class="mt-2">
        Masuk
        <template #right><ArrowRight :size="17" aria-hidden="true" /></template>
      </AppButton>
    </form>

    <p class="mt-5 text-center text-[13px] leading-[1.55] text-slate-500">
      Portal ini khusus administrator dan petugas direktorat.
    </p>

    <div class="mt-8 border-t border-admin-border pt-5">
      <NuxtLink
        to="/"
        class="inline-flex min-h-[44px] items-center gap-2 text-[14px] font-medium text-slate-500 transition hover:text-unu-green"
      >
        <ArrowLeft :size="15" aria-hidden="true" />
        Kembali ke Beranda
      </NuxtLink>
    </div>
  </div>
</template>

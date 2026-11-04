<script setup lang="ts">
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-vue-next'

const route = useRoute()
const token = computed(() => String(route.query.token || ''))
const password = ref('')
const confirm = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const success = ref(false)
const activatedRole = ref('pemohon')
const api = useApi()
const { fetchSession } = useAuth()

async function submit() {
  errorMessage.value = ''
  if (password.value.length < 10 || !/[A-Za-z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    errorMessage.value = 'Kata sandi minimal 10 karakter dan harus memuat huruf serta angka.'
    return
  }
  if (password.value !== confirm.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak sama.'
    return
  }
  loading.value = true
  try {
    const result = await api<{ user: { role: string } }>('/api/auth/activate', {
      method: 'POST',
      body: { token: token.value, password: password.value }
    })
    activatedRole.value = result.user.role
    await fetchSession(true)
    success.value = true
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Aktivasi gagal. Tautan mungkin sudah kedaluwarsa.'
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Aktivasi Akun', robots: 'noindex, nofollow' })
</script>

<template>
  <div class="bg-ivory">
    <div class="page-shell flex min-h-[calc(100vh-180px)] items-center justify-center py-12">
      <div class="w-full max-w-lg">
        <div class="rounded-3xl border border-line-warm bg-white p-6 shadow-card sm:p-8">
          <template v-if="success">
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-unu-green-soft text-unu-green"><CheckCircle2 :size="27" aria-hidden="true" /></span>
            <h1 class="mt-5 text-2xl font-semibold">Akun berhasil diaktifkan</h1>
            <p class="mt-2 text-sm leading-6 text-ink-muted">Kata sandi telah dibuat dan sesi Anda sudah aktif. Tautan aktivasi tidak dapat digunakan lagi.</p>
            <AppButton :to="activatedRole === 'admin' || activatedRole === 'superadmin' ? '/admin' : '/permohonan-saya'" size="lg" block class="mt-6">
              Lanjut ke portal <template #right><ArrowRight :size="16" /></template>
            </AppButton>
          </template>

          <template v-else-if="!token">
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-700"><AlertCircle :size="26" aria-hidden="true" /></span>
            <h1 class="mt-5 text-2xl font-semibold">Tautan aktivasi tidak ditemukan</h1>
            <p class="mt-2 text-sm leading-6 text-ink-muted">Buka tautan aktivasi langsung dari email yang dikirim administrator. Jangan membuat tautan secara manual.</p>
            <AppButton to="/masuk" variant="secondary" class="mt-6">Kembali ke halaman masuk</AppButton>
          </template>

          <template v-else>
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-unu-green-soft text-unu-green"><KeyRound :size="26" aria-hidden="true" /></span>
            <h1 class="mt-5 text-2xl font-semibold">Aktivasi akun</h1>
            <p class="mt-2 text-sm leading-6 text-ink-muted">Buat kata sandi baru. Tautan ini hanya dapat digunakan satu kali dan memiliki masa berlaku.</p>

            <div v-if="errorMessage" class="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-5 text-red-900" role="alert">
              <AlertCircle :size="15" class="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{{ errorMessage }}</p>
            </div>

            <form class="mt-6 space-y-4" @submit.prevent="submit">
              <div>
                <label for="activation-password" class="field-label">Kata sandi baru</label>
                <div class="relative">
                  <LockKeyhole :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                  <input id="activation-password" v-model="password" :type="showPassword ? 'text' : 'password'" required autocomplete="new-password" class="field-input px-10" placeholder="Minimal 10 karakter" />
                  <button type="button" class="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-ink-muted hover:bg-ivory" :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPassword = !showPassword">
                    <EyeOff v-if="showPassword" :size="16" aria-hidden="true" />
                    <Eye v-else :size="16" aria-hidden="true" />
                  </button>
                </div>
                <p class="field-help">Minimal 10 karakter, memuat huruf dan angka. Jangan gunakan kata sandi yang sama dengan layanan lain.</p>
              </div>
              <div>
                <label for="activation-confirm" class="field-label">Ulangi kata sandi</label>
                <input id="activation-confirm" v-model="confirm" :type="showPassword ? 'text' : 'password'" required autocomplete="new-password" class="field-input" placeholder="Ulangi kata sandi" />
              </div>
              <AppButton type="submit" :loading="loading" size="lg" block>Aktifkan akun <template #right><ArrowRight :size="16" /></template></AppButton>
            </form>
            <p class="mt-5 text-center text-[14px] leading-5 text-ink-muted">Masalah dengan tautan? Hubungi administrator direktorat untuk mengirim ulang undangan.</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

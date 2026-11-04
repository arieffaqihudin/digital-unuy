<script setup lang="ts">
const { settings, ensureSite } = useSite()

await useAsyncData('auth-layout-site', async () => {
  await ensureSite()
  return true
})
</script>

<template>
  <div class="min-h-[100dvh] bg-white text-admin-text [color-scheme:light]">
    <div class="grid min-h-[100dvh] md:grid-cols-2">
      <section class="relative overflow-hidden border-b border-admin-border bg-admin-sidebar md:border-b-0 md:border-r">
        <div class="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#DDEBE1]/70" aria-hidden="true" />
        <div class="pointer-events-none absolute -bottom-36 -left-28 h-80 w-80 rounded-full bg-[#ECE6D5]/70" aria-hidden="true" />

        <svg
          class="pointer-events-none absolute bottom-0 right-0 h-[62%] w-[72%] text-unu-green"
          viewBox="0 0 500 420"
          fill="none"
          aria-hidden="true"
        >
          <path d="M58 420V196C58 105 131 32 222 32C313 32 386 105 386 196V420" stroke="currentColor" stroke-opacity=".12" />
          <path d="M108 420V207C108 135 168 74 240 74C312 74 372 135 372 207V420" stroke="#BF8B15" stroke-opacity=".22" />
          <path d="M158 420V225C158 177 195 140 243 140C291 140 328 177 328 225V420" fill="currentColor" fill-opacity=".06" />
          <path d="M18 420H482" stroke="currentColor" stroke-opacity=".12" />
          <circle cx="240" cy="22" r="3.5" fill="#BF8B15" />
        </svg>

        <div class="relative flex h-full flex-col p-5 sm:p-7 md:min-h-[100dvh] md:p-9 lg:p-12 xl:p-14">
          <div class="flex items-center gap-3.5">
            <img src="/unu-logo.png" alt="Logo Universitas Nahdlatul Ulama Yogyakarta" class="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14" />
            <div>
              <p class="text-[13px] font-bold uppercase leading-tight tracking-[0.08em] text-unu-green">UNU Yogyakarta</p>
              <p class="mt-1 text-[13px] font-medium leading-snug text-slate-500 sm:text-[14px]">Direktorat Tim Transformasi Digital</p>
            </div>
          </div>

          <div class="mt-7 max-w-[520px] sm:mt-9 md:my-auto md:mt-0">
            <p class="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-unu-green">
              <span class="h-px w-6 bg-current" aria-hidden="true" />
              Portal Layanan Digital
            </p>
            <h1 class="mt-4 max-w-[500px] text-[1.7rem] font-bold leading-[1.18] tracking-[-0.03em] text-admin-text sm:text-[2.35rem] lg:text-[2.75rem] xl:text-[3rem]">
              Transformasi Digital untuk UNU Yogyakarta
            </h1>
            <p class="mt-5 hidden max-w-[460px] text-[16px] leading-[1.7] text-slate-500 sm:block">
              Menghadirkan layanan dan ekosistem digital yang terintegrasi untuk mendukung seluruh aktivitas universitas.
            </p>
          </div>

          <div class="mt-8 hidden items-center gap-3 border-t border-admin-border pt-5 text-[12px] text-slate-400 md:flex">
            <span class="h-1.5 w-1.5 rounded-full bg-unu-green" aria-hidden="true" />
            <span>Satu pintu layanan teknologi informasi</span>
          </div>
        </div>
      </section>

      <section class="flex min-h-[calc(100dvh-252px)] bg-white md:min-h-[100dvh]">
        <div class="mx-auto flex w-full max-w-[420px] flex-col justify-center px-5 py-10 sm:px-8 md:px-7 lg:px-10 lg:py-12">
          <slot />
        </div>
      </section>
    </div>
    <ToastHost />
  </div>
</template>

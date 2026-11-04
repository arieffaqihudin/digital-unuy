<script setup lang="ts">
withDefaults(
  defineProps<{
    serviceCount?: number
    platformCount?: number
  }>(),
  { serviceCount: 0, platformCount: 0 }
)
</script>

<template>
  <figure
    class="relative aspect-[5/6] w-full overflow-hidden rounded-[28px] border border-charcoal/10 bg-[#ECE6D5]"
    role="img"
    aria-label="Ilustrasi editorial gerbang kampus dan jaringan layanan digital UNU Yogyakarta"
  >
    <div class="absolute inset-0 paper-grid opacity-60" aria-hidden="true" />

    <svg viewBox="0 0 500 600" class="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
      <path d="M64 512V238C64 143 147 68 250 68C353 68 436 143 436 238V512" stroke="#1C1A1A" stroke-opacity=".14" />
      <path d="M98 512V250C98 166 166 104 250 104C334 104 402 166 402 250V512" stroke="#BF8B15" stroke-opacity=".55" />
      <path d="M142 512V266C142 198 190 152 250 152C310 152 358 198 358 266V512" fill="#337449" />
      <path d="M178 512V280C178 234 209 202 250 202C291 202 322 234 322 280V512" fill="#ECE6D5" />
      <path d="M250 202V512" stroke="#1C1A1A" stroke-opacity=".16" stroke-dasharray="4 6" />
      <path d="M64 512H436" stroke="#1C1A1A" stroke-opacity=".22" />
      <path d="M44 532H456" stroke="#1C1A1A" stroke-opacity=".1" />
      <circle cx="250" cy="38" r="4" fill="#BF8B15" />
      <path d="M250 20V56M232 38H268" stroke="#BF8B15" stroke-width="1.2" />
      <path d="M72 414C124 386 170 405 202 442" stroke="#FAF8ED" stroke-opacity=".32" stroke-dasharray="3 7" />
      <path d="M428 344C384 374 366 414 362 470" stroke="#FAF8ED" stroke-opacity=".28" stroke-dasharray="3 7" />
      <circle cx="72" cy="414" r="3" fill="#FAF8ED" />
      <circle cx="428" cy="344" r="3" fill="#FAF8ED" />
      <path d="M0 548H500" stroke="#1C1A1A" stroke-opacity=".08" />
      <path d="M0 566H500" stroke="#1C1A1A" stroke-opacity=".06" />
    </svg>

    <div class="absolute left-5 top-5 flex items-center gap-2.5">
      <span class="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 bg-ivory/80 text-[12px] font-bold">TD</span>
      <div>
        <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-charcoal/60">UNU Yogyakarta</p>
        <p class="text-[14px] font-semibold text-charcoal">Transformasi Digital</p>
      </div>
    </div>

    <figcaption class="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
      <div class="max-w-[260px]">
        <p class="text-[12px] font-bold uppercase tracking-[0.2em] text-charcoal/55">Satu pintu layanan</p>
        <p class="mt-2 text-xl font-semibold leading-tight tracking-[-0.03em] text-charcoal">
          Ekosistem digital untuk kampus.
        </p>
      </div>
      <span class="mb-1 hidden h-8 w-8 shrink-0 rounded-full border border-charcoal/15 sm:block" aria-hidden="true">
        <span class="m-2 block h-4 w-4 rounded-full bg-gold" />
      </span>
    </figcaption>
  </figure>
</template>

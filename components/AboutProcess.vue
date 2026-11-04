<script setup lang="ts">
const steps = [
  { number: '01', title: 'Memahami', text: 'Memetakan kebutuhan pengguna dan proses kampus.' },
  { number: '02', title: 'Membangun', text: 'Mengembangkan solusi yang sesuai dengan kebutuhan nyata.' },
  { number: '03', title: 'Mengimplementasikan', text: 'Mendampingi penerapan teknologi dalam aktivitas sehari-hari.' },
  { number: '04', title: 'Mengevaluasi', text: 'Mengukur penggunaan, hasil, dan kebutuhan perbaikan.' }
]
</script>

<template>
  <div class="relative">
    <div class="absolute bottom-2 left-3 top-3 w-px bg-charcoal/15 lg:hidden" aria-hidden="true" />
    <div class="absolute left-0 right-0 top-3 hidden h-px bg-charcoal/15 lg:block" aria-hidden="true" />

    <ol class="grid gap-9 lg:grid-cols-4 lg:gap-8">
      <li v-for="(step, index) in steps" :key="step.number" v-reveal="index * 80" class="relative pl-10 lg:pl-0 lg:pt-9">
        <span class="absolute left-0 top-1 grid h-6 w-6 place-items-center rounded-full border border-gold bg-ivory lg:top-0" aria-hidden="true">
          <span class="h-1.5 w-1.5 rounded-full bg-gold" />
        </span>
        <p class="text-[36px] font-semibold leading-none tracking-[-0.04em] text-charcoal sm:text-[42px]">{{ step.number }}</p>
        <h3 class="mt-3 text-[20px] font-semibold leading-6 tracking-[-0.02em]">{{ step.title }}</h3>
        <p class="mt-2 max-w-[260px] text-[15px] leading-6 text-slate-600">{{ step.text }}</p>
      </li>
    </ol>
  </div>
</template>

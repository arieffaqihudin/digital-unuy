<script setup lang="ts">
definePageMeta({ layout: 'admin' })
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Pengelolaan</p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight">Tambah Layanan</h2>
      <p class="mt-1 text-sm text-admin-muted">Buat layanan baru, susun formulir, lalu publikasikan setelah siap.</p>
    </div>
    <ServiceEditor />
  </div>
</template>

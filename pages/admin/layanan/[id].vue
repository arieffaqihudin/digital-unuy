<script setup lang="ts">
const route = useRoute()
definePageMeta({ layout: 'admin' })
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="text-[12px] font-bold uppercase tracking-[0.18em] text-unu-green">Pengelolaan</p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight">Edit Layanan</h2>
      <p class="mt-1 text-sm text-admin-muted">Ubah metadata, formulir, dan dokumen terkait layanan.</p>
    </div>
    <ServiceEditor :service-id="String(route.params.id)" />
  </div>
</template>

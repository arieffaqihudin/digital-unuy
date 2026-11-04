<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import type { FieldOption, FieldType, FormField } from '~/shared/types'
import { FIELD_TYPES } from '~/shared/types'

const props = defineProps<{ modelValue: FormField[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: FormField[]] }>()
const local = ref<FormField[]>([])
let syncing = false

const clone = (value: FormField[]) => JSON.parse(JSON.stringify(value || [])) as FormField[]

watch(
  () => props.modelValue,
  (value) => {
    if (JSON.stringify(value) === JSON.stringify(local.value)) return
    local.value = clone(value)
  },
  { immediate: true, deep: true }
)

watch(
  local,
  (value) => {
    if (JSON.stringify(value) === JSON.stringify(props.modelValue)) return
    emit('update:modelValue', clone(value))
  },
  { deep: true }
)

const mimeOptions = [
  { label: 'PDF', value: 'application/pdf' },
  { label: 'PNG', value: 'image/png' },
  { label: 'JPG/JPEG', value: 'image/jpeg' },
  { label: 'WEBP', value: 'image/webp' },
  { label: 'DOCX', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { label: 'XLSX', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { label: 'ZIP', value: 'application/zip' }
]

function keyFromLabel(label: string, index: number) {
  const base = label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return base || `field_${Date.now()}_${index}`
}

function addField() {
  const order = local.value.length
  local.value.push({
    key: '',
    type: 'text',
    label: 'Field baru',
    placeholder: '',
    helpText: '',
    required: false,
    order,
    minLength: null,
    maxLength: null,
    pattern: '',
    options: [],
    fileMaxMB: 10,
    accept: [],
    showIf: null
  })
}

function removeField(index: number) {
  if (!window.confirm('Hapus field ini dari formulir? Data permohonan lama tetap aman karena menggunakan snapshot formulir.')) return
  local.value.splice(index, 1)
  reorder()
}

function move(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= local.value.length) return
  const [item] = local.value.splice(index, 1)
  local.value.splice(target, 0, item)
  reorder()
}

function reorder() {
  local.value.forEach((field, index) => {
    field.order = index
  })
}

function onLabelInput(field: FormField) {
  if (!field.key) field.key = keyFromLabel(field.label, local.value.indexOf(field))
}

function addOption(field: FormField) {
  field.options = field.options || []
  field.options.push({ label: 'Pilihan baru', value: `pilihan_${field.options.length + 1}` })
}

function removeOption(field: FormField, index: number) {
  field.options?.splice(index, 1)
}

function toggleAccept(field: FormField, mime: string) {
  field.accept = field.accept || []
  if (field.accept.includes(mime)) field.accept = field.accept.filter((item) => item !== mime)
  else field.accept = [...field.accept, mime]
}

function parentOptions(field: FormField) {
  return local.value.filter((item) => item.key && item.key !== field.key && ['select', 'radio', 'text', 'email'].includes(item.type))
}

function keyError(field: FormField) {
  if (!field.key) return 'Key wajib diisi'
  if (!/^[a-z][a-z0-9_]{1,49}$/.test(field.key)) return 'Gunakan huruf kecil, angka, dan garis bawah'
  if (local.value.filter((item) => item.key === field.key).length > 1) return 'Key duplikat'
  return ''
}

const fieldTypeLabel = (type: FieldType) => FIELD_TYPES.find((item) => item.value === type)?.label || type
</script>

<template>
  <div>
    <div class="flex flex-col gap-3 rounded-xl border border-admin-border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm font-semibold">Formulir permohonan</p>
        <p class="mt-0.5 text-[14px] text-admin-muted">Perubahan konfigurasi membuat versi formulir baru. Permohonan lama tetap memakai snapshot saat diajukan.</p>
      </div>
      <AppButton type="button" size="sm" variant="secondary" @click="addField"><template #left><Plus :size="14" /></template>Tambah Field</AppButton>
    </div>

    <div v-if="!local.length" class="mt-3 rounded-xl border border-dashed border-admin-border p-8 text-center text-sm text-admin-muted">
      Belum ada field. Tambahkan minimal satu field agar layanan dapat diaktifkan.
    </div>

    <div class="mt-3 space-y-2">
      <details
        v-for="(field, index) in local"
        :key="index"
        class="group rounded-xl border border-admin-border bg-white"
        :open="index === local.length - 1 && !field.key"
      >
        <summary class="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
          <GripVertical :size="15" class="text-admin-muted/40" aria-hidden="true" />
          <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-unu-green-soft text-[12px] font-bold">{{ index + 1 }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold">{{ field.label || 'Field tanpa label' }} <span v-if="field.required" class="text-red-700">*</span></p>
            <p class="mt-0.5 truncate text-[12px] text-admin-muted">{{ fieldTypeLabel(field.type) }} · {{ field.key || 'key belum diisi' }}</p>
          </div>
          <div class="flex items-center gap-0.5" @click.prevent>
            <button type="button" class="grid h-8 w-8 place-items-center rounded-md text-admin-muted hover:bg-slate-50 disabled:opacity-30" :disabled="index === 0" title="Naikkan" @click="move(index, -1)"><ArrowUp :size="13" /></button>
            <button type="button" class="grid h-8 w-8 place-items-center rounded-md text-admin-muted hover:bg-slate-50 disabled:opacity-30" :disabled="index === local.length - 1" title="Turunkan" @click="move(index, 1)"><ArrowDown :size="13" /></button>
            <button type="button" class="grid h-8 w-8 place-items-center rounded-md text-red-600 hover:bg-red-50" title="Hapus field" @click="removeField(index)"><Trash2 :size="13" /></button>
          </div>
          <ChevronDown :size="14" class="text-admin-muted transition group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div class="grid gap-4 border-t border-admin-border p-4 sm:grid-cols-2">
          <div>
            <label class="admin-label">Label</label>
            <input v-model="field.label" type="text" class="field-input" maxlength="160" @input="onLabelInput(field)" />
          </div>
          <div>
            <label class="admin-label">Key</label>
            <input v-model="field.key" type="text" class="field-input font-mono text-xs" maxlength="50" />
            <p v-if="keyError(field)" class="field-error">{{ keyError(field) }}</p>
            <p v-else class="field-help">Dipakai sebagai nama data. Huruf kecil dan garis bawah.</p>
          </div>
          <div>
            <label class="admin-label">Tipe field</label>
            <select v-model="field.type" class="field-input">
              <option v-for="type in FIELD_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option>
            </select>
          </div>
          <div>
            <label class="admin-label">Urutan</label>
            <input :value="index + 1" type="number" class="field-input" disabled />
          </div>
          <div>
            <label class="admin-label">Placeholder</label>
            <input v-model="field.placeholder" type="text" class="field-input" maxlength="200" :disabled="['checkbox', 'file', 'radio'].includes(field.type)" />
          </div>
          <div>
            <label class="admin-label">Help text</label>
            <input v-model="field.helpText" type="text" class="field-input" maxlength="400" />
          </div>

          <div class="flex items-center gap-4 sm:col-span-2">
            <label class="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
              <input v-model="field.required" type="checkbox" class="h-4 w-4 accent-unu-green" /> Wajib diisi
            </label>
            <span class="text-[14px] text-admin-muted">Pola validasi hanya untuk field teks.</span>
          </div>

          <template v-if="['text', 'textarea', 'email'].includes(field.type)">
            <div>
              <label class="admin-label">Minimal karakter</label>
              <input v-model.number="field.minLength" type="number" min="0" class="field-input" />
            </div>
            <div>
              <label class="admin-label">Maksimal karakter</label>
              <input v-model.number="field.maxLength" type="number" min="1" max="10000" class="field-input" />
            </div>
            <div class="sm:col-span-2">
              <label class="admin-label">Pola regex <span class="font-normal normal-case text-admin-muted">(opsional)</span></label>
              <input v-model="field.pattern" type="text" class="field-input font-mono text-xs" maxlength="200" placeholder="Contoh: ^[0-9]{8}$" />
            </div>
          </template>

          <template v-if="['select', 'radio'].includes(field.type)">
            <div class="sm:col-span-2">
              <div class="flex items-center justify-between">
                <label class="admin-label mb-0">Pilihan</label>
                <button type="button" class="text-[14px] font-semibold text-unu-green hover:underline" @click="addOption(field)">Tambah pilihan</button>
              </div>
              <div class="mt-2 space-y-2">
                <div v-for="(option, optionIndex) in field.options" :key="optionIndex" class="flex gap-2">
                  <input v-model="option.label" type="text" class="field-input flex-1" placeholder="Label pilihan" />
                  <input v-model="option.value" type="text" class="field-input flex-1 font-mono text-xs" placeholder="nilai" />
                  <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-red-600 hover:bg-red-50" @click="removeOption(field, optionIndex)"><Trash2 :size="13" /></button>
                </div>
                <p v-if="!field.options?.length" class="text-[14px] text-admin-muted">Minimal satu pilihan diperlukan untuk select/radio.</p>
              </div>
            </div>
          </template>

          <template v-if="field.type === 'file'">
            <div>
              <label class="admin-label">Batas ukuran (MB)</label>
              <input v-model.number="field.fileMaxMB" type="number" min="1" max="10" class="field-input" />
            </div>
            <div class="sm:col-span-2">
              <label class="admin-label">Tipe file yang diizinkan</label>
              <div class="flex flex-wrap gap-2">
                <label v-for="mime in mimeOptions" :key="mime.value" class="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-admin-border px-3 text-[14px] font-medium">
                  <input type="checkbox" class="h-3.5 w-3.5 accent-unu-green" :checked="field.accept?.includes(mime.value)" @change="toggleAccept(field, mime.value)" />
                  {{ mime.label }}
                </label>
              </div>
              <p class="field-help">Jika tidak dipilih, sistem memakai daftar aman bawaan.</p>
            </div>
          </template>

          <div class="sm:col-span-2">
            <label class="admin-label">Tampilkan hanya jika <span class="font-normal normal-case text-admin-muted">(opsional)</span></label>
            <div class="grid gap-2 sm:grid-cols-[1fr_1fr]">
              <select :value="field.showIf?.fieldKey || ''" class="field-input" @change="field.showIf = ($event.target as HTMLSelectElement).value ? { fieldKey: ($event.target as HTMLSelectElement).value, equals: field.showIf?.equals || '' } : null">
                <option value="">Selalu tampil</option>
                <option v-for="parent in parentOptions(field)" :key="parent.key" :value="parent.key">{{ parent.label }} ({{ parent.key }})</option>
              </select>
              <input v-if="field.showIf?.fieldKey" v-model="field.showIf!.equals" type="text" class="field-input" placeholder="Nilai yang memicu tampil" />
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

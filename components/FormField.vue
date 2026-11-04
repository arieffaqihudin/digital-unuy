<script setup lang="ts">
import { UploadCloud } from 'lucide-vue-next'
import { useId } from 'vue'
import type { FormField } from '~/shared/types'

const props = defineProps<{
  field: FormField
  modelValue: unknown
  error?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
  'update:file': [value: File | null]
}>()

const id = useId()
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.field.helpText) ids.push(`${id}-help`)
  if (props.error) ids.push(`${id}-error`)
  return ids.join(' ') || undefined
})

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')

function update(value: unknown) {
  emit('update:modelValue', value)
}

function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  selectedFileName.value = file?.name || ''
  emit('update:file', file)
}

function clearFile() {
  selectedFileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
  emit('update:file', null)
}

const acceptLabel = computed(() => {
  if (!props.field.accept?.length) return 'PDF, gambar, DOCX, XLSX, atau ZIP'
  return props.field.accept
    .map((mime) => {
      if (mime === 'application/pdf') return 'PDF'
      if (mime === 'image/png') return 'PNG'
      if (mime === 'image/jpeg') return 'JPG'
      if (mime === 'image/webp') return 'WEBP'
      if (mime.includes('wordprocessingml')) return 'DOCX'
      if (mime.includes('spreadsheetml')) return 'XLSX'
      if (mime === 'application/zip') return 'ZIP'
      return mime
    })
    .join(', ')
})
</script>

<template>
  <div>
    <fieldset v-if="field.type === 'radio'" class="min-w-0">
      <legend class="field-label">
        {{ field.label }}
        <span v-if="field.required" class="text-red-700" aria-hidden="true">*</span>
      </legend>
      <div class="grid gap-2 sm:grid-cols-2" :aria-describedby="describedBy">
        <label
          v-for="option in field.options"
          :key="option.value"
          class="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border border-line-warm bg-white px-3.5 py-2.5 text-sm transition hover:border-charcoal/30 has-[:checked]:border-charcoal has-[:checked]:bg-ivory"
        >
          <input
            :id="`${id}-${option.value}`"
            type="radio"
            :name="field.key"
            :value="option.value"
            :checked="String(modelValue ?? '') === option.value"
            :required="field.required"
            :disabled="disabled"
            class="h-4 w-4 accent-unu-green"
            @change="update(option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </fieldset>

    <label v-else-if="field.type === 'checkbox'" class="flex cursor-pointer items-start gap-3 rounded-xl border border-line-warm bg-white p-3.5 transition hover:border-charcoal/30">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue === true || modelValue === 'true'"
        :required="field.required"
        :disabled="disabled"
        class="mt-0.5 h-4 w-4 shrink-0 accent-unu-green"
        :aria-describedby="describedBy"
        :aria-invalid="Boolean(error)"
        @change="update(($event.target as HTMLInputElement).checked)"
      />
      <span class="text-sm leading-6">
        {{ field.label }}
        <span v-if="field.required" class="text-red-700" aria-hidden="true">*</span>
        <span v-if="field.helpText" class="mt-0.5 block text-xs font-normal text-ink-muted">{{ field.helpText }}</span>
      </span>
    </label>

    <div v-else-if="field.type === 'file'">
      <label :for="id" class="field-label">
        {{ field.label }}
        <span v-if="field.required" class="text-red-700" aria-hidden="true">*</span>
      </label>
      <input
        :id="id"
        ref="fileInput"
        type="file"
        class="sr-only"
        :accept="field.accept?.length ? field.accept.join(',') : undefined"
        :required="field.required"
        :disabled="disabled"
        :aria-describedby="describedBy"
        @change="onFile"
      />
      <label
        :for="id"
        class="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-warm bg-white px-4 py-3 transition hover:border-unu-green hover:bg-unu-green-soft"
      >
        <UploadCloud :size="18" class="shrink-0 text-unu-green" aria-hidden="true" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium">{{ selectedFileName || 'Pilih file' }}</span>
          <span class="mt-0.5 block text-[14px] text-ink-muted">{{ acceptLabel }} · maks. {{ field.fileMaxMB || 10 }} MB</span>
        </span>
      </label>
      <button v-if="selectedFileName" type="button" class="mt-1.5 text-xs font-semibold text-red-700 underline-offset-4 hover:underline" @click="clearFile">
        Hapus pilihan file
      </button>
    </div>

    <div v-else>
      <label :for="id" class="field-label">
        {{ field.label }}
        <span v-if="field.required" class="text-red-700" aria-hidden="true">*</span>
      </label>

      <select
        v-if="field.type === 'select'"
        :id="id"
        :value="String(modelValue ?? '')"
        :required="field.required"
        :disabled="disabled"
        class="field-input"
        :aria-describedby="describedBy"
        :aria-invalid="Boolean(error)"
        @change="update(($event.target as HTMLSelectElement).value)"
      >
        <option value="">Pilih {{ field.label.toLowerCase() }}</option>
        <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>

      <textarea
        v-else-if="field.type === 'textarea'"
        :id="id"
        :value="String(modelValue ?? '')"
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="disabled"
        :minlength="field.minLength ?? undefined"
        :maxlength="field.maxLength ?? undefined"
        rows="5"
        class="field-input resize-y"
        :aria-describedby="describedBy"
        :aria-invalid="Boolean(error)"
        @input="update(($event.target as HTMLTextAreaElement).value)"
      />

      <input
        v-else
        :id="id"
        :type="field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'"
        :value="modelValue ?? ''"
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="disabled"
        :minlength="field.minLength ?? undefined"
        :maxlength="field.maxLength ?? undefined"
        :inputmode="field.type === 'number' ? 'numeric' : undefined"
        class="field-input"
        :aria-describedby="describedBy"
        :aria-invalid="Boolean(error)"
        @input="update(($event.target as HTMLInputElement).value)"
      />
    </div>

    <p v-if="field.helpText && field.type !== 'checkbox'" :id="`${id}-help`" class="field-help">{{ field.helpText }}</p>
    <p v-if="error" :id="`${id}-error`" class="field-error" role="alert">
      <span aria-hidden="true">!</span>{{ error }}
    </p>
  </div>
</template>

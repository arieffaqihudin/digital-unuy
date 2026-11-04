import type { FieldType, FormField } from '../../shared/types'
import { FIELD_TYPES } from '../../shared/types'

export interface FieldErrors {
  [key: string]: string
}

const SAFE_KEY = /^[a-z][a-z0-9_]{1,49}$/

export function isVisible(field: FormField, payload: Record<string, unknown>, fields: FormField[]): boolean {
  if (!field.showIf?.fieldKey) return true
  const parent = fields.find((candidate) => candidate.key === field.showIf?.fieldKey)
  if (!parent) return false
  const value = payload[parent.key]
  const normalized = Array.isArray(value) ? value.join(',') : String(value ?? '')
  return normalized === String(field.showIf.equals ?? '')
}

export function validateSubmission(
  fields: FormField[],
  rawPayload: Record<string, unknown>,
  files: Map<string, { originalName: string; mimeType: string; size: number }>
): { data: Record<string, unknown>; errors: FieldErrors } {
  const errors: FieldErrors = {}
  const data: Record<string, unknown> = {}
  const sorted = [...fields].sort((a, b) => a.order - b.order)

  for (const field of sorted) {
    if (!isVisible(field, rawPayload, sorted)) continue

    if (field.type === 'file') {
      const file = files.get(field.key)
      if (field.required && !file) {
        errors[field.key] = `${field.label} wajib dilampirkan.`
        continue
      }
      if (file) {
        const maxMB = Math.min(Math.max(Number(field.fileMaxMB) || 10, 1), 10)
        if (file.size > maxMB * 1024 * 1024) {
          errors[field.key] = `${field.label} melebihi batas ${maxMB} MB.`
        }
        if (field.accept?.length && !field.accept.includes(file.mimeType)) {
          errors[field.key] = `${field.label} harus berupa ${field.accept
            .map((mime) => mime.split('/').pop())
            .join(', ')}.`
        }
      }
      continue
    }

    let value = rawPayload[field.key]
    const empty = value === undefined || value === null || String(value).trim() === ''

    if (field.type === 'checkbox') {
      value = value === true || value === 'true' || value === 'on'
      if (field.required && value !== true) {
        errors[field.key] = `${field.label} wajib disetujui.`
      }
      data[field.key] = Boolean(value)
      continue
    }

    if (empty) {
      if (field.required) errors[field.key] = `${field.label} wajib diisi.`
      else data[field.key] = ''
      continue
    }

    if (field.type === 'number') {
      const number = Number(value)
      if (!Number.isFinite(number)) {
        errors[field.key] = `${field.label} harus berupa angka.`
      } else {
        data[field.key] = number
      }
      continue
    }

    const stringValue = String(value).trim()
    const min = field.minLength ?? 0
    const max = field.maxLength || (field.type === 'textarea' ? 10000 : 5000)

    if (stringValue.length < min) {
      errors[field.key] = `${field.label} minimal ${min} karakter.`
      continue
    }
    if (stringValue.length > max) {
      errors[field.key] = `${field.label} maksimal ${max} karakter.`
      continue
    }

    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(stringValue)) {
      errors[field.key] = `${field.label} harus berupa alamat email yang valid.`
      continue
    }

    if (field.type === 'date') {
      const date = new Date(`${stringValue}T00:00:00`)
      if (Number.isNaN(date.getTime())) {
        errors[field.key] = `${field.label} harus berupa tanggal yang valid.`
        continue
      }
    }

    if (['select', 'radio'].includes(field.type)) {
      const allowed = (field.options || []).map((option) => option.value)
      if (!allowed.includes(stringValue)) {
        errors[field.key] = `${field.label} memiliki pilihan yang tidak valid.`
        continue
      }
    }

    if (field.pattern && field.pattern.length <= 200) {
      try {
        const regex = new RegExp(field.pattern)
        if (!regex.test(stringValue)) {
          errors[field.key] = `${field.label} tidak sesuai format yang diminta.`
          continue
        }
      } catch {
        // Invalid admin patterns are ignored at runtime; admin form validation prevents them.
      }
    }

    data[field.key] = stringValue
  }

  return { data, errors }
}

export function validateFormDefinition(input: unknown): { fields: FormField[]; error?: string } {
  if (!Array.isArray(input) || input.length === 0) {
    return { fields: [], error: 'Formulir harus memiliki minimal satu field.' }
  }
  if (input.length > 60) {
    return { fields: [], error: 'Jumlah field maksimal 60.' }
  }

  const keys = new Set<string>()
  const allowedTypes = FIELD_TYPES.map((item) => item.value)
  const fields: FormField[] = []

  for (let index = 0; index < input.length; index += 1) {
    const raw = input[index] as any
    const key = String(raw?.key || '')
      .trim()
      .toLowerCase()
    if (!SAFE_KEY.test(key)) {
      return {
        fields: [],
        error: `Key field ke-${index + 1} harus huruf kecil, diawali huruf, tanpa spasi (contoh: nama_lengkap).`
      }
    }
    if (keys.has(key)) {
      return { fields: [], error: `Key field "${key}" digunakan lebih dari sekali.` }
    }
    keys.add(key)

    if (!allowedTypes.includes(raw?.type as FieldType)) {
      return { fields: [], error: `Tipe field "${key}" tidak didukung.` }
    }
    if (!String(raw?.label || '').trim()) {
      return { fields: [], error: `Label field "${key}" wajib diisi.` }
    }

    const options = Array.isArray(raw.options)
      ? raw.options
          .map((option: any) => ({
            label: String(option?.label || '').trim(),
            value: String(option?.value || '').trim()
          }))
          .filter((option: any) => option.label && option.value)
      : []

    if (['select', 'radio'].includes(raw.type) && options.length === 0) {
      return { fields: [], error: `Field "${raw.label}" membutuhkan minimal satu pilihan.` }
    }

    let pattern = String(raw.pattern || '')
    if (pattern.length > 200) {
      return { fields: [], error: `Pola validasi "${raw.label}" maksimal 200 karakter.` }
    }
    if (pattern) {
      try {
        new RegExp(pattern)
      } catch {
        return { fields: [], error: `Pola validasi "${raw.label}" tidak valid.` }
      }
    }

    fields.push({
      key,
      type: raw.type,
      label: String(raw.label).trim().slice(0, 160),
      placeholder: String(raw.placeholder || '').slice(0, 200),
      helpText: String(raw.helpText || '').slice(0, 400),
      required: Boolean(raw.required),
      order: index,
      minLength: raw.minLength === null || raw.minLength === undefined || raw.minLength === '' ? null : Math.max(0, Number(raw.minLength)),
      maxLength:
        raw.maxLength === null || raw.maxLength === undefined || raw.maxLength === ''
          ? null
          : Math.min(10000, Math.max(1, Number(raw.maxLength))),
      pattern,
      options,
      fileMaxMB: Math.min(10, Math.max(1, Number(raw.fileMaxMB) || 10)),
      accept: Array.isArray(raw.accept) ? raw.accept.map(String) : [],
      showIf:
        raw.showIf?.fieldKey && raw.showIf?.equals !== undefined
          ? {
              fieldKey: String(raw.showIf.fieldKey),
              equals: String(raw.showIf.equals)
            }
          : null
    })
  }

  for (const field of fields) {
    if (field.showIf) {
      const target = fields.find((candidate) => candidate.key === field.showIf?.fieldKey)
      if (!target || target.key === field.key) {
        return { fields: [], error: `Conditional field "${field.label}" merujuk field yang tidak valid.` }
      }
    }
  }

  return { fields }
}

export function slugify(value: string) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

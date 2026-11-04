import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'

export const DEFAULT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip'
]

const extensionByMime: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/zip': '.zip'
}

function uploadRoot() {
  const config = useRuntimeConfig()
  return resolve(process.cwd(), config.uploadDir)
}

export function sanitizeFileName(name: string) {
  return String(name || 'lampiran')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180) || 'lampiran'
}

function sniffMatches(buffer: Buffer, mime: string) {
  if (mime === 'application/pdf') return buffer.subarray(0, 5).toString() === '%PDF-'
  if (mime === 'image/png')
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mime === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (mime === 'image/webp')
    return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
  if (mime.includes('openxmlformats') || mime === 'application/zip')
    return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
  return false
}

export function validateUploadMetadata(
  fileName: string,
  mimeType: string,
  size: number,
  allowedMimes: string[],
  maxMB: number
) {
  const cleanName = sanitizeFileName(fileName)
  const ext = extname(cleanName).toLowerCase()
  if (!extensionByMime[mimeType]) {
    throw createError({ statusCode: 422, statusMessage: `Tipe file ${mimeType || 'tidak dikenal'} tidak diizinkan.` })
  }
  if (!allowedMimes.includes(mimeType)) {
    throw createError({ statusCode: 422, statusMessage: `Tipe file untuk ${cleanName} tidak diizinkan.` })
  }
  if (size <= 0) {
    throw createError({ statusCode: 422, statusMessage: `File ${cleanName} kosong.` })
  }
  if (size > maxMB * 1024 * 1024) {
    throw createError({ statusCode: 422, statusMessage: `Ukuran ${cleanName} melebihi batas ${maxMB} MB.` })
  }
  if (ext && ext !== extensionByMime[mimeType] && !(mimeType === 'image/jpeg' && ext === '.jpeg')) {
    throw createError({ statusCode: 422, statusMessage: `Ekstensi file ${cleanName} tidak cocok dengan tipe file.` })
  }
  return cleanName
}

export async function savePrivateUpload(input: {
  data: Buffer
  originalName: string
  mimeType: string
  allowedMimes?: string[]
  maxMB?: number
  folder: string
}) {
  const allowed = input.allowedMimes?.length ? input.allowedMimes : DEFAULT_ALLOWED_MIME_TYPES
  const cleanName = validateUploadMetadata(
    input.originalName,
    input.mimeType,
    input.data.length,
    allowed,
    input.maxMB || 10
  )

  if (!sniffMatches(input.data, input.mimeType)) {
    throw createError({
      statusCode: 422,
      statusMessage: `Isi file ${cleanName} tidak sesuai dengan tipe file yang dinyatakan.`
    })
  }

  const folder = input.folder.replace(/\.\./g, '').replace(/^[/\\]+/, '')
  const directory = resolve(uploadRoot(), folder)
  if (!directory.startsWith(uploadRoot() + sep)) {
    throw createError({ statusCode: 400, statusMessage: 'Lokasi penyimpanan tidak valid.' })
  }
  await mkdir(directory, { recursive: true })
  const fileName = `${randomUUID()}${extensionByMime[input.mimeType]}`
  await writeFile(join(directory, fileName), input.data)
  return {
    storageKey: `${folder}/${fileName}`.replaceAll('\\', '/'),
    originalName: cleanName,
    mimeType: input.mimeType,
    size: input.data.length
  }
}

export function resolveStoragePath(storageKey: string) {
  if (!storageKey || storageKey.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Lokasi file tidak valid.' })
  }
  const root = uploadRoot()
  const target = resolve(root, storageKey)
  if (!target.startsWith(root + sep)) {
    throw createError({ statusCode: 400, statusMessage: 'Lokasi file tidak valid.' })
  }
  return target
}

export async function readPrivateUpload(storageKey: string) {
  const target = resolveStoragePath(storageKey)
  await stat(target)
  return readFile(target)
}

export async function deletePrivateUpload(storageKey: string) {
  try {
    await rm(resolveStoragePath(storageKey), { force: true })
  } catch {
    // Cleanup is best-effort.
  }
}

export function contentDisposition(fileName: string, download = false) {
  const safe = sanitizeFileName(fileName).replaceAll('"', '')
  return `${download ? 'attachment' : 'inline'}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`
}

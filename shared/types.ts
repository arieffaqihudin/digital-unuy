export type RoleSlug = 'superadmin' | 'admin' | 'pemohon'

export type Permission =
  | 'requests.read'
  | 'requests.manage'
  | 'requests.assign'
  | 'services.manage'
  | 'content.manage'
  | 'documents.manage'
  | 'users.manage'
  | 'roles.manage'
  | 'settings.manage'
  | 'audit.read'
  | 'notifications.read'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: RoleSlug
  permissions: Permission[]
}

export type RequestStatus =
  | 'Diajukan'
  | 'Diverifikasi'
  | 'Diproses'
  | 'Selesai'
  | 'Ditolak'

export const REQUEST_STATUSES: RequestStatus[] = [
  'Diajukan',
  'Diverifikasi',
  'Diproses',
  'Selesai',
  'Ditolak'
]

export const WAITING_SUBSTATUS = 'Menunggu Kelengkapan Pemohon'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file'

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'select', label: 'Select' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'File upload' }
]

export interface FieldOption {
  label: string
  value: string
}

export interface FormField {
  key: string
  type: FieldType
  label: string
  placeholder?: string
  helpText?: string
  required: boolean
  order: number
  minLength?: number | null
  maxLength?: number | null
  pattern?: string
  options?: FieldOption[]
  fileMaxMB?: number
  accept?: string[]
  showIf?: {
    fieldKey: string
    equals: string
  } | null
}

export interface ServiceFormVersionDTO {
  id: string
  version: number
  fields: FormField[]
  createdAt: string
}

export interface ServiceDTO {
  id: string
  name: string
  slug: string
  shortDescription: string
  description: string
  category: string
  icon: string
  active: boolean
  acceptsRequests: boolean
  order: number
  featured: boolean
  targetUsers: string[]
  requirements: string[]
  requiredDocuments: string[]
  procedure: string[]
  estimatedDuration?: string
  formVersion?: number
  fields?: FormField[]
  relatedDocuments?: DocumentDTO[]
  updatedAt?: string
}

export interface ServiceListResponse {
  items: ServiceDTO[]
  total: number
  page: number
  pageSize: number
  categories: string[]
}

export type DocumentCategory =
  | 'SOP'
  | 'Panduan'
  | 'Kebijakan'
  | 'Formulir'
  | 'Dokumen Lainnya'

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'SOP',
  'Panduan',
  'Kebijakan',
  'Formulir',
  'Dokumen Lainnya'
]

export interface DocumentDTO {
  id: string
  title: string
  slug: string
  category: DocumentCategory
  description?: string
  published: boolean
  version: string
  effectiveDate?: string
  updatedAt: string
  services?: { id: string; name: string; slug: string }[]
  fileName?: string
  fileSize?: number
  archived?: boolean
}

export interface DocumentListResponse {
  items: DocumentDTO[]
  total: number
  page: number
  pageSize: number
}

export interface DigitalPlatformDTO {
  id: string
  name: string
  slug: string
  description: string
  category: string
  unit: string
  status: 'Aktif' | 'Pilot' | 'Dalam Pengembangan' | 'Tidak Aktif'
  url?: string
  audience: string
  icon: string
  order: number
  updatedAt: string
}

export interface ProgramDTO {
  id: string
  title: string
  slug: string
  category: string
  summary: string
  content: string
  status: 'Direncanakan' | 'Berjalan' | 'Selesai'
  order: number
  updatedAt: string
}

export interface ArticleDTO {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  thumbnail?: string
  category: string
  author: string
  publishedAt: string
  status: 'draft' | 'published'
  updatedAt: string
}

export interface MetricDTO {
  label: string
  value: number
  unit?: string
  description?: string
  verified: boolean
}

export interface SiteSettingsDTO {
  directorateName: string
  universityName: string
  tagline: string
  logoUrl: string
  description: string
  address: string
  contactPhone: string
  contactEmail: string
  notificationEmail: string
  socials: { label: string; url: string }[]
  hero: {
    eyebrow: string
    title: string
    description: string
    primaryLabel: string
    primaryUrl: string
    secondaryLabel: string
    secondaryUrl: string
  }
  metrics: MetricDTO[]
  devSeedMode: boolean
}

export interface RequestAttachmentDTO {
  id: string
  fieldKey?: string
  originalName: string
  mimeType: string
  size: number
}

export interface RequestListItem {
  id: string
  ticketNumber: string
  serviceName: string
  serviceSlug: string
  status: RequestStatus
  substatus?: string
  createdAt: string
  updatedAt: string
  assignedToName?: string
}

export interface RequestDetailDTO extends RequestListItem {
  description?: string
  data: Record<string, unknown>
  formSnapshot: { version: number; fields: FormField[] }
  attachments: RequestAttachmentDTO[]
  timeline: {
    id: string
    status: RequestStatus
    substatus?: string
    note?: string
    actorName?: string
    createdAt: string
  }[]
  comments: {
    id: string
    message: string
    visibility: 'public' | 'internal'
    authorName: string
    createdAt: string
  }[]
  rejectionReason?: string
  resolutionSummary?: string
  requestedCompletionNote?: string
  trackingUrl?: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export const PLATFORM_STATUSES = ['Aktif', 'Pilot', 'Dalam Pengembangan', 'Tidak Aktif'] as const

export const PLATFORM_CATEGORIES = [
  'Akademik',
  'Tata Kelola',
  'Sumber Daya Manusia',
  'Penjaminan Mutu',
  'Website & Publikasi',
  'Pengabdian Masyarakat',
  'Infrastruktur Digital'
]

export const PROGRAM_CATEGORIES = [
  'Digitalisasi Layanan',
  'Integrasi Data',
  'Pengembangan Sistem',
  'Tata Kelola Digital',
  'Penguatan Kapasitas Digital'
]

export const SERVICE_CATEGORIES = [
  'Akun & Identitas',
  'Sistem Informasi',
  'Infrastruktur',
  'Kolaborasi',
  'Dukungan Teknis',
  'Data & Integrasi',
  'Keamanan'
]

export const ROLE_LABELS: Record<RoleSlug, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin/Petugas',
  pemohon: 'Pemohon'
}

export const ROLE_PERMISSIONS: Record<RoleSlug, Permission[]> = {
  superadmin: [
    'requests.read',
    'requests.manage',
    'requests.assign',
    'services.manage',
    'content.manage',
    'documents.manage',
    'users.manage',
    'roles.manage',
    'settings.manage',
    'audit.read',
    'notifications.read'
  ],
  admin: [
    'requests.read',
    'requests.manage',
    'requests.assign',
    'services.manage',
    'content.manage',
    'documents.manage',
    'notifications.read'
  ],
  pemohon: []
}

export const STATUS_META: Record<
  RequestStatus,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger'; symbol: string }
> = {
  Diajukan: { label: 'Diajukan', tone: 'info', symbol: '●' },
  Diverifikasi: { label: 'Diverifikasi', tone: 'warning', symbol: '◆' },
  Diproses: { label: 'Diproses', tone: 'warning', symbol: '◐' },
  Selesai: { label: 'Selesai', tone: 'success', symbol: '✓' },
  Ditolak: { label: 'Ditolak', tone: 'danger', symbol: '×' }
}

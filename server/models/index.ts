import mongoose, { Schema, type Model, type Types } from 'mongoose'
import { DOCUMENT_CATEGORIES, PLATFORM_STATUSES, PROGRAM_CATEGORIES, REQUEST_STATUSES, SERVICE_CATEGORIES } from '../../shared/types'

const models = mongoose.models as Record<string, Model<any>>

function defineModel<T>(name: string, schema: Schema<T>): Model<T> {
  if (models[name]) return models[name] as Model<T>
  return mongoose.model<T>(name, schema)
}

const timestamps = { createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now } }

const roleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true },
    description: { type: String, default: '' },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: true }
  },
  { timestamps: true }
)

const permissionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    group: { type: String, default: 'Umum' },
    description: { type: String, default: '' }
  },
  { timestamps: true }
)

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, default: '', select: false },
    role: { type: String, enum: ['superadmin', 'admin', 'pemohon'], default: 'pemohon', index: true },
    active: { type: Boolean, default: false, index: true },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isSeedData: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  },
  { timestamps: true }
)

const activationTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
)

const fieldSchema = new Schema(
  {
    key: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'email', 'select', 'radio', 'checkbox', 'date', 'file'],
      required: true
    },
    label: { type: String, required: true },
    placeholder: { type: String, default: '' },
    helpText: { type: String, default: '' },
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    minLength: { type: Number, default: null },
    maxLength: { type: Number, default: null },
    pattern: { type: String, default: '' },
    options: {
      type: [new Schema({ label: String, value: String }, { _id: false })],
      default: []
    },
    fileMaxMB: { type: Number, default: 10 },
    accept: { type: [String], default: [] },
    showIf: {
      type: new Schema({ fieldKey: String, equals: String }, { _id: false }),
      default: null
    }
  },
  { _id: false }
)

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, required: true, maxlength: 280 },
    description: { type: String, required: true },
    category: { type: String, required: true, enum: SERVICE_CATEGORIES },
    icon: { type: String, default: 'layers' },
    active: { type: Boolean, default: false, index: true },
    acceptsRequests: { type: Boolean, default: true },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, index: true },
    targetUsers: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    requiredDocuments: { type: [String], default: [] },
    procedure: { type: [String], default: [] },
    estimatedDuration: { type: String, default: '' },
    currentFormVersionId: { type: Schema.Types.ObjectId, ref: 'ServiceFormVersion', default: null },
    formVersionNumber: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isSeedData: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const serviceFormVersionSchema = new Schema(
  {
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    version: { type: Number, required: true },
    fields: { type: [fieldSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
)
serviceFormVersionSchema.index({ service: 1, version: 1 }, { unique: true })

const serviceRequestSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    trackingTokenHash: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    requesterName: { type: String, default: '' },
    requesterEmail: { type: String, default: '', index: true },
    requesterPhone: { type: String, default: '' },
    isGuest: { type: Boolean, default: false, index: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    serviceSlug: { type: String, required: true },
    serviceName: { type: String, required: true },
    formVersion: { type: Number, required: true },
    formSnapshot: { type: [fieldSchema], default: [] },
    data: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: REQUEST_STATUSES, default: 'Diajukan', index: true },
    substatus: { type: String, default: '' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    rejectionReason: { type: String, default: '' },
    resolutionSummary: { type: String, default: '' },
    requestedCompletionNote: { type: String, default: '' },
    idempotencyKey: { type: String, default: null },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    isSeedData: { type: Boolean, default: false }
  },
  { timestamps: true }
)
serviceRequestSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true })
serviceRequestSchema.index({ user: 1, createdAt: -1 })
serviceRequestSchema.index({ status: 1, createdAt: -1 })
serviceRequestSchema.index({ service: 1, createdAt: -1 })

const requestStatusHistorySchema = new Schema(
  {
    request: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, index: true },
    fromStatus: { type: String, default: '' },
    toStatus: { type: String, required: true },
    substatus: { type: String, default: '' },
    note: { type: String, default: '' },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: 'Sistem' }
  },
  { timestamps: true }
)

const requestDraftSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    data: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
)
requestDraftSchema.index({ user: 1, service: 1 }, { unique: true })

const requestCommentSchema = new Schema(
  {
    request: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    authorName: { type: String, required: true },
    message: { type: String, required: true, maxlength: 5000 },
    visibility: { type: String, enum: ['public', 'internal'], default: 'public' }
  },
  { timestamps: true }
)

const requestAttachmentSchema = new Schema(
  {
    request: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true, index: true },
    fieldKey: { type: String, default: 'lampiran' },
    originalName: { type: String, required: true },
    storageKey: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
)

const documentVersionSchema = new Schema(
  {
    document: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    /* Version labels are unique per document. */
    version: { type: String, required: true },
    fileName: { type: String, required: true },
    storageKey: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    effectiveDate: { type: Date, default: null },
    changelog: { type: String, default: '' },
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
)

documentVersionSchema.index({ document: 1, version: 1 }, { unique: true })

const documentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, enum: DOCUMENT_CATEGORIES, required: true, index: true },
    description: { type: String, default: '' },
    published: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true },
    currentVersionId: { type: Schema.Types.ObjectId, ref: 'DocumentVersion', default: null },
    services: { type: [{ type: Schema.Types.ObjectId, ref: 'Service' }], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isSeedData: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const teamGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    order: { type: Number, default: 0, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
)

const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    position: { type: String, required: true, trim: true, maxlength: 160 },
    unit: { type: String, default: '', trim: true, maxlength: 160 },
    bio: { type: String, default: '', maxlength: 1500 },
    group: { type: Schema.Types.ObjectId, ref: 'TeamGroup', default: null, index: true },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: false, index: true },
    photoStorageKey: { type: String, default: '' },
    photoMimeType: { type: String, default: '' },
    photoSize: { type: Number, default: 0 },
    focalX: { type: Number, default: 50, min: 0, max: 100 },
    focalY: { type: Number, default: 50, min: 0, max: 100 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
)

documentSchema.virtual('currentVersion', {
  ref: 'DocumentVersion',
  localField: 'currentVersionId',
  foreignField: '_id',
  justOne: true
})

const digitalPlatformSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true, maxlength: 500 },
    category: { type: String, required: true },
    unit: { type: String, default: '' },
    status: { type: String, enum: PLATFORM_STATUSES, default: 'Dalam Pengembangan', index: true },
    url: { type: String, default: '' },
    audience: { type: String, default: '' },
    icon: { type: String, default: 'globe' },
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isSeedData: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const programSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true },
    category: { type: String, enum: PROGRAM_CATEGORIES, required: true },
    summary: { type: String, required: true, maxlength: 400 },
    content: { type: String, default: '' },
    status: { type: String, enum: ['Direncanakan', 'Berjalan', 'Selesai'], default: 'Direncanakan' },
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isSeedData: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const articleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true, maxlength: 400 },
    content: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    category: { type: String, default: 'Berita' },
    author: { type: String, default: 'Direktorat Transformasi Digital' },
    publishedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isSeedData: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const pageSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    published: { type: Boolean, default: true },
    isSeedData: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const metricSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String, default: '' },
    description: { type: String, default: '' },
    verified: { type: Boolean, default: false }
  },
  { _id: false }
)

const siteSettingSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    directorateName: { type: String, default: 'Direktorat Tim Transformasi Digital' },
    universityName: { type: String, default: 'Universitas Nahdlatul Ulama Yogyakarta' },
    tagline: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    notificationEmail: { type: String, default: '' },
    socials: {
      type: [new Schema({ label: String, url: String }, { _id: false })],
      default: []
    },
    hero: {
      eyebrow: { type: String, default: 'Transformasi Digital' },
      title: { type: String, default: 'Mendorong Transformasi Digital UNU Yogyakarta' },
      description: { type: String, default: '' },
      primaryLabel: { type: String, default: 'Jelajahi Layanan' },
      primaryUrl: { type: String, default: '/layanan' },
      secondaryLabel: { type: String, default: 'Tentang Direktorat' },
      secondaryUrl: { type: String, default: '/tentang' }
    },
    metrics: { type: [metricSchema], default: [] },
    devSeedMode: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const notificationLogSchema = new Schema(
  {
    template: { type: String, required: true },
    recipient: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'simulated'], required: true },
    provider: { type: String, default: 'smtp' },
    error: { type: String, default: '' },
    reference: { type: String, default: '' }
  },
  { timestamps: true }
)

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorName: { type: String, default: 'Sistem' },
    actorEmail: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  },
  { timestamps: true }
)

export const Role = defineModel('Role', roleSchema)
export const Permission = defineModel('Permission', permissionSchema)
export const User = defineModel('User', userSchema)
export const Session = defineModel('Session', sessionSchema)
export const ActivationToken = defineModel('ActivationToken', activationTokenSchema)
export const Service = defineModel('Service', serviceSchema)
export const ServiceFormVersion = defineModel('ServiceFormVersion', serviceFormVersionSchema)
export const ServiceRequest = defineModel('ServiceRequest', serviceRequestSchema)
export const RequestDraft = defineModel('RequestDraft', requestDraftSchema)
export const RequestStatusHistory = defineModel('RequestStatusHistory', requestStatusHistorySchema)
export const RequestComment = defineModel('RequestComment', requestCommentSchema)
export const RequestAttachment = defineModel('RequestAttachment', requestAttachmentSchema)
export const Document = defineModel('Document', documentSchema)
export const DocumentVersion = defineModel('DocumentVersion', documentVersionSchema)
export const TeamGroup = defineModel('TeamGroup', teamGroupSchema)
export const TeamMember = defineModel('TeamMember', teamMemberSchema)
export const DigitalPlatform = defineModel('DigitalPlatform', digitalPlatformSchema)
export const Program = defineModel('Program', programSchema)
export const Article = defineModel('Article', articleSchema)
export const Page = defineModel('Page', pageSchema)
export const SiteSetting = defineModel('SiteSetting', siteSettingSchema)
export const NotificationLog = defineModel('NotificationLog', notificationLogSchema)
export const AuditLog = defineModel('AuditLog', auditLogSchema)

export type UserDoc = Types.Subdocument & {
  _id: Types.ObjectId
  name: string
  email: string
  passwordHash?: string
  role: 'superadmin' | 'admin' | 'pemohon'
  active: boolean
  createdAt: Date
}

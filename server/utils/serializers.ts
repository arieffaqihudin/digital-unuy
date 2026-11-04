import type {
  ArticleDTO,
  DigitalPlatformDTO,
  DocumentDTO,
  FormField,
  ProgramDTO,
  RequestDetailDTO,
  RequestListItem,
  ServiceDTO,
  SiteSettingsDTO,
  TeamGroupDTO,
  TeamMemberDTO
} from '../../shared/types'

export function toIso(value: unknown) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

export function serializeService(service: any, fields?: FormField[], relatedDocuments?: DocumentDTO[]): ServiceDTO {
  return {
    id: String(service._id),
    name: service.name,
    slug: service.slug,
    shortDescription: service.shortDescription,
    description: service.description,
    category: service.category,
    icon: service.icon || 'layers',
    active: Boolean(service.active),
    acceptsRequests: Boolean(service.acceptsRequests),
    order: Number(service.order || 0),
    featured: Boolean(service.featured),
    targetUsers: service.targetUsers || [],
    requirements: service.requirements || [],
    requiredDocuments: service.requiredDocuments || [],
    procedure: service.procedure || [],
    estimatedDuration: service.estimatedDuration || '',
    formVersion: service.formVersionNumber || 1,
    fields,
    relatedDocuments,
    updatedAt: toIso(service.updatedAt)
  }
}

export function serializeDocument(doc: any): DocumentDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    category: doc.category,
    description: doc.description || '',
    published: Boolean(doc.published),
    version: doc.currentVersion?.version || doc.version || '1.0',
    effectiveDate: toIso(doc.currentVersion?.effectiveDate || doc.effectiveDate),
    updatedAt: toIso(doc.updatedAt),
    services: (doc.services || [])
      .filter((service: any) => service?._id || typeof service === 'string')
      .map((service: any) =>
        service?.name
          ? { id: String(service._id), name: service.name, slug: service.slug }
          : { id: String(service), name: '', slug: '' }
      )
      .filter((service: any) => service.slug),
    fileName: doc.currentVersion?.fileName,
    fileSize: doc.currentVersion?.size,
    archived: Boolean(doc.archived)
  }
}

export function serializeTeamMember(member: any, photoBase = '/api/team/members'): TeamMemberDTO {
  return {
    id: String(member._id),
    name: member.name,
    position: member.position,
    unit: member.unit || '',
    bio: member.bio || '',
    groupId: member.group?._id ? String(member.group._id) : member.group ? String(member.group) : '',
    groupName: member.group?.name || '',
    order: Number(member.order || 0),
    published: Boolean(member.published),
    photoUrl: member.photoStorageKey ? `${photoBase}/${String(member._id)}/photo` : undefined,
    focalX: Number(member.focalX ?? 50),
    focalY: Number(member.focalY ?? 50),
    updatedAt: toIso(member.updatedAt)
  }
}

export function serializeTeamGroup(group: any): TeamGroupDTO {
  return {
    id: String(group._id),
    name: group.name,
    slug: group.slug,
    order: Number(group.order || 0)
  }
}

export function serializePlatform(platform: any): DigitalPlatformDTO {
  return {
    id: String(platform._id),
    name: platform.name,
    slug: platform.slug,
    description: platform.description,
    category: platform.category,
    unit: platform.unit || '',
    status: platform.status,
    url: platform.url || '',
    audience: platform.audience || '',
    icon: platform.icon || 'globe',
    order: Number(platform.order || 0),
    updatedAt: toIso(platform.updatedAt)
  }
}

export function serializeProgram(program: any): ProgramDTO {
  return {
    id: String(program._id),
    title: program.title,
    slug: program.slug,
    category: program.category,
    summary: program.summary,
    content: program.content || '',
    status: program.status,
    order: Number(program.order || 0),
    updatedAt: toIso(program.updatedAt)
  }
}

export function serializeArticle(article: any): ArticleDTO {
  return {
    id: String(article._id),
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    thumbnail: article.thumbnail || '',
    category: article.category,
    author: article.author,
    publishedAt: toIso(article.publishedAt),
    status: article.status,
    updatedAt: toIso(article.updatedAt)
  }
}

export function serializeRequestSummary(request: any): RequestListItem {
  return {
    id: String(request._id),
    ticketNumber: request.ticketNumber,
    serviceName: request.serviceName,
    serviceSlug: request.serviceSlug,
    status: request.status,
    substatus: request.substatus || '',
    createdAt: toIso(request.createdAt),
    updatedAt: toIso(request.lastActivityAt || request.updatedAt),
    assignedToName: request.assignedTo?.name || ''
  }
}

export function serializeRequestDetail(
  request: any,
  timeline: any[],
  comments: any[],
  attachments: any[],
  options: { includeInternal: boolean; trackingUrl?: string }
): RequestDetailDTO {
  return {
    ...serializeRequestSummary(request),
    data: request.data || {},
    formSnapshot: {
      version: request.formVersion,
      fields: request.formSnapshot || []
    },
    attachments: attachments.map((attachment) => ({
      id: String(attachment._id),
      fieldKey: attachment.fieldKey,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size
    })),
    timeline: timeline.map((entry) => ({
      id: String(entry._id),
      status: entry.toStatus,
      substatus: entry.substatus || '',
      note: entry.note || '',
      actorName: entry.actorName || 'Sistem',
      createdAt: toIso(entry.createdAt)
    })),
    comments: comments
      .filter((comment) => options.includeInternal || comment.visibility === 'public')
      .map((comment) => ({
        id: String(comment._id),
        message: comment.message,
        visibility: comment.visibility,
        authorName: comment.authorName,
        createdAt: toIso(comment.createdAt)
      })),
    rejectionReason: request.rejectionReason || '',
    resolutionSummary: request.resolutionSummary || '',
    requestedCompletionNote: request.requestedCompletionNote || '',
    trackingUrl: options.trackingUrl
  }
}

export function serializeSettings(settings: any): SiteSettingsDTO {
  return {
    directorateName: settings?.directorateName || 'Direktorat Tim Transformasi Digital',
    universityName: settings?.universityName || 'Universitas Nahdlatul Ulama Yogyakarta',
    tagline: settings?.tagline || '',
    logoUrl: settings?.logoUrl || '',
    description: settings?.description || '',
    address: settings?.address || '',
    contactPhone: settings?.contactPhone || '',
    contactEmail: settings?.contactEmail || '',
    notificationEmail: settings?.notificationEmail || '',
    socials: settings?.socials || [],
    hero: {
      eyebrow: settings?.hero?.eyebrow || 'Transformasi Digital',
      title: settings?.hero?.title || 'Mendorong Transformasi Digital UNU Yogyakarta',
      description: settings?.hero?.description || '',
      primaryLabel: settings?.hero?.primaryLabel || 'Jelajahi Layanan',
      primaryUrl: settings?.hero?.primaryUrl || '/layanan',
      secondaryLabel: settings?.hero?.secondaryLabel || 'Tentang Direktorat',
      secondaryUrl: settings?.hero?.secondaryUrl || '/tentang'
    },
    metrics: (settings?.metrics || []).filter((metric: any) => metric.verified === true),
    devSeedMode: Boolean(settings?.devSeedMode)
  }
}

export function pageMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  }
}

export function parsePagination(query: Record<string, unknown>, defaultSize = 12) {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(48, Math.max(1, Number(query.pageSize) || defaultSize))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

# API Contracts: Digital UNUY — Website & Digital Service Portal

**Status:** Draft · **Version:** 0.1 · **Source:** `docs/IMPLEMENTATION_PLAN.md` §6 / `docs/PRD.md` §9 · **Envelope:** `{ "data": {}, "message": "", "error": "" }` · **Base path:** `/api/v1/`

## 0. Conventions

### 0.1 Envelope and Phase 1 deviation

Target contract:

```json
{ "data": {}, "message": "Human-readable success", "error": "" }
```

Error:

```json
{ "data": null, "message": "", "error": "Pesan kesalahan.", "errors": { "field": "Pesan field." } }
```

**Phase 1 path mapping:** every `/api/v1/...` path maps 1:1 to `/api/...` (for example `/api/v1/services` → `/api/services`). `/sitemap.xml` and `/robots.txt` are unchanged. Phase 1 returns raw JSON; validation errors arrive as `data.errors` and map to top-level `errors` in the target contract. This is tracked as Q-API.

### 0.2 Authentication and CSRF

- Staff session cookie `unu_session` (`HttpOnly`, `SameSite=Lax`, `Secure` in production), 7 days, token stored as SHA-256.
- Public requests require no session.
- Requester access uses a ticket number + random tracking token; only the token hash is stored.
- **All mutations** require header `x-unu-csrf: 1` and, when `Origin` is present, an Origin host matching the request host. Missing marker → 403.
- `401` = no/expired session. `403` = authenticated but missing permission, bad CSRF/Origin, or attachment not accessible. `404` = not found or not visible, including wrong ticket/token.

### 0.3 Permissions

`requests.read`, `requests.manage`, `requests.assign`, `services.manage`, `content.manage`, `documents.manage`, `users.manage`, `roles.manage`, `settings.manage`, `audit.read`, `notifications.read`.

`superadmin` has all permissions and is immutable. `admin` permissions are editable (Q7). Permission cache TTL is 60 seconds.

### 0.4 Pagination

`page` ≥ 1; `pageSize` default 12 for public lists, 20–24 for admin lists, capped at 48. Response pagination: `{ items, total, page, pageSize }`.

### 0.5 Rate limits (per process)

| Scope | Limit | Identity |
|-------|-------|----------|
| `login` | 8 / 10 min | IP + email |
| `activation` | 10 / 15 min | IP + token prefix |
| `request-submit-ip` | 40 / hour | IP |
| `request-submit` | 12 / hour | requester email |
| `tracking` | 30 / 10 min | IP |
| `track-respond` / `track-comment` | 20 / 10 min | IP |
| `track-attachment` | 15 / 10 min | IP |
| `public-search` | 120 / min | IP |

`429` includes `Retry-After`.

### 0.6 Status codes

`200`, `201`, `204`, `301` redirect, `400`, `401`, `403`, `404`, `409`, `410`, `413`, `422`, `429`, `500`, `502`, `503`.

## 1. Public Content

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `GET /api/v1/home` | Public | — | `{settings, services[], platforms[], platformCategories[], documents[], articles[], metrics[], counts{services,platforms}}` | 503 |
| `GET /api/v1/site` | Public | — | `{settings: SiteSettingsDTO}` | 503 |
| `GET /api/v1/search` | Public | `q` (≥2, ≤120), `type` (`service`\|`platform`\|`document`\|`article`\|`page`), `page`, `pageSize` | `{query, items: SearchResultDTO[], total, page, pageSize, counts}` | 422 invalid type, 429 |
| `GET /api/v1/services` | Public | `q` (≤120), `category`, `page`, `pageSize` (default 12) | `{items: ServiceDTO[], total, page, pageSize, categories[]}` | 503 |
| `GET /api/v1/services/{slug}` | Public | slug | `{service: ServiceDTO, fields: FormField[], relatedDocuments: DocumentDTO[]}`; 404 if inactive/missing | 404 |
| `GET /api/v1/platforms` | Public | `q`, `category`, `audience`, `status`, `page`, `pageSize` (default 24) | `{items: DigitalPlatformDTO[], total, page, pageSize, categories[], audiences[]}` | 503 |
| `GET /api/v1/platforms/{slug}` | Public | slug | `{platform: DigitalPlatformDTO}`; 404 if unpublished/missing | 404 |
| `GET /api/v1/documents` | Public | `q`, `category`, `page`, `pageSize` (default 12) | `{items: DocumentDTO[], total, page, pageSize, categories[]}` | 503 |
| `GET /api/v1/documents/{slug}` | Public | slug | `{document: DocumentDTO}`; only published + not archived | 404 |
| `GET /api/v1/documents/{slug}/download` | Public | slug | Binary stream; `Content-Disposition`; `Content-Type` from file; `X-Content-Type-Options: nosniff`; `Cache-Control: private, no-store` | 404, 503 |
| `GET /api/v1/articles` | Public | `q`, `category`, `page`, `pageSize` | `{items: ArticleDTO[], total, page, pageSize, categories[]}` | 503 |
| `GET /api/v1/articles/{slug}` | Public | slug | `{article: ArticleDTO}`; only published | 404 |
| `GET /api/v1/pages/{slug}` | Public | slug | `{page: {id,title,slug,excerpt,content,seo,updatedAt}}`; only published | 404 |
| `GET /api/v1/team` | Public | — | `{groups: TeamGroupDTO[], members: TeamMemberDTO[]}`; published only | 503 |
| `GET /api/v1/team/members/{id}/photo` | Public | id (ObjectId) | Image bytes; published member only | 404 |

## 2. Request Submission & Tracking

### 2.1 `POST /api/v1/services/{slug}/requests`

| Item | Detail |
|------|--------|
| Auth | Public (optional session; staff submission records `user`) |
| Content-Type | `application/json` or `multipart/form-data` |
| Headers | `x-idempotency-key` required, 10–120 chars; mutations also require `x-unu-csrf: 1` |
| JSON body | `{ requester: { name, email, phone? }, data: { [fieldKey]: value } }` |
| Multipart | parts `payload` (JSON field data), `__requester` (JSON requester), and one file part per file field key |
| Validation | requester name ≥3, valid email, phone ≤40; field rules from form version; file MIME/extension/magic/size (max 10 MB per field, 12 MB total) |
| Success 200 | `{ duplicate: false, ticketNumber, requestId, status: "Diajukan", trackingUrl, emailStatus: "sent"\|"simulated"\|"failed" }` |
| Duplicate 200 | `{ duplicate: true, ticketNumber, requestId, status, emailStatus: "not-resent" }` |
| Errors | 400 missing/invalid idempotency or unreadable payload; 404 service inactive/missing; 409 not accepting requests, missing form, or duplicate by another identity; 413 total upload; 422 field/file validation with `errors`; 429; 503 ticket generation |
| Effects | Create request, attachments, initial status history, audit `request.created`, confirmation email |

### 2.2 `POST /api/v1/track`

| Item | Detail |
|------|--------|
| Auth | Ticket + token |
| Body | `{ "ticket": string, "token": string }` |
| Success 200 | `{ request: RequestDetailDTO }` with public comments only, `Cache-Control: no-store` |
| Errors | 400 missing fields; 404 wrong ticket/token; 429 |

### 2.3 `POST /api/v1/track/respond`

| Item | Detail |
|------|--------|
| Auth | Ticket + token |
| Body | `{ ticket, token, message }` (5–5000 chars) |
| Success 200 | `{ ok: true, status: "Diverifikasi" }` |
| Errors | 400, 404, 409 not waiting for completeness or concurrent change, 422 message length, 429 |
| Effects | Clear substatus, add public comment + status history, audit |

### 2.4 `POST /api/v1/track/comments`

| Item | Detail |
|------|--------|
| Auth | Ticket + token |
| Body | `{ ticket, token, message }` (3–5000) |
| Success 200 | `{ comment: { id, message, authorName, createdAt } }` |
| Errors | 400, 404, 422, 429 |

### 2.5 `POST /api/v1/track/attachments`

| Item | Detail |
|------|--------|
| Auth | Ticket + token |
| Content-Type | `multipart/form-data` with parts `ticket`, `token`, `file` |
| Success 200 | `{ attachment: { id, fieldKey: "kelengkapan_pemohon", originalName, mimeType, size } }` |
| Errors | 400 empty, 404, 409 not waiting for completeness, 422 missing file/validation, 429 |

### 2.6 `GET /api/v1/requests/attachments/{id}`

| Item | Detail |
|------|--------|
| Auth | **Staff session** (`requireUser`); no ticket/token access |
| Success 200 | Binary stream; `Content-Disposition: attachment`; `Cache-Control: private, no-store`; nosniff |
| Errors | 401, 403 not owner/`requests.read`, 404 |
| Notes | Audit `attachment.accessed`. **Guest requesters cannot download attachments via this endpoint** — documented as Q-ATT. |

## 3. Auth

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `POST /api/v1/auth/login` | Public | `{ email, password }` | `{ user: SessionUser }` + session cookie | 400 missing; 401 wrong credentials; 403 inactive/non-staff; 429 |
| `POST /api/v1/auth/logout` | Session (optional) | — | `{ ok: true }`; session deleted, cookie cleared | — |
| `GET /api/v1/auth/session` | Public | — | `{ user: SessionUser \| null }` | 503 |
| `POST /api/v1/auth/activate` | Public | `{ token, password }` | `{ user: SessionUser }` + session cookie | 400 missing token; 410 invalid/used/expired/inactive; 422 weak password; 429 |

**Password policy:** enforced by `passwordProblems()`; minimum length and character rules; activation token is single-use and stored hashed.

## 4. Admin Dashboard & Requests

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `GET /api/v1/admin/dashboard` | `requests.read` | `period` (`7d`\|`30d`\|`90d`\|`all`, default `30d`) | `{period, counts{total,submitted,processing,completed,rejected,waitingOnRequester}, simpleStats{completionRate,averageResolutionHours}, recent[], actionQueue[]}` | 401/403 |
| `GET /api/v1/admin/requests` | `requests.read` | `status`, `service` (slug), `assigned` (`unassigned`\|ObjectId), `waiting=true`, `q` (≤100), `page`, `pageSize` (default 20) | `{items: RequestListItem[], total, page, pageSize}` | 401/403 |
| `GET /api/v1/admin/requests/options` | `requests.read` | — | `{services:[{slug,name}], assignees:[{id,name,email,role}]}` | 401/403 |
| `GET /api/v1/admin/requests/{id}` | `requests.read` | ObjectId | `{request: RequestDetailDTO}` including internal comments | 401/403/404 |
| `PATCH /api/v1/admin/requests/{id}` | `requests.manage` (+`requests.assign` for assign) | See below | `{ok, status, substatus, emailStatus, warning}` | 400/401/403/404/409/422/502 |
| `POST /api/v1/admin/requests/{id}/attachments` | `requests.manage` | multipart `file` | `{attachment}` | 401/403/404/409 terminal, 422 missing/invalid file |

**PATCH actions:**

| Action | Body | Rules |
|--------|------|-------|
| `assign` | `{ action:"assign", assignedTo: ObjectId\|null }` | Assignee must be active admin/superadmin; requires `requests.assign` |
| `comment` | `{ action:"comment", note: 2–5000, visibility:"public"\|"internal" }` | Adds comment; no status change |
| `verify` | `{ action:"verify", note?, publicNote? }` | Only `Diajukan`, not waiting; → `Diverifikasi` |
| `start` | `{ action:"start", note?, publicNote? }` | Only `Diverifikasi`, no substatus; → `Diproses`; email |
| `request_info` | `{ action:"request_info", note (required) }` | Sets substatus `Menunggu Kelengkapan Pemohon`; email |
| `complete` | `{ action:"complete", resolutionSummary (≥10), note?, publicNote? }` | Only `Diproses`; → `Selesai`; email |
| `reject` | `{ action:"reject", reason (≥10), note?, publicNote? }` | From `Diajukan`/`Diverifikasi`/`Diproses`; → `Ditolak`; email |

Terminal statuses (`Selesai`, `Ditolak`) cannot be changed → 409. Concurrent status change → 409. Email failure does not roll back the status change; response `emailStatus: "failed"` and `warning`.

## 5. Admin Services

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `GET /api/v1/admin/services` | `services.manage` | `q`, `status`, `category`, `page`, `pageSize` | `{items: ServiceDTO[], total, page, pageSize}` | 401/403 |
| `POST /api/v1/admin/services` | `services.manage` | `{name(3–160), slug?, shortDescription(≥10,≤280), description(≥20), category(enum), icon?, active?, acceptsRequests?, featured?, order?, targetUsers[]?, requirements[]?, requiredDocuments[]?, procedure[]?, estimatedDuration?, fields: FormField[], documentIds[]?, seo?}` | 201 `{service: ServiceDTO}` | 401/403, 409 slug, 422 validation/form |
| `GET /api/v1/admin/services/{id}` | `services.manage` | ObjectId | `{service: ServiceDTO, documents: DocumentDTO[], documentIds: string[]}` | 401/403/404 |
| `PATCH /api/v1/admin/services/{id}` | `services.manage` | Any subset of the create fields; `fields` creates a new form version when changed; `documentIds` replaces related docs | `{service: ServiceDTO, documents: DocumentDTO[]}` | 401/403/404, 409 slug, 422 validation, 422 activate without fields |

**Form field rules:** 1–60 fields; key `^[a-z][a-z0-9_]{1,49}$`, unique; type in `text,textarea,number,email,select,radio,checkbox,date,file`; label required; select/radio need options; pattern ≤200 and valid regex; `showIf` must reference an existing field; file `accept` allowlist and `fileMaxMB` 1–10.

## 6. Admin Documents

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `GET /api/v1/admin/documents` | `documents.manage` | `q`, `category`, `published`, `archived`, `page`, `pageSize` | `{items: DocumentDTO[], total, page, pageSize}` | 401/403 |
| `GET /api/v1/admin/documents/options` | `documents.manage` | — | `{items:[{id,title,slug,category}]}` | 401/403 |
| `POST /api/v1/admin/documents` | `documents.manage` | multipart: `metadata` JSON `{title(≥3),slug?,category(enum),description?,published?,version?,effectiveDate?,changelog?,serviceIds[]?}` + `file` (PDF/DOCX/XLSX/ZIP, ≤10 MB) | 201 `{document: DocumentDTO}` | 400 metadata/file missing, 401/403, 409 slug, 422 validation/file |
| `GET /api/v1/admin/documents/{id}` | `documents.manage` | ObjectId | `{document: DocumentDTO, versions: DocumentVersion[]}` | 401/403/404 |
| `PATCH /api/v1/admin/documents/{id}` | `documents.manage` | `{title?,slug?,category?,description?,published?,archived?,serviceIds?,seo?}` | `{document: DocumentDTO}` | 401/403/404, 409 slug, 422 |
| `POST /api/v1/admin/documents/{id}/versions` | `documents.manage` | multipart: `metadata` `{version(required,≤30),effectiveDate?,changelog?}` + `file` | 200 `{version:{id,version,fileName,createdAt}}` | 400 metadata, 401/403/404, 409 duplicate version, 422 file |
| `GET /api/v1/admin/documents/{id}/download` | `documents.manage` | ObjectId | Binary stream (`inline`/`attachment` per query) | 401/403/404 |

**Upload storage:** private local filesystem; random storage key; MIME + extension + magic bytes enforced; cleanup on DB failure.

## 7. Admin Ecosystem

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `GET /api/v1/admin/platforms` | `content.manage` | `q`, `categoryId`, `status`, `published`, `page`, `pageSize` | `{items: DigitalPlatformDTO[], total, page, pageSize, categories: PlatformCategoryDTO[]}` | 401/403 |
| `POST /api/v1/admin/platforms` | `content.manage` | `{name(≥2,≤160),slug?,description(≥10,≤500),categoryId,unit?,status(enum),url?,audiences[]?,order?,published?,featured?,thumbnail?,gallery[]?,problem?,solution?,benefits?,features?,modules[]?,metrics[]?,seo?}` | 201 `{platform}` | 401/403, 409 slug, 422 category/status/validation |
| `PATCH /api/v1/admin/platforms/{id}` | `content.manage` | Subset of create fields | `{platform}` | 401/403/404, 409 slug, 422 |
| `DELETE /api/v1/admin/platforms/{id}` | `content.manage` | ObjectId | `{ok: true}` | 401/403/404 |
| `GET /api/v1/admin/platform-categories` | `content.manage` | — | `{items: PlatformCategoryDTO[]}` | 401/403 |
| `POST /api/v1/admin/platform-categories` | `content.manage` | `{name,slug?,description?,order?,active?}` | 201 `{category}` | 401/403, 409 slug, 422 |
| `PATCH /api/v1/admin/platform-categories/{id}` | `content.manage` | Subset | `{category}` | 401/403/404, 409 slug |
| `DELETE /api/v1/admin/platform-categories/{id}` | `content.manage` | ObjectId | `{ok: true}` | 401/403/404, 409 if in use (documented behavior) |

**Platform limits:** modules/metrics arrays validated by `platform-input` helpers; URLs http/https; audiences from `PLATFORM_AUDIENCES`; status from `PLATFORM_STATUSES`.

## 8. Admin Publications, Pages, Team

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `GET /api/v1/admin/articles` | `content.manage` | `q`, `status`, `category`, `page`, `pageSize` | `{items: ArticleDTO[], total, page, pageSize}` | 401/403 |
| `POST /api/v1/admin/articles` | `content.manage` | `{title(≥3,≤200),slug?,excerpt(≥10,≤400),content(≥20),thumbnail?,category?,author?,publishedAt?,status:"draft"\|"published",seo?}` | 201 `{article}` | 401/403, 409 slug, 422 validation/date |
| `GET /api/v1/admin/articles/{id}` | `content.manage` | ObjectId | `{article}` | 401/403/404 |
| `PATCH /api/v1/admin/articles/{id}` | `content.manage` | Subset of create fields | `{article}` | 401/403/404, 409 slug, 422 |
| `GET /api/v1/admin/pages` | `content.manage` | `q`, `published`, `page`, `pageSize` | `{items[], total, page, pageSize}` | 401/403 |
| `POST /api/v1/admin/pages` | `content.manage` | `{title(≥3),slug?,excerpt?,content?,published?,seo?}` | 201 `{page:{id,title,slug,published,updatedAt}}` | 401/403, 409 slug, 422 |
| `PATCH /api/v1/admin/pages/{id}` | `content.manage` | Subset | `{page}` | 401/403/404, 409 slug, 422 |
| `GET /api/v1/admin/team/members` | `content.manage` | `groupId`, `published`, `page`, `pageSize` | `{items: TeamMemberDTO[], total, page, pageSize}` | 401/403 |
| `POST /api/v1/admin/team/members` | `content.manage` | multipart: `metadata` `{name(≥2,≤120),position(≥2,≤160),unit?,bio?,groupId?,order?}` + optional `photo` (JPEG/PNG/WebP, ≤10 MB) | 201 `{member}; published:false` | 400 metadata missing, 401/403, 422 validation/photo |
| `GET /api/v1/admin/team/members/{id}` | `content.manage` | ObjectId | `{member}` | 401/403/404 |
| `PATCH /api/v1/admin/team/members/{id}` | `content.manage` | multipart metadata + optional photo; supports name/position/unit/bio/groupId/order/published/focalX/focalY | `{member}` | 401/403/404, 422 |
| `DELETE /api/v1/admin/team/members/{id}` | `content.manage` | ObjectId | `{ok: true}`; photo cleaned up | 401/403/404 |
| `GET /api/v1/admin/team/members/{id}/photo` | `content.manage` | ObjectId | Image bytes | 401/403/404 |
| `GET /api/v1/admin/team/groups` | `content.manage` | — | `{items: TeamGroupDTO[]}` | 401/403 |
| `POST /api/v1/admin/team/groups` | `content.manage` | `{name(≥2,≤100),order?}` | 201 `{group}` | 401/403, 409 duplicate, 422 |
| `PATCH /api/v1/admin/team/groups/{id}` | `content.manage` | `{name?,order?}` | `{group}` | 401/403/404, 409 |
| `DELETE /api/v1/admin/team/groups/{id}` | `content.manage` | ObjectId | `{ok: true}` | 401/403/404, 409 if members exist (documented) |

## 9. Admin Users, Roles, Settings, Notifications, Audit

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `GET /api/v1/admin/users` | `users.manage` | `q`, `role`, `active`, `page`, `pageSize` | `{items:[{id,name,email,role,active,hasPassword,invitationPending,lastLoginAt,createdAt}], total, page, pageSize}` | 401/403 |
| `POST /api/v1/admin/users` | `users.manage` (+`roles.manage` to assign superadmin) | `{name(≥3),email,role:"admin"\|"superadmin"}` | 201 `{user}`; `active:false` | 401/403, 409 email, 422 validation |
| `PATCH /api/v1/admin/users/{id}` | `users.manage` (+`roles.manage` for role) | `{name?,email?,role?,active?}` | `{user, emailStatus}` | 401/403, 404, 409 self/last superadmin/email change on active, 422, 502 activation email |
| `POST /api/v1/admin/users/{id}/resend` | `users.manage` | ObjectId | `{ok, emailStatus}` | 401/403/404, 409 if active, 502 |
| `GET /api/v1/admin/roles` | `roles.manage` | — | `{roles:[{slug,label,description,permissions[],locked}], permissions: PermissionMeta[]}` | 401/403 |
| `PATCH /api/v1/admin/roles/{slug}` | `roles.manage` | `{permissions: Permission[]}`; slug must be `admin` | `{role}`; clears permission cache | 401/403, 409 superadmin locked, 422 unknown permission |
| `GET /api/v1/admin/settings` | `settings.manage` | — | `{settings: SiteSettingsDTO, metrics}` | 401/403 |
| `PUT /api/v1/admin/settings` | `settings.manage` | `{directorateName,universityName,tagline,logoUrl,description,address,contactPhone,contactEmail,notificationEmail,socials[],hero{...},metrics[],seo{...},devSeedMode}` | `{settings}` | 401/403, 422 email/URL/validation |
| `GET /api/v1/admin/notifications` | `notifications.read` (+`requests.read` for action view) | `view` (`action`\|`all`), `page`, `pageSize` | `{actionCount, items[], total, page, pageSize}` | 401/403 |
| `GET /api/v1/admin/audit` | `audit.read` | `action`, `entityType`, `actor`, `q`, `page`, `pageSize` | `{items: AuditRow[], total, page, pageSize}` | 401/403 |

**User rules:** new users inactive with empty `passwordHash`; activating a user without a password issues a 48-hour token and sends email; email failure rolls activation back and returns 502; cannot deactivate/demote self; last active superadmin protected; changing email on an active account is blocked.

## 10. SEO Routes

| Endpoint | Auth | Request | Success | Errors |
|----------|------|---------|---------|--------|
| `GET /sitemap.xml` | Public | — | XML sitemap of indexable public content; content with `seo.noindex` excluded | 503 in production with localhost base |
| `GET /robots.txt` | Public | — | `Disallow: /` outside indexable environments; otherwise allow + sitemap reference | — |

`X-Robots-Tag: noindex, nofollow` is applied to private routes regardless of environment. Private patterns: `/admin`, `/masuk`, `/aktivasi`, `/lacak`, `/permohonan-saya`, `/lacak-permohonan`, `/pencarian`, `/layanan/*/ajukan`, `/api`.

## 11. Shared Types

Full definitions live in `shared/types.ts` and `shared/seo.ts`. Key shapes:

```ts
SessionUser = { id, name, email, role: "superadmin"|"admin", permissions: Permission[] }

ServiceDTO = {
  id, name, slug, shortDescription, description, category, icon,
  active, acceptsRequests, order, featured,
  targetUsers[], requirements[], requiredDocuments[], procedure[],
  estimatedDuration?, formVersion?, fields?: FormField[],
  relatedDocuments?: DocumentDTO[], seo?, updatedAt
}

DocumentDTO = {
  id, title, slug, category, description?, published,
  version, effectiveDate?, updatedAt, services?, fileName?, fileSize?, archived?
}

DigitalPlatformDTO = {
  id, name, slug, description, category, categoryId, categorySlug, categoryOrder,
  unit, status, url?, audience, audiences[], icon, order,
  published, featured, thumbnail, gallery[], problem, solution, benefits, features,
  modules[], metrics[], seo?, updatedAt
}

ArticleDTO = { id, title, slug, excerpt, content, thumbnail?, category, author, publishedAt, status, seo?, updatedAt }

TeamMemberDTO = { id, name, position, unit, bio, groupId, groupName, order, published, photoUrl?, focalX, focalY, updatedAt }
TeamGroupDTO = { id, name, slug, order }
PlatformCategoryDTO = { id, name, slug, description, order, active, platformCount? }
SearchResultDTO = { id, type, typeLabel, title, category, excerpt, href, updatedAt }

RequestListItem = { id, ticketNumber, serviceName, serviceSlug, status, substatus?, createdAt, updatedAt, assignedToName? }
RequestDetailDTO = RequestListItem & {
  data, formSnapshot: { version, fields[] }, attachments[], timeline[], comments[],
  rejectionReason?, resolutionSummary?, requestedCompletionNote?, trackingUrl?
}

SiteSettingsDTO = {
  directorateName, universityName, tagline, logoUrl, description, address,
  contactPhone, contactEmail, notificationEmail, socials[], hero{}, metrics[], seo{}, devSeedMode
}

FormField = {
  key, type, label, placeholder?, helpText?, required, order,
  minLength?, maxLength?, pattern?, options[]?, fileMaxMB?, accept[]?,
  showIf?: { fieldKey, equals } | null
}

Paginated<T> = { items: T[], total, page, pageSize }
```

**Enums:** `RoleSlug` (`superadmin`,`admin`) · `RequestStatus` (`Diajukan`,`Diverifikasi`,`Diproses`,`Selesai`,`Ditolak`) · `WAITING_SUBSTATUS` (`Menunggu Kelengkapan Pemohon`) · `FieldType` (9 values) · `DocumentCategory` (5) · `PlatformStatus` (`Sudah Rilis`,`Dalam Pengembangan`,`Pilot / Beta`) · `PlatformAudience` (4) · `ServiceCategory` (7) · `SearchContentType` (5).

## 12. Open Questions

- **Q-API:** migration from `/api/*` raw JSON to `/api/v1` + envelope, and the frontend adapter changes.
- **Q-ATT:** `GET /api/v1/requests/attachments/{id}` requires a staff session, so guest requesters cannot download their own attachments despite the README claim. Decide whether to add ticket+token access.
- **Q-ROLE:** whether role/permission management stays API-only or gets a sidebar screen.
- **Q-DEL:** delete semantics for platforms/categories/groups with dependent records (Mongo has no FK).
- **Q-1:** canonical field-error location (`errors` vs `data.errors`) for the rewritten backend.

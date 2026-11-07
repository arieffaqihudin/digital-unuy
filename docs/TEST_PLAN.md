# Test Plan: Digital UNUY — Website & Digital Service Portal

**Status:** Draft · **Version:** 0.1 · **Source:** PRD v1.0 · Implementation Plan v0.1 · Contracts v0.1 · **Owner:** Arief Faqihudin

## 1. Scope

**In scope:** FR-01…FR-20, all 79 API entries in `API_CONTRACTS.md`, 22 collections in `DATA_CATALOG.md`, the RBAC matrix, the request state machine, upload validation, SEO indexing policy, and the P0 edge cases in PRD §18.

**Out of scope (Phase 1):**

- SSO/institutional identity, object storage, malware scanning (Phase 2, T21).
- Redis/multi-instance behavior (Phase 3, T22).
- Formal WCAG/axe audit, Safari/Firefox-specific visual QA.
- Load beyond ≤1k staff / ≤5k requests/year.
- Email delivery through real campus SMTP (staging test only).

## 2. Strategy & Levels

| Level | Scope | Tooling | Coverage Target | Runs On |
|-------|-------|---------|-----------------|---------|
| Unit | Pure logic: validation, slugify, serializers, indexing, platform input, password rules, request state helpers | Vitest (planned) | ≥90% of `server/utils` and `shared/` | Every PR |
| Integration | API handlers + MongoDB: request lifecycle, transactions/updates, uploads, audit, sessions | Vitest + test DB (planned) | Every write path and auth/permission path | Every PR |
| Contract | Every endpoint: success, envelope, status codes, validation, permissions, rate limits | Vitest + `$fetch` (planned) | 100% of endpoints | Every PR |
| E2E | Public catalog, submission, tracking, activation, admin lifecycle, CMS | Playwright (`npm run test:e2e`) | Critical flows | Merge + nightly |
| Visual | Render and console errors | `npm run test:visual` | All public/admin screens | Merge + nightly |
| Responsive | Page × viewport overflow/clipping/4xx | `npm run test:responsive` | 10 viewports | Merge + nightly |
| Manual | Accessibility, Safari/Firefox, real SMTP, backup restore | Checklist | Release candidate | Release |

**Current state:** E2E **105/105**, visual **44/44**, responsive **140/140** pass per README. No unit/integration/contract runner exists — this is the largest coverage gap.

**Smoke suite (must run on every PR once automated):**
`TC-AUTH-01`, `TC-AUTH-02`, `TC-AUTH-03`, `TC-ACT-01`, `TC-ACT-02`, `TC-SVC-01`, `TC-REQ-01`, `TC-REQ-02`, `TC-REQ-03`, `TC-TRK-01`, `TC-TRK-02`, `TC-LIFE-01`, `TC-LIFE-02`, `TC-LIFE-03`, `TC-RBAC-01`, `TC-RBAC-02`, `TC-CMS-01`, `TC-SEC-01`, `TC-SEC-02`.

**If only 20 cases could be automated before launch:** the smoke suite plus `TC-REQ-04` (duplicate idempotency).

## 3. Requirements Traceability Matrix

### 3.1 User stories (PRD §5)

| Requirement | Test cases | Level |
|-------------|------------|-------|
| US-01 AC1–AC3 catalog | TC-SVC-01…03 | E2E + Contract |
| US-02 AC1 form rendering | TC-REQ-01, TC-REQ-05 | E2E |
| US-02 AC2 server validation | TC-REQ-02, TC-REQ-06 | Integration |
| US-02 AC3 idempotency | TC-REQ-04 | Integration |
| US-02 AC4 ticket format/unique | TC-REQ-01, TC-REQ-07 | Integration |
| US-02 AC5 response fields | TC-REQ-01 | Contract |
| US-02 AC6 rate limits | TC-REQ-08 | Integration |
| US-03 AC1–AC3 tracking | TC-TRK-01…03 | Integration |
| US-03 AC4 tracking rate | TC-TRK-04 | Integration |
| US-04 AC1–AC3 follow-up | TC-TRK-05…07 | Integration |
| US-05 AC1–AC4 login/session | TC-AUTH-01…04 | Integration |
| US-06 AC1–AC5 activation | TC-ACT-01…05 | Integration |
| US-07 AC1–AC3 dashboard | TC-DASH-01…03 | Integration |
| US-08 AC1–AC7 lifecycle | TC-LIFE-01…08 | Integration |
| US-09 AC1–AC3 assignment/comments | TC-LIFE-09…11 | Integration |
| US-10 AC1–AC5 service/form | TC-SVCADM-01…06 | Integration |
| US-11 AC1–AC4 documents | TC-DOC-01…05 | Integration |
| US-12 AC1–AC3 ecosystem | TC-ECO-01…04 | Integration |
| US-13 AC1–AC3 publications/pages | TC-CMS-01…04 | Integration |
| US-14 AC1–AC3 team | TC-TEAM-01…03 | Integration |
| US-15 AC1–AC4 users/roles | TC-USER-01…06 | Integration |
| US-16 AC1–AC2 settings | TC-SET-01…03 | Integration |
| US-17 AC1–AC3 audit | TC-AUD-01…03 | Integration |
| US-18 AC1–AC2 notifications | TC-NOT-01…02 | Integration |
| US-19 AC1–AC3 SEO | TC-SEO-01…04 | Integration + Manual |
| US-20 AC1–AC4 security | TC-SEC-01…06 | Integration + Unit |

### 3.2 P0 edge cases (PRD §18)

| Edge case | Test case |
|-----------|-----------|
| Service inactive/missing, not accepting, empty form | TC-REQ-09…11 |
| Invalid/missing idempotency, duplicate same/different identity | TC-REQ-04, TC-REQ-12 |
| Field validation, file MIME/extension/magic/size, total >12 MB | TC-REQ-02, TC-REQ-06, TC-REQ-13 |
| Ticket collision | TC-REQ-07 |
| Tracking wrong token/missing ticket | TC-TRK-01, TC-TRK-03 |
| Internal comment never public | TC-TRK-06 |
| Invalid/terminal/concurrent lifecycle transitions | TC-LIFE-01…05 |
| Complete without summary, reject without reason, request_info twice | TC-LIFE-06…08 |
| Assign invalid/inactive staff, missing assign permission | TC-LIFE-09, TC-RBAC-04 |
| Empty/short comment | TC-LIFE-10 |
| Login wrong/inactive/non-staff, CSRF, expired session | TC-AUTH-01…04, TC-SEC-01 |
| Activation invalid/used/expired, weak password, email failure | TC-ACT-01…05 |
| User self-deactivate/demote, last superadmin, duplicate email | TC-USER-01…06 |
| Role superadmin edit, unknown permission | TC-USER-07, TC-USER-08 |
| Service duplicate slug, activate without fields, duplicate key, bad regex, conditional missing, >60 fields | TC-SVCADM-01…06 |
| Document duplicate slug/version, upload failure cleanup, unpublished download | TC-DOC-01…05 |
| Platform duplicate slug, unknown category, delete dependents | TC-ECO-01…04 |
| Article/page duplicate slug | TC-CMS-01, TC-CMS-04 |
| Team photo failure, unpublished photo | TC-TEAM-01…03 |
| Settings invalid email/URL, unverified metrics hidden | TC-SET-01…03 |
| Audit sensitive metadata | TC-AUD-01 |
| Search <2 chars, invalid type | TC-SEARCH-01, TC-SEARCH-02 |
| SEO non-production/localhost, sitemap localhost, private routes | TC-SEO-01…04 |
| Upload path traversal | TC-SEC-05 |
| Seed reset in production | Manual checklist |

### 3.3 Tasks (Implementation Plan §5)

| Task | Proof |
|------|-------|
| T01 shell/tokens | TC-RWD-01, TC-A11Y-01 |
| T02 home | TC-HOME-01 |
| T03 services | TC-SVC-01…03 |
| T04 request submit | TC-REQ-01…13 |
| T05 tracking | TC-TRK-01…07 |
| T06 auth/activation | TC-AUTH-01…04, TC-ACT-01…05 |
| T07 dashboard | TC-DASH-01…03 |
| T08 lifecycle | TC-LIFE-01…11 |
| T09 service admin | TC-SVCADM-01…06 |
| T10 documents | TC-DOC-01…05 |
| T11 ecosystem | TC-ECO-01…04 |
| T12 publications/pages | TC-CMS-01…04 |
| T13 team | TC-TEAM-01…03 |
| T14 users/roles | TC-USER-01…08 |
| T15 settings/SEO | TC-SET-01…03, TC-SEO-01…04 |
| T16 audit | TC-AUD-01…03 |
| T17 notifications | TC-NOT-01…02 |
| T18 search | TC-SEARCH-01…02 |
| T19 security | TC-SEC-01…06 |
| T20 QA | This plan's smoke suite |

## 4. Test Cases

### 4.1 Public content (TC-HOME, TC-SVC, TC-SEARCH)

| ID | Source | Level | Preconditions | Steps / Input | Expected | Priority |
|----|--------|-------|---------------|---------------|----------|----------|
| TC-HOME-01 | US-01, FR-01 | E2E | Seeded content | GET `/api/home`, open `/` | Sections render; verified metrics only; no console error | P1 |
| TC-SVC-01 | US-01 AC1 | E2E | Active + inactive services | Open `/layanan` | Only active services; filters/pagination | P0 |
| TC-SVC-02 | US-01 AC2 | E2E | Service with docs | Open detail | Sasaran, syarat, prosedur, estimasi, docs shown | P1 |
| TC-SVC-03 | US-01 AC3 | Unit | Search `a.b` | `GET /api/services?q=a.b` | Regex escaped; no 500 | P1 |
| TC-SEARCH-01 | §18 | Unit | term `a` | `GET /api/search?q=a` | `items: []`, `total:0` | P2 |
| TC-SEARCH-02 | §18 | Contract | — | `GET /api/search?q=ab&type=bad` | 422 | P2 |
| TC-SEARCH-03 | FR-17 | Integration | Seeded all types | `GET /api/search?q=...` | Counts per type, sorted by type order | P1 |

### 4.2 Request submission & tracking (TC-REQ, TC-TRK)

| ID | Source | Level | Preconditions | Steps / Input | Expected | Priority |
|----|--------|-------|---------------|---------------|----------|----------|
| TC-REQ-01 | US-02 | Integration | Active service + form | Submit JSON with idempotency | 200, ticket format, trackingUrl, status `Diajukan`, audit | P0 |
| TC-REQ-02 | US-02 AC2 | Integration | Required field empty | Submit | 422 with `errors[field]` | P0 |
| TC-REQ-03 | US-02 AC4 | Integration | — | Submit twice quickly with same key | Same ticket, `duplicate:true` | P0 |
| TC-REQ-04 | US-02 AC3 | Integration | Same key, different email | Submit | 409 | P0 |
| TC-REQ-05 | US-02 AC1 | E2E | Form with `showIf` | Change parent value | Dependent field shows/hides; hidden field not required | P1 |
| TC-REQ-06 | US-02 AC2 | Integration | Invalid email/select value/pattern | Submit | 422 per field | P1 |
| TC-REQ-07 | §18 | Integration | Mock collision | Submit | Retries; after 5 → 503 | P2 |
| TC-REQ-08 | US-02 AC6 | Integration | — | 41 submissions/hour same IP | 429 + Retry-After | P1 |
| TC-REQ-09 | §18 | Integration | Inactive service | Submit | 404 | P0 |
| TC-REQ-10 | §18 | Integration | `acceptsRequests=false` | Submit | 409 | P1 |
| TC-REQ-11 | §18 | Integration | Form without fields | Submit | 409 | P1 |
| TC-REQ-12 | §18 | Integration | Invalid idempotency header | Submit | 400 | P1 |
| TC-REQ-13 | §18 upload | Integration | File >10 MB / bad magic bytes / bad extension | Submit multipart | 422; no file persisted | P0 |
| TC-REQ-14 | §18 upload | Integration | Total multipart >12 MB | Submit | 413 | P1 |
| TC-TRK-01 | US-03 | Integration | Existing request | `POST /track` with correct ticket+token | 200 detail, public comments only, no-store | P0 |
| TC-TRK-02 | US-03 AC2 | Integration | Request with internal comment | Track | Internal comment absent | P0 |
| TC-TRK-03 | US-03 AC3 | Integration | Wrong token / missing ticket | Track | 404 | P0 |
| TC-TRK-04 | US-03 AC4 | Integration | — | 31 track calls/10 min | 429 | P2 |
| TC-TRK-05 | US-04 AC1 | Integration | Waiting request | `POST /track/respond` | 200; status `Diverifikasi`; substatus cleared; history + comment | P0 |
| TC-TRK-06 | US-04 AC1 | Integration | Not waiting | `POST /track/respond` | 409 | P1 |
| TC-TRK-07 | US-04 AC3 | Integration | Multipart file | `POST /track/attachments` while waiting | 200; file private; 15/10 min rate | P1 |
| TC-TRK-08 | §18 | Integration | Attachment of another requester | `GET /requests/attachments/{id}` without staff session | 401 (documented Q-ATT) | P1 |

### 4.3 Auth & activation (TC-AUTH, TC-ACT)

| ID | Source | Level | Preconditions | Steps / Input | Expected | Priority |
|----|--------|-------|---------------|---------------|----------|----------|
| TC-AUTH-01 | US-05 | Integration | Active admin | Login valid | 200 user + cookie flags; `lastLoginAt`; audit | P0 |
| TC-AUTH-02 | US-05 AC2 | Integration | Inactive user / wrong password | Login | 403 / 401 | P0 |
| TC-AUTH-03 | US-05 AC3 | Integration | — | Inspect cookie | HttpOnly, SameSite=Lax, Secure prod, 7 days | P0 |
| TC-AUTH-04 | US-05 AC1 | Integration | — | 9 failed logins/10 min | 429 + Retry-After | P1 |
| TC-ACT-01 | US-06 | Integration | Inactive user no password | Activate with token + strong password | 200; password hash; token used; session | P0 |
| TC-ACT-02 | US-06 AC2 | Integration | Used token | Activate again | 410 | P0 |
| TC-ACT-03 | US-06 AC5 | Integration | Expired token | Activate | 410 | P1 |
| TC-ACT-04 | US-06 AC2 | Integration | Weak password | Activate | 422 | P1 |
| TC-ACT-05 | US-06 AC3 | Integration | SMTP down | Admin activates user | 502; user remains inactive; token removed | P0 |

### 4.4 Admin dashboard & lifecycle (TC-DASH, TC-LIFE)

| ID | Source | Level | Preconditions | Steps / Input | Expected | Priority |
|----|--------|-------|---------------|---------------|----------|----------|
| TC-DASH-01 | US-07 | Integration | Requests in all statuses | `GET /admin/dashboard` | Counts match DB; completion rate/average hours correct | P1 |
| TC-DASH-02 | US-07 AC2 | Integration | — | periods 7d/30d/90d/all | Date filters correct | P2 |
| TC-DASH-03 | US-07 AC3 | Integration | — | Dashboard | actionQueue + recent populated | P2 |
| TC-LIFE-01 | US-08 AC1 | Integration | `Diajukan` | verify | `Diverifikasi`, history, audit, email | P0 |
| TC-LIFE-02 | US-08 AC1 | Integration | `Diverifikasi` | start | `Diproses`, email | P0 |
| TC-LIFE-03 | US-08 AC1/AC3 | Integration | `Diproses` | complete with summary | `Selesai`, resolution summary, email | P0 |
| TC-LIFE-04 | US-08 AC1/AC4 | Integration | `Diajukan` | reject with reason | `Ditolak`, reason, email | P0 |
| TC-LIFE-05 | US-08 AC5 | Integration | `Selesai` | any action | 409 | P0 |
| TC-LIFE-06 | US-08 AC2 | Integration | `Diproses` | request_info without note | 422 | P0 |
| TC-LIFE-07 | US-08 AC2 | Integration | waiting | request_info again | 409 | P1 |
| TC-LIFE-08 | US-08 AC3/AC4 | Integration | `Diproses`/`Diajukan` | complete with short summary / reject with short reason | 422 | P1 |
| TC-LIFE-09 | US-09 AC1 | Integration | Active/inactive staff | assign each | 200 / 422 | P1 |
| TC-LIFE-10 | US-09 AC2 | Integration | note 1 char | comment | 422 | P1 |
| TC-LIFE-11 | US-09 AC2 | Integration | comment public/internal | Track | Public visible; internal hidden | P0 |
| TC-LIFE-12 | §18 concurrency | Integration | Two updates | Concurrent verify/start | One succeeds; other 409 | P1 |

### 4.5 CMS (TC-SVCADM, TC-DOC, TC-ECO, TC-CMS, TC-TEAM)

| ID | Source | Level | Preconditions | Steps / Input | Expected | Priority |
|----|--------|-------|---------------|---------------|----------|----------|
| TC-SVCADM-01 | US-10 | Integration | services.manage | Create valid service + fields | 201, form version 1, audit | P0 |
| TC-SVCADM-02 | US-10 AC5 | Integration | existing slug | Create duplicate | 409 | P1 |
| TC-SVCADM-03 | US-10 AC2 | Unit | bad key/type/duplicate key/61 fields/bad regex/missing showIf target | Create | 422 each | P1 |
| TC-SVCADM-04 | US-10 AC3 | Integration | existing service | PATCH changed fields | New form version; old version retained | P0 |
| TC-SVCADM-05 | US-10 AC4 | Integration | active=false, no fields | Activate | 422 | P0 |
| TC-SVCADM-06 | §18 | Integration | linked docs | PATCH documentIds | Service↔document relation updated | P2 |
| TC-DOC-01 | US-11 | Integration | documents.manage | POST multipart valid PDF | 201, version 1.0, private file | P0 |
| TC-DOC-02 | US-11 AC3 | Integration | existing doc | POST version 1.1 | 200; current version changes | P1 |
| TC-DOC-03 | §18 | Integration | duplicate version/slug | Create | 409 | P1 |
| TC-DOC-04 | §18 upload | Integration | bad MIME/magic/extension | Upload | 422; no orphan file | P1 |
| TC-DOC-05 | US-11 AC4 | Integration | unpublished/archived | Public list/detail/download | Hidden/404 | P1 |
| TC-ECO-01 | US-12 | Integration | content.manage | Create category + platform | 201; filters find it | P1 |
| TC-ECO-02 | §18 | Integration | duplicate slug/unknown category | Create | 409 / 422 | P1 |
| TC-ECO-03 | US-12 AC3 | Integration | audience/status filters | GET public platforms | Correct subset | P2 |
| TC-ECO-04 | Q-DEL | Integration | delete platform/category | DELETE | 200; decide dependent behavior (Q-DEL) | P2 |
| TC-CMS-01 | US-13 | Integration | content.manage | Create article/page | 201; slug unique; sanitized content | P1 |
| TC-CMS-02 | §18 | Integration | XSS payload in markdown | Create + render | Sanitized; script not executed | P0 |
| TC-CMS-03 | US-13 AC1 | Integration | draft article | Public list | Draft hidden | P1 |
| TC-CMS-04 | §18 | Integration | duplicate slug | Create | 409 | P2 |
| TC-TEAM-01 | US-14 | Integration | content.manage | Create member with photo | 201; published false; photo private | P1 |
| TC-TEAM-02 | US-14 AC2 | Integration | unpublished member | Public photo endpoint | 404 | P1 |
| TC-TEAM-03 | US-14 AC3 | Integration | group with members | DELETE group | 409 | P2 |

### 4.6 Users, roles, settings, audit, notifications (TC-USER, TC-SET, TC-AUD, TC-NOT)

| ID | Source | Level | Preconditions | Steps / Input | Expected | Priority |
|----|--------|-------|---------------|---------------|----------|----------|
| TC-USER-01 | US-15 AC1 | Integration | users.manage | Create user | 201 inactive, no password | P0 |
| TC-USER-02 | §18 | Integration | duplicate email | Create | 409 | P1 |
| TC-USER-03 | US-15 AC2 | Integration | inactive no password | Activate | Invitation email; emailStatus | P0 |
| TC-USER-04 | US-15 AC3 | Integration | self | Deactivate/demote self | 409 | P0 |
| TC-USER-05 | US-15 AC3 | Integration | one active superadmin | Deactivate/demote | 409 | P0 |
| TC-USER-06 | §18 | Integration | active account | Change email | 409 | P2 |
| TC-USER-07 | US-15 AC4 | Integration | roles.manage | PATCH admin permissions | 200; cache cleared | P1 |
| TC-USER-08 | §18 | Integration | roles.manage | PATCH superadmin / unknown permission | 409 / 422 | P1 |
| TC-SET-01 | US-16 | Integration | settings.manage | PUT settings | 200; audit | P1 |
| TC-SET-02 | §18 | Integration | invalid email/URL | PUT | 422 | P1 |
| TC-SET-03 | US-16 AC1 | Integration | unverified metric | Public site/home | Metric hidden | P2 |
| TC-AUD-01 | US-17 AC2 | Unit | metadata with password/token/secret | recordAudit | Sensitive keys removed | P0 |
| TC-AUD-02 | US-17 | Integration | audit.read | GET audit | Filters/pagination; 403 without permission | P1 |
| TC-AUD-03 | §18 | Integration | attachment access | GET attachment | Audit `attachment.accessed` | P2 |
| TC-NOT-01 | US-18 | Integration | actionable requests | GET notifications?view=action | actionCount matches | P2 |
| TC-NOT-02 | §18 | Integration | no notifications.read | GET | 403 | P1 |

### 4.7 Security, SEO, NFR (TC-SEC, TC-SEO, TC-RBAC, TC-RWD, TC-A11Y, TC-PERF)

| ID | Source | Level | Steps / Input | Expected | Priority |
|----|--------|-------|---------------|----------|----------|
| TC-SEC-01 | US-20 AC1 | Integration | POST without `x-unu-csrf` | 403 | P0 |
| TC-SEC-02 | US-20 AC1 | Integration | POST with foreign Origin | 403 | P0 |
| TC-SEC-03 | US-20 AC2 | Integration | Rate limits per §0.5 | 429 with Retry-After | P1 |
| TC-SEC-04 | US-20 AC3 | Integration | Markdown `<script>` / HTML event handler | Sanitized | P0 |
| TC-SEC-05 | §18 uploads | Integration | storageKey with `..` | 400 | P1 |
| TC-SEC-06 | US-20 AC4 | Manual | Inspect headers | nosniff, SAMEORIGIN, referrer, permissions, COOP | P1 |
| TC-RBAC-01 | PRD §4 | Integration | Admin without each permission | 403 per endpoint | P0 |
| TC-RBAC-02 | PRD §4 | Integration | Superadmin | 200/201 | P0 |
| TC-RBAC-03 | PRD §4 | Integration | Inactive user session | 401 | P0 |
| TC-RBAC-04 | PRD §4 | Integration | Admin assigns without requests.assign | 403 | P0 |
| TC-SEO-01 | US-19 AC1 | Integration | `NODE_ENV=development` | robots disallow, noindex header | P1 |
| TC-SEO-02 | US-19 AC1 | Integration | production + https non-localhost | robots allow + sitemap reference | P1 |
| TC-SEO-03 | US-19 AC2 | Integration | private routes | noindex header | P1 |
| TC-SEO-04 | US-19 AC3 | Integration | production + localhost | sitemap 503 | P2 |
| TC-RWD-01 | FR-20 | Responsive | 10 viewports 320–1920 | No overflow/clipping/4xx | P1 |
| TC-A11Y-01 | NFR | Manual | Keyboard + focus + labels + contrast | No critical blockers | P2 |
| TC-PERF-01 | NFR | Load | Warm public pages | Target TBD (Q1) | P2 |

## 5. RBAC Matrix

| Action | Public | Admin (default) | Admin without permission | Superadmin | Inactive |
|--------|--------|-----------------|--------------------------|------------|----------|
| Read published content | 200 | 200 | 200 | 200 | 200 |
| Submit request | 200 | 200 | 200 | 200 | 200 |
| Track own request | 200 | 200 | 200 | 200 | 200 |
| Login | — | 200 | 200 | 200 | 403 |
| Dashboard / requests read | 401 | 200 | 403 | 200 | 401 |
| Lifecycle / assign / comments | 401 | 200 | 403 | 200 | 401 |
| Services / content / documents | 401 | 200 | 403 | 200 | 401 |
| Users | 401 | 403 | 403 | 200 | 401 |
| Roles | 401 | 403 | 403 | 200 | 401 |
| Settings | 401 | 403 | 403 | 200 | 401 |
| Audit | 401 | 403 | 403 | 200 | 401 |
| Notifications | 401 | 200 | 403 | 200 | 401 |

## 6. Test Data & Fixtures

| Entity | Fixture | Valid | Boundary | Invalid |
|--------|---------|-------|----------|---------|
| users | `mkUser(role, active)` | superadmin, admin | inactive, no password, last superadmin | duplicate email, weak password |
| sessions | `mkSession(user)` | active | expired | inactive user |
| activation tokens | `mkActivation(user)` | fresh | used, expired | wrong token |
| services | `mkService(status)` | active, requestable | inactive, no fields, duplicate slug | bad category |
| form versions | `mkForm(fields)` | 1 field, 60 fields | 0 / 61 fields, conditional | duplicate key, bad regex |
| requests | `mkRequest(status)` | each status, waiting | terminal, concurrent | bad field data |
| attachments | `mkAttachment(request)` | PDF/PNG | 10 MB boundary | bad magic/MIME, path traversal |
| documents | `mkDocument(published)` | published, versioned | archived, unpublished | duplicate slug/version |
| platforms | `mkPlatform(status)` | published | draft, featured | unknown category |
| articles/pages | `mkArticle(status)` | draft/published | long content | duplicate slug |
| team | `mkMember(published)` | published with photo | unpublished, no group | bad photo |
| settings | `mkSettings()` | defaults | 8 metrics/socials | invalid URL/email |
| audit/notifications | `mkAudit()`, `mkNotification()` | entries | sensitive metadata | — |

**Personas:** Superadmin, Admin (default permissions), Admin with restricted permissions, Inactive staff, Guest requester, Guest with a waiting request.

**Reset strategy:** dedicated test MongoDB database recreated by `seed:reset` before integration/E2E runs; temporary `NUXT_UPLOAD_DIR` wiped per run; no production data; emails use `@example.test`.

## 7. Environments & CI

| Suite | Environment | Trigger | Gate |
|-------|-------------|---------|------|
| Typecheck/build | CI | Every PR | Block merge |
| Unit (planned) | CI | Every PR | Block merge |
| Integration/contract (planned) | CI + MongoDB service | Every PR | Block merge |
| E2E | CI + built app + MongoDB | Merge/nightly | Block deploy |
| Visual | CI | Merge/nightly | Report |
| Responsive | CI | Merge/nightly | Report |
| Post-deploy smoke | Staging/prod | After deploy | Rollback on failure |
| Manual accessibility/Safari | Staging | Release candidate | Sign-off |

Config from `ENVIRONMENT_VARIABLES.md`; test DB and upload dir are isolated per run.

## 8. Non-Functional Tests

| NFR (PRD §11) | Method | Threshold | Case |
|---------------|--------|-----------|------|
| Public page performance | Lighthouse/k6 | TBD (Q1) | TC-PERF-01 |
| Request submission | k6/autocannon | TBD; no 5xx at expected rate | TC-PERF-02 |
| Upload safety | Malicious/mismatched files | Always 422 and no persistence | TC-REQ-13, TC-DOC-04 |
| XSS | Markdown/HTML payloads | Sanitized | TC-SEC-04, TC-CMS-02 |
| CSRF | Cross-origin mutation | 403 | TC-SEC-01/02 |
| Rate limits | Burst per scope | 429 + Retry-After | TC-SEC-03 |
| Privacy | Inspect storage/logs | No raw tracking token or password in audit | TC-AUD-01 |
| SEO | robots/sitemap/meta | Public indexable only in prod+https | TC-SEO-01…04 |
| Responsive | 320–1920 | No overflow/4xx | TC-RWD-01 |
| Accessibility | Keyboard + axe (planned) | No critical blockers | TC-A11Y-01 |
| Backup/restore | Restore Mongo dump + upload dir | App serves content and files | Manual TC-OPS-01 |
| Email | Staging SMTP | Activation and status emails delivered | Manual TC-OPS-02 |

## 9. Exit Criteria & Defects

**Per milestone**

- **M1:** public home/catalog/detail pass; SMS smoke; no console errors.
- **M2:** submission, tracking, auth, activation pass; upload safety and CSRF pass.
- **M3:** lifecycle, CMS, users/roles, settings, audit, notifications pass; RBAC matrix green.
- **M4:** E2E/visual/responsive full pass; unit/contract suites meet targets; manual accessibility and restore signed.

**Release gate:** smoke green; 100% of P0 ACs/edge cases covered; zero open P0/P1; build and typecheck clean; staging SMTP and restore verified.

| Severity | Meaning | Owner |
|----------|---------|-------|
| P0 | Auth bypass, data loss, request/tracking outage, CSRF/XSS | Tech lead |
| P1 | Broken core flow, wrong permission, upload/lifecycle bug | Module owner |
| P2 | Cosmetic, edge-case degradation | Module owner |
| P3 | Backlog | Product owner |

**Regression:** full suite before every production release and after any hotfix touching auth, requests, uploads, RBAC, or CMS write paths.

## 10. Document Info & Sign-off

| Field | Value |
|-------|-------|
| Status | Draft |
| Version | 0.1 |
| Source PRD | PRD v1.0 — `docs/PRD.md` |
| Source Plan | Implementation Plan v0.1 |
| Source Contracts | API v0.1, Data Catalog v0.1, Env Vars v0.1 |
| Author / Owner | Arief Faqihudin |
| Approver + date | Belum ditandatangani |
| File location | `docs/TEST_PLAN.md` |

**Open questions**

- Q1: performance targets and request-resolution target (PRD Q1).
- Q2: whether Vitest and an integration harness are added in Phase 2.
- Q3: test MongoDB/runners and upload volume in CI.
- Q4: contract tests against Phase 1 `/api/*` or the `/api/v1` envelope first (Q-API).
- Q5: Q-ATT (guest attachment access) expected behavior.
- Q6: formal accessibility and Safari/Firefox scope.

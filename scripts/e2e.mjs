import { readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const stamp = Date.now()
let passed = 0
const failures = []

class Client {
  constructor(name) {
    this.name = name
    this.cookies = new Map()
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ')
  }

  async request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase()
    const headers = { ...(options.headers || {}) }
    if (!['GET', 'HEAD'].includes(method) && options.csrf !== false) headers['x-unu-csrf'] = '1'
    if (this.cookies.size) headers.cookie = this.cookieHeader()
    let body = options.body
    if (options.json !== undefined) {
      headers['content-type'] = 'application/json'
      body = JSON.stringify(options.json)
    }
    const response = await fetch(`${BASE}${path}`, { method, headers, body, redirect: 'manual' })
    for (const cookie of response.headers.getSetCookie?.() || []) {
      const [pair] = cookie.split(';')
      const [key, value] = pair.split('=')
      if (!key) continue
      if (!value || /max-age=0/i.test(cookie)) this.cookies.delete(key)
      else this.cookies.set(key, value)
    }
    const text = await response.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }
    return { status: response.status, headers: response.headers, text, data }
  }

  get(path, options) {
    return this.request(path, options)
  }
  post(path, options) {
    return this.request(path, { ...options, method: 'POST' })
  }
  patch(path, options) {
    return this.request(path, { ...options, method: 'PATCH' })
  }
  put(path, options) {
    return this.request(path, { ...options, method: 'PUT' })
  }
  delete(path, options) {
    return this.request(path, { ...options, method: 'DELETE' })
  }
}

function check(name, condition, details = '') {
  if (condition) {
    passed += 1
    console.log(`PASS  ${name}`)
  } else {
    failures.push({ name, details })
    console.log(`FAIL  ${name}${details ? ` — ${details}` : ''}`)
  }
}

async function login(client, email, password) {
  return client.post('/api/auth/login', { json: { email, password } })
}

async function latestMailFor(email) {
  const folder = resolve(process.cwd(), '.data', 'mail-outbox')
  const files = await readdir(folder)
  for (const file of files) {
    const full = join(folder, file)
    try {
      const content = JSON.parse(await readFile(full, 'utf8'))
      if (content.to === email) {
        const match = content.html.match(/aktivasi\?token=([^"&<]+)/)
        if (match) return { token: decodeURIComponent(match[1]), file, content }
      }
    } catch {
      // Skip incomplete or unrelated mail sink files.
    }
  }
  return null
}

const publicClient = new Client('public')
const admin = new Client('superadmin')
const applicant = new Client('pemohon')

console.log('\n=== Public website & katalog ===')
const home = await publicClient.get('/api/home')
check('Homepage API 200', home.status === 200)
check('Homepage memuat layanan', home.data?.services?.length >= 6)
check('Homepage memuat ekosistem', home.data?.platforms?.length >= 1)
check('Homepage tidak menampilkan metrik belum terverifikasi', Array.isArray(home.data?.metrics) && home.data.metrics.every((m) => m.verified))

const serviceList = await publicClient.get('/api/services')
check('Katalog layanan 200', serviceList.status === 200)
check('Katalog memiliki 8 layanan', serviceList.data?.total === 8, `total=${serviceList.data?.total}`)
const searchResult = await publicClient.get('/api/services?q=email')
check('Pencarian layanan berfungsi', searchResult.data?.items?.some((s) => s.slug === 'pembuatan-email-institusi'))
const categoryResult = await publicClient.get('/api/services?category=Keamanan')
check('Filter kategori layanan berfungsi', categoryResult.data?.items?.every((s) => s.category === 'Keamanan'))

const serviceDetail = await publicClient.get('/api/services/pembuatan-email-institusi')
check('Detail layanan 200', serviceDetail.status === 200)
check('Detail layanan memiliki fields dari DB', serviceDetail.data?.service?.fields?.length >= 5)
check('Layanan terkait memiliki dokumen SOP', serviceDetail.data?.service?.relatedDocuments?.length >= 1)

const documents = await publicClient.get('/api/documents')
check('Dokumen publik 200', documents.status === 200)
check('Dokumen seed tersedia', documents.data?.total >= 4)
const docDownload = await publicClient.get('/api/documents/sop-pengajuan-layanan-digital/download')
check('Unduh dokumen publik 200', docDownload.status === 200)
const unauthDocDownload = await publicClient.get('/api/documents/dokumen-uji-publikasi/download')
check('Dokumen unpublish tidak dapat diakses', unauthDocDownload.status === 404)

const platforms = await publicClient.get('/api/platforms?status=Pilot')
check('Filter status ekosistem berfungsi', platforms.data?.items?.every((p) => p.status === 'Pilot'))
const articles = await publicClient.get('/api/articles')
check('Publikasi publik hanya published', articles.data?.items?.every((a) => a.status === 'published'))
const sitemap = await publicClient.get('/sitemap.xml')
check('Sitemap tersedia', sitemap.status === 200 && sitemap.text.includes('<urlset'))
const robots = await publicClient.get('/robots.txt')
check('Robots memblokir area privat', robots.text.includes('Disallow: /admin') && robots.text.includes('Disallow: /permohonan-saya'))

console.log('\n=== Authentication & activation ===')
const badLogin = await login(admin, 'superadmin@digital.unu.local', 'wrong-password')
check('Login salah ditolak', badLogin.status === 401)
const adminLogin = await login(admin, 'superadmin@digital.unu.local', 'Admin#Unu2026')
check('Login superadmin berhasil', adminLogin.status === 200 && adminLogin.data?.user?.role === 'superadmin')
const applicantLogin = await login(applicant, 'pemohon@digital.unu.local', 'Pemohon#2026')
check('Login pemohon berhasil', applicantLogin.status === 200 && applicantLogin.data?.user?.role === 'pemohon')
const inactiveLogin = await login(new Client('inactive'), 'nonaktif@digital.unu.local', 'anything123')
check('Akun nonaktif tidak bisa login', inactiveLogin.status === 401 || inactiveLogin.status === 403)

const activationEmail = `e2e-${stamp}@digital.unu.local`
const newUser = await admin.post('/api/admin/users', {
  json: { name: 'Pengguna E2E', email: activationEmail, role: 'pemohon' }
})
check('Admin membuat pengguna nonaktif default', newUser.status === 200 && newUser.data?.user?.active === false)
const newUserId = newUser.data?.user?.id
const activate = await admin.patch(`/api/admin/users/${newUserId}`, { json: { active: true } })
check('Admin mengaktifkan pengguna & mengirim aktivasi', activate.status === 200 && activate.data?.emailStatus === 'simulated')
const mail = await latestMailFor(activationEmail)
check('Email aktivasi tersedia dengan token sekali pakai', Boolean(mail?.token))
const newClient = new Client('new-user')
const activation = await newClient.post('/api/auth/activate', {
  json: { token: mail?.token, password: 'AktivasiE2E#2026' }
})
check('Aktivasi akun berhasil', activation.status === 200 && activation.data?.user?.email === activationEmail)
const reuse = await new Client('reuse').post('/api/auth/activate', {
  json: { token: mail?.token, password: 'AktivasiE2E#2027' }
})
check('Token aktivasi tidak dapat dipakai dua kali', reuse.status === 410)
const newLogin = await login(newClient, activationEmail, 'AktivasiE2E#2026')
check('Pengguna hasil aktivasi dapat login', newLogin.status === 200)

console.log('\n=== Service request end-to-end ===')
const idem = `e2e-request-${stamp}-abcdef`
const payload = {
  nama_lengkap: 'Pemohon E2E',
  kategori_pemohon: 'mahasiswa',
  identitas_institusi: 'E2E12345',
  unit_kerja: 'Fakultas Uji',
  email_alternatif: 'pemohon.e2e@example.com',
  nomor_kontak: '081234567890',
  keterangan: 'Permohonan otomatis untuk pengujian end-to-end.'
}
const invalid = await applicant.post('/api/services/pembuatan-email-institusi/requests', {
  json: { nama_lengkap: '' },
  headers: { 'x-idempotency-key': `${idem}-invalid` }
})
check('Validasi server menolak field wajib kosong', invalid.status === 422)

const created = await applicant.post('/api/services/pembuatan-email-institusi/requests', {
  json: payload,
  headers: { 'x-idempotency-key': idem }
})
check('Permohonan berhasil dibuat', created.status === 200 && Boolean(created.data?.ticketNumber))
const requestId = created.data?.requestId
const ticket = created.data?.ticketNumber
check('Nomor tiket unik berformat benar', /^UNU-DTD-\d{4}-[A-Z0-9]{6}$/.test(ticket || ''))
const duplicate = await applicant.post('/api/services/pembuatan-email-institusi/requests', {
  json: payload,
  headers: { 'x-idempotency-key': idem }
})
check('Idempotensi mencegah permohonan duplikat', duplicate.status === 200 && duplicate.data?.duplicate === true && duplicate.data?.requestId === requestId)

const mine = await applicant.get('/api/requests/mine')
check('Permohonan muncul di daftar pemohon', mine.data?.items?.some((item) => item.id === requestId))
const ownerDetail = await applicant.get(`/api/requests/${requestId}`)
check('Pemohon dapat membuka detail miliknya', ownerDetail.status === 200 && ownerDetail.data?.request?.id === requestId)
const crossUserDetail = await newClient.get(`/api/requests/${requestId}`)
check('Pengguna lain tidak dapat membuka detail permohonan', crossUserDetail.status === 404)

const trackUrl = new URL(created.data?.trackingUrl)
const tracking = await publicClient.post('/api/track', {
  json: { ticket, token: trackUrl.searchParams.get('token') }
})
check('Tracking publik dengan token berhasil', tracking.status === 200 && tracking.data?.request?.ticketNumber === ticket)
const wrongTracking = await publicClient.post('/api/track', { json: { ticket, token: 'wrong-token-value' } })
check('Tracking dengan token salah ditolak', wrongTracking.status === 404)

const draft = await applicant.put('/api/requests/drafts/pembuatan-email-institusi', {
  json: { data: { nama_lengkap: 'Draft E2E', unit_kerja: 'Unit Draft' } }
})
check('Draft formulir tersimpan di database', draft.status === 200)
const draftRead = await applicant.get('/api/requests/drafts/pembuatan-email-institusi')
check('Draft formulir dapat dipulihkan', draftRead.data?.data?.nama_lengkap === 'Draft E2E')
await applicant.delete('/api/requests/drafts/pembuatan-email-institusi')
const draftDeleted = await applicant.get('/api/requests/drafts/pembuatan-email-institusi')
check('Draft dapat dihapus', !draftDeleted.data?.data?.nama_lengkap)

const adminDetail = await admin.get(`/api/admin/requests/${requestId}`)
check('Admin dapat membuka detail & data pemohon', adminDetail.status === 200 && adminDetail.data?.requester?.email === 'pemohon@digital.unu.local')
const verify = await admin.patch(`/api/admin/requests/${requestId}`, {
  json: { action: 'verify', note: 'Data awal diverifikasi.', publicNote: 'Permohonan diverifikasi.' }
})
check('Admin memverifikasi permohonan', verify.status === 200 && verify.data?.status === 'Diverifikasi')
const requestInfo = await admin.patch(`/api/admin/requests/${requestId}`, {
  json: { action: 'request_info', note: 'Mohon lengkapi surat keterangan aktif.' }
})
check('Admin meminta kelengkapan', requestInfo.status === 200 && requestInfo.data?.substatus === 'Menunggu Kelengkapan Pemohon')
const respond = await applicant.post(`/api/requests/${requestId}/respond`, {
  json: { message: 'Kelengkapan telah dikirim dan dikonfirmasi.' }
})
check('Pemohon melengkapi permohonan', respond.status === 200 && respond.data?.status === 'Diverifikasi')
const start = await admin.patch(`/api/admin/requests/${requestId}`, {
  json: { action: 'start', note: 'Permohonan mulai diproses.' }
})
check('Admin memulai proses', start.status === 200 && start.data?.status === 'Diproses')
const complete = await admin.patch(`/api/admin/requests/${requestId}`, {
  json: { action: 'complete', resolutionSummary: 'Akun email institusi berhasil disiapkan dan diuji.' }
})
check('Admin menyelesaikan permohonan', complete.status === 200 && complete.data?.status === 'Selesai')
const finalDetail = await applicant.get(`/api/requests/${requestId}`)
check('Timeline mencatat seluruh status', ['Diajukan', 'Diverifikasi', 'Diproses', 'Selesai'].every((s) => finalDetail.data?.request?.timeline?.some((t) => t.status === s)))
check('Hasil penyelesaian terlihat pemohon', finalDetail.data?.request?.resolutionSummary?.includes('berhasil disiapkan'))
const invalidTransition = await admin.patch(`/api/admin/requests/${requestId}`, { json: { action: 'start' } })
check('Perubahan status tidak sah ditolak', invalidTransition.status === 409)
const emptyReject = await admin.patch(`/api/admin/requests/${requestId}`, { json: { action: 'reject', reason: 'x' } })
check('Penolakan tanpa alasan memadai ditolak', emptyReject.status === 409 || emptyReject.status === 422)

console.log('\n=== Attachments & private file access ===')
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)
const fileRequestForm = new FormData()
fileRequestForm.append(
  'payload',
  JSON.stringify({
    jenis_kendala: 'tidak_dapat_akses',
    sistem_terdampak: 'Portal Akademik',
    deskripsi_masalah: 'Pengujian unggah lampiran melalui API.',
    waktu_kejadian: new Date().toISOString().slice(0, 10),
    tingkat_dampak: 'individu'
  })
)
fileRequestForm.append('screenshot', new Blob([png], { type: 'image/png' }), 'screenshot.png')
const fileRequest = await applicant.request('/api/services/bantuan-teknis-ti/requests', {
  method: 'POST',
  body: fileRequestForm,
  headers: { 'x-idempotency-key': `e2e-file-${stamp}-abcdef` }
})
check('Permohonan dengan lampiran berhasil', fileRequest.status === 200)
const fileRequestDetail = await applicant.get(`/api/requests/${fileRequest.data?.requestId}`)
const attachmentId = fileRequestDetail.data?.request?.attachments?.[0]?.id
check('Metadata lampiran tersimpan', Boolean(attachmentId))
const ownerDownload = await applicant.get(`/api/requests/attachments/${attachmentId}`)
check('Pemohon dapat mengunduh lampirannya', ownerDownload.status === 200 && ownerDownload.text.length > 0)
const crossDownload = await newClient.get(`/api/requests/attachments/${attachmentId}`)
check('Pengguna lain tidak dapat mengunduh lampiran', crossDownload.status === 403)
const anonymousDownload = await publicClient.get(`/api/requests/attachments/${attachmentId}`)
check('Anonim tidak dapat mengunduh lampiran privat', anonymousDownload.status === 401)
const fakePdf = new FormData()
fakePdf.append('payload', JSON.stringify({
  jenis_kendala: 'tidak_dapat_akses',
  sistem_terdampak: 'Portal',
  deskripsi_masalah: 'Menguji validasi isi file berbahaya.',
  waktu_kejadian: new Date().toISOString().slice(0, 10),
  tingkat_dampak: 'individu'
}))
fakePdf.append('screenshot', new Blob([Buffer.from('not a pdf')], { type: 'application/pdf' }), 'fake.pdf')
const malicious = await applicant.request('/api/services/bantuan-teknis-ti/requests', {
  method: 'POST',
  body: fakePdf,
  headers: { 'x-idempotency-key': `e2e-badfile-${stamp}` }
})
check('File dengan isi tidak cocok ditolak', malicious.status === 422)

console.log('\n=== RBAC, CSRF & admin views ===')
const pemohonAdminApi = await applicant.get('/api/admin/requests')
check('Pemohon ditolak dari API admin', pemohonAdminApi.status === 403)
const unauthAdminApi = await publicClient.get('/api/admin/requests')
check('Anonim ditolak dari API admin', unauthAdminApi.status === 401)
const csrfMissing = await applicant.request(`/api/admin/requests/${requestId}`, {
  method: 'PATCH',
  json: { action: 'verify' },
  csrf: false
})
check('Mutasi tanpa penanda CSRF ditolak', csrfMissing.status === 403)
const adminPage = await admin.get('/admin')
check('Admin dapat membuka dashboard', adminPage.status === 200)
check('Halaman admin noindex', adminPage.text.includes('noindex'))
const applicantAdminPage = await applicant.get('/admin')
check('Pemohon dialihkan dari halaman admin', applicantAdminPage.status === 302)

console.log('\n=== CMS, versioning, documents & XSS ===')
const servicesAdmin = await admin.get('/api/admin/services')
const emailService = servicesAdmin.data?.items?.find((service) => service.slug === 'pembuatan-email-institusi')
const serviceAdminDetail = await admin.get(`/api/admin/services/${emailService.id}`)
const originalVersion = serviceAdminDetail.data?.service?.formVersion
const oldSnapshot = await applicant.get(`/api/requests/${requestId}`)
const testField = {
  key: `field_uji_${stamp}`,
  label: 'Field Uji Versi',
  type: 'text',
  required: false,
  order: serviceAdminDetail.data.service.fields.length,
  placeholder: '',
  helpText: '',
  minLength: null,
  maxLength: 100,
  pattern: '',
  options: [],
  fileMaxMB: 10,
  accept: [],
  showIf: null
}
const updatedForm = await admin.patch(`/api/admin/services/${emailService.id}`, {
  json: { fields: [...serviceAdminDetail.data.service.fields, testField] }
})
check('Perubahan formulir membuat versi baru', updatedForm.status === 200 && updatedForm.data?.service?.formVersion === originalVersion + 1)
const oldSnapshotAfter = await applicant.get(`/api/requests/${requestId}`)
check('Permohonan lama memakai snapshot formulir lama', oldSnapshotAfter.data?.request?.formSnapshot?.version === oldSnapshot.data?.request?.formSnapshot?.version)
check('Field baru tidak masuk snapshot lama', !oldSnapshotAfter.data?.request?.formSnapshot?.fields?.some((f) => f.key === testField.key))

const pdfPath = resolve(process.cwd(), '.data', 'uploads', 'documents')
const pdfDirs = await readdir(pdfPath)
let pdfBytes = null
for (const dir of pdfDirs) {
  const files = await readdir(join(pdfPath, dir))
  const pdf = files.find((file) => file.endsWith('.pdf'))
  if (pdf) {
    pdfBytes = await readFile(join(pdfPath, dir, pdf))
    break
  }
}
check('Fixture PDF tersedia untuk pengujian dokumen', Boolean(pdfBytes))
const docForm = new FormData()
docForm.append(
  'metadata',
  JSON.stringify({
    title: 'Dokumen E2E Publikasi',
    slug: `dokumen-e2e-${stamp}`,
    category: 'Panduan',
    description: 'Dokumen otomatis untuk pengujian publikasi.',
    version: '1.0',
    published: true
  })
)
docForm.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'dokumen-e2e.pdf')
const docCreated = await admin.request('/api/admin/documents', { method: 'POST', body: docForm })
check('Admin mengunggah dokumen', docCreated.status === 200)
const docSlug = `dokumen-e2e-${stamp}`
const docPublic = await publicClient.get(`/api/documents/${docSlug}`)
check('Dokumen terbit tampil publik', docPublic.status === 200)
const docUnpublish = await admin.patch(`/api/admin/documents/${docCreated.data?.document?.id}`, { json: { published: false } })
check('Admin dapat unpublish dokumen', docUnpublish.status === 200 && docUnpublish.data?.document?.published === false)
const docAfterUnpublish = await publicClient.get(`/api/documents/${docSlug}`)
check('Dokumen unpublish tidak lagi publik', docAfterUnpublish.status === 404)

const xssArticle = await admin.post('/api/admin/articles', {
  json: {
    title: `Artikel E2E ${stamp}`,
    slug: `artikel-e2e-${stamp}`,
    excerpt: 'Pengujian sanitasi konten berbahaya.',
    content: '## Judul aman\n\n<script>alert("xss")</script>\n\nKonten aman.',
    category: 'Pengujian',
    status: 'published'
  }
})
check('Admin membuat publikasi', xssArticle.status === 200)
check('Konten berbahaya disanitasi saat disimpan', !xssArticle.data?.article?.content?.includes('<script'))
const xssPublic = await publicClient.get(`/api/articles/artikel-e2e-${stamp}`)
check('Publikasi XSS tersanitasi di endpoint publik', xssPublic.status === 200 && !xssPublic.text.includes('<script>alert'))

const platformsAdmin = await admin.get('/api/admin/platforms')
check('Admin dapat membaca ekosistem', platformsAdmin.status === 200)
const programsAdmin = await admin.get('/api/admin/programs')
check('Admin dapat membaca program', programsAdmin.status === 200)
const pagesAdmin = await admin.get('/api/admin/pages')
check('Admin dapat membaca halaman', pagesAdmin.status === 200)
const rolesAdmin = await admin.get('/api/admin/roles')
check('Admin dapat membaca role & permission', rolesAdmin.status === 200 && rolesAdmin.data?.roles?.length === 3)
const audit = await admin.get('/api/admin/audit')
check('Audit log mencatat aktivitas', audit.status === 200 && audit.data?.total > 5)
const notifications = await admin.get('/api/admin/notifications')
check('Log notifikasi mencatat pengiriman', notifications.status === 200 && notifications.data?.total > 3)
check('Log notifikasi bukan penyimpanan token', !JSON.stringify(notifications.data).includes('aktivasi?token='))

console.log('\n=== Guest submission & tracking without account ===')
const guestEmail = `guest-${stamp}@example.com`
const guestIdem = `guest-${stamp}-abcdef`
const guestCreate = await publicClient.post('/api/services/bantuan-teknis-ti/requests', {
  json: {
    requester: { name: 'Pemohon Tanpa Akun', email: guestEmail, phone: '081200000000' },
    data: {
      jenis_kendala: 'tidak_dapat_akses',
      sistem_terdampak: 'Portal Akademik',
      deskripsi_masalah: 'Pengujian pengajuan tanpa akun melalui API.',
      waktu_kejadian: new Date().toISOString().slice(0, 10),
      tingkat_dampak: 'individu'
    }
  },
  headers: { 'x-idempotency-key': guestIdem }
})
check('Pengajuan tanpa login berhasil', guestCreate.status === 200 && Boolean(guestCreate.data?.ticketNumber))
const guestTicket = guestCreate.data?.ticketNumber
const guestRequestId = guestCreate.data?.requestId
const guestTrackingUrl = new URL(guestCreate.data?.trackingUrl)
const guestToken = guestTrackingUrl.searchParams.get('token')
check('Hasil pengajuan guest menyertakan ID dan tautan lacak', Boolean(guestTicket) && Boolean(guestToken))
const guestTrack = await publicClient.post('/api/track', { json: { ticket: guestTicket, token: guestToken } })
check('Guest dapat melacak tanpa login', guestTrack.status === 200 && guestTrack.data?.request?.ticketNumber === guestTicket)
const guestAdminDetail = await admin.get(`/api/admin/requests/${guestRequestId}`)
check('Admin melihat kontak pemohon guest', guestAdminDetail.data?.requester?.email === guestEmail)
await admin.patch(`/api/admin/requests/${guestRequestId}`, { json: { action: 'verify', note: 'Diverifikasi.' } })
const guestInfo = await admin.patch(`/api/admin/requests/${guestRequestId}`, { json: { action: 'request_info', note: 'Mohon lengkapi dokumen pendukung.' } })
check('Admin dapat meminta kelengkapan guest', guestInfo.status === 200 && guestInfo.data?.substatus === 'Menunggu Kelengkapan Pemohon')
const guestRespond = await publicClient.post('/api/track/respond', {
  json: { ticket: guestTicket, token: guestToken, message: 'Kelengkapan telah dikirim oleh pemohon tanpa akun.' }
})
check('Guest dapat mengirim kelengkapan lewat tracking', guestRespond.status === 200 && guestRespond.data?.status === 'Diverifikasi')
const guestComment = await publicClient.post('/api/track/comments', {
  json: { ticket: guestTicket, token: guestToken, message: 'Terima kasih, saya menunggu proses berikutnya.' }
})
check('Guest dapat berkomunikasi lewat tracking', guestComment.status === 200)
const guestTrackAfter = await publicClient.post('/api/track', { json: { ticket: guestTicket, token: guestToken } })
check('Komunikasi guest terlihat pada tracking', guestTrackAfter.data?.request?.comments?.some((comment) => comment.message.includes('menunggu proses')))

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${passed} checks passed, ${failures.length} failed`)
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2))
  process.exit(1)
}

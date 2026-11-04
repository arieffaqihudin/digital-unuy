import { readFile, readdir } from 'node:fs/promises'
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
    try {
      const content = JSON.parse(await readFile(join(folder, file), 'utf8'))
      if (content.to === email) {
        const match = content.html.match(/aktivasi\?token=([^"&<]+)/)
        if (match) return { token: decodeURIComponent(match[1]), content }
      }
    } catch {
      // Skip unrelated or incomplete mail sink files.
    }
  }
  return null
}

const publicClient = new Client('public')
const admin = new Client('superadmin')

console.log('\n=== Public website & CMS content ===')
const home = await publicClient.get('/api/home')
check('Homepage API 200', home.status === 200)
check('Homepage memuat layanan', home.data?.services?.length >= 6)
check('Homepage memuat ekosistem', home.data?.platforms?.length >= 1)
check('Homepage tidak menampilkan metrik belum terverifikasi', Array.isArray(home.data?.metrics) && home.data.metrics.every((m) => m.verified))
const aboutPage = await publicClient.get('/tentang')
check('Halaman Tentang menampilkan narasi visual', aboutPage.text.includes('Teknologi Bukan Tujuan') && aboutPage.text.includes('Tiga Siklus. Satu Ekosistem.'))
check('Halaman Tentang menampilkan dampak historis', aboutPage.text.includes('Yang Kami Bangun Harus Memberi Dampak'))
const publicSearch = await publicClient.get('/api/search?q=layanan')
check('Pencarian publik mengembalikan hasil', publicSearch.status === 200 && publicSearch.data?.items?.length > 0)
check('Pencarian hanya mengembalikan jenis konten publik', publicSearch.data?.items?.every((item) => ['service', 'platform', 'document', 'article', 'page'].includes(item.type)))
check('Filter jenis pencarian berfungsi', (await publicClient.get('/api/search?q=layanan&type=service')).data?.items?.every((item) => item.type === 'service'))
check('Pencarian mengecualikan dokumen belum terbit', (await publicClient.get('/api/search?q=Dokumen%20E2E%20Publikasi')).data?.total === 0)
check('Halaman hasil pencarian tersedia', (await publicClient.get('/pencarian?q=layanan')).text.includes('Hasil Pencarian'))

const serviceList = await publicClient.get('/api/services')
check('Katalog layanan 200', serviceList.status === 200)
check('Katalog memiliki 8 layanan', serviceList.data?.total === 8, `total=${serviceList.data?.total}`)
check('Pencarian layanan berfungsi', (await publicClient.get('/api/services?q=email')).data?.items?.some((s) => s.slug === 'pembuatan-email-institusi'))
check('Filter kategori layanan berfungsi', (await publicClient.get('/api/services?category=Keamanan')).data?.items?.every((s) => s.category === 'Keamanan'))

const serviceDetail = await publicClient.get('/api/services/pembuatan-email-institusi')
check('Detail layanan 200', serviceDetail.status === 200)
check('Detail layanan memiliki fields dari DB', serviceDetail.data?.service?.fields?.length >= 5)
check('Layanan terkait memiliki dokumen SOP', serviceDetail.data?.service?.relatedDocuments?.length >= 1)

const documents = await publicClient.get('/api/documents')
check('Dokumen publik 200', documents.status === 200)
check('Dokumen seed tersedia', documents.data?.total >= 4)
check('Unduh dokumen publik 200', (await publicClient.get('/api/documents/sop-pengajuan-layanan-digital/download')).status === 200)
check('Dokumen unpublish tidak dapat diakses', (await publicClient.get('/api/documents/dokumen-uji-publikasi/download')).status === 404)
const ecosystem = await publicClient.get('/api/platforms')
check('Ekosistem memiliki empat kategori utama', ecosystem.data?.categories?.length === 4)
check('Ekosistem menampilkan 10 produk utama', ecosystem.data?.total === 10, `total=${ecosystem.data?.total}`)
check('Filter kategori ekosistem berfungsi', (await publicClient.get('/api/platforms?category=akademik-pembelajaran')).data?.total === 4)
check('Filter sasaran pengguna berfungsi', (await publicClient.get('/api/platforms?audience=Mahasiswa')).data?.items?.every((p) => p.audiences.includes('Mahasiswa')))
check('Kombinasi filter kategori dan pengguna berfungsi', (await publicClient.get('/api/platforms?category=akademik-pembelajaran&audience=Mahasiswa')).data?.total === 1)
const ecosystemDetail = await publicClient.get('/api/platforms/portal-pegawai-green-team')
check('Detail produk ekosistem dapat dibuka', ecosystemDetail.status === 200)
check('Modul Green Team tampil pada produk induk', ecosystemDetail.data?.platform?.modules?.length === 4)
check('Produk nonpublik tidak tampil di API publik', !ecosystem.data?.items?.some((p) => p.slug === 'portal-akademik-terpadu'))
check('Publikasi publik hanya published', (await publicClient.get('/api/articles')).data?.items?.every((a) => a.status === 'published'))
check('Halaman Tim Kami publik 200', (await publicClient.get('/api/team')).status === 200)
check('Sitemap tersedia', (await publicClient.get('/sitemap.xml')).text.includes('/tentang-kami/tim'))
const robots = await publicClient.get('/robots.txt')
check('Robots memblokir area privat', robots.text.includes('Disallow: /admin') || /Disallow: \/\s*(\n|$)/.test(robots.text))
check('Halaman permohonan lama tidak tersedia', (await publicClient.get('/permohonan-saya')).status === 404)
check('API dashboard pemohon lama tidak tersedia', (await publicClient.get('/api/requests/mine')).status === 404)

console.log('\n=== Authentication staf & activation ===')
check('Login salah ditolak', (await login(admin, 'superadmin@digital.unu.local', 'wrong-password')).status === 401)
const adminLogin = await login(admin, 'superadmin@digital.unu.local', 'Admin#Unu2026')
check('Login superadmin berhasil', adminLogin.status === 200 && adminLogin.data?.user?.role === 'superadmin')
check('Login tanpa email ditolak', (await publicClient.post('/api/auth/login', { json: { email: '', password: '' } })).status === 400)

const activationEmail = `e2e-${stamp}@digital.unu.local`
const newUser = await admin.post('/api/admin/users', {
  json: { name: 'Admin E2E', email: activationEmail, role: 'admin' }
})
check('Admin membuat pengguna nonaktif default', newUser.status === 200 && newUser.data?.user?.active === false)
const newUserId = newUser.data?.user?.id
const inactiveLogin = await login(new Client('inactive'), activationEmail, 'AktivasiE2E#2026')
check('Akun nonaktif tidak bisa login', inactiveLogin.status === 401 || inactiveLogin.status === 403)
const activate = await admin.patch(`/api/admin/users/${newUserId}`, { json: { active: true } })
check('Admin mengaktifkan pengguna & mengirim aktivasi', activate.status === 200 && activate.data?.emailStatus === 'simulated')
const mail = await latestMailFor(activationEmail)
check('Email aktivasi tersedia dengan token sekali pakai', Boolean(mail?.token))
const newClient = new Client('new-admin')
const activation = await newClient.post('/api/auth/activate', { json: { token: mail?.token, password: 'AktivasiE2E#2026' } })
check('Aktivasi akun staf berhasil', activation.status === 200 && activation.data?.user?.email === activationEmail)
check('Token aktivasi tidak dapat dipakai dua kali', (await new Client('reuse').post('/api/auth/activate', { json: { token: mail?.token, password: 'AktivasiE2E#2027' } })).status === 410)
check('Pengguna hasil aktivasi dapat login', (await login(newClient, activationEmail, 'AktivasiE2E#2026')).status === 200)
check('Token aktivasi tidak tersimpan di notifikasi', !JSON.stringify((await admin.get('/api/admin/notifications')).data).includes('aktivasi?token='))

console.log('\n=== Guest submission end-to-end ===')
const guestEmail = `guest-${stamp}@example.com`
const idem = `e2e-request-${stamp}-abcdef`
const invalid = await publicClient.post('/api/services/pembuatan-email-institusi/requests', {
  json: { requester: { name: 'Guest E2E', email: guestEmail }, data: { nama_lengkap: '' } },
  headers: { 'x-idempotency-key': `${idem}-invalid` }
})
check('Validasi server menolak field wajib kosong', invalid.status === 422)
const created = await publicClient.post('/api/services/pembuatan-email-institusi/requests', {
  json: {
    requester: { name: 'Guest E2E', email: guestEmail, phone: '081234567890' },
    data: {
      nama_lengkap: 'Guest E2E',
      kategori_pemohon: 'mahasiswa',
      identitas_institusi: 'E2E12345',
      unit_kerja: 'Fakultas Uji',
      email_alternatif: guestEmail,
      nomor_kontak: '081234567890',
      keterangan: 'Permohonan otomatis untuk pengujian end-to-end.'
    }
  },
  headers: { 'x-idempotency-key': idem }
})
check('Permohonan tanpa login berhasil dibuat', created.status === 200 && Boolean(created.data?.ticketNumber))
const requestId = created.data?.requestId
const ticket = created.data?.ticketNumber
check('Nomor tiket unik berformat benar', /^UNU-DTD-\d{4}-[A-Z0-9]{6}$/.test(ticket || ''))
const duplicate = await publicClient.post('/api/services/pembuatan-email-institusi/requests', {
  json: { requester: { name: 'Guest E2E', email: guestEmail }, data: {} },
  headers: { 'x-idempotency-key': idem }
})
check('Idempotensi mencegah permohonan duplikat', duplicate.status === 200 && duplicate.data?.duplicate === true && duplicate.data?.requestId === requestId)
const trackUrl = new URL(created.data?.trackingUrl)
const trackingToken = trackUrl.searchParams.get('token')
check('Respons pengajuan memuat tautan tracking aman', Boolean(trackingToken))
const tracking = await publicClient.post('/api/track', { json: { ticket, token: trackingToken } })
check('Tracking publik dengan token berhasil', tracking.status === 200 && tracking.data?.request?.ticketNumber === ticket)
check('Tracking dengan token salah ditolak', (await publicClient.post('/api/track', { json: { ticket, token: 'wrong-token-value' } })).status === 404)

const adminDetail = await admin.get(`/api/admin/requests/${requestId}`)
check('Admin dapat membuka detail & kontak guest', adminDetail.status === 200 && adminDetail.data?.requester?.email === guestEmail)
check('Admin memverifikasi permohonan', (await admin.patch(`/api/admin/requests/${requestId}`, { json: { action: 'verify', note: 'Diverifikasi.' } })).data?.status === 'Diverifikasi')
const info = await admin.patch(`/api/admin/requests/${requestId}`, { json: { action: 'request_info', note: 'Mohon lengkapi surat keterangan aktif.' } })
check('Admin meminta kelengkapan', info.data?.substatus === 'Menunggu Kelengkapan Pemohon')
const respond = await publicClient.post('/api/track/respond', {
  json: { ticket, token: trackingToken, message: 'Kelengkapan telah dikirim melalui tracking publik.' }
})
check('Guest melengkapi permohonan lewat tracking', respond.status === 200 && respond.data?.status === 'Diverifikasi')
check('Admin memulai proses', (await admin.patch(`/api/admin/requests/${requestId}`, { json: { action: 'start', note: 'Mulai diproses.' } })).data?.status === 'Diproses')
check('Admin menyelesaikan permohonan', (await admin.patch(`/api/admin/requests/${requestId}`, { json: { action: 'complete', resolutionSummary: 'Permohonan selesai diuji end-to-end.' } })).data?.status === 'Selesai')
const finalTrack = await publicClient.post('/api/track', { json: { ticket, token: trackingToken } })
check('Timeline guest mencatat seluruh status', ['Diajukan', 'Diverifikasi', 'Diproses', 'Selesai'].every((status) => finalTrack.data?.request?.timeline?.some((entry) => entry.status === status)))
check('Hasil penyelesaian terlihat guest', finalTrack.data?.request?.resolutionSummary?.includes('selesai diuji'))
check('Perubahan status tidak sah ditolak', (await admin.patch(`/api/admin/requests/${requestId}`, { json: { action: 'start' } })).status === 409)

console.log('\n=== Attachments, private files & guest tracking actions ===')
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
const fileForm = new FormData()
fileForm.append('__requester', JSON.stringify({ name: 'Guest File', email: `file-${stamp}@example.com`, phone: '' }))
fileForm.append('payload', JSON.stringify({
  jenis_kendala: 'tidak_dapat_akses',
  sistem_terdampak: 'Portal Akademik',
  deskripsi_masalah: 'Pengujian unggah lampiran tanpa akun.',
  waktu_kejadian: new Date().toISOString().slice(0, 10),
  tingkat_dampak: 'individu'
}))
fileForm.append('screenshot', new Blob([png], { type: 'image/png' }), 'screenshot.png')
const fileRequest = await publicClient.request('/api/services/bantuan-teknis-ti/requests', {
  method: 'POST',
  body: fileForm,
  headers: { 'x-idempotency-key': `e2e-file-${stamp}-abcdef` }
})
check('Permohonan guest dengan lampiran berhasil', fileRequest.status === 200)
const fileDetail = await admin.get(`/api/admin/requests/${fileRequest.data?.requestId}`)
const attachmentId = fileDetail.data?.request?.attachments?.[0]?.id
check('Metadata lampiran tersimpan', Boolean(attachmentId))
check('Staf dapat mengunduh lampiran', (await admin.get(`/api/requests/attachments/${attachmentId}`)).status === 200)
check('Anonim tidak dapat mengunduh lampiran privat', (await publicClient.get(`/api/requests/attachments/${attachmentId}`)).status === 401)
const fakePdf = new FormData()
fakePdf.append('__requester', JSON.stringify({ name: 'Guest Bad File', email: `bad-${stamp}@example.com`, phone: '' }))
fakePdf.append('payload', JSON.stringify({
  jenis_kendala: 'tidak_dapat_akses',
  sistem_terdampak: 'Portal',
  deskripsi_masalah: 'Menguji validasi isi file berbahaya.',
  waktu_kejadian: new Date().toISOString().slice(0, 10),
  tingkat_dampak: 'individu'
}))
fakePdf.append('screenshot', new Blob([Buffer.from('not a pdf')], { type: 'application/pdf' }), 'fake.pdf')
check('File dengan isi tidak cocok ditolak', (await publicClient.request('/api/services/bantuan-teknis-ti/requests', {
  method: 'POST',
  body: fakePdf,
  headers: { 'x-idempotency-key': `e2e-badfile-${stamp}` }
})).status === 422)
const comment = await publicClient.post('/api/track/comments', {
  json: { ticket, token: trackingToken, message: 'Terima kasih, saya menunggu informasi berikutnya.' }
})
check('Guest dapat berkomunikasi lewat tracking', comment.status === 200)

console.log('\n=== RBAC, CSRF & admin views ===')
check('Anonim ditolak dari API admin', (await publicClient.get('/api/admin/requests')).status === 401)
check('Mutasi tanpa penanda CSRF ditolak', (await admin.request(`/api/admin/requests/${requestId}`, { method: 'PATCH', json: { action: 'verify' }, csrf: false })).status === 403)
const adminPage = await admin.get('/admin')
check('Admin dapat membuka dashboard', adminPage.status === 200)
check('Halaman admin noindex', adminPage.text.includes('noindex'))
check('Halaman login tidak memuat footer publik', !(await publicClient.get('/masuk')).text.includes('Hak cipta dilindungi'))

console.log('\n=== CMS, versioning, documents & XSS ===')
const servicesAdmin = await admin.get('/api/admin/services')
const emailService = servicesAdmin.data?.items?.find((service) => service.slug === 'pembuatan-email-institusi')
const serviceAdminDetail = await admin.get(`/api/admin/services/${emailService.id}`)
const originalVersion = serviceAdminDetail.data?.service?.formVersion
const oldTrack = await publicClient.post('/api/track', { json: { ticket, token: trackingToken } })
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
const updatedForm = await admin.patch(`/api/admin/services/${emailService.id}`, { json: { fields: [...serviceAdminDetail.data.service.fields, testField] } })
check('Perubahan formulir membuat versi baru', updatedForm.status === 200 && updatedForm.data?.service?.formVersion === originalVersion + 1)
const oldTrackAfter = await publicClient.post('/api/track', { json: { ticket, token: trackingToken } })
check('Permohonan lama memakai snapshot formulir lama', oldTrackAfter.data?.request?.formSnapshot?.version === oldTrack.data?.request?.formSnapshot?.version)
check('Field baru tidak masuk snapshot lama', !oldTrackAfter.data?.request?.formSnapshot?.fields?.some((field) => field.key === testField.key))

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
docForm.append('metadata', JSON.stringify({
  title: 'Dokumen E2E Publikasi',
  slug: `dokumen-e2e-${stamp}`,
  category: 'Panduan',
  description: 'Dokumen otomatis untuk pengujian publikasi.',
  version: '1.0',
  published: true
}))
docForm.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'dokumen-e2e.pdf')
const docCreated = await admin.request('/api/admin/documents', { method: 'POST', body: docForm })
check('Admin mengunggah dokumen', docCreated.status === 200)
const docSlug = `dokumen-e2e-${stamp}`
check('Dokumen terbit tampil publik', (await publicClient.get(`/api/documents/${docSlug}`)).status === 200)
check('Admin dapat unpublish dokumen', (await admin.patch(`/api/admin/documents/${docCreated.data?.document?.id}`, { json: { published: false } })).data?.document?.published === false)
check('Dokumen unpublish tidak lagi publik', (await publicClient.get(`/api/documents/${docSlug}`)).status === 404)

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
check('Publikasi XSS tersanitasi di endpoint publik', !(await publicClient.get(`/api/articles/artikel-e2e-${stamp}`)).text.includes('<script>alert'))
await admin.patch(`/api/admin/articles/${xssArticle.data?.article?.id}`, { json: { status: 'draft' } })

console.log('\n=== Team CMS ===')
const finalTeamGroups = await admin.get('/api/admin/team/groups')
check('Kelompok tim menggunakan empat struktur final', JSON.stringify(finalTeamGroups.data?.items?.map((item) => item.name)) === JSON.stringify(['Pimpinan', 'Product', 'Engineering', 'Design']))
const group = await admin.post('/api/admin/team/groups', { json: { name: `Kelompok E2E ${stamp}`, order: 1 } })
check('Admin membuat kelompok tim', group.status === 200)
const teamFormData = new FormData()
teamFormData.append('metadata', JSON.stringify({
  name: 'Anggota E2E',
  position: 'Pengujian Tim',
  unit: 'QA',
  bio: 'Data sementara pengujian modul Tim Kami.',
  groupId: group.data?.group?.id,
  order: 1,
  published: true,
  focalX: 50,
  focalY: 40
}))
teamFormData.append('photo', new Blob([png], { type: 'image/png' }), 'foto.png')
const member = await admin.request('/api/admin/team/members', { method: 'POST', body: teamFormData })
check('Admin menambahkan anggota tim dengan foto', member.status === 200 && Boolean(member.data?.member?.photoUrl))
check('Anggota baru otomatis tidak dipublikasikan', member.data?.member?.published === false)
check('Anggota baru belum tampil di API publik', !(await publicClient.get('/api/team')).data?.groups?.some((g) => g.members.some((m) => m.name === 'Anggota E2E')))
check('Foto anggota baru belum dapat diakses publik', (await publicClient.get(`/api/team/members/${member.data?.member?.id}/photo`)).status === 404)
check('Kelompok yang masih dipakai tidak dapat dihapus', (await admin.delete(`/api/admin/team/groups/${group.data?.group?.id}`)).status === 409)
const publishedMember = await admin.patch(`/api/admin/team/members/${member.data?.member?.id}`, { json: { published: true } })
check('Admin dapat mempublikasikan anggota', publishedMember.data?.member?.published === true)
check('Anggota publik tampil di API tim', (await publicClient.get('/api/team')).data?.groups?.some((g) => g.members.some((m) => m.name === 'Anggota E2E')))
check('Foto anggota dapat diakses publik setelah dipublikasikan', (await publicClient.get(`/api/team/members/${member.data?.member?.id}/photo`)).status === 200)
check('Admin dapat unpublish anggota', (await admin.patch(`/api/admin/team/members/${member.data?.member?.id}`, { json: { published: false } })).data?.member?.published === false)
check('Anggota nonaktif tidak tampil publik', !(await publicClient.get('/api/team')).data?.groups?.some((g) => g.members.some((m) => m.name === 'Anggota E2E')))
const teamAudit = await admin.get('/api/admin/audit?pageSize=30')
check('Audit mencatat status publikasi sebelum dan sesudah', teamAudit.data?.items?.some((item) =>
  item.action === 'team_member.updated' &&
  item.metadata?.publishedBefore === false &&
  item.metadata?.publishedAfter === true
))
check('Admin menghapus anggota', (await admin.delete(`/api/admin/team/members/${member.data?.member?.id}`)).status === 200)
check('Admin menghapus kelompok', (await admin.delete(`/api/admin/team/groups/${group.data?.group?.id}`)).status === 200)
check('Foto lama dibersihkan setelah penghapusan', (await publicClient.get(`/api/team/members/${member.data?.member?.id}/photo`)).status === 404)

console.log('\n=== Administration ===')
check('Admin dapat membaca role & permission', (await admin.get('/api/admin/roles')).data?.roles?.length === 2)
check('Audit log mencatat aktivitas', (await admin.get('/api/admin/audit')).data?.total > 5)
const notifications = await admin.get('/api/admin/notifications')
check('Pusat notifikasi mengembalikan aktivitas permohonan', notifications.status === 200 && Array.isArray(notifications.data?.items) && notifications.data.items.length > 0 && notifications.data.items.every((item) => item.href.startsWith('/admin/permohonan/')))
check('Notifikasi bukan log email dan tidak memuat token', !JSON.stringify(notifications.data).includes('recipient') && !JSON.stringify(notifications.data).includes('aktivasi?token='))

console.log(`\n${failures.length ? 'FAILED' : 'PASSED'}: ${passed} checks passed, ${failures.length} failed`)
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2))
  process.exit(1)
}

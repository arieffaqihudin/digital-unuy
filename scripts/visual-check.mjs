import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const base = process.env.BASE_URL || 'http://localhost:3000'
const chromePath =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const output = resolve(process.cwd(), '.data', 'screenshots')
await mkdir(output, { recursive: true })

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
const results = []
let failed = false

async function auditPage(page, path, name, viewport) {
  const errors = []
  const pageErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const overflow = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }))
  const hasHorizontalOverflow = overflow.scrollWidth > overflow.width + 1
  const status = response?.status() ?? 0
  const entry = {
    name,
    viewport,
    path,
    status,
    horizontalOverflow: hasHorizontalOverflow,
    consoleErrors: [...new Set(errors)],
    pageErrors: [...new Set(pageErrors)]
  }
  results.push(entry)
  if (status >= 400 || hasHorizontalOverflow || pageErrors.length) failed = true
  await page.screenshot({
    path: resolve(output, `${name}-${viewport}.png`),
    fullPage: true
  })
}

async function login(page, email, password) {
  await page.goto(`${base}/masuk`, { waitUntil: 'networkidle' })
  await page.fill('#login-email', email)
  await page.fill('#login-password', password)
  await Promise.all([page.waitForURL(/\/admin/, { timeout: 15000 }), page.click('button[type="submit"]')])
  await page.waitForLoadState('networkidle')
}

const publicPages = [
  ['/', 'home'],
  ['/tentang', 'about'],
  ['/layanan', 'services'],
  ['/layanan/pembuatan-email-institusi', 'service-detail'],
  ['/ekosistem-digital', 'ecosystem'],
  ['/dokumen', 'documents'],
  ['/dokumen/sop-pengajuan-layanan-digital', 'document-detail'],
  ['/publikasi', 'publications'],
  ['/publikasi/menata-layanan-digital-satu-alur-jelas', 'publication-detail'],
  ['/lacak', 'tracking'],
  ['/masuk', 'login']
]

for (const viewport of ['mobile', 'desktop']) {
  const context = await browser.newContext({
    viewport: viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: 1
  })
  const page = await context.newPage()
  for (const [path, name] of publicPages) {
    await auditPage(page, path, name, viewport)
  }
  await context.close()
}

const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const adminPage = await adminContext.newPage()
await login(adminPage, 'superadmin@digital.unu.local', 'Admin#Unu2026')
const adminPages = [
  ['/admin', 'admin-dashboard'],
  ['/admin/permohonan', 'admin-requests'],
  ['/admin/layanan', 'admin-services'],
  ['/admin/layanan/baru', 'admin-service-new'],
  ['/admin/ekosistem', 'admin-ecosystem'],
  ['/admin/tim', 'admin-team'],
  ['/admin/program', 'admin-programs'],
  ['/admin/publikasi', 'admin-publications'],
  ['/admin/halaman', 'admin-pages'],
  ['/admin/dokumen', 'admin-documents'],
  ['/admin/pengguna', 'admin-users'],
  ['/admin/akses', 'admin-access'],
  ['/admin/pengaturan', 'admin-settings'],
  ['/admin/notifikasi', 'admin-notifications'],
  ['/admin/audit', 'admin-audit']
]
for (const [path, name] of adminPages) {
  await auditPage(adminPage, path, name, 'desktop')
}
await adminContext.close()

const mobileAdminContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const mobileAdminPage = await mobileAdminContext.newPage()
await login(mobileAdminPage, 'superadmin@digital.unu.local', 'Admin#Unu2026')
for (const [path, name] of [
  ['/admin', 'admin-dashboard'],
  ['/admin/permohonan', 'admin-requests'],
  ['/admin/layanan', 'admin-services'],
  ['/admin/pengguna', 'admin-users'],
  ['/admin/pengaturan', 'admin-settings']
]) {
  await auditPage(mobileAdminPage, path, `${name}-mobile`, 'mobile')
}
await mobileAdminContext.close()

const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const guestPage = await guestContext.newPage()
await auditPage(guestPage, '/layanan/pembuatan-email-institusi/ajukan', 'request-form-mobile', 'mobile')
await auditPage(guestPage, '/tentang-kami/tim', 'team-mobile', 'mobile')
await guestContext.close()

await browser.close()

console.log(JSON.stringify(results, null, 2))
const problems = results.filter(
  (item) => item.status >= 400 || item.horizontalOverflow || item.pageErrors.length
)
console.log(`\n${problems.length ? 'FAILED' : 'PASSED'}: ${results.length} page checks`)
if (problems.length) {
  console.error(JSON.stringify(problems, null, 2))
  process.exit(1)
}

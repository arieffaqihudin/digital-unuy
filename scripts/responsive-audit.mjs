import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const base = process.env.BASE_URL || 'http://localhost:3000'
const chromePath =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const screenshots = resolve(process.cwd(), '.data', 'screenshots', 'responsive')
await mkdir(screenshots, { recursive: true })

const viewports = [
  { name: '320', width: 320, height: 800 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '820', width: 820, height: 1180 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 }
]

const corePublicPages = [
  ['/', 'home'],
  ['/layanan', 'services'],
  ['/layanan/pembuatan-email-institusi', 'service-detail'],
  ['/ekosistem-digital', 'ecosystem'],
  ['/ekosistem-digital/portal-pegawai-green-team', 'ecosystem-detail'],
  ['/pencarian?q=layanan', 'search'],
  ['/dokumen', 'documents'],
  ['/publikasi', 'publications']
]

const extraPublicPages = [
  ['/tentang', 'about'],
  ['/dokumen/sop-pengajuan-layanan-digital', 'document-detail'],
  ['/publikasi/menata-layanan-digital-satu-alur-jelas', 'publication-detail'],
  ['/program/penyederhanaan-alur-pengajuan-layanan', 'program-detail'],
  ['/tentang-kami/tim', 'team'],
  ['/masuk', 'login'],
  ['/lacak', 'tracking']
]

const adminPages = [
  ['/admin', 'admin-dashboard'],
  ['/admin/layanan', 'admin-services'],
  ['/admin/permohonan', 'admin-requests'],
  ['/admin/pengguna', 'admin-users'],
  ['/admin/audit', 'admin-audit'],
  ['/admin/notifikasi', 'admin-notifications'],
  ['/admin/layanan/baru', 'admin-service-new'],
  ['/admin/tim', 'admin-team']
]

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
const results = []
const failures = []

async function inspect(page, path, name, viewport) {
  const consoleErrors = []
  const pageErrors = []
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  }
  const onPageError = (error) => pageErrors.push(error.message)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  let response
  try {
    response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(180)
  } catch (error) {
    pageErrors.push(`Navigation failed: ${error.message}`)
  }

  const layout = await page.evaluate(() => {
    const width = window.innerWidth
    const scrollWidth = document.documentElement.scrollWidth
    const clipping = [...document.querySelectorAll('h1,h2,h3')]
      .filter((element) => {
        const style = getComputedStyle(element)
        return (
          style.display !== 'none' &&
          !element.classList.contains('sr-only') &&
          element.getBoundingClientRect().width > 2 &&
          element.scrollWidth > element.clientWidth + 1
        )
      })
      .slice(0, 5)
      .map((element) => (element.textContent || '').trim().slice(0, 60))
    return { width, scrollWidth, clipping }
  })

  page.off('console', onConsole)
  page.off('pageerror', onPageError)

  const result = {
    name,
    viewport,
    path,
    status: response?.status() || 0,
    horizontalOverflow: layout.scrollWidth > layout.width + 1,
    scrollWidth: layout.scrollWidth,
    viewportWidth: layout.width,
    headingClipping: layout.clipping,
    consoleErrors: [...new Set(consoleErrors)],
    pageErrors: [...new Set(pageErrors)]
  }
  results.push(result)
  if (
    result.status >= 400 ||
    result.horizontalOverflow ||
    result.headingClipping.length ||
    result.pageErrors.length
  ) {
    failures.push(result)
  }
  return result
}

async function login(page, email, password, destination) {
  await page.goto(`${base}/masuk`, { waitUntil: 'networkidle' })
  await page.fill('#login-email', email)
  await page.fill('#login-password', password)
  await Promise.all([
    page.waitForURL(new RegExp(destination), { timeout: 15000 }),
    page.click('button[type="submit"]')
  ])
  await page.waitForLoadState('networkidle')
}

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1
  })
  const page = await context.newPage()
  for (const [path, name] of corePublicPages) {
    await inspect(page, path, name, viewport.name)
  }
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.screenshot({
    path: resolve(screenshots, `home-${viewport.name}.png`),
    fullPage: false
  })

  if (['390', '768', '1024', '1440'].includes(viewport.name)) {
    for (const [path, name] of extraPublicPages) {
      await inspect(page, path, name, viewport.name)
    }
  }
  await context.close()
}

const authenticatedViewports = viewports.filter((item) => ['390', '768', '1024', '1440'].includes(item.name))

const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const guestPage = await guestContext.newPage()
for (const viewport of authenticatedViewports) {
  await guestPage.setViewportSize({ width: viewport.width, height: viewport.height })
  await inspect(guestPage, '/layanan/pembuatan-email-institusi/ajukan', 'request-form', viewport.name)
}
await guestContext.close()

const adminContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const adminPage = await adminContext.newPage()
await login(adminPage, 'superadmin@digital.unu.local', 'Admin#Unu2026', '/admin')
for (const viewport of authenticatedViewports) {
  await adminPage.setViewportSize({ width: viewport.width, height: viewport.height })
  for (const [path, name] of adminPages) {
    await inspect(adminPage, path, name, viewport.name)
  }
  await adminPage.goto(`${base}/admin`, { waitUntil: 'networkidle' })
  await adminPage.screenshot({
    path: resolve(screenshots, `admin-${viewport.name}.png`),
    fullPage: false
  })
}
await adminContext.close()

await browser.close()

console.log(`Checked ${results.length} page/viewport combinations.`)
console.log(`Failures: ${failures.length}`)
if (failures.length) {
  console.log(JSON.stringify(failures, null, 2))
  process.exit(1)
}
console.log('PASSED: no horizontal overflow, heading clipping, page errors, or 4xx responses.')

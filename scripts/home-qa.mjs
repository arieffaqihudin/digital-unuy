import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const base = process.env.BASE_URL || 'http://localhost:3000'
const chromePath =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const out = resolve(process.cwd(), '.data', 'screenshots', 'home-redesign')
await mkdir(out, { recursive: true })
const widths = (process.env.WIDTHS || '320,375,390,430,768,820,1024,1280,1440,1920').split(',').map(Number)

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
const report = []
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const m = await page.evaluate(() => {
    const h1 = document.querySelector('h1')
    const header = document.querySelector('header')
    const nav = document.querySelector('header nav')
    const navLinks = [...(nav?.querySelectorAll('a,button') || [])]
    const tops = new Set(navLinks.map((n) => Math.round(n.getBoundingClientRect().top)))
    const clipped = [...document.querySelectorAll('h1,h2,h3,p,dt,dd,a,button')].filter((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)
    }).length
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      h1Height: Math.round(h1.getBoundingClientRect().height),
      h1Font: getComputedStyle(h1).fontSize,
      navFont: nav ? getComputedStyle(nav.querySelector('a,button')).fontSize : null,
      headerHeight: Math.round(header.getBoundingClientRect().height),
      navRows: nav && getComputedStyle(nav).display !== 'none' ? tops.size : 'hidden',
      clipped,
      docHeight: document.documentElement.scrollHeight
    }
  })
  await page.screenshot({ path: resolve(out, `home-${width}-top.png`), clip: { x: 0, y: 0, width, height: Math.min(1700, m.docHeight) } })
  await page.screenshot({ path: resolve(out, `home-${width}-full.png`), fullPage: true })
  report.push({ width, ...m, overflow: m.scrollWidth > m.innerWidth + 1, errors: [...new Set(errors)] })
  await context.close()
}
await browser.close()
console.table(report.map(({ errors, ...r }) => r))
const errs = report.filter((r) => r.errors.length)
if (errs.length) console.log(JSON.stringify(errs, null, 2))

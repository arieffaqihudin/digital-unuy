import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const base = process.env.BASE_URL || 'http://localhost:3000'
const chromePath =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const outDir = resolve(process.cwd(), 'public', 'images', 'home')
await mkdir(outDir, { recursive: true })

const shots = [
  ['portal-layanan', '/layanan'],
  ['portal-lacak', '/lacak'],
  ['portal-dokumen', '/dokumen']
]

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 })
const page = await context.newPage()
for (const [name, path] of shots) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('main h1', { timeout: 30000 })
  await page.waitForTimeout(800)
  const png = await page.screenshot({ clip: { x: 0, y: 73, width: 1440, height: 780 } })
  await sharp(png).webp({ quality: 84 }).toFile(resolve(outDir, `${name}.webp`))
  await sharp(png).resize({ width: 1080 }).webp({ quality: 82 }).toFile(resolve(outDir, `${name}-1080.webp`))
  // Hero variant: starts below the breadcrumb so no page chrome shows inside the hero visual.
  const heroPng = await page.screenshot({ clip: { x: 0, y: 150, width: 1440, height: 780 } })
  await sharp(heroPng).resize({ width: 1080 }).webp({ quality: 84 }).toFile(resolve(outDir, `hero-screen-${name.replace('portal-', '')}.webp`))
  console.log(`saved ${name}`)
}
await browser.close()

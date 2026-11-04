import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const base = process.env.BASE_URL || 'http://localhost:3000'
const chromePath =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const outDir = resolve(process.cwd(), 'public', 'images', 'home')
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 })
const page = await context.newPage()
await page.goto(`${base}/layanan`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const png = await page.screenshot({ clip: { x: 0, y: 72, width: 1440, height: 780 } })
await browser.close()

await sharp(png).webp({ quality: 84 }).toFile(resolve(outDir, 'portal-layanan.webp'))
console.log('saved public/images/home/portal-layanan.webp')

import sharp from 'sharp'
import { resolve } from 'node:path'

const dir = resolve(process.cwd(), 'public', 'images', 'home')
const source = resolve(dir, 'Yogyakarta Campus Digital Ecosystem (1).png')
const crop = { left: 400, top: 110, width: 820, height: 831 }

// Keep-area in crop coordinates: building silhouette, trees, and ground. Everything else (sky, UI cards, connector lines) is transparent.
const keep = [
  [296, 154], [405, 144], [405, 101], [603, 92], [603, 184], [694, 178], [694, 326], [782, 326], [782, 470],
  [820, 482], [820, 831], [24, 831], [24, 600], [54, 560], [54, 298], [292, 298]
]
const polygon = keep.map(([x, y]) => `${x},${y}`).join(' ')
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${crop.width}" height="${crop.height}">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff"/><stop offset="0.74" stop-color="#fff"/><stop offset="0.97" stop-color="#000"/>
      </linearGradient>
      <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000"/><stop offset="0.05" stop-color="#fff"/><stop offset="0.93" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
      </linearGradient>
      <mask id="m"><polygon points="${polygon}" fill="#fff"/></mask>
    </defs>
    <rect width="100%" height="100%" fill="#000"/>
    <rect width="100%" height="100%" fill="url(#fade)" mask="url(#m)"/>
  </svg>`
)

const alpha = await sharp(mask).blur(1.2).toColourspace('b-w').raw().toBuffer({ resolveWithObject: true })
const sideAlpha = await sharp(
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${crop.width}" height="${crop.height}"><rect width="100%" height="100%" fill="url(#side)"/><defs><linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="0.04" stop-color="#fff"/><stop offset="0.94" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs></svg>`)
)
  .toColourspace('b-w')
  .raw()
  .toBuffer()

const combined = Buffer.alloc(alpha.data.length)
for (let i = 0; i < combined.length; i++) combined[i] = Math.round((alpha.data[i] * sideAlpha[i]) / 255)

const base = sharp(source).extract(crop).removeAlpha()
const rgba = await sharp(await base.toBuffer())
  .joinChannel(combined, { raw: { width: crop.width, height: crop.height, channels: 1 } })
  .toBuffer()

await sharp(rgba).webp({ quality: 86, alphaQuality: 90 }).toFile(resolve(dir, 'hero-building.webp'))
await sharp(rgba).resize({ width: 560 }).webp({ quality: 84, alphaQuality: 88 }).toFile(resolve(dir, 'hero-building-560.webp'))
console.log('saved hero-building.webp and hero-building-560.webp')

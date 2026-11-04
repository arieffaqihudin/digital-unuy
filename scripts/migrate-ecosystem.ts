import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { DigitalPlatform, PlatformCategory } from '../server/models'
import { slugify } from '../server/utils/validation'
import {
  LEGACY_PLATFORM_CATEGORY_MAP,
  PLATFORM_CATEGORY_SEED,
  PLATFORM_SEED
} from './ecosystem-data'

const MONGODB_URI = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_unuy'
const DRY_RUN = process.argv.includes('--dry-run')
const ALLOW_PRODUCTION = process.argv.includes('--allow-production')

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
}

function keyOf(value: unknown) {
  return normalizeText(value).toLocaleLowerCase('id-ID')
}

function compactKey(value: unknown) {
  return keyOf(value).replace(/[^a-z0-9]+/g, '')
}

function connectionInfo() {
  try {
    const parsed = new URL(MONGODB_URI)
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/${parsed.pathname.replace(/^\//, '') || '(default)'}`
  } catch {
    return '(koneksi tidak dapat ditampilkan)'
  }
}

if (process.env.NODE_ENV === 'production' && !ALLOW_PRODUCTION) {
  console.error('[migrate-ecosystem] Ditolak: NODE_ENV=production. Gunakan --allow-production bila disetujui.')
  process.exit(1)
}

console.log(`[migrate-ecosystem] Menghubungkan ke ${connectionInfo()}${DRY_RUN ? ' (dry run)' : ''}`)
await mongoose.connect(MONGODB_URI)
console.log(`[migrate-ecosystem] Terhubung ke database "${mongoose.connection.name}".`)

const beforeCategories = await PlatformCategory.find({}).lean()
const beforePlatforms = await DigitalPlatform.find({}).lean()

const backupDir = resolve(process.cwd(), '.data', 'backups')
const backupPath = resolve(backupDir, `ecosystem-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
if (!DRY_RUN) {
  await mkdir(backupDir, { recursive: true })
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        database: mongoose.connection.name,
        categories: beforeCategories,
        platforms: beforePlatforms
      },
      null,
      2
    )
  )
}

const categoryByName = new Map<string, (typeof beforeCategories)[number]>()
const categoryBySlug = new Map<string, (typeof beforeCategories)[number]>()
for (const category of beforeCategories) {
  categoryByName.set(compactKey(category.name), category)
  categoryBySlug.set(category.slug, category)
}

const createdCategories: string[] = []
const reusedCategories: Array<{ requested: string; existing: string; slug: string }> = []
const categoryConflicts: Array<Record<string, unknown>> = []
const resolvedCategories = new Map<string, { id: string; name: string; slug: string }>()

for (const definition of PLATFORM_CATEGORY_SEED) {
  const existing =
    categoryBySlug.get(definition.slug) ||
    categoryByName.get(compactKey(definition.name)) ||
    beforeCategories.find((category) => compactKey(category.slug) === compactKey(definition.slug))

  if (existing) {
    resolvedCategories.set(definition.slug, {
      id: String(existing._id),
      name: existing.name,
      slug: existing.slug
    })
    if (normalizeText(existing.name) !== definition.name || existing.slug !== definition.slug) {
      reusedCategories.push({ requested: definition.name, existing: existing.name, slug: existing.slug })
    }
    continue
  }

  if (DRY_RUN) {
    resolvedCategories.set(definition.slug, { id: '', name: definition.name, slug: definition.slug })
    createdCategories.push(definition.name)
    continue
  }

  const created = await PlatformCategory.create({
    name: definition.name,
    slug: definition.slug,
    description: definition.description,
    order: definition.order,
    active: true,
    isSeedData: true
  })
  categoryBySlug.set(created.slug, created.toObject())
  categoryByName.set(compactKey(created.name), created.toObject())
  resolvedCategories.set(definition.slug, {
    id: String(created._id),
    name: created.name,
    slug: created.slug
  })
  createdCategories.push(definition.name)
}

const platformBySlug = new Map<string, (typeof beforePlatforms)[number]>()
const platformByName = new Map<string, (typeof beforePlatforms)[number]>()
for (const platform of beforePlatforms) {
  platformBySlug.set(platform.slug, platform)
  platformByName.set(compactKey(platform.name), platform)
}

const createdPlatforms: string[] = []
const reusedPlatforms: string[] = []
const platformConflicts: Array<Record<string, unknown>> = []
const moduleSeedCount = { created: 0, skipped: 0 }
const metricSeedCount = { created: 0, skipped: 0 }
const officialSlugs = new Set(PLATFORM_SEED.map((platform) => platform.slug))

for (const definition of PLATFORM_SEED) {
  const category = resolvedCategories.get(definition.categorySlug)
  if (!category) {
    platformConflicts.push({ name: definition.name, reason: `Kategori ${definition.categorySlug} tidak ditemukan.` })
    continue
  }

  const existing =
    platformBySlug.get(definition.slug) ||
    platformByName.get(compactKey(definition.name))

  if (existing) {
    if (existing.slug !== definition.slug) {
      platformConflicts.push({
        name: definition.name,
        reason: 'Nama produk sudah ada dengan slug berbeda. Slug existing dipertahankan.',
        existingSlug: existing.slug,
        requestedSlug: definition.slug
      })
    }
    reusedPlatforms.push(existing.name)

    if (!DRY_RUN) {
      const set: Record<string, unknown> = {
        categoryId: category.id || existing.categoryId || null,
        category: category.name
      }
      if (!Array.isArray(existing.audiences) || existing.audiences.length === 0) {
        set.audiences = definition.audiences
      }
      if (existing.published === undefined) set.published = true
      if (existing.featured === undefined) set.featured = Boolean(definition.featured)
      if (!existing.thumbnail) set.thumbnail = definition.thumbnail || ''
      if (!Array.isArray(existing.gallery) || existing.gallery.length === 0) {
        set.gallery = definition.gallery || []
      }
      if (!existing.problem) set.problem = definition.problem || ''
      if (!existing.solution) set.solution = definition.solution || ''
      if (!existing.benefits) set.benefits = definition.benefits || ''
      if (!existing.features) set.features = definition.features || ''
      if (!Array.isArray(existing.modules) || existing.modules.length === 0) {
        set.modules = definition.modules || []
      }
      if (!Array.isArray(existing.metrics) || existing.metrics.length === 0) {
        set.metrics = definition.metrics || []
      }
      await DigitalPlatform.updateOne({ _id: existing._id }, { $set: set })
    }

    if (!Array.isArray(existing.modules) || existing.modules.length === 0) {
      moduleSeedCount.created += definition.modules?.length || 0
    } else {
      moduleSeedCount.skipped += definition.modules?.length || 0
    }
    if (!Array.isArray(existing.metrics) || existing.metrics.length === 0) {
      metricSeedCount.created += definition.metrics?.length || 0
    } else {
      metricSeedCount.skipped += definition.metrics?.length || 0
    }
    continue
  }

  if (DRY_RUN) {
    createdPlatforms.push(definition.name)
    moduleSeedCount.created += definition.modules?.length || 0
    metricSeedCount.created += definition.metrics?.length || 0
    continue
  }

  const created = await DigitalPlatform.create({
    name: definition.name,
    slug: definition.slug,
    description: definition.description,
    category: category.name,
    categoryId: category.id || null,
    unit: definition.unit || '',
    status: definition.status,
    url: definition.url || '',
    audiences: definition.audiences,
    order: definition.order,
    published: true,
    featured: Boolean(definition.featured),
    thumbnail: definition.thumbnail || '',
    gallery: definition.gallery || [],
    problem: definition.problem || '',
    solution: definition.solution || '',
    benefits: definition.benefits || '',
    features: definition.features || '',
    modules: definition.modules || [],
    metrics: definition.metrics || [],
    isSeedData: true
  })
  platformBySlug.set(created.slug, created.toObject())
  platformByName.set(compactKey(created.name), created.toObject())
  createdPlatforms.push(created.name)
  moduleSeedCount.created += definition.modules?.length || 0
  metricSeedCount.created += definition.metrics?.length || 0
}

const statusMigration: Record<string, string> = {
  Aktif: 'Sudah Rilis',
  Pilot: 'Pilot / Beta',
  'Belum Dikonfirmasi': 'Dalam Pengembangan',
  'Tidak Aktif': 'Dalam Pengembangan'
}
const statusCounts: Record<string, number> = {}
for (const [from, to] of Object.entries(statusMigration)) {
  const count = await DigitalPlatform.countDocuments({ status: from })
  if (count) {
    statusCounts[`${from} -> ${to}`] = count
    if (!DRY_RUN) await DigitalPlatform.updateMany({ status: from }, { $set: { status: to } })
  }
}

const legacyProducts: string[] = []
for (const platform of beforePlatforms) {
  if (officialSlugs.has(platform.slug)) continue
  const categorySlug = LEGACY_PLATFORM_CATEGORY_MAP[normalizeText(platform.category)]
  const category = categorySlug ? resolvedCategories.get(categorySlug) : null
  if (!DRY_RUN) {
    const set: Record<string, unknown> = {}
    if (!platform.categoryId && category?.id) {
      set.categoryId = category.id
      set.category = category.name
    }
    if (platform.published === undefined) set.published = false
    if (Object.keys(set).length) await DigitalPlatform.updateOne({ _id: platform._id }, { $set: set })
  }
  legacyProducts.push(platform.name)
}

const afterCategories = DRY_RUN ? beforeCategories.length + createdCategories.length : await PlatformCategory.countDocuments()
const afterPlatforms = DRY_RUN ? beforePlatforms.length + createdPlatforms.length : await DigitalPlatform.countDocuments()
const publishedCount = DRY_RUN
  ? beforePlatforms.filter((platform) => platform.published === true).length + PLATFORM_SEED.length
  : await DigitalPlatform.countDocuments({ published: true })
const officialCount = DRY_RUN
  ? beforePlatforms.filter((platform) => officialSlugs.has(platform.slug)).length + createdPlatforms.length
  : await DigitalPlatform.countDocuments({ slug: { $in: PLATFORM_SEED.map((platform) => platform.slug) } })

console.log(
  JSON.stringify(
    {
      mode: DRY_RUN ? 'dry-run' : 'apply',
      database: mongoose.connection.name,
      backup: DRY_RUN ? null : backupPath,
      before: {
        categories: beforeCategories.length,
        platforms: beforePlatforms.length,
        published: beforePlatforms.filter((platform) => platform.published === true).length
      },
      after: {
        categories: afterCategories,
        platforms: afterPlatforms,
        published: publishedCount,
        officialProducts: officialCount
      },
      categories: {
        created: createdCategories,
        reused: reusedCategories,
        conflicts: categoryConflicts
      },
      products: {
        created: createdPlatforms,
        reused: reusedPlatforms,
        conflicts: platformConflicts,
        legacyRetainedAndUnpublished: legacyProducts
      },
      modules: moduleSeedCount,
      metrics: metricSeedCount,
      statusesNormalized: statusCounts
    },
    null,
    2
  )
)

await mongoose.disconnect()

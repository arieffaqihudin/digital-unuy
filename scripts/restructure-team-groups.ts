import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { TeamGroup, TeamMember } from '../server/models'
import { slugify } from '../server/utils/validation'

const MONGODB_URI = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_unuy'
const DRY_RUN = process.argv.includes('--dry-run')
const ALLOW_PRODUCTION = process.argv.includes('--allow-production')

const FINAL_GROUPS = [
  { name: 'Pimpinan', slug: 'pimpinan', order: 1 },
  { name: 'Product', slug: 'product', order: 2 },
  { name: 'Engineering', slug: 'engineering', order: 3 },
  { name: 'Design', slug: 'design', order: 4 }
]

const MEMBER_ASSIGNMENTS: Record<string, { group: string; order: number }> = {
  'Arief Faqihudin, S.T': { group: 'Pimpinan', order: 1 },
  'Ujang Fahmi': { group: 'Pimpinan', order: 2 },
  'Nur Muna Nadiya': { group: 'Product', order: 1 },
  Putri: { group: 'Product', order: 2 },
  'Zhafirah Majdina': { group: 'Product', order: 3 },
  'Mardiyah Nurhayati': { group: 'Product', order: 4 },
  'Intani Damayanti': { group: 'Product', order: 5 },
  'Annurdien Rasyid': { group: 'Engineering', order: 1 },
  'Asrofin Raharjo': { group: 'Engineering', order: 2 },
  'Abdul Basith': { group: 'Engineering', order: 3 },
  'Ibnu Adam': { group: 'Engineering', order: 4 },
  'Yulianto Andi': { group: 'Engineering', order: 5 },
  'Achmad Ibrahim Humam': { group: 'Engineering', order: 6 },
  "Muhammad Asy'ari Indra Putra": { group: 'Engineering', order: 7 },
  'Ibnu Absori Abdul Aziz': { group: 'Engineering', order: 8 },
  Zamahsyari: { group: 'Engineering', order: 9 },
  'Untara Vivi Cahya': { group: 'Engineering', order: 10 },
  'Ahsan Firdaus': { group: 'Engineering', order: 11 },
  'Ikhwan Inzaghi': { group: 'Engineering', order: 12 },
  'Dhista Ardiansyah': { group: 'Engineering', order: 13 },
  'Dimas Mahendra Kusuma': { group: 'Engineering', order: 14 },
  'Seto Rahardyanto': { group: 'Design', order: 1 },
  'Ridwan Adjie Santoso': { group: 'Design', order: 2 }
}

function normalizeName(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('id-ID')
    .replace(/[’‘`´]/g, "'")
}

function compactKey(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, '')
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
  console.error('[team-groups] Ditolak: NODE_ENV=production. Gunakan --allow-production bila disetujui.')
  process.exit(1)
}

console.log(`[team-groups] Menghubungkan ke ${connectionInfo()}${DRY_RUN ? ' (dry run)' : ''}`)
await mongoose.connect(MONGODB_URI)
console.log(`[team-groups] Terhubung ke database "${mongoose.connection.name}".`)

const beforeGroups = await TeamGroup.find({}).sort({ order: 1, name: 1 }).lean()
const beforeMembers = await TeamMember.find({}).lean()

const backupDir = resolve(process.cwd(), '.data', 'backups')
const backupPath = resolve(backupDir, `team-groups-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
if (!DRY_RUN) {
  await mkdir(backupDir, { recursive: true })
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        database: mongoose.connection.name,
        groups: beforeGroups,
        members: beforeMembers
      },
      null,
      2
    )
  )
}

const groupBySlug = new Map(beforeGroups.map((group) => [group.slug, group]))
const groupByKey = new Map(beforeGroups.map((group) => [compactKey(group.name), group]))
const finalGroups = new Map<string, { id: string; name: string; order: number }>()
const createdGroups: string[] = []
const reusedGroups: string[] = []

for (const definition of FINAL_GROUPS) {
  const existing =
    groupBySlug.get(definition.slug) ||
    groupByKey.get(compactKey(definition.name)) ||
    beforeGroups.find((group) => compactKey(group.slug) === compactKey(definition.slug))

  if (existing) {
    finalGroups.set(definition.name, {
      id: String(existing._id),
      name: existing.name,
      order: definition.order
    })
    reusedGroups.push(existing.name)
    if (!DRY_RUN && (existing.order !== definition.order || existing.slug !== definition.slug)) {
      await TeamGroup.updateOne(
        { _id: existing._id },
        { $set: { order: definition.order, slug: definition.slug } }
      )
    }
    continue
  }

  if (DRY_RUN) {
    finalGroups.set(definition.name, { id: '', name: definition.name, order: definition.order })
    createdGroups.push(definition.name)
    continue
  }

  const created = await TeamGroup.create({
    name: definition.name,
    slug: definition.slug,
    order: definition.order
  })
  groupBySlug.set(created.slug, created.toObject())
  groupByKey.set(compactKey(created.name), created.toObject())
  finalGroups.set(definition.name, { id: String(created._id), name: created.name, order: definition.order })
  createdGroups.push(created.name)
}

const memberByName = new Map<string, typeof beforeMembers>()
for (const member of beforeMembers) {
  const key = normalizeName(member.name)
  const bucket = memberByName.get(key) || []
  bucket.push(member)
  memberByName.set(key, bucket)
}

const updatedMembers: string[] = []
const skippedMembers: string[] = []
const unmappedMembers: string[] = []
const duplicateMembers: Array<{ name: string; ids: string[] }> = []

for (const [name, assignment] of Object.entries(MEMBER_ASSIGNMENTS)) {
  const matches = memberByName.get(normalizeName(name)) || []
  if (matches.length > 1) {
    duplicateMembers.push({ name, ids: matches.map((member) => String(member._id)) })
    continue
  }
  const member = matches[0]
  if (!member) {
    unmappedMembers.push(name)
    continue
  }
  const group = finalGroups.get(assignment.group)
  if (!group) {
    unmappedMembers.push(name)
    continue
  }
  if (group.id && String(member.group || '') === group.id && Number(member.order) === assignment.order) {
    skippedMembers.push(member.name)
    continue
  }
  if (!DRY_RUN) {
    await TeamMember.updateOne(
      { _id: member._id },
      { $set: { group: group.id, order: assignment.order } }
    )
  }
  updatedMembers.push(member.name)
}

const finalGroupIds = new Set([...finalGroups.values()].map((group) => group.id).filter(Boolean))
const oldGroupsToDelete: string[] = []
const retainedGroups: Array<{ name: string; memberCount: number }> = []
for (const group of beforeGroups) {
  if (finalGroupIds.has(String(group._id))) continue
  const memberCount = await TeamMember.countDocuments({ group: group._id })
  if (memberCount > 0) {
    retainedGroups.push({ name: group.name, memberCount })
    continue
  }
  oldGroupsToDelete.push(group.name)
  if (!DRY_RUN) await TeamGroup.deleteOne({ _id: group._id })
}

const groupCounts = await Promise.all(
  FINAL_GROUPS.map(async (definition) => {
    const group = finalGroups.get(definition.name)
    const memberCount = group?.id ? await TeamMember.countDocuments({ group: group.id }) : 0
    return { name: definition.name, order: definition.order, memberCount }
  })
)
const totalMembers = await TeamMember.countDocuments()

console.log(
  JSON.stringify(
    {
      mode: DRY_RUN ? 'dry-run' : 'apply',
      database: mongoose.connection.name,
      backup: DRY_RUN ? null : backupPath,
      before: { groups: beforeGroups.length, members: beforeMembers.length },
      after: { groups: await TeamGroup.countDocuments(), members: totalMembers },
      finalGroups: groupCounts,
      groups: {
        created: createdGroups,
        reused: reusedGroups,
        deletedOld: oldGroupsToDelete,
        retainedWithMembers: retainedGroups
      },
      members: {
        updated: updatedMembers.length,
        unchanged: skippedMembers.length,
        unmapped: unmappedMembers,
        duplicates: duplicateMembers
      }
    },
    null,
    2
  )
)

await mongoose.disconnect()

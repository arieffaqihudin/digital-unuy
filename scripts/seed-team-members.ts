import mongoose from 'mongoose'
import { TeamGroup, TeamMember } from '../server/models'
import { slugify } from '../server/utils/validation'

const MONGODB_URI = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_unuy'
const DRY_RUN = process.argv.includes('--dry-run')
const ALLOW_PRODUCTION = process.argv.includes('--allow-production')

type GroupDefinition = {
  name: string
  order: number
}

type MemberDefinition = {
  name: string
  position: string
  group: string
}

const GROUP_DEFINITIONS: GroupDefinition[] = [
  { name: 'Pimpinan', order: 1 },
  { name: 'Product', order: 2 },
  { name: 'Engineering', order: 3 },
  { name: 'Design', order: 4 }
]

const MEMBER_DEFINITIONS: MemberDefinition[] = [
  { name: 'Ujang Fahmi', position: 'Tech Head', group: 'Pimpinan' },
  { name: 'Nur Muna Nadiya', position: 'Product Manager', group: 'Product' },
  { name: 'Putri', position: 'Product Manager', group: 'Product' },
  { name: 'Zhafirah Majdina', position: 'Quality Assurance', group: 'Product' },
  { name: 'Mardiyah Nurhayati', position: 'Quality Assurance', group: 'Product' },
  { name: 'Intani Damayanti', position: 'Quality Assurance', group: 'Product' },
  { name: 'Annurdien Rasyid', position: 'Mobile Engineer', group: 'Engineering' },
  { name: 'Asrofin Raharjo', position: 'Mobile Engineer', group: 'Engineering' },
  { name: 'Abdul Basith', position: 'Front End Engineer', group: 'Engineering' },
  { name: 'Ibnu Adam', position: 'Front End Engineer', group: 'Engineering' },
  { name: 'Yulianto Andi', position: 'Front End Engineer', group: 'Engineering' },
  { name: 'Achmad Ibrahim Humam', position: 'Front End Engineer', group: 'Engineering' },
  { name: "Muhammad Asy'ari Indra Putra", position: 'Front End Engineer', group: 'Engineering' },
  { name: 'Ibnu Absori Abdul Aziz', position: 'Front End Engineer', group: 'Engineering' },
  { name: 'Zamahsyari', position: 'Dev Ops', group: 'Engineering' },
  { name: 'Untara Vivi Cahya', position: 'Back End Engineer', group: 'Engineering' },
  { name: 'Ahsan Firdaus', position: 'Back End Engineer', group: 'Engineering' },
  { name: 'Ikhwan Inzaghi', position: 'Back End Engineer', group: 'Engineering' },
  { name: 'Dhista Ardiansyah', position: 'Back End Engineer', group: 'Engineering' },
  { name: 'Dimas Mahendra Kusuma', position: 'Back End Engineer', group: 'Engineering' },
  { name: 'Seto Rahardyanto', position: 'UI-UX Designer', group: 'Design' },
  { name: 'Ridwan Adjie Santoso', position: 'UI-UX Designer', group: 'Design' }
]
function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeName(value: unknown) {
  return normalizeText(value)
    .toLocaleLowerCase('id-ID')
    .replace(/[’‘`´]/g, "'")
}

function compactKey(value: unknown) {
  return normalizeText(value)
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, '')
}

function publicConnectionInfo() {
  try {
    const parsed = new URL(MONGODB_URI)
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/${parsed.pathname.replace(/^\//, '') || '(default)'}`
  } catch {
    return '(koneksi tidak dapat ditampilkan)'
  }
}

if (process.env.NODE_ENV === 'production' && !ALLOW_PRODUCTION) {
  console.error('[seed-team] Ditolak: NODE_ENV=production. Jalankan dengan --allow-production bila benar-benar disetujui.')
  process.exit(1)
}

console.log(`[seed-team] Menghubungkan ke ${publicConnectionInfo()}${DRY_RUN ? ' (dry run)' : ''}`)
await mongoose.connect(MONGODB_URI)
console.log(`[seed-team] Terhubung ke database "${mongoose.connection.name}".`)

const beforeMembers = await TeamMember.countDocuments()
const beforeGroups = await TeamGroup.countDocuments()
const existingGroups = await TeamGroup.find({}).lean()
const existingMembers = await TeamMember.find({}).lean()

const groupById = new Map(existingGroups.map((group) => [String(group._id), group]))
const groupMatches = new Map<string, typeof existingGroups>()
for (const group of existingGroups) {
  for (const key of new Set([compactKey(group.name), compactKey(group.slug)])) {
    if (!key) continue
    const bucket = groupMatches.get(key) || []
    bucket.push(group)
    groupMatches.set(key, bucket)
  }
}

const groupConflicts: Array<Record<string, unknown>> = []
const resolvedGroups = new Map<string, { id: string | null; name: string; reused: boolean }>()
const createdGroups: GroupDefinition[] = []
const reusedGroups: Array<{ requested: string; existing: string }> = []

for (const definition of GROUP_DEFINITIONS) {
  const key = compactKey(definition.name)
  const matches = groupMatches.get(key) || []
  if (matches.length > 1) {
    groupConflicts.push({
      requested: definition.name,
      reason: 'Beberapa kelompok existing memiliki nama yang sama setelah normalisasi.',
      matches: matches.map((group) => ({ id: String(group._id), name: group.name }))
    })
  }

  let existing = matches[0] || existingGroups.find((group) => group.slug === slugify(definition.name))
  if (existing) {
    resolvedGroups.set(definition.name, { id: String(existing._id), name: existing.name, reused: true })
    if (normalizeText(existing.name) !== definition.name) {
      reusedGroups.push({ requested: definition.name, existing: existing.name })
    }
    continue
  }

  if (DRY_RUN) {
    resolvedGroups.set(definition.name, { id: null, name: definition.name, reused: false })
    createdGroups.push(definition)
    continue
  }

  const slug = slugify(definition.name)
  const created = await TeamGroup.create({
    name: definition.name,
    slug,
    order: definition.order,
    createdBy: null
  })
  groupMatches.set(key, [created])
  groupById.set(String(created._id), created.toObject())
  resolvedGroups.set(definition.name, { id: String(created._id), name: created.name, reused: false })
  createdGroups.push(definition)
}

const existingMembersByName = new Map<string, typeof existingMembers>()
for (const member of existingMembers) {
  const key = normalizeName(member.name)
  const bucket = existingMembersByName.get(key) || []
  bucket.push(member)
  existingMembersByName.set(key, bucket)
}

const memberConflicts: Array<Record<string, unknown>> = []
const membersToInsert: Array<MemberDefinition & { groupId: string; groupName: string }> = []
let skippedMembers = 0

for (const definition of MEMBER_DEFINITIONS) {
  const matches = existingMembersByName.get(normalizeName(definition.name)) || []
  const desiredGroup = resolvedGroups.get(definition.group)
  if (!desiredGroup) {
    memberConflicts.push({ name: definition.name, reason: `Kelompok "${definition.group}" tidak dapat disiapkan.` })
    continue
  }

  if (matches.length > 1) {
    memberConflicts.push({
      name: definition.name,
      reason: 'Ditemukan lebih dari satu anggota dengan nama yang sama setelah normalisasi.',
      existing: matches.map((member) => ({
        id: String(member._id),
        name: member.name,
        position: member.position,
        group: member.group ? groupById.get(String(member.group))?.name || String(member.group) : null
      }))
    })
    continue
  }

  const existing = matches[0]
  if (existing) {
    const existingGroup = existing.group
      ? groupById.get(String(existing.group))?.name || String(existing.group)
      : null
    const groupMatchesDefinition = existingGroup
      ? compactKey(existingGroup) === compactKey(definition.group)
      : false
    const positionMatchesDefinition = normalizeText(existing.position) === normalizeText(definition.position)

    if (!groupMatchesDefinition || !positionMatchesDefinition) {
      memberConflicts.push({
        name: definition.name,
        reason: 'Nama sudah ada tetapi jabatan atau kelompok berbeda. Data existing tidak diubah.',
        existing: { position: existing.position, group: existingGroup },
        requested: { position: definition.position, group: definition.group }
      })
      continue
    }

    skippedMembers += 1
    continue
  }

  if (!desiredGroup.id) {
    membersToInsert.push({ ...definition, groupId: '', groupName: desiredGroup.name })
    continue
  }
  membersToInsert.push({ ...definition, groupId: desiredGroup.id, groupName: desiredGroup.name })
}

const nextOrderByGroup = new Map<string, number>()
for (const group of existingGroups) {
  nextOrderByGroup.set(String(group._id), 0)
}
for (const member of existingMembers) {
  const key = member.group ? String(member.group) : '__ungrouped__'
  const current = nextOrderByGroup.get(key) || 0
  nextOrderByGroup.set(key, Math.max(current, Number(member.order) || 0))
}
for (const group of resolvedGroups.values()) {
  if (group.id && !nextOrderByGroup.has(group.id)) nextOrderByGroup.set(group.id, 0)
}

const membersWithOrder = membersToInsert.map((member) => {
  const key = member.groupId || `__planned__:${member.groupName}`
  const order = (nextOrderByGroup.get(key) || 0) + 1
  nextOrderByGroup.set(key, order)
  return { ...member, order }
})

if (!DRY_RUN && membersWithOrder.length) {
  await TeamMember.insertMany(
    membersWithOrder.map((member) => ({
      name: member.name,
      position: member.position,
      unit: '',
      bio: '',
      group: member.groupId || null,
      order: member.order,
      published: false,
      photoStorageKey: '',
      photoMimeType: '',
      photoSize: 0,
      focalX: 50,
      focalY: 50,
      createdBy: null
    }))
  )
}

const afterMembers = DRY_RUN ? beforeMembers + membersWithOrder.length : await TeamMember.countDocuments()
const afterGroups = DRY_RUN ? beforeGroups + createdGroups.length : await TeamGroup.countDocuments()
const insertedByGroup = membersWithOrder.reduce<Record<string, number>>((accumulator, member) => {
  accumulator[member.groupName] = (accumulator[member.groupName] || 0) + 1
  return accumulator
}, {})

console.log(
  JSON.stringify(
    {
      mode: DRY_RUN ? 'dry-run' : 'apply',
      database: mongoose.connection.name,
      before: { members: beforeMembers, groups: beforeGroups },
      after: { members: afterMembers, groups: afterGroups },
      groups: {
        created: createdGroups.map((group) => group.name),
        reused: reusedGroups,
        conflicts: groupConflicts
      },
      members: {
        requested: MEMBER_DEFINITIONS.length,
        inserted: membersWithOrder.length,
        skippedExisting: skippedMembers,
        conflicts: memberConflicts,
        insertedByGroup,
        publications: { published: 0, unpublished: membersWithOrder.length }
      }
    },
    null,
    2
  )
)

await mongoose.disconnect()

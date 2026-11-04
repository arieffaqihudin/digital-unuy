import { SiteSetting } from '../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'settings.manage')
  const body = await readBody(event)
  const settings = await SiteSetting.findOne({ key: 'global' })

  const doc = settings || new SiteSetting({ key: 'global' })
  const text = (value: unknown, max = 300) => String(value || '').trim().slice(0, max)

  doc.directorateName = text(body?.directorateName, 160) || 'Direktorat Tim Transformasi Digital'
  doc.universityName = text(body?.universityName, 180) || 'Universitas Nahdlatul Ulama Yogyakarta'
  doc.tagline = text(body?.tagline, 200)
  doc.logoUrl = validateUrl(body?.logoUrl)
  doc.description = text(body?.description, 800)
  doc.address = text(body?.address, 500)
  doc.contactPhone = text(body?.contactPhone, 80)
  doc.contactEmail = validateEmail(body?.contactEmail)
  doc.notificationEmail = validateEmail(body?.notificationEmail)

  doc.socials = Array.isArray(body?.socials)
    ? body.socials
        .map((social: any) => ({ label: text(social?.label, 60), url: validateUrl(social?.url) }))
        .filter((social: any) => social.label && social.url)
        .slice(0, 8)
    : []

  doc.hero = {
    eyebrow: text(body?.hero?.eyebrow, 80) || 'Transformasi Digital',
    title: text(body?.hero?.title, 180) || 'Mendorong Transformasi Digital UNU Yogyakarta',
    description: text(body?.hero?.description, 900),
    primaryLabel: text(body?.hero?.primaryLabel, 60) || 'Jelajahi Layanan Digital',
    primaryUrl: validateInternalUrl(body?.hero?.primaryUrl) || '/layanan',
    secondaryLabel: text(body?.hero?.secondaryLabel, 60) || 'Mengenal Direktorat',
    secondaryUrl: validateInternalUrl(body?.hero?.secondaryUrl) || '/tentang'
  }

  if (!Array.isArray(body?.metrics)) {
    doc.metrics = []
  } else {
    doc.metrics = body.metrics
      .map((metric: any) => ({
        label: text(metric?.label, 100),
        value: Number(metric?.value),
        unit: text(metric?.unit, 30),
        description: text(metric?.description, 200),
        verified: Boolean(metric?.verified)
      }))
      .filter((metric: any) => metric.label && Number.isFinite(metric.value) && metric.value >= 0)
      .slice(0, 8)
  }

  doc.devSeedMode = Boolean(body?.devSeedMode)
  await doc.save()
  await recordAudit(event, user, 'settings.updated', 'SiteSetting', String(doc._id), {
    metrics: doc.metrics.length,
    devSeedMode: doc.devSeedMode
  })

  return {
    settings: {
      ...serializeSettings(doc),
      metrics: doc.metrics
    }
  }
})

function validateEmail(value: unknown) {
  const email = String(value || '').trim().toLowerCase()
  if (!email) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 180) {
    throw createError({ statusCode: 422, statusMessage: 'Alamat email pengaturan tidak valid.' })
  }
  return email
}

function validateUrl(value: unknown) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (url.length > 500) throw createError({ statusCode: 422, statusMessage: 'URL terlalu panjang.' })
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol')
    return parsed.toString()
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'URL harus diawali http:// atau https://.' })
  }
}

function validateInternalUrl(value: unknown) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (url.startsWith('/')) return url.slice(0, 500)
  return validateUrl(url)
}

import { Article } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Publikasi tidak ditemukan.' })
  const article = await Article.findById(id)
  if (!article) throw createError({ statusCode: 404, statusMessage: 'Publikasi tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []

  if (body?.title !== undefined) {
    const title = String(body.title).trim()
    if (title.length < 3) throw createError({ statusCode: 422, statusMessage: 'Judul publikasi minimal 3 karakter.' })
    article.title = title
    changed.push('title')
  }
  if (body?.slug !== undefined) {
    const nextSlug = slugify(String(body.slug))
    if (!nextSlug) throw createError({ statusCode: 422, statusMessage: 'Slug publikasi tidak valid.' })
    if (nextSlug !== article.slug && (await Article.exists({ slug: nextSlug, _id: { $ne: article._id } }))) {
      throw createError({ statusCode: 409, statusMessage: 'Slug publikasi sudah digunakan.' })
    }
    article.slug = nextSlug
    changed.push('slug')
  }
  if (body?.excerpt !== undefined) {
    const excerpt = String(body.excerpt).trim()
    if (excerpt.length < 10) throw createError({ statusCode: 422, statusMessage: 'Ringkasan publikasi minimal 10 karakter.' })
    article.excerpt = excerpt
    changed.push('excerpt')
  }
  if (body?.content !== undefined) {
    const content = String(body.content).trim()
    if (content.length < 20) throw createError({ statusCode: 422, statusMessage: 'Konten publikasi minimal 20 karakter.' })
    article.content = markdownToSafeHtml(content)
    changed.push('content')
  }
  if (body?.thumbnail !== undefined) {
    article.thumbnail = validateThumbnail(body.thumbnail)
    changed.push('thumbnail')
  }
  if (body?.category !== undefined) {
    article.category = String(body.category || 'Berita').trim().slice(0, 80)
    changed.push('category')
  }
  if (body?.author !== undefined) {
    article.author = String(body.author || '').trim().slice(0, 120) || user.name
    changed.push('author')
  }
  if (body?.status !== undefined) {
    article.status = body.status === 'published' ? 'published' : 'draft'
    changed.push('status')
  }
  if (body?.publishedAt !== undefined) {
    const date = new Date(body.publishedAt)
    if (Number.isNaN(date.getTime())) throw createError({ statusCode: 422, statusMessage: 'Tanggal publikasi tidak valid.' })
    article.publishedAt = date
    changed.push('publishedAt')
  }

  const seoInput = parseSeoInput(body?.seo)
  if (seoInput) {
    article.seo = seoInput as any
    changed.push('seo')
  }

  await article.save()
  await recordAudit(event, user, 'article.updated', 'Article', String(article._id), {
    title: article.title,
    status: article.status,
    changed
  })
  return { article: serializeArticle(article) }
})

function validateThumbnail(value: unknown) {
  const url = String(value || '').trim()
  if (!url) return ''
  if (url.length > 500) throw createError({ statusCode: 422, statusMessage: 'URL thumbnail terlalu panjang.' })
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol')
    return parsed.toString()
  } catch {
    throw createError({ statusCode: 422, statusMessage: 'URL thumbnail harus diawali http:// atau https://.' })
  }
}

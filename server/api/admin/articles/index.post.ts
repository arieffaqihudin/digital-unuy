import { Article } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const body = await readBody(event)
  const title = String(body?.title || '').trim()
  const excerpt = String(body?.excerpt || '').trim()
  const content = String(body?.content || '').trim()
  if (title.length < 3) throw createError({ statusCode: 422, statusMessage: 'Judul publikasi minimal 3 karakter.' })
  if (excerpt.length < 10) throw createError({ statusCode: 422, statusMessage: 'Ringkasan publikasi minimal 10 karakter.' })
  if (content.length < 20) throw createError({ statusCode: 422, statusMessage: 'Konten publikasi minimal 20 karakter.' })
  const status = body?.status === 'published' ? 'published' : 'draft'
  const slug = slugify(String(body?.slug || title))
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Slug publikasi tidak valid.' })
  if (await Article.exists({ slug })) throw createError({ statusCode: 409, statusMessage: 'Slug publikasi sudah digunakan.' })

  const publishedAt = body?.publishedAt ? new Date(body.publishedAt) : new Date()
  if (Number.isNaN(publishedAt.getTime())) {
    throw createError({ statusCode: 422, statusMessage: 'Tanggal publikasi tidak valid.' })
  }

  const article = await Article.create({
    title,
    slug,
    excerpt,
    content: markdownToSafeHtml(content),
    thumbnail: validateThumbnail(body?.thumbnail),
    category: String(body?.category || 'Berita').trim().slice(0, 80),
    author: String(body?.author || user.name).trim().slice(0, 120),
    publishedAt,
    status,
    createdBy: user.id
  })
  await recordAudit(event, user, 'article.created', 'Article', String(article._id), {
    title: article.title,
    status
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

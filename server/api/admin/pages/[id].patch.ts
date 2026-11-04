import { Page } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan.' })
  const page = await Page.findById(id)
  if (!page) throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []

  if (body?.title !== undefined) {
    const title = String(body.title).trim()
    if (title.length < 3) throw createError({ statusCode: 422, statusMessage: 'Judul halaman minimal 3 karakter.' })
    page.title = title
    changed.push('title')
  }
  if (body?.slug !== undefined) {
    const nextSlug = slugify(String(body.slug))
    if (!nextSlug) throw createError({ statusCode: 422, statusMessage: 'Slug halaman tidak valid.' })
    if (nextSlug !== page.slug && (await Page.exists({ slug: nextSlug, _id: { $ne: page._id } }))) {
      throw createError({ statusCode: 409, statusMessage: 'Slug halaman sudah digunakan.' })
    }
    page.slug = nextSlug
    changed.push('slug')
  }
  if (body?.excerpt !== undefined) {
    page.excerpt = String(body.excerpt).slice(0, 400)
    changed.push('excerpt')
  }
  if (body?.content !== undefined) {
    page.content = markdownToSafeHtml(String(body.content || ''))
    changed.push('content')
  }
  if (body?.seoTitle !== undefined) {
    page.seoTitle = String(body.seoTitle || '').slice(0, 160)
    changed.push('seoTitle')
  }
  if (body?.seoDescription !== undefined) {
    page.seoDescription = String(body.seoDescription || '').slice(0, 300)
    changed.push('seoDescription')
  }
  if (body?.published !== undefined) {
    page.published = Boolean(body.published)
    changed.push('published')
  }

  await page.save()
  await recordAudit(event, user, 'page.updated', 'Page', String(page._id), {
    title: page.title,
    changed
  })
  return {
    page: {
      id: String(page._id),
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt,
      content: page.content,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      published: page.published,
      updatedAt: page.updatedAt
    }
  }
})

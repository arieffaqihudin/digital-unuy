import { Page } from '../../../models'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const body = await readBody(event)
  const title = String(body?.title || '').trim()
  if (title.length < 3) throw createError({ statusCode: 422, statusMessage: 'Judul halaman minimal 3 karakter.' })
  const slug = slugify(String(body?.slug || title))
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Slug halaman tidak valid.' })
  if (await Page.exists({ slug })) throw createError({ statusCode: 409, statusMessage: 'Slug halaman sudah digunakan.' })

  const page = await Page.create({
    seo: parseSeoInput(body?.seo),
    title,
    slug,
    excerpt: String(body?.excerpt || '').slice(0, 400),
    content: markdownToSafeHtml(String(body?.content || '')),
    seoTitle: parseSeoInput(body?.seo)?.title ?? String(body?.seoTitle || '').slice(0, 160),
    seoDescription: parseSeoInput(body?.seo)?.description ?? String(body?.seoDescription || '').slice(0, 300),
    published: Boolean(body?.published)
  })
  await recordAudit(event, user, 'page.created', 'Page', String(page._id), { title: page.title })
  return {
    page: {
      id: String(page._id),
      title: page.title,
      slug: page.slug,
      published: page.published,
      updatedAt: page.updatedAt
    }
  }
})

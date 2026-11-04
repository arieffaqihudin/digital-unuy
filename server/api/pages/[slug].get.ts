import { Page } from '../../models'

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
  const page = await Page.findOne({ slug, published: true }).lean()
  if (!page) throw createError({ statusCode: 404, statusMessage: 'Halaman tidak ditemukan.' })
  return {
    page: {
      id: String(page._id),
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt,
      content: page.content,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      updatedAt: page.updatedAt
    }
  }
})

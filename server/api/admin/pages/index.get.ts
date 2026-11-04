import { Page } from '../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.manage')
  const pages = await Page.find({}).sort({ updatedAt: -1 }).lean()
  return {
    items: pages.map((page) => ({
      id: String(page._id),
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt,
      content: page.content,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      published: page.published,
      updatedAt: page.updatedAt
    }))
  }
})

import { Article } from '../../models'

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
  const article = await Article.findOne({ slug, status: 'published' }).lean()
  if (!article) throw createError({ statusCode: 404, statusMessage: 'Publikasi tidak ditemukan.' })

  const related = await Article.find({
    status: 'published',
    _id: { $ne: article._id }
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean()

  return {
    article: serializeArticle(article),
    related: related.map((item) => serializeArticle(item))
  }
})

import { Article } from '../../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Publikasi tidak ditemukan.' })
  const article = await Article.findById(id).lean()
  if (!article) throw createError({ statusCode: 404, statusMessage: 'Publikasi tidak ditemukan.' })
  return { article: serializeArticle(article) }
})

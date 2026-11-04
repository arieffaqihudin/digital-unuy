import { Program } from '../../../models'
import { PROGRAM_CATEGORIES } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const body = await readBody(event)
  const title = String(body?.title || '').trim()
  const summary = String(body?.summary || '').trim()
  if (title.length < 3) throw createError({ statusCode: 422, statusMessage: 'Judul program minimal 3 karakter.' })
  if (summary.length < 10) throw createError({ statusCode: 422, statusMessage: 'Ringkasan program minimal 10 karakter.' })
  if (!PROGRAM_CATEGORIES.includes(body?.category)) {
    throw createError({ statusCode: 422, statusMessage: 'Kategori program tidak valid.' })
  }
  if (!['Direncanakan', 'Berjalan', 'Selesai'].includes(body?.status)) {
    throw createError({ statusCode: 422, statusMessage: 'Status program tidak valid.' })
  }
  const slug = slugify(String(body?.slug || title))
  if (!slug) throw createError({ statusCode: 422, statusMessage: 'Slug program tidak valid.' })
  if (await Program.exists({ slug })) throw createError({ statusCode: 409, statusMessage: 'Slug program sudah digunakan.' })

  const program = await Program.create({
    title,
    slug,
    category: body.category,
    summary,
    content: markdownToSafeHtml(String(body?.content || '')),
    status: body.status,
    order: Number(body?.order) || 0,
    createdBy: user.id
  })
  await recordAudit(event, user, 'program.created', 'Program', String(program._id), { title: program.title })
  return { program: serializeProgram(program) }
})

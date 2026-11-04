import { Program } from '../../../models'
import { PROGRAM_CATEGORIES } from '../../../../shared/types'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'content.manage')
  const id = String(getRouterParam(event, 'id') || '')
  if (!isObjectId(id)) throw createError({ statusCode: 404, statusMessage: 'Program tidak ditemukan.' })
  const program = await Program.findById(id)
  if (!program) throw createError({ statusCode: 404, statusMessage: 'Program tidak ditemukan.' })
  const body = await readBody(event)
  const changed: string[] = []

  if (body?.title !== undefined) {
    const title = String(body.title).trim()
    if (title.length < 3) throw createError({ statusCode: 422, statusMessage: 'Judul program minimal 3 karakter.' })
    program.title = title
    changed.push('title')
  }
  if (body?.slug !== undefined) {
    const nextSlug = slugify(String(body.slug))
    if (!nextSlug) throw createError({ statusCode: 422, statusMessage: 'Slug program tidak valid.' })
    if (nextSlug !== program.slug && (await Program.exists({ slug: nextSlug, _id: { $ne: program._id } }))) {
      throw createError({ statusCode: 409, statusMessage: 'Slug program sudah digunakan.' })
    }
    program.slug = nextSlug
    changed.push('slug')
  }
  if (body?.summary !== undefined) {
    const summary = String(body.summary).trim()
    if (summary.length < 10) throw createError({ statusCode: 422, statusMessage: 'Ringkasan program minimal 10 karakter.' })
    program.summary = summary
    changed.push('summary')
  }
  if (body?.category !== undefined) {
    if (!PROGRAM_CATEGORIES.includes(body.category)) {
      throw createError({ statusCode: 422, statusMessage: 'Kategori program tidak valid.' })
    }
    program.category = body.category
    changed.push('category')
  }
  if (body?.status !== undefined) {
    if (!['Direncanakan', 'Berjalan', 'Selesai'].includes(body.status)) {
      throw createError({ statusCode: 422, statusMessage: 'Status program tidak valid.' })
    }
    program.status = body.status
    changed.push('status')
  }
  if (body?.content !== undefined) {
    program.content = markdownToSafeHtml(String(body.content || ''))
    changed.push('content')
  }
  if (body?.order !== undefined) {
    const order = Number(body.order)
    if (!Number.isFinite(order)) throw createError({ statusCode: 422, statusMessage: 'Urutan tidak valid.' })
    program.order = order
    changed.push('order')
  }

  await program.save()
  await recordAudit(event, user, 'program.updated', 'Program', String(program._id), {
    title: program.title,
    changed
  })
  return { program: serializeProgram(program) }
})

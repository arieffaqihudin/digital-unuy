import { Program } from '../../models'

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
  const program = await Program.findOne({ slug }).lean()
  if (!program) throw createError({ statusCode: 404, statusMessage: 'Program tidak ditemukan.' })
  const related = await Program.find({ _id: { $ne: program._id } })
    .sort({ order: 1 })
    .limit(3)
    .lean()
  return {
    program: serializeProgram(program),
    related: related.map((item) => serializeProgram(item))
  }
})

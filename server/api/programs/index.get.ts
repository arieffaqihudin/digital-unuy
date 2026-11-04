import { Program } from '../../models'

export default defineEventHandler(async () => {
  const programs = await Program.find({}).sort({ order: 1, updatedAt: -1 }).lean()
  return { items: programs.map((program) => serializeProgram(program)) }
})

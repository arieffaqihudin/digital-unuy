export default defineEventHandler(async () => {
  const settings = await getSettings()
  return { settings: serializeSettings(settings) }
})

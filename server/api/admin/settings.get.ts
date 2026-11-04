import { SiteSetting } from '../../models'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'settings.manage')
  const settings = await getSettings()
  return {
    settings: {
      ...serializeSettings(settings),
      metrics: settings.metrics || []
    }
  }
})

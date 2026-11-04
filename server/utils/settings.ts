import { SiteSetting } from '../models'

export async function getSettings() {
  let settings = await SiteSetting.findOne({ key: 'global' }).lean()
  if (!settings) {
    const created = await SiteSetting.create({ key: 'global' })
    settings = created.toObject()
  }
  return settings
}

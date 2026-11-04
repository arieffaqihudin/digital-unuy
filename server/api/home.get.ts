import {
  Article,
  DigitalPlatform,
  Document,
  PlatformCategory,
  Service,
  SiteSetting
} from '../models'

export default defineEventHandler(async () => {
  const [featuredServices, allServices, platforms, platformCategories, documents, articles, settings] =
    await Promise.all([
      Service.find({ active: true, featured: true }).sort({ order: 1 }).limit(6).lean(),
      Service.find({ active: true }).sort({ order: 1 }).limit(6).lean(),
      DigitalPlatform.find({ published: true })
        .populate('categoryId', 'name slug order')
        .sort({ featured: -1, order: 1, name: 1 })
        .limit(6)
        .lean(),
      PlatformCategory.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
      Document.find({ published: true, archived: false })
        .sort({ updatedAt: -1 })
        .populate('currentVersion')
        .limit(4)
        .lean(),
      Article.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(3).lean(),
      SiteSetting.findOne({ key: 'global' }).lean()
    ])

  const serviceItems = featuredServices.length ? featuredServices : allServices
  const verifiedMetrics = (settings?.metrics || []).filter((metric: any) => metric.verified === true)

  return {
    settings: serializeSettings(settings),
    services: serviceItems.map((service) => serializeService(service)),
    platforms: platforms.map((platform) => serializePlatform(platform)),
    platformCategories: platformCategories.map((category) => serializePlatformCategory(category)),
    documents: documents.map((doc) => serializeDocument(doc)),
    articles: articles.map((article) => serializeArticle(article)),
    metrics: verifiedMetrics,
    counts: {
      services: await Service.countDocuments({ active: true }),
      platforms: await DigitalPlatform.countDocuments({ published: true })
    }
  }
})

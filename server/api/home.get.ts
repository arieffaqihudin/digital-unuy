import {
  Article,
  DigitalPlatform,
  Document,
  Program,
  Service,
  SiteSetting
} from '../models'

export default defineEventHandler(async () => {
  const [featuredServices, allServices, platforms, programs, documents, articles, settings] =
    await Promise.all([
      Service.find({ active: true, featured: true }).sort({ order: 1 }).limit(6).lean(),
      Service.find({ active: true }).sort({ order: 1 }).limit(6).lean(),
      DigitalPlatform.find({}).sort({ order: 1, name: 1 }).limit(6).lean(),
      Program.find({}).sort({ order: 1, updatedAt: -1 }).limit(4).lean(),
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
    programs: programs.map((program) => serializeProgram(program)),
    documents: documents.map((doc) => serializeDocument(doc)),
    articles: articles.map((article) => serializeArticle(article)),
    metrics: verifiedMetrics,
    counts: {
      services: await Service.countDocuments({ active: true }),
      platforms: await DigitalPlatform.countDocuments({})
    }
  }
})

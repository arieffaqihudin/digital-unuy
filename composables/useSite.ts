import type { SiteSettingsDTO } from '~/shared/types'

const defaultSettings: SiteSettingsDTO = {
  directorateName: 'Direktorat Tim Transformasi Digital',
  universityName: 'Universitas Nahdlatul Ulama Yogyakarta',
  tagline: '',
  logoUrl: '',
  description: '',
  address: '',
  contactPhone: '',
  contactEmail: '',
  notificationEmail: '',
  socials: [],
  hero: {
    eyebrow: 'Transformasi Digital',
    title: 'Mendorong Transformasi Digital UNU Yogyakarta',
    description:
      'Mengembangkan ekosistem digital yang terintegrasi, memperkuat tata kelola teknologi informasi, dan menghadirkan layanan digital yang mendukung pendidikan, penelitian, pengabdian, serta pengelolaan universitas.',
    primaryLabel: 'Jelajahi Layanan Digital',
    primaryUrl: '/layanan',
    secondaryLabel: 'Mengenal Direktorat',
    secondaryUrl: '/tentang'
  },
  metrics: [],
  devSeedMode: false
}

export function useSite() {
  const settings = useState<SiteSettingsDTO>('site.settings', () => defaultSettings)
  const loaded = useState<boolean>('site.loaded', () => false)

  async function ensureSite(force = false) {
    if (loaded.value && !force) return settings.value
    try {
      const requestFetch = useRequestFetch()
      const data = await requestFetch<{ settings: SiteSettingsDTO }>('/api/site')
      settings.value = data.settings
    } catch {
      settings.value = defaultSettings
    } finally {
      loaded.value = true
    }
    return settings.value
  }

  return { settings, loaded, ensureSite, defaults: defaultSettings }
}

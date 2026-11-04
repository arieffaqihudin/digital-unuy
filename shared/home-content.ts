export interface ImpactMetric {
  value: number
  suffix?: string
  label: string
  period: string
  detail?: string
}

export const heroContent = {
  eyebrow: 'Direktorat Transformasi Digital',
  headline: {
    lead: 'Satu Kampus, Satu',
    accent: 'Ekosistem Digital.'
  },
  supporting:
    'Menghubungkan layanan, sistem, dan data untuk mendukung aktivitas akademik, operasional, dan tata kelola UNU Yogyakarta.',
  primaryCta: { label: 'Jelajahi Ekosistem', to: '/ekosistem-digital' },
  secondaryCta: { label: 'Ajukan Layanan', to: '/layanan' },
  visual: {
    src: '/images/home/campus-digital-ecosystem.webp',
    srcset: '/images/home/campus-digital-ecosystem-836.webp 836w, /images/home/campus-digital-ecosystem.webp 1400w',
    width: 1400,
    height: 788,
    alt: 'Gedung Universitas Nahdlatul Ulama Yogyakarta terhubung dengan layanan, dokumen, dan sistem digital kampus',
    building: {
      src: '/images/home/hero-building.webp',
      srcset: '/images/home/hero-building-560.webp 560w, /images/home/hero-building.webp 820w',
      width: 820,
      height: 831,
      alt: 'Gedung kampus Universitas Nahdlatul Ulama Yogyakarta'
    },
    screens: [
      {
        key: 'layanan',
        src: '/images/home/hero-screen-layanan.webp',
        alt: 'Tampilan katalog Layanan Digital pada portal UNU Yogyakarta'
      },
      {
        key: 'dokumen',
        src: '/images/home/hero-screen-dokumen.webp',
        alt: 'Tampilan halaman Panduan & Dokumen pada portal UNU Yogyakarta'
      },
      {
        key: 'lacak',
        src: '/images/home/hero-screen-lacak.webp',
        alt: 'Tampilan halaman Lacak Permohonan pada portal UNU Yogyakarta'
      }
    ]
  }
}

export const impactContent = {
  eyebrow: 'Dampak Transformasi',
  cta: { label: 'Lihat Dampak Transformasi', to: '/dampak' },
  source: 'Sumber: presentasi Transformasi Digital UNU Yogyakarta. Bukan data real-time.'
}

export const impactMetrics: ImpactMetric[] = [
  {
    value: 88,
    suffix: '%',
    label: 'Portofolio otomatis',
    period: 'Smt. Genap 2025/2026',
    detail: '370 dari 421'
  },
  { value: 652, label: 'Ijazah diterbitkan', period: 'Data 2025' },
  { value: 2141, label: 'Dokumen digital', period: 'Data 2026' },
  { value: 16401, label: 'Presensi tercatat', period: 'Data 2026' }
]

export const approachContent = {
  eyebrow: 'Pendekatan Transformasi',
  heading: 'Satu ekosistem, tiga siklus yang saling terhubung.',
  loopLabel: 'Satu ekosistem',
  cycles: [
    {
      title: 'Mahasiswa',
      icon: 'academic',
      text: 'Dari awal studi hingga kelulusan.',
      examples: ['Ijazah & SKPI']
    },
    {
      title: 'Dosen & Pegawai',
      icon: 'users',
      text: 'Pekerjaan akademik dan kepegawaian.',
      examples: ['Portofolio perkuliahan', 'Presensi pegawai']
    },
    {
      title: 'Institusi',
      icon: 'landmark',
      text: 'Tata kelola berbasis data terdokumentasi.',
      examples: ['Dokumen digital']
    }
  ]
}

export interface ShowcaseScreen {
  key: string
  tab: string
  caption: string
  src: string
  srcset: string
  alt: string
}

export const showcaseContent = {
  eyebrow: 'Ekosistem Digital',
  heading: 'Platform yang menyusun layanan kampus.',
  product: {
    eyebrow: 'Produk unggulan',
    name: 'Portal Layanan Digital',
    cluster: 'Layanan & Tata Kelola Digital',
    summary: 'Satu pintu untuk mengajukan layanan TI, melacak status, dan membaca panduan.',
    status: 'Pilot / Beta',
    cta: { label: 'Buka Portal Layanan', to: '/layanan' }
  },
  screens: [
    {
      key: 'layanan',
      tab: 'Katalog Layanan',
      caption: 'Telusuri layanan TI dan ajukan permohonan.',
      src: '/images/home/portal-layanan.webp',
      srcset: '/images/home/portal-layanan-1080.webp 1080w, /images/home/portal-layanan.webp 2160w',
      alt: 'Tangkapan layar katalog Layanan Digital pada portal UNU Yogyakarta'
    },
    {
      key: 'lacak',
      tab: 'Pelacakan',
      caption: 'Pantau status dengan nomor tiket dan token akses.',
      src: '/images/home/portal-lacak.webp',
      srcset: '/images/home/portal-lacak-1080.webp 1080w, /images/home/portal-lacak.webp 2160w',
      alt: 'Tangkapan layar halaman Lacak Permohonan pada portal UNU Yogyakarta'
    },
    {
      key: 'dokumen',
      tab: 'Dokumentasi',
      caption: 'Baca SOP, panduan, dan kebijakan layanan.',
      src: '/images/home/portal-dokumen.webp',
      srcset: '/images/home/portal-dokumen-1080.webp 1080w, /images/home/portal-dokumen.webp 2160w',
      alt: 'Tangkapan layar halaman Panduan & Dokumen pada portal UNU Yogyakarta'
    }
  ] as ShowcaseScreen[]
}

export const caseStudyContent = {
  eyebrow: 'Studi Kasus Unggulan',
  heading: 'Portofolio perkuliahan yang dihasilkan otomatis.',
  description:
    'Pada Semester Genap 2025/2026, 370 dari 421 portofolio perkuliahan dihasilkan otomatis.',
  produced: 370,
  total: 421,
  period: 'Semester Genap 2025/2026',
  image: null as null | { src: string; alt: string }
}

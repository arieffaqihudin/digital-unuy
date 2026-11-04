export interface ImpactMetric {
  value: number
  suffix?: string
  label: string
  period: string
  detail?: string
}

export const heroContent = {
  eyebrow: 'Direktorat Transformasi Digital · UNU Yogyakarta',
  supporting:
    'Kami membangun ekosistem digital berdasarkan siklus kehidupan kampus—mahasiswa, dosen dan pegawai, serta institusi—agar teknologi benar-benar menjawab kebutuhan nyata.',
  primaryCta: { label: 'Jelajahi Ekosistem Digital', to: '/ekosistem-digital' },
  secondaryCta: { label: 'Ajukan Layanan', to: '/layanan' },
  visual: {
    src: '/images/home/portal-layanan.webp',
    width: 2160,
    height: 1170,
    alt: 'Tangkapan layar halaman Layanan Digital pada portal Transformasi Digital UNU Yogyakarta',
    caption: 'Portal Layanan Digital UNU Yogyakarta'
  }
}

export const impactContent = {
  eyebrow: 'Dampak Transformasi',
  heading: 'Bukan Sekadar Membangun Sistem. Menghadirkan Perubahan Nyata.',
  description:
    'Dari proses akademik hingga operasional kampus, transformasi digital mulai menghadirkan pekerjaan yang lebih terintegrasi, terdokumentasi, dan terukur.',
  cta: { label: 'Lihat Dampak Transformasi', to: '/dampak' },
  source: 'Sumber: presentasi Transformasi Digital UNU Yogyakarta. Data per periode yang tertera, bukan data real-time.'
}

export const impactMetrics: ImpactMetric[] = [
  {
    value: 88,
    suffix: '%',
    label: 'Portofolio perkuliahan dihasilkan otomatis',
    period: 'Semester Genap 2025/2026',
    detail: '370 dari 421 portofolio'
  },
  { value: 652, label: 'Ijazah diterbitkan', period: 'Data 2025' },
  { value: 2141, label: 'Dokumen digital dikelola', period: 'Data 2026' },
  { value: 16401, label: 'Aktivitas presensi pegawai tercatat', period: 'Data 2026' }
]

export const approachContent = {
  eyebrow: 'Pendekatan Transformasi',
  heading: 'Satu ekosistem, tiga siklus yang saling terhubung.',
  description:
    'Teknologi dirancang mengikuti perjalanan orang di kampus, bukan mengikuti struktur sistem.',
  cycles: [
    {
      title: 'Mahasiswa',
      text: 'Perjalanan akademik dari awal studi hingga kelulusan, termasuk penerbitan ijazah dan SKPI.'
    },
    {
      title: 'Dosen & Pegawai',
      text: 'Pekerjaan akademik dan kepegawaian sehari-hari, seperti portofolio perkuliahan dan presensi.'
    },
    {
      title: 'Institusi',
      text: 'Tata kelola, dokumen, dan pengambilan keputusan yang bertumpu pada data terdokumentasi.'
    }
  ]
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

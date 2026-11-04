import type { PlatformMetricDTO } from '../shared/types'

export type PlatformCategorySeed = {
  name: string
  slug: string
  description: string
  order: number
}

export type PlatformModuleSeed = {
  name: string
  description?: string
  order: number
  active: boolean
}

export type PlatformSeed = {
  name: string
  slug: string
  description: string
  categorySlug: string
  status: 'Aktif' | 'Pilot' | 'Dalam Pengembangan' | 'Tidak Aktif' | 'Belum Dikonfirmasi'
  audiences: string[]
  unit?: string
  url?: string
  order: number
  featured?: boolean
  thumbnail?: string
  gallery?: string[]
  problem?: string
  solution?: string
  benefits?: string
  features?: string
  modules?: PlatformModuleSeed[]
  metrics?: PlatformMetricDTO[]
}

export const PLATFORM_CATEGORY_SEED: PlatformCategorySeed[] = [
  {
    name: 'Akademik & Pembelajaran',
    slug: 'akademik-pembelajaran',
    description:
      'Sistem digital yang mendukung proses akademik, pembelajaran, penilaian, dan administrasi kelulusan mahasiswa.',
    order: 1
  },
  {
    name: 'Operasional & Tata Kelola',
    slug: 'operasional-tata-kelola',
    description:
      'Ekosistem digital untuk administrasi, kepegawaian, pengelolaan dokumen, dan operasional universitas.',
    order: 2
  },
  {
    name: 'Pengabdian & Pengembangan Masyarakat',
    slug: 'pengabdian-pengembangan-masyarakat',
    description:
      'Sistem informasi yang mendukung perencanaan, pelaksanaan, monitoring, dan evaluasi kegiatan pengabdian serta pengembangan masyarakat.',
    order: 3
  },
  {
    name: 'Platform & Infrastruktur Digital',
    slug: 'platform-infrastruktur-digital',
    description:
      'Platform dan layanan pendukung yang memudahkan unit kerja membangun, mengelola, dan mengintegrasikan kebutuhan digital universitas.',
    order: 4
  }
]

export const LEGACY_PLATFORM_CATEGORY_MAP: Record<string, string> = {
  Akademik: 'akademik-pembelajaran',
  'Penjaminan Mutu': 'akademik-pembelajaran',
  'Tata Kelola': 'operasional-tata-kelola',
  'Sumber Daya Manusia': 'operasional-tata-kelola',
  'Website & Publikasi': 'platform-infrastruktur-digital',
  'Infrastruktur Digital': 'platform-infrastruktur-digital',
  'Pengabdian Masyarakat': 'pengabdian-pengembangan-masyarakat',
  'Akademik & Pembelajaran': 'akademik-pembelajaran',
  'Operasional & Tata Kelola': 'operasional-tata-kelola',
  'Pengabdian & Pengembangan Masyarakat': 'pengabdian-pengembangan-masyarakat',
  'Platform & Infrastruktur Digital': 'platform-infrastruktur-digital'
}

const METRIC_SOURCE = 'Presentasi Transformasi Digital UNU Yogyakarta'

export const PLATFORM_SEED: PlatformSeed[] = [
  {
    name: 'Sistem Informasi Akademik',
    slug: 'sistem-informasi-akademik',
    description:
      'Menyatukan data akademik mahasiswa, kurikulum, penilaian, dan administrasi kelulusan dalam satu sistem.',
    categorySlug: 'akademik-pembelajaran',
    status: 'Belum Dikonfirmasi',
    audiences: ['Mahasiswa', 'Dosen', 'Tenaga Kependidikan'],
    order: 1,
    featured: true,
    problem: 'Data akademik tersebar pada beberapa berkas dan alur kerja manual sehingga penelusuran status menjadi lambat.',
    solution: 'Satu sistem akademik terpadu untuk mengelola data mahasiswa, kurikulum, penilaian, dan kelulusan.',
    benefits: 'Mempercepat administrasi akademik dan menyediakan satu sumber data yang konsisten bagi mahasiswa serta pengelola program studi.',
    features: 'Data mahasiswa\nKurikulum dan kelas\nPenilaian\nAdministrasi kelulusan'
  },
  {
    name: 'Sistem Informasi OBA',
    slug: 'sistem-informasi-oba',
    description:
      'Mendukung pengelolaan portofolio perkuliahan dan penilaian secara otomatis.',
    categorySlug: 'akademik-pembelajaran',
    status: 'Belum Dikonfirmasi',
    audiences: ['Dosen', 'Pengelola Unit'],
    order: 2,
    problem: 'Portofolio perkuliahan disusun berulang dari banyak dokumen sehingga menyita waktu dosen dan pengelola.',
    solution: 'Otomasi penyusunan portofolio berbasis data perkuliahan dan penilaian.',
    benefits: 'Mengurangi pekerjaan administratif dosen dan mempercepat penyiapan portofolio perkuliahan.',
    features: 'Portofolio otomatis\nRekap penilaian\nData perkuliahan',
    metrics: [
      {
        value: 88,
        suffix: '%',
        label: 'Portofolio perkuliahan dihasilkan otomatis',
        period: 'Semester Genap 2025/2026',
        source: METRIC_SOURCE
      }
    ]
  },
  {
    name: 'Sistem Ijazah Generator',
    slug: 'sistem-ijazah-generator',
    description:
      'Mempercepat penyiapan dan penerbitan ijazah dengan data kelulusan yang konsisten.',
    categorySlug: 'akademik-pembelajaran',
    status: 'Belum Dikonfirmasi',
    audiences: ['Tenaga Kependidikan', 'Pengelola Unit'],
    order: 3,
    problem: 'Penerbitan ijazah membutuhkan pencocokan data kelulusan secara manual dan berulang.',
    solution: 'Generator ijazah yang membaca data kelulusan dan menyiapkan dokumen secara terkendali.',
    benefits: 'Mempercepat penerbitan ijazah dan mengurangi risiko ketidaksesuaian data.',
    features: 'Data kelulusan\nPenyiapan dokumen ijazah\nRekap penerbitan',
    metrics: [
      {
        value: 652,
        label: 'Ijazah diterbitkan',
        period: 'Data 2025',
        source: METRIC_SOURCE
      }
    ]
  },
  {
    name: 'Sistem Tata Kelola SKPI',
    slug: 'sistem-tata-kelola-skpi',
    description:
      'Mengelola data dan penerbitan Surat Keterangan Pendamping Ijazah secara terintegrasi.',
    categorySlug: 'akademik-pembelajaran',
    status: 'Belum Dikonfirmasi',
    audiences: ['Tenaga Kependidikan', 'Pengelola Unit'],
    order: 4,
    problem: 'Data kegiatan mahasiswa untuk SKPI tersebar dan proses verifikasinya tidak seragam.',
    solution: 'Pengelolaan data SKPI yang terhubung dengan kegiatan dan persyaratan kelulusan.',
    benefits: 'Mempermudah verifikasi dan penerbitan SKPI dengan data yang tertelusur.',
    features: 'Data kegiatan mahasiswa\nVerifikasi\nPenerbitan SKPI'
  },
  {
    name: 'Portal Pegawai Green Team',
    slug: 'portal-pegawai-green-team',
    description:
      'Portal terpadu untuk administrasi kepegawaian, cuti, presensi, persuratan, dan agenda kerja.',
    categorySlug: 'operasional-tata-kelola',
    status: 'Belum Dikonfirmasi',
    audiences: ['Dosen', 'Tenaga Kependidikan'],
    order: 5,
    featured: true,
    problem: 'Proses kepegawaian dan persuratan tersebar pada beberapa kanal sehingga status pekerjaan sulit dipantau.',
    solution: 'Satu portal pegawai yang menghubungkan cuti, presensi, persuratan, dan agenda kerja.',
    benefits: 'Menyederhanakan administrasi pegawai dan memberikan satu pintu untuk kebutuhan operasional harian.',
    features: 'Tata kelola cuti\nAbsensi dan presensi pegawai\nPersuratan\nTata kelola agenda',
    modules: [
      { name: 'Tata Kelola Cuti', description: 'Pengajuan dan persetujuan cuti pegawai.', order: 1, active: true },
      { name: 'Absensi / Presensi Pegawai', description: 'Pencatatan kehadiran pegawai.', order: 2, active: true },
      { name: 'Persuratan', description: 'Pengelolaan surat dan alur disposisi.', order: 3, active: true },
      { name: 'Tata Kelola Agenda', description: 'Penjadwalan dan pencatatan agenda kerja.', order: 4, active: true }
    ],
    metrics: [
      { value: 2141, label: 'Dokumen digital', period: 'Data 2026', source: METRIC_SOURCE },
      { value: 16401, label: 'Aktivitas presensi', period: 'Data 2026', source: METRIC_SOURCE },
      { value: 921, label: 'Agenda', period: 'Data 2026', source: METRIC_SOURCE },
      { value: 292, label: 'Pengajuan cuti', period: 'Data 2026', source: METRIC_SOURCE }
    ]
  },
  {
    name: 'Sistem Informasi Anggaran',
    slug: 'sistem-informasi-anggaran',
    description:
      'Mendukung perencanaan, realisasi, dan pemantauan anggaran unit kerja secara tertata.',
    categorySlug: 'operasional-tata-kelola',
    status: 'Belum Dikonfirmasi',
    audiences: ['Tenaga Kependidikan', 'Pengelola Unit'],
    order: 6,
    problem: 'Informasi anggaran unit kerja tersebar dan rekonsiliasi realisasi membutuhkan waktu.',
    solution: 'Pengelolaan perencanaan dan realisasi anggaran dalam satu alur yang tercatat.',
    benefits: 'Membantu unit kerja memantau anggaran dan mempercepat penyusunan laporan.',
    features: 'Perencanaan anggaran\nRealisasi\nPemantauan dan rekap'
  },
  {
    name: 'Sistem Informasi Tata Kelola Labsos',
    slug: 'sistem-informasi-tata-kelola-labsos',
    description:
      'Mendukung perencanaan, pelaksanaan, dan monitoring kegiatan pengabdian serta pengembangan masyarakat.',
    categorySlug: 'pengabdian-pengembangan-masyarakat',
    status: 'Belum Dikonfirmasi',
    audiences: ['Mahasiswa', 'Dosen', 'Pengelola Unit'],
    order: 7,
    problem: 'Data kegiatan pengabdian, mitra, dan luaran belum tercatat dalam satu alur yang mudah ditelusuri.',
    solution: 'Sistem tata kelola kegiatan pengabdian dari perencanaan hingga evaluasi.',
    benefits: 'Memudahkan monitoring kegiatan dan penyusunan laporan pengabdian masyarakat.',
    features: 'Perencanaan kegiatan\nData mitra\nMonitoring\nLuaran kegiatan'
  },
  {
    name: 'Website Builder',
    slug: 'website-builder',
    description:
      'Memudahkan unit kerja membangun dan mengelola website resmi secara mandiri.',
    categorySlug: 'platform-infrastruktur-digital',
    status: 'Belum Dikonfirmasi',
    audiences: ['Pengelola Unit'],
    order: 8,
    problem: 'Pembuatan website unit kerja membutuhkan waktu karena bergantung pada pengembangan teknis.',
    solution: 'Pembangun website dengan komponen dan tata kelola konten yang siap digunakan.',
    benefits: 'Mempercepat peluncuran website unit kerja dengan identitas dan struktur yang konsisten.',
    features: 'Templat halaman\nPengelolaan konten\nIdentitas unit'
  },
  {
    name: 'Form Builder',
    slug: 'form-builder',
    description:
      'Memungkinkan unit kerja menyusun formulir digital tanpa pengembangan teknis.',
    categorySlug: 'platform-infrastruktur-digital',
    status: 'Belum Dikonfirmasi',
    audiences: ['Dosen', 'Tenaga Kependidikan', 'Pengelola Unit'],
    order: 9,
    problem: 'Kebutuhan formulir baru sering menunggu antrean pengembangan aplikasi.',
    solution: 'Penyusun formulir mandiri dengan validasi dan alur data yang dapat dikonfigurasi.',
    benefits: 'Mempercepat penyediaan formulir digital dan mengurangi ketergantungan pada tim teknis.',
    features: 'Komponen isian\nValidasi\nPublikasi formulir'
  },
  {
    name: 'Shortlink',
    slug: 'shortlink',
    description:
      'Menyederhanakan tautan resmi kampus untuk dibagikan dan dipantau.',
    categorySlug: 'platform-infrastruktur-digital',
    status: 'Belum Dikonfirmasi',
    audiences: ['Dosen', 'Tenaga Kependidikan', 'Pengelola Unit'],
    order: 10,
    problem: 'Tautan layanan yang panjang menyulitkan proses berbagi dan pencatatan kanal informasi.',
    solution: 'Layanan tautan pendek resmi dengan pengelolaan dan pemantauan sederhana.',
    benefits: 'Membuat tautan resmi lebih mudah dibagikan dan digunakan pada berbagai kanal komunikasi.',
    features: 'Pemendekan tautan\nPengelolaan tautan\nRekap kunjungan'
  }
]

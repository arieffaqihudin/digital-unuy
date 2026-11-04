import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { markdownToSafeHtml } from '../server/utils/content'
import { PERMISSION_META } from '../shared/permissions'
import { ROLE_PERMISSIONS } from '../shared/types'
import {
  Article,
  DigitalPlatform,
  Document,
  DocumentVersion,
  Page,
  Permission,
  Program,
  Role,
  Service,
  ServiceFormVersion,
  SiteSetting,
  TeamGroup,
  TeamMember,
  User
} from '../server/models'

const MONGODB_URI = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_unuy'
const UPLOAD_ROOT = resolve(process.cwd(), process.env.NUXT_UPLOAD_DIR || '.data/uploads')
const RESET = process.argv.includes('--reset')
const SEED_PASSWORD_ADMIN = process.env.SEED_ADMIN_PASSWORD || 'Admin#Unu2026'
const SEED_PASSWORD_PETUGAS = process.env.SEED_PETUGAS_PASSWORD || 'Petugas#2026'

if (process.env.NODE_ENV === 'production') {
  console.error('Seed ditolak: jangan menjalankan seed development di NODE_ENV=production.')
  process.exit(1)
}

await mongoose.connect(MONGODB_URI)
console.log(`[seed] terhubung ke ${MONGODB_URI}`)

if (RESET) {
  console.log('[seed] --reset: menghapus database aplikasi…')
  await mongoose.connection.dropDatabase()
}

const now = new Date()
const field = (
  key: string,
  label: string,
  type: any = 'text',
  required = true,
  extra: Record<string, unknown> = {}
) => ({
  key,
  label,
  type,
  required,
  placeholder: '',
  helpText: '',
  minLength: null,
  maxLength: type === 'textarea' ? 5000 : 500,
  pattern: '',
  options: [],
  fileMaxMB: 10,
  accept: [],
  showIf: null,
  ...extra
})
const options = (values: string[]) =>
  values.map((value) => ({
    label: value
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    value
  }))
const upload = (key: string, label: string, required = true, accept?: string[]) =>
  field(key, label, 'file', required, {
    accept: accept || [],
    helpText: 'Maksimal 10 MB. Format harus sesuai ketentuan layanan.',
    maxLength: null
  })
const requiredAcceptedMimes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip'
]

await Permission.bulkWrite(
  PERMISSION_META.map((permission) => ({
    updateOne: {
      filter: { key: permission.key },
      update: { $set: permission },
      upsert: true
    }
  }))
)
await Role.deleteOne({ slug: 'pemohon' })
await User.deleteOne({ email: 'pemohon@digital.unu.local' })
await User.deleteOne({ email: 'nonaktif@digital.unu.local' })

for (const slug of ['superadmin', 'admin'] as const) {
  await Role.updateOne(
    { slug },
    {
      $set: {
        slug,
        label: slug === 'superadmin' ? 'Superadmin' : 'Admin/Petugas',
        description:
          slug === 'superadmin'
            ? 'Akses penuh terhadap administrasi sistem.'
            : 'Petugas operasional layanan dan konten.',
        permissions: ROLE_PERMISSIONS[slug],
        isSystem: true
      }
    },
    { upsert: true }
  )
}

async function upsertUser(input: {
  name: string
  email: string
  role: 'superadmin' | 'admin'
  password: string
  active: boolean
}) {
  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = await User.findOneAndUpdate(
    { email: input.email },
    {
      $set: {
        name: input.name,
        email: input.email,
        role: input.role,
        active: input.active,
        passwordHash,
        emailVerifiedAt: input.active ? now : null,
        isSeedData: true
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  return user
}

await upsertUser({
  name: 'Superadmin Pengembangan',
  email: 'superadmin@digital.unu.local',
  role: 'superadmin',
  password: SEED_PASSWORD_ADMIN,
  active: true
})
await upsertUser({
  name: 'Petugas Layanan',
  email: 'petugas@digital.unu.local',
  role: 'admin',
  password: SEED_PASSWORD_PETUGAS,
  active: true
})

await SiteSetting.findOneAndUpdate(
  { key: 'global' },
  {
    $set: {
      key: 'global',
      directorateName: 'Direktorat Tim Transformasi Digital',
      universityName: 'Universitas Nahdlatul Ulama Yogyakarta',
      tagline: 'Satu pintu layanan digital kampus',
      logoUrl: '',
      description:
        'Menghadirkan layanan dan ekosistem digital yang terintegrasi untuk mendukung tata kelola, pembelajaran, dan pengembangan universitas.',
      address: '',
      contactPhone: '',
      contactEmail: '',
      notificationEmail: '',
      socials: [],
      hero: {
        eyebrow: 'Transformasi Digital',
        title: 'Mendorong Transformasi Digital UNU Yogyakarta',
        description:
          'Menghadirkan layanan dan ekosistem digital yang terintegrasi untuk mendukung tata kelola, pembelajaran, dan pengembangan universitas.',
        primaryLabel: 'Jelajahi Layanan',
        primaryUrl: '/layanan',
        secondaryLabel: 'Tentang Direktorat',
        secondaryUrl: '/tentang'
      },
      metrics: [],
      devSeedMode: true
    }
  },
  { upsert: true }
)

await Page.findOneAndUpdate(
  { slug: 'tentang-kami' },
  {
    $set: {
      title: 'Direktorat Tim Transformasi Digital',
      slug: 'tentang-kami',
      excerpt:
        'Mendorong transformasi digital UNU Yogyakarta melalui tata kelola yang tertib, integrasi sistem dan data, serta layanan digital yang berorientasi pada kebutuhan sivitas akademika.',
      content: markdownToSafeHtml(`
## Peran dan fokus kerja

Direktorat Tim Transformasi Digital berperan mendorong pemanfaatan teknologi informasi secara terencana di lingkungan Universitas Nahdlatul Ulama Yogyakarta. Fokus kerja diarahkan pada tata kelola teknologi informasi, digitalisasi proses bisnis, integrasi sistem dan data, pengembangan sistem informasi, infrastruktur layanan digital, serta pendampingan transformasi bagi unit kerja.

Transformasi dijalankan secara bertahap dengan menempatkan kebutuhan pengguna sebagai titik awal. Setiap inisiatif diharapkan memiliki tujuan yang jelas, pemilik proses, dan ukuran keberhasilan yang dapat ditinjau bersama.

## Cara kami bekerja

- **Satu pintu.** Layanan digital dihimpun agar mudah ditemukan, dipahami, dan diajukan.
- **Tertib.** Setiap permohonan memiliki alur, status, dan jejak audit yang dapat ditelusuri.
- **Terukur.** Statistik operasional hanya ditampilkan setelah datanya terverifikasi.
- **Aman.** Data pribadi dan lampiran dilindungi sesuai kewenangan pengguna.

## Batasan informasi

Halaman ini tidak memuat struktur organisasi, nama pimpinan, atau mandat formal yang belum diverifikasi. Informasi resmi akan diperbarui melalui pengelolaan konten yang sah.
`),
      seoTitle: 'Tentang Direktorat Tim Transformasi Digital',
      seoDescription:
        'Peran Direktorat Tim Transformasi Digital UNU Yogyakarta dalam tata kelola TI, integrasi data, dan layanan digital.',
      published: true,
      isSeedData: true
    }
  },
  { upsert: true }
)

const serviceDefinitions = [
  {
    name: 'Pembuatan Email Institusi',
    slug: 'pembuatan-email-institusi',
    category: 'Akun & Identitas',
    icon: 'mail',
    order: 1,
    featured: true,
    shortDescription: 'Permohonan akun email resmi universitas untuk pihak yang memenuhi persyaratan.',
    description:
      'Layanan pembuatan akun email institusi untuk sivitas akademika dan pihak yang berhak. Permohonan akan diverifikasi terhadap status pemohon dan ketersediaan lisensi sebelum diproses.',
    targetUsers: ['Dosen', 'Tenaga kependidikan', 'Mahasiswa aktif', 'Pengelola unit kerja'],
    requirements: [
      'Pemohon memiliki status aktif yang dapat diverifikasi oleh unit terkait.',
      'Ketersediaan lisensi atau kuota akun dikonfirmasi oleh petugas sebelum akun dibuat.',
      'Data identitas sesuai dengan data institusi.'
    ],
    requiredDocuments: ['Kartu identitas sivitas atau surat keterangan unit (jika diperlukan)'],
    procedure: [
      'Lengkapi formulir dan unggah dokumen pendukung bila diminta.',
      'Petugas memverifikasi status pemohon dan ketersediaan lisensi.',
      'Jika disetujui, akun disiapkan dan informasi akses disampaikan melalui kanal resmi.',
      'Pemohon memeriksa dan mengaktifkan akun sesuai instruksi.'
    ],
    estimatedDuration: '3–5 hari kerja',
    fields: [
      field('nama_lengkap', 'Nama lengkap', 'text', true, { maxLength: 120 }),
      field('kategori_pemohon', 'Kategori pemohon', 'select', true, {
        options: options(['mahasiswa', 'dosen', 'tenaga_kependidikan', 'unit_kerja', 'lainnya'])
      }),
      field('identitas_institusi', 'NIM / NIDN / NIP / identitas unit', 'text', true, {
        helpText: 'Sesuaikan dengan kategori pemohon.',
        maxLength: 60
      }),
      field('unit_kerja', 'Fakultas / unit kerja', 'text', true, { maxLength: 160 }),
      field('email_alternatif', 'Email alternatif', 'email', true, { maxLength: 180 }),
      field('nomor_kontak', 'Nomor kontak', 'text', true, {
        maxLength: 30,
        placeholder: 'Contoh: 08xxxxxxxxxx'
      }),
      field('keterangan', 'Keterangan tambahan', 'textarea', false, { maxLength: 2000 })
    ]
  },
  {
    name: 'Pengembangan Sistem Informasi',
    slug: 'pengembangan-sistem-informasi',
    category: 'Sistem Informasi',
    icon: 'code',
    order: 2,
    featured: true,
    shortDescription: 'Usulan pengembangan sistem informasi baru atau pengembangan lanjutan sesuai kebutuhan unit.',
    description:
      'Layanan pengajuan usulan pengembangan sistem informasi. Pengajuan tidak otomatis berarti usulan disetujui untuk dikerjakan; petugas akan melakukan kajian kelayakan dan menyampaikan hasil tindak lanjut.',
    targetUsers: ['Unit kerja', 'Fakultas', 'Program studi', 'Pengelola layanan'],
    requirements: [
      'Kebutuhan dan permasalahan dijelaskan secara spesifik.',
      'Terdapat penanggung jawab dari unit pemohon.',
      'Usulan memiliki kaitan jelas dengan proses bisnis atau layanan unit.'
    ],
    requiredDocuments: ['Dokumen kebutuhan atau proposal ringkas', 'Dokumen pendukung lainnya (opsional)'],
    procedure: [
      'Kirim usulan melalui formulir.',
      'Petugas melakukan kajian awal dan meminta klarifikasi bila diperlukan.',
      'Hasil kajian dan rekomendasi tindak lanjut disampaikan melalui portal.',
      'Pekerjaan hanya dimulai setelah usulan disetujui sesuai mekanisme yang berlaku.'
    ],
    estimatedDuration: 'Kajian awal 7–14 hari kerja',
    fields: [
      field('unit_pemohon', 'Unit pemohon', 'text', true, { maxLength: 160 }),
      field('nama_sistem', 'Nama sistem yang diusulkan', 'text', true, { maxLength: 160 }),
      field('latar_belakang', 'Latar belakang kebutuhan', 'textarea', true, { maxLength: 4000 }),
      field('permasalahan', 'Permasalahan yang ingin diselesaikan', 'textarea', true, { maxLength: 4000 }),
      field('tujuan', 'Tujuan pengembangan', 'textarea', true, { maxLength: 3000 }),
      field('pengguna_sistem', 'Pengguna sistem', 'textarea', true, { maxLength: 2000 }),
      field('fitur_utama', 'Gambaran fitur utama', 'textarea', true, { maxLength: 5000 }),
      field('urgensi', 'Tingkat urgensi', 'radio', true, {
        options: options(['rendah', 'sedang', 'tinggi', 'kritis'])
      }),
      upload('dokumen_pendukung', 'Dokumen pendukung', false, requiredAcceptedMimes)
    ]
  },
  {
    name: 'Permintaan Domain dan Server',
    slug: 'permintaan-domain-dan-server',
    category: 'Infrastruktur',
    icon: 'server',
    order: 3,
    featured: true,
    shortDescription: 'Permohonan domain, subdomain, atau sumber daya server untuk kebutuhan unit kerja.',
    description:
      'Permohonan penyediaan domain/subdomain dan/atau sumber daya server. Seluruh permintaan tetap melalui kajian dan persetujuan administrator.',
    targetUsers: ['Unit kerja', 'Fakultas', 'Pengelola website atau aplikasi'],
    requirements: [
      'Tujuan penggunaan dan penanggung jawab dijelaskan.',
      'Nama domain mengikuti ketentuan penamaan institusi.',
      'Kebutuhan infrastruktur diuraikan secara wajar.'
    ],
    requiredDocuments: ['Surat permohonan atau dokumen pendukung unit'],
    procedure: [
      'Ajukan kebutuhan domain/server.',
      'Petugas memeriksa ketersediaan dan kesesuaian.',
      'Permintaan disetujui atau ditolak beserta alasannya.',
      'Penyediaan dilakukan setelah persetujuan.'
    ],
    estimatedDuration: '5–10 hari kerja',
    fields: [
      field('unit_pemohon', 'Unit pemohon', 'text', true, { maxLength: 160 }),
      field('domain_diusulkan', 'Nama domain/subdomain yang diusulkan', 'text', true, {
        maxLength: 200,
        helpText: 'Contoh: namaunit.unu-jogja.ac.id'
      }),
      field('tujuan_penggunaan', 'Tujuan penggunaan', 'textarea', true, { maxLength: 3000 }),
      field('penanggung_jawab', 'Penanggung jawab', 'text', true, { maxLength: 160 }),
      field('jenis_kebutuhan', 'Jenis kebutuhan', 'select', true, {
        options: options(['domain_baru', 'subdomain', 'server_aplikasi', 'penyimpanan', 'lainnya'])
      }),
      field('kebutuhan_infrastruktur', 'Perkiraan kebutuhan infrastruktur', 'textarea', true, { maxLength: 3000 }),
      upload('dokumen_pendukung', 'Dokumen pendukung', true, requiredAcceptedMimes)
    ]
  },
  {
    name: 'Google Workspace',
    slug: 'google-workspace',
    category: 'Kolaborasi',
    icon: 'grid',
    order: 4,
    featured: true,
    shortDescription: 'Bantuan akun, pemulihan akses, perubahan layanan, konfigurasi, dan permasalahan Google Workspace.',
    description:
      'Layanan dukungan Google Workspace untuk sivitas dan unit kerja. Field tambahan menyesuaikan jenis permintaan yang dipilih.',
    targetUsers: ['Dosen', 'Tenaga kependidikan', 'Mahasiswa', 'Unit kerja'],
    requirements: [
      'Pemohon memiliki akun institusi yang terkait.',
      'Jenis permintaan dijelaskan secara spesifik.',
      'Untuk pemulihan akses, identitas pemohon akan diverifikasi.'
    ],
    requiredDocuments: ['Tangkapan layar atau dokumen pendukung (opsional)'],
    procedure: [
      'Pilih jenis permintaan dan lengkapi field terkait.',
      'Petugas memverifikasi identitas dan kebutuhan.',
      'Tindak lanjut disampaikan melalui portal atau email.',
      'Pemohon mengonfirmasi hasil penyelesaian.'
    ],
    estimatedDuration: '1–3 hari kerja',
    fields: [
      field('jenis_permintaan', 'Jenis permintaan', 'select', true, {
        options: options([
          'bantuan_akun',
          'pemulihan_akses',
          'perubahan_layanan',
          'permintaan_konfigurasi',
          'permasalahan_penggunaan',
          'lainnya'
        ])
      }),
      field('email_workspace', 'Email institusi terkait', 'email', true, { maxLength: 180 }),
      field('nama_lengkap', 'Nama lengkap', 'text', true, { maxLength: 120 }),
      field('unit_kerja', 'Fakultas / unit kerja', 'text', true, { maxLength: 160 }),
      field('layanan_diminta', 'Layanan yang diminta', 'select', false, {
        options: options(['gmail', 'drive', 'meet', 'calendar', 'groups', 'lainnya']),
        showIf: { fieldKey: 'jenis_permintaan', equals: 'perubahan_layanan' }
      }),
      field('konfigurasi_diminta', 'Konfigurasi yang diminta', 'textarea', false, {
        maxLength: 3000,
        showIf: { fieldKey: 'jenis_permintaan', equals: 'permintaan_konfigurasi' }
      }),
      field('deskripsi_masalah', 'Deskripsi permasalahan', 'textarea', true, { maxLength: 4000 }),
      upload('lampiran', 'Lampiran pendukung', false, requiredAcceptedMimes)
    ]
  },
  {
    name: 'Bantuan Teknis TI',
    slug: 'bantuan-teknis-ti',
    category: 'Dukungan Teknis',
    icon: 'headphones',
    order: 5,
    featured: true,
    shortDescription: 'Pelaporan kendala teknis pada sistem atau layanan TI yang digunakan.',
    description:
      'Layanan bantuan teknis untuk kendala penggunaan sistem. Sertakan informasi waktu kejadian dan tangkapan layar agar penanganan lebih cepat.',
    targetUsers: ['Sivitas akademika', 'Unit kerja', 'Pengguna layanan TI'],
    requirements: [
      'Kendala dijelaskan dengan cukup detail.',
      'Waktu kejadian dan sistem terdampak diisi.',
      'Lampiran tangkapan layar disarankan untuk mempercepat diagnosis.'
    ],
    requiredDocuments: ['Tangkapan layar kendala (disarankan)'],
    procedure: [
      'Laporkan kendala melalui formulir.',
      'Petugas memverifikasi dan menghubungi pemohon bila perlu.',
      'Kendala diproses sesuai tingkat dampak.',
      'Pemohon menerima ringkasan penyelesaian.'
    ],
    estimatedDuration: '1–5 hari kerja sesuai dampak',
    fields: [
      field('jenis_kendala', 'Jenis kendala', 'select', true, {
        options: options(['tidak_dapat_akses', 'kinerja_lambat', 'kesalahan_data', 'gangguan_layanan', 'lainnya'])
      }),
      field('sistem_terdampak', 'Sistem yang terdampak', 'text', true, { maxLength: 200 }),
      field('deskripsi_masalah', 'Deskripsi permasalahan', 'textarea', true, { maxLength: 5000 }),
      field('waktu_kejadian', 'Waktu kejadian', 'date', true),
      upload('screenshot', 'Tangkapan layar', false, ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
      field('tingkat_dampak', 'Tingkat dampak', 'radio', true, {
        options: options(['individu', 'unit_kerja', 'banyak_pengguna', 'layanan_kritis'])
      })
    ]
  },
  {
    name: 'Integrasi Sistem dan Data',
    slug: 'integrasi-sistem-dan-data',
    category: 'Data & Integrasi',
    icon: 'network',
    order: 6,
    featured: true,
    shortDescription: 'Pengajuan integrasi data antar sistem dengan tujuan dan otorisasi yang jelas.',
    description:
      'Layanan pengajuan integrasi sistem dan data. Akses terhadap data sensitif tidak diberikan secara otomatis melalui pengajuan dan tetap memerlukan persetujuan pemilik data.',
    targetUsers: ['Unit kerja', 'Pengelola sistem', 'Pemilik proses bisnis'],
    requirements: [
      'Sistem sumber dan tujuan diidentifikasi.',
      'Tujuan integrasi dan jenis data dijelaskan.',
      'Persetujuan pemilik data diperlukan untuk data sensitif.'
    ],
    requiredDocuments: ['Dokumen kebutuhan integrasi', 'Dokumen persetujuan pemilik data (bila relevan)'],
    procedure: [
      'Ajukan kebutuhan integrasi.',
      'Petugas mengkaji kelayakan teknis dan tata kelola data.',
      'Persetujuan pemilik data diminta bila diperlukan.',
      'Implementasi dilakukan setelah seluruh persetujuan lengkap.'
    ],
    estimatedDuration: '10–20 hari kerja',
    fields: [
      field('unit_pemohon', 'Unit pemohon', 'text', true, { maxLength: 160 }),
      field('sistem_sumber', 'Sistem sumber', 'text', true, { maxLength: 160 }),
      field('sistem_tujuan', 'Sistem tujuan', 'text', true, { maxLength: 160 }),
      field('tujuan_integrasi', 'Tujuan integrasi', 'textarea', true, { maxLength: 3000 }),
      field('jenis_data', 'Jenis data yang dibutuhkan', 'textarea', true, { maxLength: 3000 }),
      field('penanggung_jawab', 'Penanggung jawab', 'text', true, { maxLength: 160 }),
      upload('dokumen_pendukung', 'Dokumen pendukung', false, requiredAcceptedMimes)
    ]
  },
  {
    name: 'Website Unit Kerja',
    slug: 'website-unit-kerja',
    category: 'Sistem Informasi',
    icon: 'globe',
    order: 7,
    featured: false,
    shortDescription: 'Permohonan pembuatan atau pengembangan website resmi unit kerja.',
    description:
      'Layanan permohonan website unit kerja. Kebutuhan fitur, pengelola konten, dan tujuan website akan dikaji sebelum pengembangan dilakukan.',
    targetUsers: ['Fakultas', 'Program studi', 'Unit kerja', 'Lembaga'],
    requirements: [
      'Unit pemohon dan penanggung jawab konten jelas.',
      'Tujuan website dijelaskan.',
      'Kebutuhan fitur sesuai dengan kapasitas pengelolaan.'
    ],
    requiredDocuments: ['Dokumen kebutuhan website', 'Struktur konten awal (opsional)'],
    procedure: [
      'Ajukan kebutuhan website.',
      'Petugas melakukan kajian dan koordinasi desain.',
      'Website dikembangkan dan diuji.',
      'Unit kerja menerima pelatihan pengelolaan konten.'
    ],
    estimatedDuration: '14–30 hari kerja',
    fields: [
      field('unit_pemohon', 'Unit pemohon', 'text', true, { maxLength: 160 }),
      field('jenis_website', 'Jenis website', 'select', true, {
        options: options(['website_unit', 'program_studi', 'lembaga', 'lainnya'])
      }),
      field('tujuan_website', 'Tujuan website', 'textarea', true, { maxLength: 3000 }),
      field('penanggung_jawab_konten', 'Penanggung jawab konten', 'text', true, { maxLength: 160 }),
      field('kebutuhan_fitur', 'Kebutuhan fitur', 'textarea', true, { maxLength: 4000 }),
      upload('dokumen_pendukung', 'Dokumen pendukung', false, requiredAcceptedMimes)
    ]
  },
  {
    name: 'Keamanan & Hak Akses',
    slug: 'keamanan-hak-akses',
    category: 'Keamanan',
    icon: 'shield',
    order: 8,
    featured: false,
    shortDescription: 'Permintaan terkait keamanan sistem dan pengelolaan hak akses pengguna.',
    description:
      'Layanan permintaan keamanan dan hak akses. Jangan pernah mengirim kata sandi atau kredensial rahasia melalui formulir maupun lampiran.',
    targetUsers: ['Pengelola sistem', 'Unit kerja', 'Pemilik data'],
    requirements: [
      'Sistem terkait dan jenis permintaan dijelaskan.',
      'Identitas pemohon dapat diverifikasi.',
      'Permintaan akses harus disertai dasar kewenangan yang jelas.'
    ],
    requiredDocuments: ['Dokumen pendukung kewenangan (bila relevan)'],
    procedure: [
      'Ajukan permintaan dengan rincian kebutuhan.',
      'Petugas memverifikasi identitas dan kewenangan.',
      'Permintaan diproses atau ditolak dengan alasan.',
      'Pemohon menerima konfirmasi hasil.'
    ],
    estimatedDuration: '2–7 hari kerja',
    fields: [
      field('sistem_terkait', 'Sistem terkait', 'text', true, { maxLength: 160 }),
      field('jenis_permintaan', 'Jenis permintaan', 'select', true, {
        options: options(['penambahan_akses', 'pencabutan_akses', 'perubahan_peran', 'insiden_keamanan', 'lainnya'])
      }),
      field('identitas_pemohon', 'Identitas pemohon', 'text', true, { maxLength: 160 }),
      field('rincian_kebutuhan', 'Rincian kebutuhan', 'textarea', true, {
        maxLength: 4000,
        helpText: 'Jangan menuliskan kata sandi, token, atau kunci rahasia.'
      }),
      upload('dokumen_pendukung', 'Dokumen pendukung', false, requiredAcceptedMimes)
    ]
  }
]

const serviceIdBySlug = new Map<string, mongoose.Types.ObjectId>()
for (const definition of serviceDefinitions) {
  const existing = await Service.findOne({ slug: definition.slug })
  const service =
    existing ||
    new Service({
      slug: definition.slug,
      createdBy: null,
      isSeedData: true
    })
  service.set({
    name: definition.name,
    slug: definition.slug,
    category: definition.category,
    icon: definition.icon,
    order: definition.order,
    featured: definition.featured,
    shortDescription: definition.shortDescription,
    description: definition.description,
    targetUsers: definition.targetUsers,
    requirements: definition.requirements,
    requiredDocuments: definition.requiredDocuments,
    procedure: definition.procedure,
    estimatedDuration: definition.estimatedDuration,
    active: true,
    acceptsRequests: true,
    isSeedData: true
  })
  await service.save()

  let currentVersion = service.currentFormVersionId
    ? await ServiceFormVersion.findById(service.currentFormVersionId)
    : null
  if (!currentVersion) {
    currentVersion = await ServiceFormVersion.create({
      service: service._id,
      version: 1,
      fields: definition.fields,
      createdBy: null
    })
    service.currentFormVersionId = currentVersion._id
    service.formVersionNumber = 1
    await service.save()
  }
  serviceIdBySlug.set(definition.slug, service._id)
}

const platformDefinitions = [
  {
    name: 'Portal Akademik Terpadu',
    slug: 'portal-akademik-terpadu',
    description:
      'Pusat informasi dan layanan akademik bagi mahasiswa serta pengelola program studi. Status pada data contoh ini belum merupakan konfirmasi operasional.',
    category: 'Akademik',
    unit: 'Unit Pengelola Akademik',
    status: 'Pilot',
    audience: 'Mahasiswa, dosen, pengelola program studi',
    icon: 'academic',
    order: 1
  },
  {
    name: 'Portal Tata Kelola Digital',
    slug: 'portal-tata-kelola-digital',
    description:
      'Ruang kerja digital untuk proses tata kelola, persuratan, dan koordinasi unit kerja. Status menunjukkan tahap pengembangan, bukan klaim produksi.',
    category: 'Tata Kelola',
    unit: 'Pengelola Tata Kelola',
    status: 'Dalam Pengembangan',
    audience: 'Tenaga kependidikan, pimpinan unit',
    icon: 'briefcase',
    order: 2
  },
  {
    name: 'Layanan Data Kepegawaian',
    slug: 'layanan-data-kepegawaian',
    description:
      'Katalog layanan dan informasi sumber daya manusia yang terhubung dengan proses administrasi kepegawaian.',
    category: 'Sumber Daya Manusia',
    unit: 'Pengelola SDM',
    status: 'Pilot',
    audience: 'Dosen, tenaga kependidikan',
    icon: 'users',
    order: 3
  },
  {
    name: 'Portal Penjaminan Mutu',
    slug: 'portal-penjaminan-mutu',
    description:
      'Dokumentasi dan alur kerja penjaminan mutu internal yang sedang disiapkan untuk integrasi bertahap.',
    category: 'Penjaminan Mutu',
    unit: 'Pengelola Penjaminan Mutu',
    status: 'Dalam Pengembangan',
    audience: 'Unit penjaminan mutu, program studi',
    icon: 'badge',
    order: 4
  },
  {
    name: 'Jaringan Website Unit Kerja',
    slug: 'jaringan-website-unit-kerja',
    description:
      'Kumpulan website resmi fakultas dan unit kerja yang menggunakan standar identitas serta pengelolaan konten terpusat.',
    category: 'Website & Publikasi',
    unit: 'Pengelola Komunikasi & Website',
    status: 'Pilot',
    audience: 'Publik, sivitas akademika',
    icon: 'globe',
    order: 5
  },
  {
    name: 'Portal Pengabdian Masyarakat',
    slug: 'portal-pengabdian-masyarakat',
    description:
      'Ruang pendataan kegiatan pengabdian masyarakat, mitra, dan luaran kegiatan. Tahap implementasi masih dalam pengembangan.',
    category: 'Pengabdian Masyarakat',
    unit: 'Pengelola Pengabdian',
    status: 'Dalam Pengembangan',
    audience: 'Dosen, lembaga pengabdian',
    icon: 'workflow',
    order: 6
  },
  {
    name: 'Fondasi Infrastruktur Digital',
    slug: 'fondasi-infrastruktur-digital',
    description:
      'Kumpulan layanan dasar seperti identitas, jaringan, dan penyimpanan yang menjadi fondasi layanan digital universitas.',
    category: 'Infrastruktur Digital',
    unit: 'Pengelola Infrastruktur TI',
    status: 'Pilot',
    audience: 'Pengelola sistem, unit TI',
    icon: 'server',
    order: 7
  }
]
for (const definition of platformDefinitions) {
  await DigitalPlatform.findOneAndUpdate(
    { slug: definition.slug },
    { $set: { ...definition, isSeedData: true } },
    { upsert: true }
  )
}

const programDefinitions = [
  {
    title: 'Penyederhanaan Alur Pengajuan Layanan',
    slug: 'penyederhanaan-alur-pengajuan-layanan',
    category: 'Digitalisasi Layanan',
    summary:
      'Menyatukan formulir, status, dan komunikasi layanan TI dalam satu portal agar pengguna tidak berpindah kanal.',
    content:
      '## Arah kerja\n\nProgram ini memetakan alur layanan yang ada, menyederhanakan formulir, dan menyiapkan pelacakan status yang konsisten. Fokus awal adalah layanan yang paling sering digunakan oleh sivitas akademika.',
    status: 'Berjalan',
    order: 1
  },
  {
    title: 'Pemetaan Data dan Integrasi Antarunit',
    slug: 'pemetaan-data-dan-integrasi-antarunit',
    category: 'Integrasi Data',
    summary:
      'Mengidentifikasi sumber data, pemilik data, dan kebutuhan pertukaran informasi antarunit secara terkendali.',
    content:
      '## Pendekatan\n\nSetiap integrasi dimulai dari tujuan penggunaan, dasar kewenangan, dan persetujuan pemilik data. Data sensitif tidak dibuka otomatis melalui permohonan.',
    status: 'Direncanakan',
    order: 2
  },
  {
    title: 'Penguatan Portal Layanan Terpadu',
    slug: 'penguatan-portal-layanan-terpadu',
    category: 'Pengembangan Sistem',
    summary:
      'Membangun portal layanan yang dapat dikonfigurasi melalui CMS, termasuk formulir dinamis dan pelacakan permohonan.',
    content:
      '## Ruang lingkup\n\nPortal menyediakan katalog layanan, formulir yang dikelola admin, nomor tiket, timeline status, serta kanal komunikasi yang tercatat.',
    status: 'Berjalan',
    order: 3
  },
  {
    title: 'Tata Kelola Perubahan dan Hak Akses',
    slug: 'tata-kelola-perubahan-dan-hak-akses',
    category: 'Tata Kelola Digital',
    summary:
      'Menetapkan praktik perubahan yang tercatat dan pembatasan akses berdasarkan peran pada sistem digital.',
    content:
      '## Prinsip\n\nAkses diberikan seminimal mungkin, perubahan sensitif dicatat, dan pemisahan kewenangan diterapkan pada proses administrasi.',
    status: 'Direncanakan',
    order: 4
  },
  {
    title: 'Pendampingan Kapasitas Digital Unit Kerja',
    slug: 'pendampingan-kapasitas-digital-unit-kerja',
    category: 'Penguatan Kapasitas Digital',
    summary:
      'Menyiapkan panduan dan pendampingan agar unit kerja dapat mengelola layanan digital secara mandiri dan tertib.',
    content:
      '## Bentuk kegiatan\n\nPanduan tertulis, sesi pendampingan, dan materi pembelajaran singkat yang disesuaikan dengan kebutuhan unit kerja.',
    status: 'Direncanakan',
    order: 5
  }
]
for (const definition of programDefinitions) {
  await Program.findOneAndUpdate(
    { slug: definition.slug },
    { $set: { ...definition, content: markdownToSafeHtml(definition.content), isSeedData: true } },
    { upsert: true }
  )
}

const articleDefinitions = [
  {
    title: 'Menata Layanan Digital dengan Satu Alur yang Jelas',
    slug: 'menata-layanan-digital-satu-alur-jelas',
    excerpt:
      'Mengapa katalog layanan, formulir, dan pelacakan status perlu berada dalam satu alur yang konsisten.',
    category: 'Praktik Baik',
    content: `## Satu pintu, banyak kebutuhan

Layanan teknologi informasi tidak hanya soal aplikasi. Ia mencakup cara pengguna menemukan layanan, memahami persyaratan, mengirim data, dan mengetahui perkembangan permohonannya.

Portal layanan digital mencoba menyatukan titik-titik tersebut. Pengguna tidak perlu menebak unit mana yang harus dihubungi atau mengirim dokumen melalui kanal yang berbeda-beda.

## Status yang tidak ambigu

Setiap permohonan memiliki status utama dan, bila diperlukan, substatus. Catatan internal petugas dipisahkan dari komunikasi yang ditujukan kepada pemohon. Perubahan status tercatat pada timeline.

## Data contoh

Artikel ini merupakan bagian dari seed development dan bukan publikasi resmi. Konten produksi harus diperbarui melalui CMS.`,
    categoryOrder: 1
  },
  {
    title: 'Mengapa Integrasi Data Perlu Persetujuan Pemilik Data',
    slug: 'integrasi-data-persetujuan-pemilik-data',
    excerpt:
      'Integrasi bukan sekadar menyambungkan dua sistem. Kewenangan dan tujuan penggunaan data harus jelas sejak awal.',
    category: 'Tata Kelola',
    content: `## Mulai dari pertanyaan yang tepat

Sebelum integrasi dikerjakan, perlu dipastikan data apa yang dibutuhkan, untuk tujuan apa, siapa yang berwenang, dan bagaimana data dilindungi.

## Persetujuan tidak otomatis

Pengajuan integrasi melalui portal tidak berarti akses data langsung diberikan. Persetujuan pemilik data dan kajian teknis tetap diperlukan.

## Catatan pengembangan

Artikel ini adalah data contoh pengembangan. Jangan menganggapnya sebagai kebijakan resmi universitas.`,
    categoryOrder: 2
  },
  {
    title: 'Panduan Singkat Melacak Permohonan Secara Aman',
    slug: 'panduan-singkat-melacak-permohonan',
    excerpt:
      'Nomor tiket saja tidak cukup. Token akses membantu melindungi data dan lampiran permohonan.',
    category: 'Panduan',
    content: `## Nomor tiket dan token akses

Saat permohonan dibuat, sistem menghasilkan nomor tiket dan token akses acak. Token dikirim ke email pemohon dan hanya berlaku untuk permohonan terkait.

## Jangan bagikan tautan

Tautan pelacakan dapat membuka data permohonan. Simpan dan gunakan secara pribadi. Jika tautan terekspos, hubungi administrator.

## Alternatif

Pemohon tidak perlu membuat akun. Simpan ID permohonan dan token akses untuk membuka halaman Lacak Permohonan.`,
    categoryOrder: 3
  }
]
for (const definition of articleDefinitions) {
  await Article.findOneAndUpdate(
    { slug: definition.slug },
    {
      $set: {
        title: definition.title,
        slug: definition.slug,
        excerpt: definition.excerpt,
        content: markdownToSafeHtml(definition.content),
        thumbnail: '',
        category: definition.category,
        author: 'Direktorat Tim Transformasi Digital',
        publishedAt: new Date(now.getTime() - definition.categoryOrder * 86400000),
        status: 'published',
        isSeedData: true
      }
    },
    { upsert: true }
  )
}

function escapePdf(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

function createSamplePdf(title: string, lines: string[]) {
  const contentLines = [
    'BT',
    '/F1 18 Tf',
    '72 760 Td',
    `(${escapePdf(title)}) Tj`,
    '/F1 10 Tf',
    '0 -30 Td',
    ...lines.flatMap((line) => [`(${escapePdf(line)}) Tj`, '0 -18 Td']),
    'ET'
  ].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(contentLines, 'utf8')} >>\nstream\n${contentLines}\nendstream`
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  return Buffer.from(pdf, 'utf8')
}

const documentDefinitions = [
  {
    title: 'SOP Pengajuan Layanan Digital',
    slug: 'sop-pengajuan-layanan-digital',
    category: 'SOP',
    description:
      'Dokumen contoh alur pengajuan layanan melalui portal, mulai dari pemilihan layanan hingga penyelesaian.',
    version: '1.0',
    services: ['pembuatan-email-institusi', 'pengembangan-sistem-informasi', 'permintaan-domain-dan-server'],
    lines: [
      'DOKUMEN CONTOH PENGEMBANGAN — BUKAN SOP RESMI',
      '',
      '1. Pemohon masuk ke portal dan memilih layanan.',
      '2. Pemohon membaca persyaratan dan mengisi formulir.',
      '3. Sistem membuat nomor tiket dan token pelacakan.',
      '4. Petugas memverifikasi permohonan.',
      '5. Petugas dapat meminta kelengkapan kepada pemohon.',
      '6. Permohonan diproses dan diselesaikan atau ditolak dengan alasan.',
      '7. Seluruh perubahan status tercatat pada timeline dan audit log.',
      '',
      'Versi ini hanya untuk keperluan pengembangan aplikasi.'
    ]
  },
  {
    title: 'Panduan Penggunaan Email Institusi',
    slug: 'panduan-penggunaan-email-institusi',
    category: 'Panduan',
    description:
      'Panduan contoh penggunaan akun email institusi, keamanan akun, dan prosedur bantuan.',
    version: '1.0',
    services: ['pembuatan-email-institusi', 'google-workspace'],
    lines: [
      'DOKUMEN CONTOH PENGEMBANGAN — BUKAN PANDUAN RESMI',
      '',
      'Gunakan akun email institusi hanya untuk keperluan resmi.',
      'Jangan membagikan kata sandi kepada siapa pun.',
      'Aktifkan verifikasi dua langkah bila tersedia.',
      'Laporkan akses mencurigakan melalui layanan Bantuan Teknis TI.',
      'Permintaan pemulihan akses akan diverifikasi identitasnya.',
      '',
      'Kebijakan resmi harus ditetapkan oleh universitas.'
    ]
  },
  {
    title: 'Kebijakan Dasar Keamanan Akses',
    slug: 'kebijakan-dasar-keamanan-akses',
    category: 'Kebijakan',
    description:
      'Dokumen contoh prinsip dasar keamanan akses dan pembatasan data sensitif.',
    version: '0.9',
    services: ['keamanan-hak-akses', 'integrasi-sistem-dan-data'],
    lines: [
      'DOKUMEN CONTOH PENGEMBANGAN — BUKAN KEBIJAKAN RESMI',
      '',
      'Akses diberikan berdasarkan kebutuhan tugas dan kewenangan.',
      'Kata sandi tidak boleh dikirim melalui formulir atau email.',
      'Data sensitif hanya dapat diakses setelah persetujuan pemilik data.',
      'Setiap perubahan hak akses dicatat pada audit log.',
      'Akses dapat dicabut ketika kewenangan berakhir.',
      '',
      'Dokumen ini belum menggantikan kebijakan resmi universitas.'
    ]
  },
  {
    title: 'Formulir Checklist Kebutuhan Integrasi',
    slug: 'formulir-checklist-kebutuhan-integrasi',
    category: 'Formulir',
    description:
      'Checklist contoh untuk membantu unit kerja menyiapkan informasi sebelum mengajukan integrasi sistem.',
    version: '1.0',
    services: ['integrasi-sistem-dan-data'],
    lines: [
      'DOKUMEN CONTOH PENGEMBANGAN',
      '',
      'Sistem sumber: ______________________________',
      'Sistem tujuan: ______________________________',
      'Tujuan integrasi: ___________________________',
      'Jenis data: _________________________________',
      'Pemilik data: _______________________________',
      'Dasar kewenangan: ___________________________',
      'Penanggung jawab teknis: ____________________',
      '',
      'Lengkapi dokumen ini sebelum mengajukan permohonan integrasi.'
    ]
  }
]

for (const definition of documentDefinitions) {
  const serviceIds = definition.services
    .map((slug) => serviceIdBySlug.get(slug))
    .filter(Boolean) as mongoose.Types.ObjectId[]
  let doc = await Document.findOne({ slug: definition.slug })
  if (!doc) {
    doc = new Document({
      title: definition.title,
      slug: definition.slug,
      category: definition.category,
      description: definition.description,
      published: true,
      services: serviceIds,
      isSeedData: true
    })
    await doc.save()
  } else {
    doc.set({
      title: definition.title,
      category: definition.category,
      description: definition.description,
      published: true,
      archived: false,
      services: serviceIds,
      isSeedData: true
    })
    await doc.save()
  }

  let version = doc.currentVersionId ? await DocumentVersion.findById(doc.currentVersionId) : null
  if (!version) {
    const folder = resolve(UPLOAD_ROOT, 'documents', String(doc._id))
    await mkdir(folder, { recursive: true })
    const fileName = `sample-${definition.slug}.pdf`
    const storageKey = `documents/${String(doc._id)}/${randomUUID()}.pdf`
    const buffer = createSamplePdf(definition.title, definition.lines)
    await writeFile(join(UPLOAD_ROOT, storageKey), buffer)
    version = await DocumentVersion.create({
      document: doc._id,
      version: definition.version,
      fileName,
      storageKey,
      mimeType: 'application/pdf',
      size: buffer.length,
      effectiveDate: now,
      changelog: 'Seed data development.',
      createdBy: null
    })
    doc.currentVersionId = version._id
    await doc.save()
  }
}

await Promise.all([
  User.init(),
  Role.init(),
  Permission.init(),
  Service.init(),
  ServiceFormVersion.init(),
  SiteSetting.init(),
  Page.init(),
  TeamGroup.init(),
  TeamMember.init(),
  DigitalPlatform.init(),
  Program.init(),
  Article.init(),
  Document.init(),
  DocumentVersion.init()
])

console.log('')
console.log('Seed development selesai. Data contoh ditandai isSeedData.')
console.log('Akun pengembangan:')
console.log(`  superadmin@digital.unu.local / ${SEED_PASSWORD_ADMIN}`)
console.log(`  petugas@digital.unu.local    / ${SEED_PASSWORD_PETUGAS}`)
console.log('Ganti kredensial sebelum produksi.')
console.log('')

await mongoose.disconnect()

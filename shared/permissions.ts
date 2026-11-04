import type { Permission } from './types'

export const PERMISSION_META: {
  key: Permission
  label: string
  group: string
  description: string
}[] = [
  {
    key: 'requests.read',
    label: 'Melihat permohonan',
    group: 'Permohonan',
    description: 'Melihat daftar dan detail permohonan layanan.'
  },
  {
    key: 'requests.manage',
    label: 'Mengelola permohonan',
    group: 'Permohonan',
    description: 'Memverifikasi, memproses, menolak, dan menyelesaikan permohonan.'
  },
  {
    key: 'requests.assign',
    label: 'Menugaskan petugas',
    group: 'Permohonan',
    description: 'Menetapkan penanggung jawab permohonan.'
  },
  {
    key: 'services.manage',
    label: 'Mengelola layanan',
    group: 'Konten & Layanan',
    description: 'Membuat, mengubah, menonaktifkan layanan, dan menyusun formulir.'
  },
  {
    key: 'content.manage',
    label: 'Mengelola konten website',
    group: 'Konten & Layanan',
    description: 'Mengelola halaman, program, ekosistem digital, publikasi, dan capaian.'
  },
  {
    key: 'documents.manage',
    label: 'Mengelola dokumentasi',
    group: 'Konten & Layanan',
    description: 'Mengunggah dan menerbitkan SOP, panduan, kebijakan, dan formulir.'
  },
  {
    key: 'users.manage',
    label: 'Mengelola pengguna',
    group: 'Administrasi',
    description: 'Membuat pengguna, mengaktifkan akun, dan mengirim ulang undangan.'
  },
  {
    key: 'roles.manage',
    label: 'Mengatur hak akses',
    group: 'Administrasi',
    description: 'Mengubah permission pada role non-superadmin.'
  },
  {
    key: 'settings.manage',
    label: 'Mengelola pengaturan sistem',
    group: 'Administrasi',
    description: 'Mengubah identitas, kontak, hero, dan metrik terverifikasi.'
  },
  {
    key: 'audit.read',
    label: 'Melihat audit log',
    group: 'Administrasi',
    description: 'Melihat riwayat perubahan sensitif pada sistem.'
  },
  {
    key: 'notifications.read',
    label: 'Melihat log notifikasi',
    group: 'Administrasi',
    description: 'Melihat status pengiriman email dan kegagalannya.'
  }
]

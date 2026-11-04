# Digital UNUY — Website & Digital Service Portal

Website resmi sekaligus **Digital Service Portal** Direktorat Tim Transformasi Digital Universitas Nahdlatul Ulama Yogyakarta.

Aplikasi ini bukan mockup. Katalog layanan, formulir dinamis, pengajuan, nomor tiket, tracking, dashboard admin, CMS, dokumentasi, pengguna, role, audit log, dan log notifikasi terhubung ke MongoDB melalui API server Nuxt/Nitro.

## Stack

- Nuxt 3.21 / Vue 3.5 / TypeScript
- Nitro server API
- MongoDB + Mongoose
- Tailwind CSS
- bcryptjs, nodemailer, marked, sanitize-html
- Private local file storage melalui adapter (`NUXT_UPLOAD_DIR`)

## Menjalankan aplikasi

Prasyarat: Node.js 20+ dan MongoDB yang dapat dihubungi.

```bash
npm install
cp .env.example .env
# sesuaikan NUXT_MONGODB_URI bila perlu
npm run seed:reset
npm run dev
```

Buka `http://localhost:3000`.

### Akun seed development

Data seed diberi penanda `isSeedData`. Pengajuan layanan dapat dilakukan tanpa membuat akun; pemohon menyimpan ID permohonan dan tautan pelacakan setelah submit.

| Peran | Email | Kata sandi |
|---|---|---|
| Superadmin | `superadmin@digital.unu.local` | `Admin#Unu2026` |
| Admin/Petugas | `petugas@digital.unu.local` | `Petugas#2026` |
| Pemohon | `pemohon@digital.unu.local` | `Pemohon#2026` |
| Nonaktif | `nonaktif@digital.unu.local` | — (tanpa kata sandi) |

Jangan gunakan kredensial ini di produksi. Ganti kata sandi dan bersihkan data seed sebelum go-live.

## Konfigurasi lingkungan

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NUXT_MONGODB_URI` | Ya | URI MongoDB/Atlas, default `mongodb://127.0.0.1:27017/digital_unuy` |
| `NUXT_PUBLIC_SITE_URL` | Ya | URL publik untuk canonical, sitemap, dan tautan email |
| `NUXT_SESSION_SECRET` | Ya di produksi | Secret deployment; sesi memakai token acak ber-hash di database |
| `NUXT_UPLOAD_DIR` | Tidak | Direktori file privat, default `.data/uploads` |
| `NUXT_SMTP_HOST` | Untuk email nyata | Host SMTP |
| `NUXT_SMTP_PORT` | Tidak | Default `587` |
| `NUXT_SMTP_SECURE` | Tidak | `true` untuk TLS langsung |
| `NUXT_SMTP_USER` / `NUXT_SMTP_PASS` | Tidak | Kredensial SMTP |
| `NUXT_EMAIL_FROM` | Tidak | Pengirim email |
| `SEED_*_PASSWORD` | Tidak | Override kata sandi seed development |

Tanpa SMTP pada development, email ditulis ke `.data/mail-outbox/*.json` dan log berstatus `simulated`. Ini adalah mail sink development, bukan email terkirim. Pada produksi tanpa SMTP, pengiriman ditandai gagal dan admin dapat melihatnya di **Admin → Notifikasi**.

## Fitur yang berfungsi

### Website publik

- Beranda dengan hero, layanan unggulan, profil direktorat, ekosistem, program, dokumen, capaian, publikasi, dan footer dari database/CMS.
- Katalog layanan dengan pencarian, filter kategori, pagination, loading, empty state, dan detail layanan.
- Detail layanan: sasaran, persyaratan, dokumen, prosedur, estimasi waktu, SOP terkait, status ketersediaan.
- Halaman ekosistem digital dengan filter kategori/status.
- Dokumentasi publik dengan pencarian, kategori, detail, preview PDF, unduh, versi, dan layanan terkait.
- Publikasi dengan kategori, pencarian, detail, dan render konten tersanitasi.
- Halaman profil/kustom dari CMS.
- Halaman **Tim Kami** (`/tentang-kami/tim`) dengan grid anggota, kelompok opsional, foto 3:4, focal point, dan empty state.
- SEO: title, description, Open Graph, canonical, JSON-LD, sitemap, robots, dan noindex pada area privat.
- Desain responsif mobile-first, token warna ivory/charcoal/gold/sage, navigasi mobile, skeleton, error, dan empty state.

### Autentikasi & pengguna

- Login email/kata sandi dengan bcrypt.
- Session cookie `HttpOnly`, `SameSite=Lax`, `Secure` di produksi, token sesi ber-hash dan TTL.
- Rate limit login, aktivasi, pengajuan, pelacakan, dan komentar.
- Akun baru dari admin selalu **Nonaktif**.
- Aktivasi mengirim tautan sekali pakai 48 jam; token hanya disimpan sebagai hash.
- Token aktivasi tidak bisa dipakai ulang, dapat dikirim ulang tanpa membuat akun duplikat.
- Akun nonaktif tidak dapat membuat sesi/login.
- Role: Superadmin, Admin/Petugas, Pemohon.
- Role & permission dapat diubah superadmin untuk role non-superadmin.
- Admin tidak dapat menonaktifkan/menurunkan role akun sendiri; perlindungan superadmin aktif terakhir.
- Semua perubahan sensitif masuk audit log.

### Pengajuan & pelacakan

- Pengajuan layanan dapat dilakukan **tanpa login/akun**. Setelah submit, sistem menampilkan ID permohonan dan tautan pelacakan untuk disimpan pemohon.
- Pelacakan publik menggunakan ID permohonan + token akses; pemohon juga dapat mengirim komunikasi dan kelengkapan melalui halaman lacak.

- Formulir dibuat dari konfigurasi layanan di database (text, textarea, number, email, select, radio, checkbox, date, file).
- Conditional field sederhana (`showIf`) didukung.
- Validasi server-side: required, tipe, panjang, email, pattern, opsi, ukuran/MIME file.
- Draft formulir tersimpan di MongoDB dan dipulihkan saat pengguna login.
- File divalidasi MIME, ekstensi, magic bytes, ukuran, dan disimpan privat dengan nama acak.
- Idempotency key mencegah duplikasi akibat klik berulang.
- Nomor tiket unik dengan format `UNU-DTD-YYMM-XXXXXX`.
- Snapshot formulir disimpan per permohonan sehingga perubahan formulir tidak merusak data lama.
- Status: Diajukan, Diverifikasi, Diproses, Selesai, Ditolak.
- Substatus: Menunggu Kelengkapan Pemohon.
- Timeline status, catatan publik, catatan internal terpisah, permintaan kelengkapan, unggah lampiran pemohon, unggah hasil petugas, dan ringkasan penyelesaian.
- Tracking publik memakai nomor tiket + token acak; bukan hanya nomor tiket.
- Lampiran hanya dapat diakses pemilik permohonan atau staf berizin.

### Admin dashboard

- Ringkasan aktual: total, perlu diverifikasi, diproses, selesai, ditolak, menunggu pemohon.
- Filter periode 7/30/90 hari/semua.
- Tingkat penyelesaian dan rata-rata waktu penyelesaian dihitung dari data nyata.
- Antrean tindakan dan permohonan terbaru.
- Manajemen permohonan: filter, pencarian, detail, penugasan, perubahan status tervalidasi, catatan internal/publik, lampiran, timeline.
- Manajemen layanan: CRUD metadata, aktif/nonaktif, unggulan, urutan, form builder berversi, penghubung dokumen.
- CMS: platform ekosistem, program, publikasi, halaman/profil, dan Tim Kami (anggota, kelompok, foto, urutan, publikasi).
- Dokumentasi: unggah, metadata, publish/unpublish, arsip, versi baru, hubungkan ke layanan.
- Pengguna: buat, edit, aktif/nonaktif, kirim ulang aktivasi.
- Role & permission.
- Pengaturan global: identitas, URL logo, hero, kontak, sosial, email notifikasi, metrik terverifikasi, mode seed.
- Log notifikasi dan audit log.
- Tabel responsif: tabel desktop dan daftar kartu mobile.

### Keamanan

- RBAC server-side pada setiap endpoint admin.
- Proteksi route `/admin/**`.
- CSRF marker header untuk seluruh mutasi + validasi Origin.
- Rate limiting (in-memory; lihat batasan).
- Sanitasi HTML/Markdown dengan allowlist.
- File privat di luar direktori publik.
- Otorisasi per permohonan dan lampiran.
- Password hashing bcrypt cost 12.
- Token aktivasi/sesi ber-hash, expiry, dan single-use.
- Audit log untuk login, user, role, layanan, permohonan, dokumen, pengaturan.
- Security headers: nosniff, SAMEORIGIN, referrer policy, permissions policy, COOP.

## Struktur utama

```text
pages/
  index.vue, tentang.vue, layanan/, ekosistem-digital.vue,
  dokumen/, publikasi/, masuk.vue, aktivasi.vue, lacak.vue,
  permohonan-saya/, halaman/, admin/
layouts/
  default.vue, admin.vue
components/
  layout, form, card, status, modal, toast, form builder, service editor
server/
  api/auth, api/services, api/requests, api/documents,
  api/articles, api/platforms, api/pages, api/track,
  api/admin/*, routes/sitemap.xml.ts, routes/robots.txt.ts
  models/index.ts
  utils/{security,validation,uploads,email,serializers,audit,rate-limit}.ts
scripts/
  seed.ts, e2e.mjs, visual-check.mjs
shared/
  types.ts, permissions.ts
```

## Endpoint utama

### Publik

- `GET /api/home`
- `GET /api/site`
- `GET /api/services` / `GET /api/services/:slug`
- `GET /api/platforms`
- `GET /api/documents` / `GET /api/documents/:slug`
- `GET /api/documents/:slug/download`
- `GET /api/articles` / `GET /api/articles/:slug`
- `GET /api/pages/:slug`
- `GET /api/team`, `GET /api/team/members/:id/photo`
- `POST /api/track`
- `POST /api/track/respond`, `POST /api/track/comments`, `POST /api/track/attachments`
- `GET /sitemap.xml`, `GET /robots.txt`

### Autentikasi

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/activate`

### Pemohon

- `POST /api/services/:slug/requests`
- `GET /api/requests/mine`
- `GET /api/requests/:id`
- `POST /api/requests/:id/comments`
- `POST /api/requests/:id/respond`
- `POST /api/requests/:id/attachments`
- `GET /api/requests/attachments/:id`
- `GET|PUT|DELETE /api/requests/drafts/:serviceSlug`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/requests`, `GET /api/admin/requests/options`
- `GET /api/admin/requests/:id`, `PATCH /api/admin/requests/:id`
- `POST /api/admin/requests/:id/attachments`
- `GET|POST /api/admin/services`, `GET|PATCH /api/admin/services/:id`
- `GET|POST /api/admin/documents`, `GET|PATCH /api/admin/documents/:id`
- `POST /api/admin/documents/:id/versions`
- `GET /api/admin/documents/:id/download`
- `GET|POST /api/admin/platforms`, `PATCH /api/admin/platforms/:id`
- `GET|POST /api/admin/programs`, `PATCH /api/admin/programs/:id`
- `GET|POST /api/admin/articles`, `GET|PATCH /api/admin/articles/:id`
- `GET|POST /api/admin/pages`, `PATCH /api/admin/pages/:id`
- `GET|POST /api/admin/users`, `PATCH /api/admin/users/:id`, `POST /api/admin/users/:id/resend`
- `GET /api/admin/roles`, `PATCH /api/admin/roles/:slug`
- `GET|PUT /api/admin/settings`
- `GET /api/admin/notifications`
- `GET /api/admin/team/members`, `GET|POST /api/admin/team/members/:id`, `DELETE /api/admin/team/members/:id`
- `GET|POST /api/admin/team/groups`, `PATCH|DELETE /api/admin/team/groups/:id`
- `GET /api/admin/audit`

## Pengujian

Dengan server development berjalan:

```bash
npm run test:e2e         # 89 pemeriksaan API & alur end-to-end
npm run test:visual      # 44 pemeriksaan render & error console
npm run test:responsive  # 132 kombinasi halaman × 10 viewport (320–1920px)
```

Hasil yang sudah dijalankan pada lingkungan ini:

- **E2E:** 89/89 lulus — publik, katalog, filter, tracking, aktivasi, token sekali pakai, pengajuan, idempotensi, draft, kelengkapan, timeline, lampiran privat, RBAC, CSRF, versi formulir, snapshot, dokumen publish/unpublish, XSS sanitization, audit, notifikasi.
- **Visual:** 44/44 lulus — halaman publik, admin desktop/mobile, form pengajuan, permohonan saya. Tidak ada page error atau console error.
- **Responsive:** 132/132 lulus — 10 viewport (320, 375, 390, 430, 768, 820, 1024, 1280, 1440, 1920), halaman publik, form, tracking, dan admin. Tidak ada horizontal overflow, heading clipping, atau 4xx.
- **Login standalone:** layout autentikasi tanpa public header/footer/sidebar, split-screen 50:50, light mode permanen, diuji pada 320–1440px.

Screenshot pengujian disimpan di `.data/screenshots/`.

## Batasan & pekerjaan lanjutan

Hal-hal berikut **belum** diklaim selesai:

1. **Logo resmi sudah digunakan** pada header, footer (versi putih), dan halaman login. Foto dokumentasi resmi belum tersedia; ilustrasi editorial saat ini bersifat kustom, bukan foto aktivitas kampus.
2. **Kontak, alamat, dan media sosial sengaja kosong pada seed** agar tidak menampilkan data rekaan. Isi melalui **Admin → Pengaturan**.
3. **SMTP belum dikonfigurasi.** Email development masuk ke `.data/mail-outbox` dan ditandai `simulated`, bukan terkirim. Konfigurasikan `NUXT_SMTP_*` untuk email nyata.
4. **Penyimpanan file masih filesystem lokal.** Untuk produksi multi-instance, gunakan object storage privat (S3/R2/GCS) melalui adapter. Jangan memindahkan folder upload ke `public/`.
5. **Rate limit masih in-memory** sehingga berlaku per proses. Untuk deployment multi-instance gunakan Redis/upstash.
6. **Validasi status & ketersediaan lisensi email institusi masih manual oleh petugas**, karena tidak ada API kepegawaian/akademik atau lisensi yang dapat diverifikasi di lingkungan ini. Integrasi SSO/identitas institusional belum tersedia.
7. **Tidak ada antivirus scanner.** Validasi file memakai allowlist MIME, ekstensi, ukuran, dan magic bytes. Untuk produksi, tambahkan pemindaian malware pada pipeline upload.
8. **Audit log bersifat append-only di level aplikasi**, bukan WORM/immutable storage.
9. **Belum ada integrasi object storage, SSO, SIAKAD, Feeder, atau sistem eksternal lain.** Adapter/env telah disiapkan hanya untuk MongoDB, SMTP, dan storage lokal.
10. **Pengujian browser** dilakukan dengan Chrome headless pada 10 viewport (320–1920px). Safari/Firefox dan audit aksesibilitas formal (axe/WCAG penuh) masih perlu dijalankan sebelum go-live.
11. **Data seed development** harus diganti dengan data operasional yang terverifikasi. Metrik capaian sengaja kosong sampai admin menandainya terverifikasi.
12. **Audit aksesibilitas otomatis** (misalnya axe) belum dijalankan; kontras warna utama sudah disesuaikan, tetapi verifikasi formal tetap diperlukan.

## Catatan operasional

- `npm run seed` bersifat idempotent untuk entitas utama; `npm run seed:reset` menghapus database aplikasi lalu mengisi ulang. Jangan jalankan `seed:reset` di produksi.
- File upload berada di `.data/uploads` (gitignored) dan diakses melalui endpoint ber-otorisasi. Foto Tim Kami dioptimalkan dengan Sharp dan hanya dapat diakses publik setelah anggota dipublikasikan.
- `devSeedMode` tetap disimpan sebagai penanda seed internal, tetapi banner data contoh tidak lagi ditampilkan di website publik.
- Format tanggal/tabel mengikuti locale `id-ID`.

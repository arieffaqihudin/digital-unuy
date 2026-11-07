# Design Brief: Digital UNUY — Website & Digital Service Portal

**Purpose:** Konteks visual/UX untuk mockup dan implementasi frontend. **Source:** Diekstrak dari PRD v1.0 (`docs/PRD.md`). **Language:** Bahasa Indonesia (UI), English (token).

## 1. Product Identity

Website resmi dan portal layanan digital Direktorat Transformasi Digital UNU Yogyakarta: etalase layanan, pengajuan tanpa akun, pelacakan permohonan, dan CMS admin.

**Pillars:** layanan yang mudah ditemukan; pengajuan tanpa hambatan; progres yang transparan; tata kelola yang tercatat.

**Tagline:** "Mendorong Transformasi Digital UNU Yogyakarta."

**Brand personality:** **Tereditorial, Institusional, Terbuka** — seperti laporan tahunan kampus yang hidup dan meja layanan publik, bukan dashboard SaaS. Alasannya: kanvas ivory `#FAF8ED` dan tipografi editorial memberi kesan dokumen resmi; charcoal dan emas menjaga wibawa; hijau UNU menjadi aksen aksi dan status. Situs harus terasa dapat dipercaya oleh dosen, staf, dan pimpinan.

**What it must never look like:** landing page startup gelap dengan gradien neon, kartu SaaS bertumpuk, atau antarmuka media sosial yang ramai.

## 2. User Personas (Design View)

| Persona | Who | What they see |
|---------|-----|---------------|
| **Publik / Pemohon** | Civitas tanpa akun | Header publik dengan logo, navigasi (Beranda, Layanan Digital, Ekosistem Digital, Informasi), pencarian `Ctrl+K`, tombol "Lacak Permohonan" dan "Ajukan Layanan"; footer charcoal dengan kontak; halaman katalog, detail, formulir pengajuan, dan pelacakan. |
| **Admin/Petugas** | Staf dengan permission | Shell admin: sidebar 252 px (collapsed 76 px), topbar 64 px, breadcrumb judul modul, lonceng notifikasi, menu akun. Menu mengikuti permission. |
| **Superadmin** | Pemilik sistem | Semua menu Admin, ditambah Pengguna, SEO & Indexing, Log Aktivitas (sesuai permission). |

**Role & nav adaptation:** sidebar admin memfilter item berdasarkan permission (`services.manage`, `requests.read`, `content.manage`, `documents.manage`, `users.manage`, `settings.manage`, `audit.read`, `notifications.read`). Tidak ada menu role/permission di sidebar; pengaturan role diakses lewat API/seed sesuai keputusan produk. Publik tidak melihat area admin.

## 3. Visual Identity & Design Tokens

### 3.1 Color Palette (light mode)

| Token | Light | Usage |
|-------|-------|-------|
| `ivory` | `#FAF8ED` | Latar halaman publik. Kertas hangat, bukan putih. |
| `soft-white` | `#FAFAF9` | Latar panel/alternatif. |
| `white` | `#FFFFFF` | Kartu dan field. |
| `charcoal` | `#1C1A1A` | Teks utama, footer, tombol gelap. |
| `charcoal-soft` | `#2B2828` | Varian permukaan gelap. |
| `gold` | `#BF8B15` | Aksen editorial, garis, penanda. |
| `gold-dark` | `#7D5800` | Eyebrow di atas kertas terang. |
| `gold-text` | `#9A6D08` | Teks aksen yang harus terbaca. |
| `gold-soft` | `#E8C766` | Aksen lembut. |
| `sage` | `#D7D49A` | Aksen di atas charcoal, eyebrow-light. |
| `sage-soft` | `#F0EFD9` | Latar lembut. |
| `unu-green` | `#337449` | Aksi utama, status aktif, tautan. |
| `unu-green-dark` | `#245B37` | Hover aksi utama. |
| `unu-green-soft` | `#EAF3ED` | Latar status/chip. |
| `slate-ink` | `#334155` | Teks isi sekunder. |
| `ink-muted` | `#5B6572` | Metadata. |
| `line-warm` | `#E4E0D3` | Border hangat di latar ivory. |
| `admin-bg` | `#F6F8FA` | Latar admin netral-dingin. |
| `admin-sidebar` | `#F4F7FA` | Sidebar admin. |
| `admin-border` | `#E5E7EB` | Border admin. |
| `admin-text` | `#1E293B` | Teks admin. |
| `admin-muted` | `#64748B` | Metadata admin. |

**Aturan warna:** emas hanya untuk aksen editorial dan penanda, bukan tombol utama. Hijau hanya untuk aksi/aktif/tautan. Merah hanya untuk destruktif/error. Area admin memakai palet netral `admin-*`, bukan ivory, agar padat informasi.

### 3.2 Secondary Colors

- Status permohonan: Diajukan (info), Diverifikasi/Diproses (warning), Selesai (success), Ditolak (danger). Warna mengikuti `STATUS_META`; simbol ● ◆ ◐ ✓ × boleh dipakai sebagai pembeda non-warna.
- Grafik/metrik memakai hijau UNU dan garis `line-warm`.

### 3.3 Typography

Font: **Inter Variable**, self-hosted via `@fontsource-variable/inter`; fitur `cv02 cv03 cv04 cv11`.

| Token | Size / Leading | Weight | Usage |
|-------|----------------|--------|-------|
| Hero title | `clamp(34px, 0.5rem + 3.9vw, 56px)` / 1.14 | 700 | Hero beranda |
| Section title | `clamp(26px, 1.25rem + 1.15vw, 36px)` / 1.2 | 600 | Judul bagian |
| Metric | `clamp(44px, 1.9rem + 2.6vw, 64px)` / 1 | 600 | Angka capaian, tabular |
| Display 1 | 38 → 48 → 52 → 56px / 1.12 | 700 | Judul halaman besar |
| Page title | 28 → 32px / 1.2 | 700 | Judul halaman |
| Display 2 | 24 → 28 → 32px / 1.24 | 700 | Subjudul besar |
| Display 3 | 22 → 26px / 1.28 | 700 | Subjudul |
| Heading MD | 20px / 1.4 | 600 | Judul kartu besar |
| Heading SM / card | 18px / 1.4 | 600 | Judul kartu |
| Body LG | 17 → 18px / 1.6 | 400 | Intro/deskripsi |
| Body | 16px / 1.65 | 400 | Teks isi |
| Body SM | 14px / 1.55 | 400 | Metadata kartu |
| Meta | 12px / 1.5 | 400 | Label kecil |
| Eyebrow | 10px, uppercase 0.2em | 700 | Label editorial (gold/sage/green) |
| Eyebrow editorial | 12–13px, uppercase 0.14em | 600 | Penanda bagian |
| Field | 16px | 400 | Input (mencegah zoom iOS) |

**Aturan:** heading memakai tracking negatif (-0.025em); body tidak. Huruf besar hanya untuk eyebrow dan label tabel.

### 3.4 Spacing & Shape

- Shell publik: max width **1360px** (`page-shell`), wide **1440px** (`8xl`).
- Padding gutter: 20px → 24px (≥640) → 32px (≥1024) → 48px (≥1280).
- Section spacing: `py-16` (64) → `md:py-20` (80) → `lg:py-24` (96).
- Header publik: **76px** (`--header-height`); admin topbar **64px**; sidebar admin **252px** / **76px** collapsed.
- Touch target minimum: **44px**.
- Radius: kartu `rounded-2xl` (16px), panel besar `rounded-4xl` (32px), field `rounded-lg` (8px), pill 999px.
- Shadow: `soft` `0 24px 70px -40px rgba(28,26,26,.35)`; `card` `0 1px 2px rgba(28,26,26,.03), 0 18px 45px -38px rgba(28,26,26,.28)`.
- Motion: micro 180ms, hover 220ms, image 400ms, reveal 450ms; easing `cubic-bezier(0.22, 1, 0.36, 1)`; hormati `prefers-reduced-motion`.

### 3.5 Logo

- `AppLogo` dengan `/public/unu-logo.png` + wordmark direktorat.
- Footer memakai logo putih (`unu-logo.png` di-invert) dan `member-logo-white.png`.
- Favicon/apple-touch: `/unu-logo.png`.
- Social preview default: `/og-default.png` (dapat diatur di pengaturan SEO).

### 3.6 Voice & Tone

| Principle | Do | Don't |
|-----------|----|-------|
| Jelas dan manusiawi | "Permohonan Anda telah kami terima." | "Request submitted successfully (200)." |
| Institusional tetapi hangat | "Silakan lengkapi dokumen berikut." | "Lengkapi sekarang atau permohonan ditolak!" |
| Transparan | "Menunggu kelengkapan pemohon." | Status kosong tanpa penjelasan |
| Hemat kata | "Ajukan Layanan" | "Klik di sini untuk memulai proses pengajuan layanan" |
| Akurat | "Email aktivasi berlaku 48 jam dan hanya dapat dipakai sekali." | "Cek email kamu ya" |

**Bahasa:** Indonesia; sapaan "Anda". Istilah teknis yang dipertahankan: SSO, API, PDF, SOP. Error menyebut penyebab dan langkah berikutnya. Status memakai istilah baku: Diajukan, Diverifikasi, Diproses, Selesai, Ditolak, Menunggu Kelengkapan Pemohon.

## 4. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Base | 320–375px | Target mockup seluler; nav drawer; kartu bertumpuk; tabel admin menjadi kartu |
| sm | 640px | Grid 2 kolom; form mulai berpasangan |
| md | 768px | Header 72px; hero dua kolom mulai |
| lg | 1024px | Sidebar admin 252px; tabel admin desktop; grid 3 kolom |
| xl | 1280px | Navigasi publik penuh; grid 4 kolom; sidebar collapse |
| Desktop | 1440px | Target mockup desktop; shell maks 1440px |

## 5. Screen Inventory

### 5.1 Publik

| # | Screen | Path | Key elements |
|---|--------|------|--------------|
| P1 | Beranda | `/` | Hero editorial (eyebrow, judul besar, CTA), visual hero, layanan unggulan, ekosistem, proses, dampak/metrik terverifikasi, studi kasus, tim, publikasi, footer. |
| P2 | Tentang | `/tentang` | Profil direktorat, proses/siklus, nilai, CTA layanan. |
| P3 | Tim Kami | `/tentang-kami/tim` | Grid anggota per kelompok (Pimpinan, Product, Engineering, Design), foto 3:4, empty state. |
| P4 | Katalog Layanan | `/layanan` | Search, filter kategori, grid kartu, pagination, skeleton, empty state. |
| P5 | Detail Layanan | `/layanan/{slug}` | Judul, ringkasan, sasaran, persyaratan, dokumen, prosedur, estimasi, dokumen terkait, CTA "Ajukan". |
| P6 | Form Pengajuan | `/layanan/{slug}/ajukan` | Data pemohon, field dinamis (text/textarea/number/email/select/radio/checkbox/date/file), conditional fields, upload, ringkasan, submit. |
| P7 | Ekosistem Digital | `/ekosistem-digital` | Filter kategori/audiens/status, pencarian, grid produk, showcase unggulan, empty state. |
| P8 | Detail Produk | `/ekosistem-digital/{slug}` | Visual, status, unit, audiens, problem/solution/benefit/fitur, modul, metrik, galeri. |
| P9 | Dokumentasi | `/dokumen` | Search, kategori, kartu dokumen, pagination, empty state. |
| P10 | Detail Dokumen | `/dokumen/{slug}` | Metadata, versi, tanggal berlaku, preview PDF, unduh, layanan terkait. |
| P11 | Publikasi | `/publikasi` | Daftar artikel, kategori, pencarian, kartu. |
| P12 | Detail Publikasi | `/publikasi/{slug}` | Judul, penulis, tanggal, konten tersanitasi, artikel terkait. |
| P13 | Pencarian | `/pencarian` | Input, filter jenis konten, hasil lintas layanan/ekosistem/dokumen/publikasi/halaman, empty state. |
| P14 | Halaman Kustom | `/halaman/{slug}` | Konten dari CMS (profil/kebijakan). |
| P15 | Lacak Permohonan | `/lacak` | Input tiket + token; detail status, timeline, catatan publik, lampiran, form tanggapan/kelengkapan. |
| P16 | Masuk | `/masuk` | Split-screen auth, form email/password, error, loading. |
| P17 | Aktivasi | `/aktivasi` | Token dari query, form password + konfirmasi, aturan password, state sukses/gagal. |
| P18 | Error | `error.vue` | 403/404/500 dengan CTA kembali. |

### 5.2 Admin

| # | Screen | Path | Key elements |
|---|--------|------|--------------|
| A1 | Dashboard | `/admin` | 6 metrik, tingkat penyelesaian, rata-rata jam, periode, antrean tindakan, permohonan terbaru. |
| A2 | Daftar Permohonan | `/admin/permohonan` | Search, filter status/layanan/periode/petugas, tabel desktop/kartu mobile, pagination. |
| A3 | Detail Permohonan | `/admin/permohonan/{id}` | Data pemohon, snapshot form, status/timeline, catatan publik/internal, lampiran, aksi verify/start/request_info/complete/reject, penugasan. |
| A4 | Manajemen Layanan | `/admin/layanan` | Daftar layanan, status aktif, unggulan, urutan, aksi edit. |
| A5 | Layanan Baru | `/admin/layanan/baru` | Metadata layanan, SEO, form builder drag/urutan field, validasi. |
| A6 | Edit Layanan | `/admin/layanan/{id}` | Metadata + form builder berversi + dokumen terkait + status. |
| A7 | Dokumentasi | `/admin/dokumen` | Daftar, unggah dokumen, metadata, versi, publish/arsip, unduh. |
| A8 | Ekosistem Digital | `/admin/ekosistem` | Kategori + platform, CRUD, urutan, publikasi, modul/metrik/galeri. |
| A9 | Publikasi | `/admin/publikasi` | Daftar artikel, editor markdown, status draft/published, SEO. |
| A10 | Halaman & Profil | `/admin/halaman` | Daftar halaman kustom, editor, publish, SEO. |
| A11 | Tim Kami | `/admin/tim` | Kelompok + anggota, upload foto, fokus foto, urutan, publikasi. |
| A12 | Pengguna | `/admin/pengguna` | Daftar staf, role, status, undang/resend, aktif/nonaktif. |
| A13 | SEO & Indexing | `/admin/seo` | Title suffix, default description, OG image, Google verification, preview. |
| A14 | Notifikasi | `/admin/notifikasi` | Ringkasan tindakan, daftar notifikasi, filter. |
| A15 | Log Aktivitas | `/admin/audit` | Filter aksi/entitas, tabel waktu/aktor/aksi, metadata. |

## 6. Component Inventory

| Component | Used In | Content | States | Mobile / Desktop |
|-----------|---------|---------|--------|------------------|
| AppLogo | Header, footer, admin | Logo + wordmark | default, compact, white | Compact mobile |
| AppButton | Global | Label, icon, variant | primary/secondary/ghost, hover, focus, disabled, loading | Full-width option |
| GlobalSearchDialog | Header | Input, type filter, results | closed/open, loading, empty, error | Full-screen sheet mobile; modal desktop |
| HomeHero | P1 | Eyebrow, title, description, CTA, visual | default, reduced motion | Stacked mobile; 2-col desktop |
| HomeEcosystem / HomeProcess / HomeImpact / HomeCaseStudy / HomeTeam / HomeRecognition / HomeApproach | P1 | Section content | loading skeleton, empty, filled | Stacked → grid |
| ServiceCard | P4, home | Icon, name, summary, category, CTA | hover, focus | 1-col → 2 → 3 |
| ServiceFormBuilder | A5/A6 | Field list, add/edit/remove/reorder, conditional config | empty, editing, invalid | Stacked; side panel desktop |
| FormField | P6, admin | Label, control, help, error | default, focus, invalid, disabled | Full width |
| ServiceEditor | A5/A6 | Metadata + SEO + form + docs | idle, saving, error | Single column mobile |
| PlatformCard / PlatformVisual | P7, P8, home | Name, category, status, visual | hover | Grid |
| DocumentCard | P9, P10 | Title, category, version, date | hover | Grid/list |
| ArticleCard | P11, P12 | Thumbnail, title, excerpt, date | hover | Grid |
| TeamMemberCard | P3, home | Photo 3:4, name, position, group | empty, hover | 2 → 4 cols |
| StatusBadge | P15, A2, A3 | Status icon + label | 5 statuses + waiting | Inline |
| Pagination | P4, P7, P9, A2 | Page controls | disabled edges | Compact |
| EmptyState | All lists | Icon, title, description, CTA | default | Centered |
| CardSkeleton | All lists | Shimmer card | loading | Same layout as card |
| ModalDialog | Admin | Title, body, actions | open/close, busy | Bottom sheet mobile; centered desktop |
| SeoFields | A5/A6/A8/A9/A10/A13 | Title, description, image, canonical, noindex, preview | collapsed/expanded | Stacked |
| ToastHost | Global | Success/error toast | enter/exit | Bottom mobile; bottom-right desktop |
| Breadcrumbs | Public detail | Path | default | Hidden if space-constrained |
| PublicPageHeader | Public pages | Eyebrow, title, description, CTA | default | Stacked mobile |

## 7. User Flows (with Screen References)

| Flow (PRD) | Steps (screens) | Notes |
|------------|-----------------|-------|
| A — Ajukan layanan | P4 → P5 → P6 → sukses (tiket + tautan) | Data pemohon + field dinamis + upload; idempotency key |
| B — Lacak & lengkapi | P15 → detail → tanggapan/lampiran | Tiket + token; catatan internal tidak terlihat |
| C — Proses permohonan | A1 → A2 → A3 → aksi status | Verify/start/info/complete/reject; email tiap transisi |
| D — Aktivasi staf | A12 → email → P17 → P16/A1 | Token 48 jam sekali pakai |
| E — Kelola layanan | A4 → A5/A6 → form builder → simpan | Versi form baru; snapshot permohonan lama |
| F — Kelola dokumentasi | A7 → unggah → metadata → publish → P9/P10 | Versi baru; file privat |
| G — Kelola ekosistem | A8 → kategori/platform → publikasi → P7/P8 | Filter publik |
| H — Kelola konten | A9/A10 → editor → publish → P11/P12/P14 | Markdown disanitasi |
| I — Kelola tim | A11 → kelompok/anggota → foto → publish → P3 | Foto hanya tampil bila published |
| J — Pengguna & role | A12 → undang/aktifkan → role/permission | Superadmin terakhir dilindungi |
| K — Pencarian | Global `Ctrl+K` atau P13 → hasil lintas tipe | <2 karakter → kosong |

## 8. Error, Empty & Loading States

| Screen | Empty | Error | Loading |
|--------|-------|-------|---------|
| P1 Beranda | Section dengan empty state halus; metrik kosong tidak ditampilkan | Fallback section; halaman tetap render | Skeleton kartu/visual |
| P4 Katalog | "Belum ada layanan" + saran kategori | Pesan gagal + retry | Skeleton kartu |
| P6 Form | N/A — form | Field error inline; error umum di atas submit; file error per field | Submit busy, upload progress |
| P7 Ekosistem | "Belum ada produk" / filter tidak cocok | Gagal memuat + retry | Skeleton grid |
| P9 Dokumentasi | "Belum ada dokumen" | Gagal memuat + retry | Skeleton kartu |
| P11 Publikasi | "Belum ada publikasi" | Gagal memuat + retry | Skeleton kartu |
| P13 Pencarian | "Tidak ada hasil untuk ..." | Gagal mencari + retry | Spinner/skeleton baris |
| P15 Lacak | N/A — form | Tiket/token salah: pesan 404; rate limit: pesan tunggu | Memuat detail |
| P16 Masuk | N/A | 401/403/CSRF/rate limit dengan pesan jelas | Tombol busy |
| P17 Aktivasi | N/A | 410 token invalid/expired; 422 password lemah; 502 email | Tombol busy |
| A1 Dashboard | Angka 0, antrean kosong | Gagal memuat + retry | Skeleton metrik/tabel |
| A2 Permohonan | "Belum ada permohonan" / filter kosong | Gagal memuat + retry | Skeleton baris |
| A3 Detail | Timeline kosong (jarang) | 404/409 konflik status + muat ulang | Skeleton detail |
| A4–A15 | Empty state per modul | Gagal memuat/simpan + retry | Skeleton/tombol busy |

**Global:** error 403/404/500 memakai `error.vue`; toast sukses hijau, error merah; semua aksi destruktif memakai konfirmasi.

## 9. Key Layout Patterns

| Screen | Mobile (375px) | Desktop (1440px) |
|--------|----------------|------------------|
| Public shell | Header 64px, drawer full-screen, konten 20px gutter, CTA bawah | Header 76px, nav center, search + 2 CTA kanan, shell 1360–1440px, gutter 48px |
| Hero | Satu kolom, judul 34px, visual di bawah, CTA bertumpuk | Dua kolom, judul 56px, visual kanan, CTA sejajar |
| Katalog | 1 kolom kartu; filter dalam drawer/sheet | Filter sidebar/atas; grid 3–4 kolom |
| Detail layanan | Konten satu kolom; CTA sticky bawah | Konten 8/4 dengan panel syarat/CTA sticky |
| Form pengajuan | Satu kolom; field 16px; upload besar | Dua kolom untuk field pendek; ringkasan kanan |
| Lacak | Kartu status + timeline vertikal | Dua kolom: timeline kiri, detail/aksi kanan |
| Login | Split-screen disembunyikan; form maks 400px | Split-screen 50:50, panel brand gelap |
| Admin shell | Sidebar drawer 86% (max 310px), topbar 64px | Sidebar 252px (collapsed 76px), topbar 64px, konten maks 1280px |
| Admin tabel | Kartu per baris | Tabel desktop dengan filter bar |
| Admin detail | Kartu bertumpuk | Grid 8/4: detail + aksi/timeline |

## 10. Dark Mode

**N/A — tidak diimplementasikan pada Phase 1.** Area publik memakai mode terang permanen (ivory); area admin dan autentikasi juga terang. Tidak ada toggle atau `prefers-color-scheme`. Menambahkan dark mode memerlukan token gelap untuk kedua palet (publik dan admin) serta audit kontras ulang. Dicatat sebagai Q2.

## 11. Design Deliverables

| Deliverable | Order | Variants | Acceptance |
|-------------|-------|----------|------------|
| Token reference sheet | 1 | Light only | Cocok dengan `tailwind.config.ts` dan `assets/css/main.css`; tidak ada warna hard-coded baru |
| Public shell + hero + footer | 2 | 375 dan 1440 | Sesuai token; navigasi dan `Ctrl+K` berfungsi |
| Katalog + detail layanan + form pengajuan | 3 | 375/1440; loading/empty/error | Launch-critical; semua field type dan conditional state |
| Lacak permohonan | 4 | 375/1440; status/timeline/kelengkapan | Token/tiket terlihat jelas; catatan internal tidak tampil |
| Admin dashboard + permohonan + detail | 5 | 1440 dan 375 | Tabel/kartu; aksi status; konflik 409 |
| Admin CMS (layanan, dokumen, ekosistem, publikasi, tim, pengguna) | 6 | 1440 | Form builder dan upload state |
| Login + aktivasi | 7 | 375/1440; error/loading | Split-screen; pesan token/email |
| Empty/error/loading component sheet | 8 | Semua state | Setiap komponen §6 punya state |

**Catatan:** Phase 1 sudah diimplementasikan dan menjadi referensi visual sebenarnya. Jika tidak ada redesign, deliverable yang berlaku adalah token sheet dan dokumen ini sebagai kontrak; mockup baru hanya untuk perubahan besar (Q5).

## 12. Document Info & Sign-off

| Field | Value |
|-------|-------|
| Status | Draft |
| Version | 0.1 |
| Source PRD | PRD v1.0 — `docs/PRD.md` |
| Author / Owner | Arief Faqihudin |
| Approver + date | Belum ditandatangani |
| File location | `docs/DESIGN_BRIEF.md` |

**Assumptions**

- A1: Tiga kata sifat brand (Tereditorial, Institusional, Terbuka) diekstrak dari token dan layout; perlu konfirmasi.
- A2: Dark mode tidak termasuk lingkup Phase 1.
- A3: Inter Variable self-hosted, tanpa biaya lisensi.
- A4: Aset logo yang tersedia (`unu-logo.png`, `member-logo-white.png`) cukup untuk semua penggunaan.

**Open design questions**

- Q1: Apakah tiga kata sifat brand disetujui, atau ada panduan identitas UNU yang mengikat?
- Q2: Apakah dark mode diperlukan untuk Phase 2?
- Q3: Apakah tersedia varian logo SVG/monokrom dan social preview resmi?
- Q4: Apakah ada design system UNU resmi yang wajib dipakai (SOP §6.3), dan bagaimana hubungannya dengan token ini?
- Q5: Apakah akan ada redesign/mockup baru, atau dokumen ini hanya referensi as-built?

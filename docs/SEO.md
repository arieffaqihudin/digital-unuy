# SEO — panduan deployment & verifikasi

## Konfigurasi wajib di produksi
| Variabel | Nilai | Catatan |
|---|---|---|
| `NODE_ENV` | `production` | Tanpa ini situs diperlakukan sebagai development dan **tidak boleh diindeks**. |
| `NUXT_PUBLIC_SITE_URL` | `https://<domain-produksi>` | Dipakai untuk canonical, sitemap, Open Graph, JSON-LD. Harus https dan bukan localhost. |
| `NUXT_PUBLIC_NOINDEX` | `true` (hanya staging) | Memaksa `Disallow: /` dan header `X-Robots-Tag: noindex` meski `NODE_ENV=production`. |

Kebijakan indexing ada di `server/utils/indexing.ts`:
- Produksi dengan URL https non-localhost: halaman publik boleh diindeks, `robots.txt` mencantumkan sitemap.
- Selain itu (development, staging, URL localhost): `robots.txt` = `Disallow: /`, semua respons membawa `X-Robots-Tag: noindex, nofollow`, dan `/sitemap.xml` menolak (503) bila produksi masih memakai localhost.
- Rute privat (`/admin`, `/masuk`, `/aktivasi`, `/lacak`, `/layanan/*/ajukan`, `/pencarian`, `/api`) selalu `noindex`. Keamanan data tetap ditegakkan oleh autentikasi server, bukan meta robots.

## Mengelola SEO dari CMS
- Per konten (Produk Digital, Layanan, Publikasi, Halaman): bagian **SEO & Tampilan Pencarian** — semua kolom opsional; kosong = otomatis dari judul/ringkasan. Ada pratinjau hasil pencarian dan indikator panjang (rekomendasi, bukan batas keras).
- Global: **Administrasi → SEO & Indexing** (akhiran judul, deskripsi bawaan, gambar bawaan share, kode verifikasi Google).
- Konten dengan "Jangan tampilkan di mesin pencari" otomatis keluar dari sitemap dan diberi `noindex`.

## Verifikasi Google Search Console (belum dilakukan)
1. Deploy dengan variabel di atas, lalu buka `https://<domain>/robots.txt` dan `/sitemap.xml` — pastikan berisi domain produksi.
2. Di Search Console tambahkan properti (disarankan **Domain** dengan verifikasi DNS TXT). Alternatif prefix URL: salin nilai `content` dari meta tag verifikasi ke **SEO & Indexing → Kode verifikasi**.
3. Kirim `https://<domain>/sitemap.xml` di menu Sitemaps.
4. Gunakan URL Inspection untuk beranda dan satu halaman detail; pastikan "Pengindeksan diizinkan" dan canonical sesuai.
5. Uji JSON-LD dengan Rich Results Test / Schema Markup Validator.
6. Pantau laporan Pengindeksan dan Core Web Vitals (data lapangan baru muncul setelah ada cukup trafik).

Tidak ada klaim peringkat atau status indeks sebelum data Search Console nyata tersedia.

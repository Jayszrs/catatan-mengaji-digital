# Catatan Mengaji Digital

Platform pencatatan Tahsin dan Tahfidz SD Islam Labschool Bani Saleh. Aplikasi ini menyatukan data siswa, kelas, presensi, laporan harian, ujian kenaikan level, Munaqosyah, rapor resmi, kurikulum surat, serta pemantauan Admin dalam satu sumber data Supabase.

Status proyek: **siap dijalankan dan dideploy**. Dokumentasi ini diperbarui pada 2 Agustus 2026 setelah perapihan struktur proyek.

## Fitur utama

### Admin

- Dashboard monitoring jumlah akun, siswa, kelas, laporan, dan aktivitas terbaru.
- Monitoring Guru beserta kelas, jumlah siswa, kelengkapan laporan, dan status aktivitas.
- Monitoring Orang Tua beserta anak yang terhubung, kelengkapan biodata, dan waktu login.
- Manajemen akun: membuat akun berbasis username, mengganti sandi dan role, menonaktifkan, serta menghapus akun secara aman.
- Persetujuan akun Guru dan pengaitan akun Orang Tua melalui NIS siswa.
- Manajemen siswa dan kelas lintas Guru, deteksi NIS ganda, pemindahan kelas, dan kenaikan kelas massal.
- Rekap kelengkapan laporan per Guru.
- Pengaturan tahun ajaran, kurikulum surat Level 1–6 dan Mustawa Muttawasit 1–3.
- Audit aktivitas perubahan akun dan data penting.

### Guru

- Kelola siswa dan kelas, termasuk impor Excel daftar siswa.
- Presensi dan laporan harian terintegrasi.
- Input ujian kenaikan level dengan pilihan surat sesuai level dan tahun ajaran.
- Form Munaqosyah lengkap dengan nilai angka, huruf Indonesia/Arab, kepribadian, dan catatan.
- Kelola data surat per jenjang dan tahun ajaran.
- Rapor Hafalan Harian, Hafalan Level, dan Munaqosyah menggunakan template resmi.
- Ekspor Excel, cetak, dan simpan PDF.
- Profil Guru dan foto profil.

### Orang Tua

- Melihat progres anak berdasarkan NIS yang telah diklaim secara aman.
- Melihat laporan harian, hasil ujian level, Munaqosyah, komposisi nilai, dan data surat.
- Mengubah biodata Orang Tua dan data anak yang diizinkan.
- Panduan penggunaan khusus role Orang Tua.

## Teknologi

- Next.js 16.2.7 App Router
- React 19.2.4 dan TypeScript 5
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, Row Level Security, RPC, dan Storage
- Recharts untuk visualisasi monitoring
- SheetJS (`xlsx`) untuk impor dan ekspor Excel
- Vercel Analytics, Speed Insights, dan deployment

## Arsitektur dan struktur folder

Proyek ini memakai arsitektur **Next.js full-stack**. Frontend dan backend tetap berada dalam satu aplikasi agar routing, autentikasi, build, dan deployment Vercel konsisten, tetapi tanggung jawab setiap folder dibuat jelas:

```text
catatan-mengaji-digital/
├── src/
│   ├── app/
│   │   ├── api/                 # Backend: HTTP route handlers
│   │   ├── auth/                # Frontend: login, daftar, verifikasi, reset sandi
│   │   ├── dashboard/           # Frontend: halaman Admin, Guru, dan Orang Tua
│   │   ├── globals.css          # Gaya global
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing/onboarding
│   ├── components/              # Frontend: komponen UI reusable
│   │   └── admin/               # Komponen modul Admin
│   ├── lib/                     # Logika aplikasi dan integrasi bersama
│   │   └── server/              # Backend: layanan yang hanya berjalan di server
│   └── types/                   # Deklarasi TypeScript
├── database/
│   └── migrations/              # Migrasi PostgreSQL/Supabase
├── docs/
│   ├── MOM.md                   # Notulen perjalanan proyek
│   ├── QUICKSTART.md            # Panduan mulai cepat
│   └── SUPABASE_SETUP.md        # Urutan setup dan migrasi database
├── public/                       # Logo dan gambar statis
├── .env.example                 # Contoh environment variable
├── next.config.ts               # Konfigurasi Next.js
├── package.json                 # Dependency dan perintah npm
└── tsconfig.json                # Konfigurasi TypeScript dan alias @/ ke src/
```

Ringkasnya:

- **Frontend:** `src/app` selain `src/app/api`, ditambah `src/components`.
- **Backend:** `src/app/api` dan `src/lib/server`.
- **Shared/application layer:** `src/lib` dan `src/types`.
- **Database:** `database/migrations`.

## Persyaratan

- Node.js 20.9.0 atau lebih baru
- npm
- Project Supabase
- Akun Vercel untuk deployment production

## Menjalankan secara lokal

1. Instal dependency:

   ```bash
   npm install
   ```

2. Salin konfigurasi environment:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Isi `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=GANTI_DENGAN_PASSWORD_ADMIN_YANG_KUAT
   ```

4. Jalankan migrasi sesuai [panduan Supabase](docs/SUPABASE_SETUP.md).

5. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

6. Buka `http://localhost:3000`.

## Pemeriksaan kualitas

Jalankan sebelum commit atau deployment:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Build production proyek memakai Webpack agar sama dengan proses validasi yang telah digunakan selama pengembangan:

```bash
npx next build --webpack
```

## Database dan migrasi

Semua SQL berada di `database/migrations`. Jangan menjalankan migrasi pada production tanpa backup. Gunakan urutan dan langkah verifikasi pada [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

Migrasi ditulis agar dapat dijalankan ulang sejauh memungkinkan. Jika Supabase menampilkan error schema cache setelah perubahan kolom, tunggu beberapa saat atau jalankan reload schema dari dashboard sebelum mencoba kembali.

## Alur akun

- Guru mendaftar lalu menunggu persetujuan Admin.
- Orang Tua mendaftar dan menghubungkan akun dengan siswa menggunakan NIS; sistem tetap memvalidasi keberadaan dan status hubungan siswa.
- Admin dapat membuat akun internal tanpa verifikasi email menggunakan username, nama lengkap, password, konfirmasi password, dan role.
- Kredensial rahasia dan `SUPABASE_SERVICE_ROLE_KEY` hanya boleh disimpan di environment server/Vercel, bukan di repository.

## Deployment Vercel

1. Hubungkan repository ke Vercel.
2. Tambahkan seluruh environment variable dari `.env.example` pada environment Production, Preview, dan Development sesuai kebutuhan.
3. Pastikan project Supabase yang dipakai Vercel sama dengan project yang telah menerima seluruh migrasi.
4. Push branch `main`; Vercel akan membangun dan menerbitkan commit tersebut.
5. Periksa halaman Deployments sampai status commit menjadi **Ready**.

## Dokumentasi

- [Panduan mulai cepat](docs/QUICKSTART.md)
- [Setup dan migrasi Supabase](docs/SUPABASE_SETUP.md)
- [MOM/notulen perjalanan proyek](docs/MOM.md)
- [PDF MOM lengkap](docs/MOM.pdf)
- [Panduan alur Admin (PDF)](docs/panduan/PANDUAN-ALUR-ADMIN.pdf)
- [Panduan alur Guru (PDF)](docs/panduan/PANDUAN-ALUR-GURU.pdf)
- [Panduan alur Orang Tua/Wali (PDF)](docs/panduan/PANDUAN-ALUR-ORANG-TUA.pdf)

PDF MOM dapat dibuat ulang setelah dokumen diperbarui:

```bash
python scripts/generate_mom_pdf.py
```

Tiga PDF panduan role dapat dibuat ulang secara bersamaan:

```bash
python scripts/generate_role_guides.py
```

## Pemeliharaan

- Pertahankan komponen UI umum di `src/components`.
- Tambahkan endpoint baru di `src/app/api` dan logika rahasia/server-only di `src/lib/server`.
- Tambahkan perubahan schema sebagai file SQL baru di `database/migrations`; jangan mengubah data production secara manual tanpa catatan.
- Perbarui README, panduan migrasi, dan MOM ketika ada perubahan fitur besar.

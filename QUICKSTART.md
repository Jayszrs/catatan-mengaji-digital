# 🚀 Quick Start Guide - Laporan Harian Tahsin & Tahfidz

Panduan cepat untuk memulai menggunakan platform Laporan Harian.

## 📝 Langkah 1: Persiapan Awal

### Install Dependencies

```bash
npm install
```

### Setup Environment Variables

1. Buat file `.env.local` di root folder project
2. Isi dengan:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Langkah 2: Setup Supabase

### A. Buat Project Supabase Baru

1. Kunjungi https://supabase.com
2. Sign up atau login
3. Klik "New project"
4. Isi form:
   - Nama: "laporan_harian"
   - Password: [buat password kuat]
   - Region: [pilih terdekat]
5. Tunggu project siap

### B. Copy Credentials

1. Di dashboard Supabase, buka "Project Settings"
2. Pergi ke menu "API"
3. Copy "Project URL"
4. Copy "anon public" key
5. Paste di `.env.local`

### C. Setup Database

1. Di Supabase dashboard, buka "SQL Editor"
2. Klik "New query"
3. Buka file `SUPABASE_SETUP.md` di folder project
4. Copy seluruh SQL script dari bagian "Full Setup Script"
5. Paste ke SQL Editor
6. Klik tombol "Run"
7. Tunggu proses selesai (refresh page jika perlu)

## ▶️ Langkah 3: Jalankan Project

### Development Mode

```bash
npm run dev
```

Buka http://localhost:3000

### Production Build

```bash
npm run build
npm run start
```

## ✅ Test Setup

### 1. Test Homepage

- Buka http://localhost:3000
- Pastikan tampilan bagus dengan warna hijau #2dc653

### 2. Test Signup sebagai Guru

- Klik "Daftar"
- Pilih tipe akun: "Guru"
- Isi form:
  - Nama: "Guru Test"
  - Email: "guru@test.com"
  - Password: "password123"
- Klik "Daftar"
- Seharusnya redirect ke halaman login

### 3. Test Login

- Masukkan email dan password yang baru dibuat
- Klik "Login"
- Seharusnya masuk ke dashboard guru

### 4. Test Input Laporan (Guru Dashboard)

- Klik tombol "+ Tambah Laporan"
- Isi form:
  - Tanggal: [tanggal hari ini]
  - Nama Surah: "Al-Fatihah"
  - Hal/Ayat: "1/1-7"
  - Keterangan: "Lancar"
- Klik "Simpan Laporan"
- Seharusnya laporan muncul di tabel

### 5. Test Signup sebagai Orang Tua

- Logout
- Daftar lagi dengan tipe "Orang Tua"
- Login
- Seharusnya masuk ke dashboard orang tua (lihat laporan)

## 📁 File-file Penting

| File                               | Deskripsi                                    |
| ---------------------------------- | -------------------------------------------- |
| `.env.local`                       | Environment variables (Supabase credentials) |
| `README.md`                        | Dokumentasi lengkap                          |
| `SUPABASE_SETUP.md`                | Panduan setup database Supabase              |
| `lib/supabase.ts`                  | Konfigurasi Supabase client                  |
| `app/page.tsx`                     | Homepage                                     |
| `app/auth/login/page.tsx`          | Halaman login                                |
| `app/auth/signup/page.tsx`         | Halaman signup                               |
| `app/dashboard/guru/page.tsx`      | Dashboard guru                               |
| `app/dashboard/orang-tua/page.tsx` | Dashboard orang tua                          |

## 🐛 Troubleshooting

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

- ✅ Pastikan file `.env.local` ada
- ✅ Pastikan variable sudah di-set dengan benar
- ✅ Restart npm dev server

### Error: "Connection refused" di login

- ✅ Pastikan Supabase URL dan key benar
- ✅ Pastikan project Supabase sudah ready
- ✅ Cek internet connection

### Laporan tidak muncul di tabel

- ✅ Pastikan database sudah di-setup
- ✅ Cek di Supabase "Table Editor" apakah tabel ada
- ✅ Cek apakah laporan tersimpan di database

### Design tidak sesuai (tidak ada warna hijau)

- ✅ Pastikan Tailwind CSS sudah running
- ✅ Bersihkan cache: `rm -rf .next` kemudian `npm run dev` lagi

## 📞 Support

Jika ada masalah, cek:

1. Console browser (F12 → Console tab)
2. Terminal output dari `npm run dev`
3. Supabase logs

## ✨ Fitur yang Bisa Dikembangkan

- [ ] Tambah halaman manajemen siswa
- [ ] Hapus/edit laporan
- [ ] Export laporan ke PDF
- [ ] Notifikasi email
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] Integrasi dengan sistem sekolah
- [ ] Upload file lampiran

Selamat menggunakan! 🎉

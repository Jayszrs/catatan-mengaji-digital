# Panduan Mulai Cepat

Panduan singkat untuk menjalankan Catatan Mengaji Digital di komputer pengembang.

## 1. Siapkan aplikasi

Pastikan Node.js 20.9.0 atau lebih baru telah tersedia, lalu dari root repository jalankan:

```bash
npm install
```

## 2. Siapkan environment

Salin `.env.example` menjadi `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Isi URL dan key dari Supabase Project Settings. Gunakan password bootstrap Admin yang kuat dan berbeda dari password pengguna lain.

## 3. Siapkan database

Backup database jika project Supabase sudah berisi data. Setelah itu jalankan file pada `database/migrations` mengikuti urutan di [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

Tambahkan URL berikut pada **Supabase Authentication > URL Configuration**:

- URL lokal: `http://localhost:3000`
- Callback verifikasi lokal: `http://localhost:3000/auth/verify`
- Domain production dan route `/auth/verify` milik domain production

## 4. Jalankan mode pengembangan

```bash
npm run dev
```

Buka `http://localhost:3000`.

## 5. Pemeriksaan awal

1. Login sebagai Admin dan pastikan dashboard monitoring dapat dimuat.
2. Buat atau setujui akun Guru.
3. Tambahkan kelas dan impor daftar siswa Excel.
4. Login sebagai Guru, lalu isi presensi/laporan harian, ujian level, dan Munaqosyah.
5. Buka 3 Rapor Otomatis dan pastikan template resmi menampilkan data terbaru.
6. Login sebagai Orang Tua, klaim anak memakai NIS yang valid, lalu periksa laporan anak.

## 6. Validasi sebelum deployment

```bash
npm run lint
npx tsc --noEmit
npx next build --webpack
```

## Pemecahan masalah

### Environment Supabase tidak terbaca

- Pastikan nama variable sama persis dengan `.env.example`.
- Restart server development setelah mengubah `.env.local`.
- Pastikan Vercel memakai variable yang sama untuk production.

### Fitur database belum diaktifkan

- Pastikan semua migrasi sudah dijalankan dalam urutan yang benar.
- Periksa error pertama di Supabase SQL Editor; jangan lanjutkan sebelum error itu selesai.
- Reload schema cache Supabase bila kolom baru belum dikenali oleh REST API.

### Login memakai data lama gagal

Pastikan aplikasi lokal dan Vercel mengarah ke project Supabase yang sama. Pengguna dari project Supabase lain tidak otomatis tersedia.

### Build gagal setelah memindahkan file

Pastikan alias TypeScript tetap mengarah ke `./src/*` dan semua kode aplikasi berada di dalam `src`.

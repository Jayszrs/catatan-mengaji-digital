# Setup dan Migrasi Supabase

Dokumen ini menjadi acuan database Catatan Mengaji Digital. Semua file SQL tersimpan di `database/migrations`.

## Sebelum mulai

1. Pastikan aplikasi lokal dan Vercel mengarah ke project Supabase yang sama.
2. Buat backup database production.
3. Jalankan migrasi melalui **Supabase Dashboard > SQL Editor** menggunakan akun pemilik project.
4. Jalankan satu file sampai berhasil sebelum melanjutkan ke file berikutnya.
5. Jangan menjalankan perintah penghapusan tabel pada database yang sudah berisi data.

## Environment variable

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GANTI_DENGAN_PASSWORD_ADMIN_YANG_KUAT
```

`SUPABASE_SERVICE_ROLE_KEY` dan password Admin hanya boleh berada di environment server/Vercel. Jangan menggunakan awalan `NEXT_PUBLIC_` untuk nilai rahasia.

## Urutan migrasi

Urutan berikut berlaku untuk database lama yang sudah memiliki tabel dasar aplikasi:

1. [`supabase-nis-shared-data-migration.sql`](../database/migrations/supabase-nis-shared-data-migration.sql) — menormalisasi NIS, menangani duplikat lama, dan membuka data bersama dengan kebijakan akses yang sesuai.
2. [`supabase-integrated-learning-migration.sql`](../database/migrations/supabase-integrated-learning-migration.sql) — membuat kelas, laporan harian, ujian level, Munaqosyah, rapor siswa, foto siswa, fungsi simpan, dan kebijakan RLS dasar.
3. [`supabase-student-excel-profile-migration.sql`](../database/migrations/supabase-student-excel-profile-migration.sql) — menambah profil siswa dari format Excel sekolah dan mengubah nomor telepon menjadi `text` agar data panjang tidak terpotong.
4. [`supabase-parent-security-and-automation-migration.sql`](../database/migrations/supabase-parent-security-and-automation-migration.sql) — membuat hubungan Orang Tua–siswa, profil Guru, pembatasan akses Orang Tua, storage foto Guru, serta fungsi otomatis laporan.
5. [`supabase-surah-curriculum-and-levels-migration.sql`](../database/migrations/supabase-surah-curriculum-and-levels-migration.sql) — membuat data surat per tahun ajaran, seed kurikulum, dan memperluas jenjang menjadi Level 1–6 serta Mustawa Muttawasit 1–3.
6. [`supabase-level-exam-surah-migration.sql`](../database/migrations/supabase-level-exam-surah-migration.sql) — menyimpan surat yang diuji pada setiap hasil ujian kenaikan level.
7. [`supabase-munaqosyah-form-migration.sql`](../database/migrations/supabase-munaqosyah-form-migration.sql) — menyimpan komponen Munaqosyah lengkap sesuai rekap Excel dan template rapor resmi.
8. [`supabase-account-approval-and-parent-claim-security.sql`](../database/migrations/supabase-account-approval-and-parent-claim-security.sql) — memperkuat persetujuan Guru, klaim NIS Orang Tua, dan audit keamanan akun.

## Database baru

Repository ini menyimpan migrasi evolusi aplikasi, bukan satu file reset database. Untuk database baru:

1. Buat schema dasar yang minimal memiliki `user_roles`, `students`, `laporan_tadarus_pagi`, dan `laporan_tahsin_tahfidz` sesuai schema project yang digunakan saat ini.
2. Jalankan delapan migrasi di atas secara berurutan.
3. Jangan menyalin skrip reset lama yang menggunakan `DROP TABLE`, karena dapat menghapus data.

## Verifikasi setelah migrasi

Jalankan pemeriksaan berikut dari Supabase Table Editor atau SQL Editor:

- Tabel `students` memiliki NIS unik, level yang valid, dan kolom profil Excel.
- Tabel `classes`, `daily_student_reports`, `level_promotion_exams`, `munaqosyah_exams`, `surah_curriculum`, `parent_student_links`, `teacher_profiles`, dan `account_security_events` tersedia.
- Storage bucket foto siswa dan Guru tersedia.
- Guru dapat mengubah data yang menjadi tanggung jawabnya.
- Orang Tua hanya dapat melihat anak yang terhubung.
- Admin API dapat memakai service role dari environment server.
- Data Surat menampilkan seed kurikulum untuk tahun ajaran yang dipilih.

## Penanganan error umum

### `operator does not exist: character varying >= integer`

Kolom `students.level` pada schema lama masih bertipe teks. Jalankan migrasi kurikulum versi terbaru yang menormalisasi nilai legacy dan mengubah tipe secara eksplisit sebelum membuat constraint rentang level.

### `Could not find the ... column in the schema cache`

Migrasi kolom belum dijalankan atau REST schema cache belum diperbarui. Jalankan migrasi terkait, lalu reload schema Supabase dan coba kembali.

### `value too long for type character varying(20)`

Jalankan migrasi profil Excel siswa. Migrasi tersebut mengubah `students.no_telp` menjadi `text` sehingga beberapa nomor telepon dari satu sel Excel tetap tersimpan.

### Data Surat tetap kosong

Pastikan migrasi kurikulum berhasil seluruhnya, tahun ajaran pada aplikasi sama dengan nilai seed, dan kebijakan RLS mengizinkan role pengguna membaca `surah_curriculum`.

### Login production tidak menemukan akun lokal

Periksa `NEXT_PUBLIC_SUPABASE_URL`. Akun Supabase tidak berpindah antarproject hanya karena source code dan deployment sama.

## URL autentikasi

Tambahkan URL aplikasi lokal dan production pada **Authentication > URL Configuration**, termasuk callback berikut:

```text
http://localhost:3000/auth/verify
https://DOMAIN-PRODUCTION/auth/verify
```

Setelah seluruh migrasi dan pemeriksaan selesai, jalankan ulang build aplikasi dan deployment Vercel.

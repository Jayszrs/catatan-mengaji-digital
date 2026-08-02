# MOM — Perjalanan Pengembangan Catatan Mengaji Digital

## Informasi dokumen

| Item | Keterangan |
| --- | --- |
| Nama proyek | Catatan Mengaji Digital SD Islam Labschool Bani Saleh |
| Periode pengembangan tercatat | 6 Juni 2026–2 Agustus 2026 |
| Sumber notulen | Permintaan pemilik proyek, hasil implementasi, pengujian, dan riwayat Git |
| Peserta/fungsi | Pemilik produk/sekolah dan pengembang aplikasi |
| Status | Fitur utama selesai, struktur dirapikan, dokumentasi operasional tersedia |
| Repository utama | `Jayszrs/catatan-mengaji-digital` |

## Tujuan proyek

Membangun sistem Tahsin dan Tahfidz yang dapat digunakan Guru, Orang Tua, dan Admin untuk mengelola siswa, kelas, kurikulum surat, laporan harian, ujian kenaikan level, Munaqosyah, rapor resmi, akun, serta pemantauan sekolah dalam satu aplikasi dan satu sumber data Supabase.

## Agenda dan keputusan utama

1. Mengganti proses pencatatan berbasis file terpisah menjadi aplikasi web terintegrasi.
2. Menetapkan tiga role: Admin, Guru, dan Orang Tua dengan hak akses berbeda.
3. Menggunakan NIS sebagai kunci bisnis siswa dan penghubung akun Orang Tua.
4. Guru baru harus disetujui Admin; Orang Tua dapat menghubungkan anak menggunakan NIS dengan validasi keamanan.
5. Menjaga format tiga rapor resmi yang telah tersedia; form hanya menjadi sumber data dan tidak mengganti template cetak.
6. Mendukung Level 1–6 serta Mustawa Muttawasit 1–3, dengan data surat yang dapat berubah per tahun ajaran.
7. Menyimpan frontend dan backend dalam satu aplikasi Next.js full-stack agar autentikasi dan deployment tetap konsisten.
8. Menempatkan endpoint backend di `src/app/api`, layanan server di `src/lib/server`, frontend di `src/app` dan `src/components`, serta migrasi di `database/migrations`.

## Ringkasan pelaksanaan per fase

### Fase 1 — Fondasi aplikasi dan antarmuka awal

Project dibuat menggunakan Next.js, kemudian dikembangkan menjadi aplikasi Catatan Mengaji Digital versi awal. Landing page, navigasi, autentikasi, dashboard Guru/Orang Tua, dan integrasi Supabase menjadi fondasi pekerjaan berikutnya.

Hasil:

- Aplikasi dapat dijalankan secara lokal dan dideploy.
- Identitas visual sekolah dan landing page tersedia.
- Struktur akun awal Guru dan Orang Tua tersedia.

### Fase 2 — Data siswa bersama, foto, profil, dan rapor otomatis

Data siswa dipusatkan agar dapat dipakai lintas akun yang berwenang. Dukungan foto siswa, profil Guru, laporan otomatis, reset password, dan penanganan Admin ditambahkan. Pada fase ini juga dilakukan perbaikan pesan migrasi dan konsistensi penyimpanan role.

Hasil:

- Siswa dikenali menggunakan NIS.
- Foto siswa/Guru dan profil dapat dikelola.
- Tiga sumber rapor mulai tersambung ke data aplikasi.
- Admin memiliki pengelolaan akun yang lebih aman.

### Fase 3 — Template rapor resmi dan riwayat laporan

Template resmi dikembalikan sebagai satu-satunya format cetak untuk rapor harian, kenaikan level, dan Munaqosyah. Laporan harian diperluas agar mendukung beberapa surat pada tanggal yang sama serta riwayat tanggal lama.

Hasil:

- Preview dan cetak menggunakan template resmi.
- Identitas siswa, NIS, kelas, tanggal, dan data penilaian tampil konsisten.
- Kalender rapor dapat menavigasi hari, bulan, dan tahun sebelumnya.

### Fase 4 — Kurikulum surat, sembilan jenjang, dan form penilaian

Data Surat dari referensi Excel dimasukkan ke database. Guru diberi hak mengelola daftar surat per level dan tahun ajaran, sedangkan Orang Tua hanya dapat melihat. Ujian kenaikan level memperoleh dropdown surat berdasarkan level. Form Munaqosyah dilengkapi sesuai kolom rekap Excel.

Hasil:

- Level 1–6 dan Mustawa Muttawasit 1–3 tersedia.
- Kurikulum dapat berubah tanpa merusak histori tahun ajaran sebelumnya.
- Surat ujian level tersimpan bersama hasil ujian.
- Nilai angka, huruf Indonesia/Arab, jumlah, predikat, dan kepribadian Munaqosyah tersimpan.

### Fase 5 — Impor Excel dan penyempurnaan pengalaman pengguna

Impor daftar siswa diperbaiki agar membaca NIS, nama, profil, dan beberapa nomor telepon. Layout komposisi nilai dipadatkan. Landing/onboarding, login, signup, panduan role, background sekolah, dan efek visual disempurnakan dengan perhatian pada performa scroll.

Hasil:

- File Excel sekolah dapat dipakai untuk membuat atau memperbarui siswa berdasarkan NIS.
- Data panjang tidak lagi terpotong oleh `varchar(20)`.
- Onboarding Guru dan Orang Tua berbeda dan lebih kontekstual.
- Halaman autentikasi dan landing lebih profesional.

### Fase 6 — Keamanan akun dan hubungan Orang Tua–anak

Manajemen akun Admin diperkuat. Admin dapat membuat akun menggunakan username tanpa verifikasi email, mengubah sandi dan role, serta menghapus akun dengan perlindungan Admin terakhir. Guru memerlukan persetujuan, sementara Orang Tua menggunakan NIS yang tidak sepenuhnya terbuka karena tetap divalidasi dan dibatasi oleh RLS.

Hasil:

- Sesi lama tidak dijadikan alasan untuk meminta mode Incognito saat menguji password baru.
- Perubahan password dan role ditangani server-side.
- Aktivitas keamanan dicatat.
- Orang Tua hanya dapat mengakses siswa yang telah terhubung.

### Fase 7 — Kelas, nilai terintegrasi, dan monitoring Admin

Data kelas dikembangkan menjadi dashboard nilai yang terhubung dengan laporan harian, ujian level, dan Munaqosyah. Delapan modul Admin dibuat: Dashboard Monitoring, Monitoring Guru, Monitoring Orang Tua, Manajemen Siswa/Kelas, Persetujuan Akun, Kelengkapan Laporan, Tahun Ajaran/Kurikulum, dan Audit Aktivitas.

Hasil:

- Admin dapat memantau sistem tanpa masuk ke akun Guru satu per satu.
- Rekap nilai kelas dapat ditampilkan berdasarkan kelas dan level.
- Aktivitas, kelengkapan laporan, akun, dan masalah data dapat ditindaklanjuti dari panel Admin.

### Fase 8 — Finalisasi struktur dan dokumentasi

Kode aplikasi dipindahkan ke `src`, migrasi SQL dipusatkan di `database/migrations`, dan dokumentasi ditempatkan di `docs`. Alias TypeScript, pesan migrasi, README, panduan Supabase, panduan cepat, dan MOM diperbarui tanpa mengubah URL aplikasi.

Hasil:

- Batas frontend, backend, shared logic, database, dan dokumentasi menjadi jelas.
- Root repository hanya berisi konfigurasi dan folder utama.
- Prosedur instalasi, migrasi, validasi, dan deployment terdokumentasi.

## Masalah penting dan penyelesaiannya

| Masalah | Keputusan/penyelesaian |
| --- | --- |
| Empat nilai harian hanya menjadi satu baris rapor | Query dan tampilan rapor diperluas untuk memuat seluruh nilai/surat pada tanggal terpilih. |
| Preview form berbeda dari template rapor | Semua aksi preview/cetak diarahkan ke komponen template resmi. |
| Data Surat kosong di production | Migrasi kurikulum dan seed dipisahkan, diberi pesan error yang jelas, dan didokumentasikan urutannya. |
| `students.level` bertipe teks | Migrasi terbaru menormalisasi nilai legacy dan melakukan cast sebelum constraint level 1–9. |
| Kolom hasil migrasi tidak ditemukan | Ditangani dengan migrasi khusus dan panduan reload schema cache Supabase. |
| Nomor telepon Excel terlalu panjang | Kolom `no_telp` diubah menjadi `text`. |
| NIS/nama tidak terbaca saat impor | Parser worksheet disesuaikan dengan format daftar siswa sekolah dan update berbasis NIS. |
| Password/role/hapus akun Admin tidak konsisten | Operasi dipindahkan ke API server dengan service role, validasi sesi Admin, dan audit keamanan. |
| Deploy Vercel tertinggal dari graph lokal | Branch `main`, remote, commit SHA, dan status deployment diverifikasi setelah push. |
| Kalender rapor tidak dapat diklik | Seluruh area tombol dijadikan pemicu kalender. |

## Kriteria penerimaan akhir

- [x] Landing, login, signup, reset password, dan onboarding tersedia.
- [x] Role Admin, Guru, dan Orang Tua memiliki navigasi serta izin masing-masing.
- [x] Siswa dan kelas dapat dikelola serta diimpor dari Excel.
- [x] Presensi/laporan harian, ujian level, dan Munaqosyah tersimpan.
- [x] Tiga rapor otomatis memakai template resmi.
- [x] Riwayat laporan dapat dipilih melalui kalender.
- [x] Data Surat mendukung sembilan jenjang dan tahun ajaran.
- [x] Admin memiliki delapan modul monitoring dan pengelolaan.
- [x] Migrasi, setup, struktur proyek, dan deployment terdokumentasi.
- [x] Source siap divalidasi melalui lint, TypeScript, dan production build.

## Tindak lanjut operasional

1. Backup Supabase secara berkala.
2. Jalankan migrasi baru terlebih dahulu pada environment pengujian.
3. Audit akun, NIS ganda, siswa tanpa Orang Tua, dan kelengkapan laporan melalui panel Admin.
4. Pastikan commit production Vercel sama dengan `main` setelah setiap rilis.
5. Perbarui dokumen ini saat ruang lingkup proyek berubah.

## Lampiran — Riwayat commit lengkap

Riwayat berikut disusun kronologis dari commit pertama sampai commit terakhir sebelum finalisasi dokumen ini.

| No. | Tanggal | Commit | Ringkasan |
| ---: | --- | --- | --- |
| 1 | 2026-06-06 | `9ec3c7c` | Inisialisasi Create Next App |
| 2 | 2026-06-19 | `6356ae8` | Inisialisasi Catatan Mengaji Digital v1.0 |
| 3 | 2026-06-19 | `caada0c` | Penyempurnaan footer, logo, dan navbar landing |
| 4 | 2026-07-16 | `b303f03` | Migrasi data siswa bersama dan pembaruan query siswa |
| 5 | 2026-07-16 | `2d24758` | Deklarasi TypeScript modul Next.js |
| 6 | 2026-07-28 | `f9bc5be` | Komponen avatar dan unggah foto siswa |
| 7 | 2026-07-28 | `a54b3a3` | Profil Guru dan pembuatan rapor otomatis |
| 8 | 2026-07-28 | `6861540` | Pengaturan VS Code untuk diagnostik SQL |
| 9 | 2026-07-28 | `da7f068` | Alur pemulihan password |
| 10 | 2026-07-28 | `125f65d` | Penanganan login Administrator |
| 11 | 2026-07-28 | `ee299d7` | Pesan error migrasi database |
| 12 | 2026-07-28 | `dae2475` | Tombol simpan siswa tetap terlihat |
| 13 | 2026-07-28 | `10baab2` | Penjelasan syarat simpan ujian level |
| 14 | 2026-07-28 | `a4a2247` | Pemulihan template resmi rapor otomatis |
| 15 | 2026-07-28 | `d4a4437` | Integrasi rapor otomatis dengan sumber input |
| 16 | 2026-07-28 | `09f70a0` | Pemulihan tanda tangan rapor dan penghapusan catatan terintegrasi lama |
| 17 | 2026-07-28 | `534a4a4` | Persistensi dan perbaikan role dari Admin |
| 18 | 2026-07-28 | `2ce2afe` | Role Admin aman dan penghapusan akun |
| 19 | 2026-07-28 | `7dfa01c` | Edit profil anak oleh Orang Tua dan rapor resmi |
| 20 | 2026-07-28 | `27d0e61` | Kompatibilitas kolom nilai rapor |
| 21 | 2026-07-28 | `aaf0243` | Unduh laporan harian dan filter tanggal |
| 22 | 2026-07-28 | `dd2116c` | Manajemen Data Surat Guru dan Orang Tua |
| 23 | 2026-07-28 | `35e16f0` | Penyempurnaan rapor Munaqosyah |
| 24 | 2026-07-28 | `4366828` | NIS dan kelas pada rapor ujian level |
| 25 | 2026-07-28 | `311124b` | Banyak baris hafalan harian dengan kompatibilitas data lama |
| 26 | 2026-07-28 | `152040f` | Penghentian diagnostik MSSQL untuk migrasi Supabase |
| 27 | 2026-07-28 | `27f2f70` | Cetak Munaqosyah dengan template resmi |
| 28 | 2026-07-28 | `4baef6f` | Cetak presensi harian dengan template resmi |
| 29 | 2026-07-28 | `ff57d98` | Seed Data Surat sesuai kurikulum Excel |
| 30 | 2026-07-28 | `6851008` | Normalisasi level siswa legacy sebelum migrasi |
| 31 | 2026-07-28 | `34e1ba5` | Seluruh preview tersambung ke template rapor resmi |
| 32 | 2026-07-28 | `03072df` | Impor daftar siswa dari Excel sekolah |
| 33 | 2026-07-28 | `abda023` | Pilihan surat pada ujian kenaikan level |
| 34 | 2026-07-28 | `809a761` | Impor Excel tetap bekerja sebelum migrasi profil |
| 35 | 2026-07-29 | `f51ec14` | Impor beberapa nomor telepon siswa secara aman |
| 36 | 2026-07-29 | `e060107` | Layout komposisi nilai lebih ringkas |
| 37 | 2026-07-29 | `e20ec8e` | Redesign onboarding profesional |
| 38 | 2026-07-29 | `acb1513` | Redesign portal login dan signup |
| 39 | 2026-07-29 | `549a4a3` | Tur dashboard berdasarkan role |
| 40 | 2026-07-29 | `5c7e43d` | Nama contoh siswa pada onboarding |
| 41 | 2026-07-29 | `1659744` | Panduan onboarding lebih lengkap dan optimasi landing |
| 42 | 2026-07-29 | `ee2facc` | Background parallax satu halaman |
| 43 | 2026-07-29 | `5381fcf` | Kalender riwayat rapor dan profil Orang Tua |
| 44 | 2026-07-29 | `9474f2e` | Penyederhanaan kontrol kalender rapor |
| 45 | 2026-07-29 | `c8920ec` | Seluruh tombol kalender dapat diklik |
| 46 | 2026-07-29 | `7088862` | Pemicu ulang deployment Vercel |
| 47 | 2026-07-29 | `4853a56` | Reliabilitas manajemen akun Admin |
| 48 | 2026-07-29 | `c762312` | Manajemen akun username oleh Admin |
| 49 | 2026-07-29 | `9212045` | Persetujuan Guru dan pengaitan Orang Tua melalui NIS |
| 50 | 2026-07-29 | `98a2e22` | Dashboard nilai kelas terintegrasi |
| 51 | 2026-08-02 | `e5c7935` | Delapan modul monitoring Admin |
| 52 | 2026-08-02 | Finalisasi | Perapihan struktur frontend/backend, migrasi, README, panduan, dan MOM |

## Penutupan

Ruang lingkup utama yang disepakati telah diimplementasikan. Pengembangan berikutnya diperlakukan sebagai pemeliharaan atau fase baru, bukan pekerjaan yang belum tercatat dari fase ini.

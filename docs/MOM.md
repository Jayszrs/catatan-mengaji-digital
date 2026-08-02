# MOM — Perjalanan Pengembangan Catatan Mengaji Digital

## Informasi dokumen

| Item | Keterangan |
| --- | --- |
| Nomor dokumen | MOM/CMD/VIII/2026/001 |
| Versi dokumen | 2.0 — final dengan kop surat dan lampiran lengkap |
| Nama proyek | Catatan Mengaji Digital SD Islam Labschool Bani Saleh |
| Hari/tanggal penyusunan | Minggu, 2 Agustus 2026 |
| Periode pengembangan tercatat | 6 Juni 2026–2 Agustus 2026 |
| Sumber notulen | Permintaan pemilik proyek, hasil implementasi, pengujian, dan riwayat Git |
| Pimpinan pembahasan | Pemilik produk/perwakilan sekolah |
| Notulis | Tim pengembang sistem |
| Peserta/fungsi | Pemilik produk/sekolah, Koordinator Tahfizh, Guru, perwakilan kebutuhan Orang Tua, dan pengembang aplikasi |
| Agenda | Evaluasi kebutuhan, keputusan fitur, penyelesaian masalah, penerimaan hasil, dan serah terima dokumentasi |
| Status | Fitur utama selesai, struktur dirapikan, dokumentasi operasional tersedia |
| Repository utama | `Jayszrs/catatan-mengaji-digital` |
| Repository sinkron | `alfdhzz/catatan-mengaji-digital` |
| Deployment | Vercel — `catatan-mengaji-digital.vercel.app` |

## Ringkasan eksekutif

Catatan Mengaji Digital telah berkembang dari aplikasi Next.js awal menjadi sistem operasional sekolah dengan tiga role, data siswa dan kelas terintegrasi, kurikulum sembilan jenjang, tiga jenis penilaian, tiga rapor resmi, impor/ekspor Excel, keamanan akun, dan delapan modul pengawasan Admin. Pengembangan tercatat selama 6 Juni–2 Agustus 2026 dan seluruh perubahan utama dapat ditelusuri melalui riwayat Git.

Hasil akhir telah melalui pemeriksaan TypeScript, production build, route generation, sinkronisasi repository, serta pemeriksaan endpoint production. Migrasi Supabase dan temuan ESLint legacy dicatat secara terbuka agar pengelolaan setelah serah terima tetap terukur.

## Latar belakang

Pencatatan Tahsin dan Tahfizh sebelumnya mengacu pada beberapa lembar Excel, form terpisah, dan template rapor resmi. Kondisi tersebut menimbulkan risiko data ganda, riwayat yang sulit dicari, perbedaan format antara form dan rapor, serta keterlambatan komunikasi progres siswa kepada Orang Tua. Proyek Catatan Mengaji Digital dibangun untuk menyatukan proses tersebut tanpa menghilangkan format administrasi sekolah yang telah digunakan.

Dokumen MOM ini merekam kebutuhan yang disampaikan sejak awal, keputusan yang diambil selama pengembangan, implementasi per fase, masalah dan penyelesaiannya, bukti validasi, riwayat commit, status rilis, risiko tersisa, serta tindakan operasional setelah serah terima.

## Tujuan proyek

Membangun sistem Tahsin dan Tahfidz yang dapat digunakan Guru, Orang Tua, dan Admin untuk mengelola siswa, kelas, kurikulum surat, laporan harian, ujian kenaikan level, Munaqosyah, rapor resmi, akun, serta pemantauan sekolah dalam satu aplikasi dan satu sumber data Supabase.

Sasaran khusus:

1. Mengurangi input data berulang dan ketergantungan pada banyak file Excel.
2. Menjaga histori penilaian per siswa, tanggal, level, kelas, dan tahun ajaran.
3. Menampilkan seluruh surat/nilai yang dicatat pada hari yang sama di rapor harian.
4. Memastikan tiga rapor menggunakan template resmi sekolah.
5. Memberi Orang Tua akses terbatas hanya kepada data anak yang terhubung.
6. Memberi Admin sarana pemantauan menyeluruh tanpa membuka akun Guru satu per satu.
7. Menyediakan proses migrasi, build, deployment, dan audit yang dapat ditelusuri.

## Pemangku kepentingan dan tanggung jawab

| Pihak | Kebutuhan utama | Tanggung jawab penggunaan |
| --- | --- | --- |
| Admin sekolah | Monitoring sistem, persetujuan akun, audit, tahun ajaran, data siswa/kelas | Menjaga akun, role, kurikulum, dan konsistensi data sekolah |
| Guru Tahfizh | Input laporan, ujian level, Munaqosyah, kelas, siswa, dan rapor | Memastikan data penilaian akurat dan diisi tepat waktu |
| Orang Tua/Wali | Melihat progres, rapor, komposisi nilai, data surat, dan biodata | Menjaga kerahasiaan akun serta memastikan NIS anak benar |
| Koordinator Tahfizh | Menetapkan kurikulum, memeriksa laporan dan hasil evaluasi | Memantau standar penilaian dan kelengkapan program |
| Pengembang sistem | Implementasi, migrasi, pengujian, dokumentasi, deployment | Menjaga source code, keamanan server, dan proses rilis |

## Ruang lingkup dan keluaran proyek

| Area | Keluaran yang disepakati | Status |
| --- | --- | --- |
| Landing dan autentikasi | Landing profesional, login/signup, reset password, background sekolah, onboarding per role | Selesai |
| Akun dan keamanan | Persetujuan Guru, klaim NIS Orang Tua, akun username dari Admin, ubah role/sandi, hapus/nonaktifkan, audit | Selesai |
| Siswa dan kelas | CRUD siswa/kelas, impor Excel, foto, NIS unik, pemindahan dan kenaikan kelas | Selesai |
| Laporan harian | Presensi, kegiatan, tadarus, banyak hafalan/surat per tanggal, catatan Guru, histori kalender | Selesai |
| Ujian level | Level awal/tujuan, dropdown surat per level, komponen nilai, predikat, hasil kenaikan | Selesai |
| Munaqosyah | Komponen rekap Excel, angka/huruf Indonesia dan Arab, jumlah, rata-rata, kepribadian, catatan | Selesai |
| Rapor otomatis | Hafalan Harian, Hafalan Level, Munaqosyah, template resmi, Excel, cetak/PDF | Selesai |
| Kurikulum | Level 1–6, Mustawa Muttawasit 1–3, daftar surat per tahun ajaran, akses baca Orang Tua | Selesai |
| Monitoring Admin | Delapan modul monitoring, kelengkapan laporan, aktivitas, masalah data, tahun ajaran | Selesai |
| Dokumentasi | README, Quick Start, panduan Supabase, MOM Markdown, MOM PDF, generator PDF | Selesai |

## Arsitektur implementasi

Aplikasi menggunakan pola Next.js full-stack agar frontend, backend, autentikasi, dan deployment tetap berada dalam satu unit rilis.

| Lapisan | Lokasi | Fungsi |
| --- | --- | --- |
| Frontend | `src/app` selain `src/app/api`, serta `src/components` | Halaman, dashboard, form, tabel, rapor, onboarding, dan komponen UI |
| Backend HTTP | `src/app/api` | Registrasi, sesi Admin, manajemen akun, klaim anak, dan perubahan profil |
| Layanan server | `src/lib/server` | Operasi service role, keamanan akun, dan audit server-side |
| Logika bersama | `src/lib` dan `src/types` | Supabase client, ekspor, query rapor, impor siswa, level, dan tipe data |
| Database | Supabase PostgreSQL dan `database/migrations` | Penyimpanan, RPC, constraint, RLS, seed kurikulum, dan audit |
| Aset | `public` | Logo sekolah, logo Tahsin/Tahfizh, foto background, dan favicon |
| Deployment | Vercel | Build Next.js, route statis/dinamis, Analytics, dan Speed Insights |

## Migrasi database yang menjadi bagian proyek

| Urutan | Migrasi | Hasil utama |
| ---: | --- | --- |
| 1 | `supabase-nis-shared-data-migration.sql` | Normalisasi NIS, data siswa bersama, dan kebijakan baca yang terkendali |
| 2 | `supabase-integrated-learning-migration.sql` | Kelas, laporan harian, ujian level, Munaqosyah, rapor, RPC, dan foto siswa |
| 3 | `supabase-student-excel-profile-migration.sql` | Kolom profil Excel dan nomor telepon bertipe `text` |
| 4 | `supabase-parent-security-and-automation-migration.sql` | Hubungan Orang Tua–siswa, profil Guru, RLS Orang Tua, dan otomatisasi laporan |
| 5 | `supabase-surah-curriculum-and-levels-migration.sql` | Data Surat, seed tahun ajaran, dan sembilan jenjang Tahfizh |
| 6 | `supabase-level-exam-surah-migration.sql` | Surat yang diuji pada hasil kenaikan level |
| 7 | `supabase-munaqosyah-form-migration.sql` | Penyimpanan Munaqosyah lengkap sesuai rekap Excel |
| 8 | `supabase-account-approval-and-parent-claim-security.sql` | Persetujuan akun, keamanan klaim NIS, dan event audit |

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

## Hasil implementasi per role

### Admin

- Dashboard Monitoring menampilkan ringkasan Guru, Orang Tua, siswa, kelas, laporan, dan aktivitas terbaru.
- Monitoring Guru memuat kelas yang dipegang, jumlah siswa, waktu input terakhir, dan kelengkapan laporan.
- Monitoring Orang Tua memuat anak terhubung, status hubungan, biodata, dan aktivitas akun.
- Manajemen Siswa/Kelas mendukung pemeriksaan NIS ganda, siswa tanpa Orang Tua, perpindahan kelas, serta kenaikan massal.
- Persetujuan Akun membedakan Guru yang menunggu persetujuan dan Orang Tua yang mengklaim siswa melalui NIS.
- Kelengkapan Laporan menyajikan perbandingan laporan harian, ujian level, Munaqosyah, dan status per Guru.
- Tahun Ajaran/Kurikulum mendukung pengaturan periode serta data surat Level 1–6 dan Mustawa Muttawasit 1–3.
- Audit Aktivitas merekam operasi akun dan perubahan penting yang diproses server.

### Guru

- Mengelola siswa, foto, profil siswa, kelas, level, dan impor daftar Excel sekolah.
- Mengisi presensi, kegiatan, tadarus, beberapa surat/hafalan, dan catatan pada tanggal yang sama.
- Memilih surat ujian sesuai kurikulum level dan tahun ajaran.
- Mengisi nilai Munaqosyah lengkap sesuai struktur Excel.
- Menambah, mengubah, atau menghapus Data Surat untuk tahun ajaran yang berwenang.
- Melihat preview resmi dan mengunduh/cetak tiga rapor otomatis.
- Menggunakan panduan langkah demi langkah yang lebih lengkap daripada panduan Orang Tua.

### Orang Tua

- Menghubungkan akun dengan anak melalui NIS yang divalidasi dan tetap dibatasi oleh RLS.
- Melihat progres, laporan harian historis, ujian kenaikan level, Munaqosyah, dan komposisi nilai.
- Melihat Data Surat sesuai level tanpa hak mengubah kurikulum.
- Mengubah biodata yang diperbolehkan melalui endpoint server.
- Menggunakan onboarding dan panduan khusus Orang Tua.

## Ketentuan rapor resmi

1. Form input tidak menjadi template cetak; form hanya memasok data.
2. Rapor Hafalan Harian menampilkan seluruh data pada tanggal pilihan, termasuk lebih dari satu surat/hafalan.
3. Rapor Hafalan Level mengambil hasil ujian kenaikan level dan surat yang diuji.
4. Rapor Munaqosyah mengambil komponen nilai sesuai rekap Excel tetapi tetap memakai tata letak resmi aplikasi.
5. Identitas siswa, NIS, kelas, level, periode, sumber nilai, catatan Guru, dan tanda tangan dipertahankan.
6. Kalender rapor mendukung pemilihan tanggal historis lintas hari, bulan, dan tahun.
7. Aksi cetak dari form dan menu 3 Rapor Otomatis harus menuju template resmi yang sama.

## Keamanan dan tata kelola data

| Kontrol | Implementasi |
| --- | --- |
| Pemisahan role | Admin, Guru, dan Orang Tua memiliki menu serta operasi berbeda |
| Persetujuan Guru | Akun Guru baru tidak langsung memperoleh akses operasional sebelum disetujui |
| Pengaitan Orang Tua | NIS menjadi referensi klaim, tetapi akses tetap divalidasi dan dibatasi ke satu hubungan yang sah |
| Operasi Admin | Ubah role, ubah sandi, nonaktifkan, dan hapus akun diproses melalui API server |
| Perlindungan Admin terakhir | Sistem menolak penghapusan Admin terakhir untuk mencegah kehilangan akses pengelolaan |
| RLS | Kebijakan Supabase membatasi data anak dan operasi pengguna sesuai role |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan pada sisi server dan environment Vercel |
| Audit | Event keamanan serta perubahan penting disimpan untuk penelusuran |
| Rahasia | File `.env.local`, service key, dan password tidak dimasukkan ke repository |

## Validasi teknis dan penerimaan

| Pemeriksaan | Hasil | Catatan |
| --- | --- | --- |
| TypeScript `tsc --noEmit` | Lulus | Tidak ada error tipe setelah struktur dipindahkan ke `src` |
| Next.js production build | Lulus | Next.js 16.2.7 dengan Webpack berhasil menghasilkan build production |
| Route generation | Lulus | 40 route terdeteksi, termasuk 6 endpoint backend dan dashboard seluruh role |
| Pemeriksaan production | Lulus | Landing, login, dan monitoring Admin merespons HTTP 200 setelah deployment |
| Sinkronisasi repository | Lulus | `origin/main` dan `upstream/main` telah menunjuk commit yang sama pada finalisasi struktur |
| Kelengkapan PDF MOM | Lulus | Halaman awal, commit pertama/terakhir, finalisasi, dan penutupan dapat diekstrak dari PDF |
| ESLint keseluruhan | Tercatat sebagai utang teknis | Baseline terakhir: 48 error dan 57 warning pada form legacy; tidak menghambat TypeScript/build |

## Riwayat rilis akhir

| Tanggal | Commit/rilis | Keterangan |
| --- | --- | --- |
| 2 Agustus 2026 | `e5c7935` | Delapan modul monitoring dan pengelolaan Admin selesai |
| 2 Agustus 2026 | `76b3124` | Struktur `src`, folder database/docs, README, panduan, dan MOM dirapikan |
| 2 Agustus 2026 | `b72e611` | PDF MOM lengkap awal dan generator PDF ditambahkan |
| 2 Agustus 2026 | Finalisasi dokumen v2.0 | Kop surat, logo web, isi MOM diperluas, verifikasi PDF, dan serah terima dokumen |

## Batasan dan risiko tersisa

| Risiko/batasan | Dampak | Mitigasi |
| --- | --- | --- |
| Migrasi production belum dijalankan seluruhnya | Fitur database dapat menampilkan pesan belum aktif | Ikuti urutan `docs/SUPABASE_SETUP.md`, backup, dan jalankan satu per satu |
| Schema cache Supabase terlambat diperbarui | Kolom baru sementara tidak dikenali REST API | Reload schema atau tunggu propagasi sebelum mengulang operasi |
| ESLint legacy belum bersih | Menambah beban pemeliharaan dan risiko regresi | Jadwalkan refactor tipe `any`, dependency hook, dan HTML entity per modul |
| Data Excel tidak konsisten | Header atau nilai siswa dapat gagal dipetakan | Gunakan template sekolah yang sama dan validasi hasil preview impor |
| Perbedaan environment lokal/production | Login atau data terlihat berbeda | Pastikan seluruh environment menunjuk project Supabase yang sama |
| Perubahan kurikulum tahunan | Daftar surat dapat berbeda | Gunakan tahun ajaran dan salin kurikulum tanpa mengubah histori lama |
| Akun berbasis username dikelola internal | Pemulihan mandiri melalui email tidak selalu tersedia | Admin menjadi jalur resmi reset password akun internal |

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
- [x] TypeScript dan production build berhasil; baseline ESLint legacy telah dicatat sebagai tindak lanjut.
- [x] MOM tersedia dalam Markdown serta PDF resmi dengan kop surat dan logo aplikasi.

## Tindak lanjut operasional

1. Backup Supabase secara berkala.
2. Jalankan migrasi baru terlebih dahulu pada environment pengujian.
3. Audit akun, NIS ganda, siswa tanpa Orang Tua, dan kelengkapan laporan melalui panel Admin.
4. Pastikan commit production Vercel sama dengan `main` setelah setiap rilis.
5. Perbarui dokumen ini saat ruang lingkup proyek berubah.
6. Bersihkan temuan ESLint secara bertahap tanpa mengubah perilaku form yang sudah diterima.
7. Uji pemulihan bencana melalui restore backup Supabase pada environment terpisah.
8. Review hak akses dan akun tidak aktif minimal setiap akhir semester.

## Lampiran — Riwayat commit lengkap

Riwayat berikut disusun kronologis dari commit pertama sampai finalisasi dokumen resmi. Baris “Finalisasi dokumen v2.0” mewakili commit penerbitan PDF ini yang hash akhirnya terbentuk setelah dokumen disimpan.

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
| 52 | 2026-08-02 | `76b3124` | Perapihan struktur frontend/backend, migrasi, README, panduan, dan MOM |
| 53 | 2026-08-02 | `b72e611` | PDF MOM lengkap awal dan generator PDF |
| 54 | 2026-08-02 | Finalisasi dokumen v2.0 | Kop surat, logo web, perluasan notulen, pemeriksaan PDF, dan penerbitan akhir |

## Kesimpulan rapat dan keputusan penutupan

1. Ruang lingkup utama aplikasi dinyatakan telah diimplementasikan sesuai pembahasan yang terdokumentasi.
2. Tiga template rapor resmi tetap menjadi format cetak utama dan tidak diganti oleh tampilan form input.
3. Data production harus diaktifkan melalui urutan migrasi resmi dan tidak boleh dimodifikasi dengan skrip reset yang menghapus tabel.
4. Utang teknis ESLint diterima sebagai pekerjaan pemeliharaan terpisah karena TypeScript dan production build telah lulus.
5. Perubahan fitur setelah dokumen v2.0 dicatat sebagai fase pemeliharaan atau pengembangan baru.
6. README, panduan Supabase, MOM Markdown, dan MOM PDF menjadi dokumen serah terima teknis proyek.

## Lembar pemeriksaan dan pengesahan

| Disusun oleh | Diperiksa oleh | Disetujui oleh |
| --- | --- | --- |
| Tim Pengembang Sistem | Koordinator Tahfizh | Kepala Sekolah |
| Catatan Mengaji Digital | ULFA DWI HASTUTI, S.LI | WIDI NURMARA, S.Pd.I |
| Tanda tangan: ____________________ | Tanda tangan: ____________________ | Tanda tangan: ____________________ |
| Tanggal: 2 Agustus 2026 | Tanggal: ____________________ | Tanggal: ____________________ |

## Penutupan

MOM ini menjadi catatan resmi perjalanan pengembangan Catatan Mengaji Digital dari commit pertama sampai finalisasi proyek. Dokumen dapat diperbarui apabila terdapat persetujuan perubahan ruang lingkup, migrasi baru, atau rilis lanjutan.

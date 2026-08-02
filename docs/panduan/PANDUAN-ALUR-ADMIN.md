# PANDUAN OPERASIONAL ADMIN LENGKAP

## Catatan Mengaji Digital

**SD Islam Labschool Bani Saleh — Program Tahsin & Tahfizh**

| Informasi Dokumen | Keterangan |
|---|---|
| Nomor dokumen | PND/CMD/ADM/VIII/2026/002 |
| Sasaran | Administrator sistem dan petugas pengelola data sekolah |
| Ruang lingkup | Akun, Guru, Orang Tua, siswa, kelas, laporan, dan audit aktivitas |
| Versi panduan | 2.0 — pembaruan fitur production |
| Tanggal berlaku | 2 Agustus 2026 |
| Klasifikasi | Dokumen operasional internal sekolah |

Panduan ini menjadi acuan kerja Administrator Catatan Mengaji Digital. Administrator bertanggung jawab menjaga keamanan akses, konsistensi data, keterhubungan akun, dan kelengkapan pelaporan. Administrator tidak menggantikan Guru dalam menetapkan nilai akademik atau hasil kelulusan siswa.

## 1. Tujuan dan Hasil Akhir

Setelah mengikuti panduan ini, Administrator diharapkan mampu:

- masuk dan keluar dari sistem dengan aman;
- membaca kondisi sistem melalui Dashboard Monitoring;
- menyetujui, menolak, membuat, mengubah, menonaktifkan, dan menghapus akun sesuai kewenangan;
- memantau aktivitas Guru dan kelengkapan laporannya;
- memantau Orang Tua berdasarkan kelas 1A–6B dan menghubungkan akun dengan anak menggunakan NIS;
- membaca data siswa, kelas, nilai per surat, Presensi–Tadarus, dan wali kelas mengaji;
- mengubah wali kelas mengaji serta status siswa tanpa mengubah level secara sembarang;
- menelusuri aktivitas melalui audit yang mudah dibaca;
- menangani masalah umum tanpa merusak data production.

## 2. Ringkasan Alur Kerja Admin

**Masuk → Dashboard Monitoring → Persetujuan Akun → Monitoring Guru → Monitoring Orang Tua → Siswa & Kelas → Kelengkapan Laporan → Audit Aktivitas → Keluar**

| Tahap | Hasil yang Diharapkan |
|---|---|
| Autentikasi | Admin masuk menggunakan akun yang sah |
| Pemeriksaan awal | Jumlah akun, siswa, kelas, laporan, dan peringatan terbaca |
| Pengendalian akses | Akun memiliki role dan status persetujuan yang tepat |
| Pengawasan Guru | Aktivitas dan kelengkapan laporan Guru dapat ditindaklanjuti |
| Pengawasan Orang Tua | Hubungan Orang Tua–anak dan kelas anak terbaca |
| Pengelolaan kelas | Anggota kelas, wali kelas mengaji, nilai, dan status siswa tertata |
| Pengendalian mutu | Kekurangan laporan dan data bermasalah ditemukan |
| Audit | Pelaku, target, rincian, waktu, dan status perubahan dapat ditelusuri |

## 3. Masuk, Lupa Password, dan Keluar

### 3.1 Masuk ke Sistem

1. Buka portal Catatan Mengaji Digital.
2. Pilih **Masuk ke akun**.
3. Masukkan email atau username Admin.
4. Masukkan password lalu pilih **Masuk ke Dashboard**.
5. Pastikan identitas kanan atas menampilkan role **ADMIN**.
6. Jika halaman tidak berpindah, baca pesan kesalahan sebelum mengulangi login.

### 3.2 Lupa atau Mengganti Password

1. Pada portal Login, pilih **Lupa password** untuk akun berbasis email.
2. Masukkan email yang terdaftar.
3. Buka tautan pemulihan dari inbox atau folder spam.
4. Isi password baru dan ulangi password yang sama.
5. Setelah berhasil, kembali ke Login dan gunakan password baru.
6. Untuk akun internal berbasis username tanpa email, perubahan password dilakukan oleh Admin lain melalui **Persetujuan Akun**.

Password baru berlaku langsung pada login berikutnya. Mode Incognito tidak menjadi syarat untuk mengetes password baru.

### 3.3 Keluar dengan Aman

1. Selesaikan pekerjaan dan pastikan penyimpanan berhasil.
2. Pilih **Keluar** pada sidebar.
3. Jangan hanya menutup tab, terutama pada komputer bersama.
4. Jangan menyimpan password Admin pada browser publik.

## 4. Peta Menu Admin Production

| Menu | Fungsi Utama | Tindakan yang Tersedia |
|---|---|---|
| Dashboard Monitoring | Ringkasan kondisi sistem | Membaca indikator, peringatan, dan aktivitas terbaru |
| Monitoring Guru | Pengawasan tenaga pengajar | Mencari Guru, membuka detail, mengaktifkan, atau menonaktifkan |
| Monitoring Orang Tua | Pengawasan akun wali per kelas | Memilih kelas 1A–6B, melihat relasi, menghubungkan, memindahkan, atau memutuskan anak |
| Siswa & Kelas | Pusat data kelas seluruh Guru | Memilih kelas, melihat nilai/laporan, mengatur wali kelas mengaji, dan status siswa |
| Persetujuan Akun | Pengendalian akun dan role | Menyetujui Guru, membuat akun, mengganti role/password, menonaktifkan, atau menghapus |
| Kelengkapan Laporan | Rekap pelaporan Guru | Membandingkan laporan harian, ujian level, dan Munaqosyah |
| Audit Aktivitas | Jejak perubahan sistem | Memfilter waktu/status, membaca pelaku, target, rincian, dan hasil aktivitas |

Pengaturan surat dan level operasional dilakukan oleh Guru melalui **Data Surat**. Kenaikan level dilakukan melalui **Ujian Kenaikan Level** pada role Guru. Admin menggunakan menu Siswa & Kelas untuk memantau, bukan menetapkan kenaikan level secara manual.

## 5. Dashboard Monitoring

### 5.1 Pemeriksaan Harian

1. Baca jumlah Guru, Orang Tua, siswa, dan kelas aktif.
2. Periksa jumlah laporan hari ini dan tujuh hari terakhir.
3. Tinjau jumlah ujian level dan Munaqosyah.
4. Buka bagian **Perlu Perhatian** untuk akun menunggu atau data bermasalah.
5. Baca aktivitas terbaru untuk memastikan perubahan dilakukan pengguna yang sah.
6. Gunakan tombol **Perbarui** jika data baru saja diubah pada halaman lain.

### 5.2 Prioritas Penanganan

| Kondisi | Prioritas | Tindakan |
|---|---|---|
| Akun Guru menunggu | Tinggi | Verifikasi identitas lalu setujui atau tolak |
| Siswa tanpa Orang Tua | Sedang | Cocokkan akun wali dan hubungkan menggunakan NIS |
| Guru tanpa laporan | Sedang | Konfirmasi jadwal mengajar dan status input |
| NIS ganda | Tinggi | Verifikasi dokumen siswa sebelum memperbaiki |
| Aktivitas tidak dikenal | Tinggi | Periksa Audit dan nonaktifkan akun jika diperlukan |

Dashboard hanya untuk pemantauan. Lakukan perubahan pada menu yang sesuai agar validasi dan audit tetap berjalan.

## 6. Persetujuan dan Manajemen Akun

### 6.1 Menyetujui Akun Guru

1. Buka **Persetujuan Akun**.
2. Pilih daftar akun menunggu persetujuan.
3. Periksa nama lengkap, username/email, dan role yang diminta.
4. Cocokkan dengan daftar Guru resmi sekolah.
5. Pilih **Setujui** jika identitas valid atau **Tolak** jika tidak sesuai.
6. Pastikan status berubah menjadi disetujui sebelum Guru mencoba login.

### 6.2 Pendaftaran Orang Tua

Orang Tua tidak sepenuhnya terbuka. Pendaftaran memerlukan NIS anak yang telah terdaftar. Sistem memvalidasi NIS, status hubungan, dan batas percobaan. Admin tetap harus memeriksa kecocokan nama wali jika terdapat permintaan perbaikan hubungan.

### 6.3 Membuat Akun melalui Admin

1. Pilih **Tambah Akun**.
2. Isi username yang unik.
3. Isi nama lengkap.
4. Email bersifat opsional untuk akun internal.
5. Pilih role: Admin, Guru, atau Orang Tua.
6. Isi password dan konfirmasi password.
7. Simpan lalu sampaikan kredensial secara pribadi.
8. Minta pengguna mengganti password awal setelah menerima akun.

### 6.4 Mengubah Role

1. Cari akun berdasarkan nama, username, atau email.
2. Pilih kontrol role pada baris akun.
3. Pastikan perubahan didukung keputusan administrasi.
4. Simpan dan periksa hasilnya pada daftar pengguna.
5. Buka Audit Aktivitas untuk memastikan perubahan tercatat.

### 6.5 Mengubah Password Pengguna

1. Pilih **Ubah Sandi** pada akun yang benar.
2. Pilih alasan perubahan, misalnya pengguna lupa password atau reset keamanan.
3. Masukkan password baru dan konfirmasi yang sama.
4. Simpan hingga muncul notifikasi berhasil.
5. Pengguna dapat langsung login ulang memakai password baru.
6. Pastikan audit menampilkan pelaku, target akun, alasan, dan status berhasil.

### 6.6 Menonaktifkan atau Menghapus Akun

- Gunakan **Nonaktifkan** untuk memblokir akses sementara tanpa menghapus jejak data.
- Gunakan **Hapus** hanya jika akun memang tidak diperlukan dan dampak relasinya sudah diperiksa.
- Admin tidak dapat menghapus dirinya sendiri saat sedang digunakan.
- Admin terakhir tidak dapat dihapus atau diturunkan rolenya.
- Siapkan minimal dua Admin aktif untuk mencegah kehilangan akses operasional.

## 7. Monitoring Guru

1. Buka **Monitoring Guru**.
2. Cari berdasarkan nama, kelas, username, atau email.
3. Periksa kelas dan jumlah siswa yang ditangani.
4. Bandingkan laporan hari ini dengan jumlah siswa.
5. Periksa persentase tujuh hari dan waktu aktivitas terakhir.
6. Buka detail untuk melihat jumlah ujian level, Munaqosyah, dan kelengkapan profil.
7. Pilih **Nonaktifkan** hanya jika ada keputusan administrasi atau risiko keamanan.

| Indikator | Interpretasi |
|---|---|
| Laporan 0/n | Guru belum mengisi laporan untuk siswa yang ditangani |
| Persentase tujuh hari rendah | Perlu konfirmasi jadwal atau kelengkapan input |
| Belum ada aktivitas | Belum ada laporan akademik yang tersimpan |
| Kelas kosong | Guru belum ditetapkan sebagai wali kelas mengaji atau belum memiliki siswa |
| Status nonaktif | Akses operasional Guru diblokir |

## 8. Monitoring Orang Tua per Kelas

### 8.1 Membaca Tabel Kelas

Monitoring Orang Tua menampilkan kelas **1A sampai 6B**. Setiap baris berisi:

- jumlah siswa pada kelas;
- jumlah akun Orang Tua yang sudah terhubung;
- jumlah siswa yang belum memiliki relasi Orang Tua;
- tombol **Lihat Kelas** untuk memfilter daftar wali;
- baris khusus akun Orang Tua yang belum terhubung ke anak.

### 8.2 Melihat Orang Tua pada Kelas Tertentu

1. Pilih **Lihat Kelas 1A**, atau kelas lain yang diperlukan.
2. Tabel bawah hanya menampilkan akun Orang Tua dan anak pada kelas tersebut.
3. Gunakan pencarian untuk nama Orang Tua, nama anak, NIS, atau kelas.
4. Pilih tombol kelas anak untuk membuka halaman **Siswa & Kelas** pada kelas yang sama.
5. Pilih **Semua Orang Tua** untuk menghapus filter kelas.

### 8.3 Menghubungkan Akun yang Belum Terhubung

1. Pilih **Hubungkan Akun** pada baris akun belum terhubung.
2. Pilih **Kelola Anak** pada akun yang benar.
3. Masukkan NIS siswa sesuai data sekolah.
4. Pilih **Hubungkan / Pindahkan**.
5. Periksa bahwa nama anak dan kelas muncul pada akun tersebut.
6. Pastikan jumlah Orang Tua terhubung pada tabel kelas bertambah.

### 8.4 Memindahkan atau Memutuskan Hubungan

1. Buka **Kelola Anak**.
2. Untuk memindahkan hubungan, masukkan NIS anak yang benar lalu pilih **Hubungkan / Pindahkan**.
3. Untuk menghapus hubungan, pilih **Putuskan**.
4. Lakukan hanya setelah identitas wali dan dokumen siswa dikonfirmasi.
5. Periksa Audit Aktivitas setelah perubahan.

Admin tidak boleh menghubungkan akun berdasarkan kemiripan nama. NIS adalah identitas utama relasi siswa.

## 9. Siswa & Kelas Versi Admin

### 9.1 Tabel Master Kelas 1A–6B

1. Buka **Siswa & Kelas**.
2. Pilih tahun ajaran yang sesuai.
3. Gunakan filter Guru atau level jika diperlukan.
4. Klik kelas 1A–6B untuk membuka rekap kelas.
5. Periksa jumlah siswa pada Level 1–6 dan Mustawa Muttawasit 1–3.

Sistem menyamakan format kelas lama seperti `1`, `1 A`, `1-A`, dan `Kelas 1A` menjadi kelas **1A** agar data impor lama tetap terbaca konsisten pada Guru dan Admin.

### 9.2 Menetapkan Wali Kelas Mengaji

1. Pilih kelas.
2. Pilih Guru aktif pada bagian **Wali Kelas Mengaji**.
3. Pilih **Simpan Wali Kelas**.
4. Pastikan nama Guru muncul pada master kelas dan daftar anggota kelas.

Wali kelas mengaji dapat berbeda dari wali kelas akademik sekolah. Penetapan ini digunakan untuk tanggung jawab kegiatan Tahsin & Tahfizh.

### 9.3 Melihat Nilai dan Laporan Harian

- Gunakan tab **Nilai per Surat** untuk melihat Kelancaran, Makhorijul Huruf, Hukum Tajwid, Sambung Ayat, jumlah, rata-rata, dan keterangan.
- Gunakan tab **Presensi & Tadarus** untuk melihat tanggal, kehadiran, kegiatan, bacaan Tadarus, hafalan, dan catatan Guru.
- Gunakan filter level agar tabel tidak terlalu lebar.
- Data berasal dari input Guru; Admin memantau dan tidak mengubah nilai akademik dari halaman ini.

### 9.4 Mengelola Status Siswa

Status yang tersedia adalah:

| Status | Penggunaan |
|---|---|
| Aktif | Siswa masih mengikuti program |
| Nonaktif | Siswa sementara/tetap tidak mengikuti program, tetapi riwayat dipertahankan |
| Pindah | Siswa pindah dan riwayat tetap disimpan |

1. Pilih kelas.
2. Cari siswa berdasarkan nama atau NIS.
3. Pilih status yang tepat.
4. Pilih **Simpan Status**.
5. Konfirmasi perubahan jika status bukan Aktif.

Level siswa tidak dinaikkan dari halaman Admin. Kenaikan level hanya melalui hasil **Ujian Kenaikan Level** oleh Guru.

## 10. Kelengkapan Laporan

1. Buka **Kelengkapan Laporan**.
2. Periksa laporan hari ini setiap Guru.
3. Bandingkan laporan masuk dengan jumlah siswa yang menjadi tanggung jawab Guru.
4. Tinjau persentase tujuh hari.
5. Periksa jumlah ujian level dan Munaqosyah.
6. Gunakan status **Lengkap**, **Hampir Lengkap**, atau **Perlu Dicek** untuk menentukan tindak lanjut.
7. Jangan mengubah nilai hanya untuk menaikkan persentase kelengkapan.

## 11. Audit Aktivitas

Audit menampilkan informasi dalam bahasa operasional, bukan JSON mentah:

| Kolom | Isi |
|---|---|
| Waktu | Tanggal dan jam aktivitas |
| Aktivitas | Jenis tindakan, misalnya password diubah atau laporan disimpan |
| Pelaku | Username pengguna yang melakukan tindakan |
| Target | Akun, siswa, kelas, surat, atau laporan yang dikenai tindakan |
| Rincian | Alasan dan ringkasan perubahan |
| Status | Berhasil, gagal, atau diblokir |

Aktivitas yang dipantau mencakup:

- pembuatan, perubahan role, perubahan password, penonaktifan, dan penghapusan akun;
- persetujuan atau penolakan Guru;
- hubungan Orang Tua–anak;
- perubahan wali kelas dan status siswa;
- laporan harian, nilai per surat, ujian level, dan Munaqosyah.

### 11.1 Cara Menelusuri Insiden

1. Pilih tanggal kejadian.
2. Gunakan pencarian berdasarkan username, siswa, atau aktivitas.
3. Pilih filter status.
4. Cocokkan pelaku, target, rincian, dan waktu.
5. Simpan bukti jika terdapat tindakan tidak sah.
6. Nonaktifkan akun dan ganti kredensial jika insiden terkonfirmasi.

## 12. Rutinitas Operasional Admin

| Frekuensi | Checklist |
|---|---|
| Setiap hari | Periksa akun menunggu, laporan hari ini, peringatan, dan aktivitas terbaru |
| Setiap minggu | Tinjau kelengkapan Guru, hubungan Orang Tua, kelas tanpa wali mengaji, dan siswa bermasalah |
| Setiap bulan | Audit role/password, akun tidak aktif, jumlah siswa per kelas, dan keberhasilan backup |
| Awal tahun ajaran | Verifikasi kelas 1A–6B, wali kelas mengaji, daftar siswa, NIS, dan level awal |
| Akhir semester | Pastikan rapor lengkap, status siswa benar, dan arsip audit tersedia |

## 13. Penanganan Kendala

| Kendala | Pemeriksaan dan Tindakan |
|---|---|
| Siswa Guru ada tetapi Admin kosong | Tekan Perbarui, pastikan deployment terbaru, dan periksa normalisasi kelas; data kelas `1` harus terbaca sebagai `1A` |
| Orang Tua tidak memiliki kelas | Akun belum terhubung; buka daftar Belum Terhubung dan hubungkan menggunakan NIS |
| Guru tidak bisa login setelah daftar | Pastikan status persetujuan disetujui, role Guru, dan akun aktif |
| Orang Tua gagal menggunakan NIS | Cocokkan NIS, pastikan siswa belum diklaim akun lain, dan periksa batas percobaan |
| Password baru tidak bekerja | Pastikan penyimpanan berhasil dan login menggunakan username/email yang benar |
| Admin gagal dihapus | Pastikan bukan Admin terakhir atau akun sendiri yang sedang digunakan |
| Nilai/laporan kosong | Periksa kelas, level, Guru pengampu, tanggal, dan migrasi database production |
| Data Surat kosong | Pastikan migrasi kurikulum aktif dan Guru telah mengisi Data Surat pada tahun ajaran |
| Deployment tidak berubah | Pastikan commit branch `main` telah menjadi deployment Production berstatus Ready |

## 14. Keamanan dan Privasi

- Ganti `ADMIN_PASSWORD` bawaan sebelum sistem digunakan secara resmi.
- Gunakan password minimal 12 karakter untuk Admin.
- Jangan membagikan `SUPABASE_SERVICE_ROLE_KEY`, token sesi, atau password database.
- Service role key hanya boleh berada pada environment server.
- Jangan menyalin data siswa ke perangkat pribadi tanpa persetujuan.
- Gunakan akun masing-masing; jangan memakai satu akun bersama.
- Nonaktifkan akun pengguna yang sudah tidak bertugas.
- Periksa Audit setelah perubahan sensitif.
- Backup database dan dokumen harus terenkripsi serta disimpan terpisah dari server utama.

## 15. Checklist Validasi Setelah Perubahan Besar

- [ ] Login Admin berhasil.
- [ ] Dashboard menampilkan jumlah siswa dan kelas yang benar.
- [ ] Kelas 1A–6B terbaca pada Siswa & Kelas.
- [ ] Nilai dan Presensi–Tadarus dapat dibuka.
- [ ] Wali kelas mengaji dapat disimpan.
- [ ] Tabel Monitoring Orang Tua menampilkan seluruh kelas.
- [ ] Hubungan Orang Tua berdasarkan NIS berhasil.
- [ ] Persetujuan dan perubahan role akun berhasil.
- [ ] Password baru langsung dapat digunakan.
- [ ] Audit menampilkan pelaku, target, rincian, waktu, dan status.
- [ ] Logout mengakhiri akses Admin.

## 16. Checklist Serah Terima Admin

- [ ] Administrator memahami seluruh menu production.
- [ ] Tersedia minimal dua akun Admin aktif.
- [ ] Kredensial bawaan telah diganti.
- [ ] Daftar Guru dan Orang Tua telah diverifikasi.
- [ ] Data siswa 1A–6B dan NIS telah divalidasi.
- [ ] Wali kelas mengaji telah ditetapkan.
- [ ] Kebijakan backup dan pemulihan telah diuji.
- [ ] Penanggung jawab teknis VPS/Supabase telah ditentukan.

## 17. Pengesahan

| Disusun/Dikelola oleh | Diperiksa oleh | Disahkan oleh |
|---|---|---|
| Administrator Sistem | Koordinator Tahfizh | Kepala Sekolah |
|  | **ULFA DWI HASTUTI, S.LI** | **WIDI NURMARA, S.Pd.I** |
| Tanggal: ____________ | Tanggal: ____________ | Tanggal: ____________ |

Dokumen ini menjadi pedoman operasional Admin versi 2.0. Setiap perubahan fitur production, struktur role, database, atau proses deployment harus diikuti pembaruan dokumen dan penerbitan ulang PDF.

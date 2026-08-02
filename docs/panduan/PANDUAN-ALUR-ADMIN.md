# PANDUAN ALUR PENGGUNA ADMIN

## Catatan Mengaji Digital

**SD Islam Labschool Bani Saleh — Program Tahsin & Tahfizh**

| Informasi Dokumen | Keterangan |
|---|---|
| Sasaran | Administrator sistem |
| Ruang lingkup | Pengawasan akun, Guru, Orang Tua, siswa, kelas, laporan, kurikulum, dan audit |
| Versi panduan | 1.0 |
| Tanggal berlaku | 2 Agustus 2026 |
| Klasifikasi | Dokumen operasional internal sekolah |

Panduan ini menjelaskan urutan kerja Administrator dari masuk ke sistem sampai keluar. Administrator memiliki akses paling luas dan wajib menjaga ketepatan data, keamanan akun, serta jejak audit. Administrator tidak menggantikan Guru dalam memberi nilai akademik.

## 1. Ringkasan Alur Admin

**Masuk → Periksa Dashboard Monitoring → Proses Persetujuan Akun → Pantau Guru dan Orang Tua → Kelola Siswa/Kelas → Periksa Kelengkapan Laporan → Atur Tahun/Kurikulum → Tinjau Audit → Keluar**

| Tahap | Hasil yang Diharapkan |
|---|---|
| Autentikasi | Admin masuk menggunakan akun yang sah |
| Pemeriksaan awal | Ringkasan pengguna, kelas, laporan, dan masalah terbaca |
| Pengendalian akses | Akun Guru disetujui/ditolak dan role pengguna tepat |
| Pengawasan operasional | Aktivitas Guru dan hubungan Orang Tua–anak dapat dipantau |
| Pengelolaan akademik | Siswa, kelas, tahun ajaran, level, dan kurikulum tertata |
| Pengendalian mutu | Kekurangan laporan ditindaklanjuti |
| Audit | Perubahan penting dapat ditelusuri |

## 2. Masuk dan Pemeriksaan Awal

1. Buka portal **Catatan Mengaji Digital** lalu pilih **Masuk**.
2. Isi username dan password Admin.
3. Pastikan identitas kanan atas menampilkan role **ADMIN**.
4. Buka **Dashboard Monitoring**.
5. Periksa jumlah Guru, Orang Tua, siswa, kelas aktif, akun menunggu, laporan terbaru, dan peringatan data.
6. Jika ada angka tidak wajar, jangan langsung mengubah data; telusuri dahulu pada modul terkait dan **Audit Aktivitas**.

Admin harus keluar melalui tombol **Keluar**, terutama ketika memakai komputer bersama. Jangan hanya menutup tab.

## 3. Peta Menu Admin

| Menu | Fungsi Utama | Tindakan Admin |
|---|---|---|
| Dashboard Monitoring | Ringkasan seluruh sistem | Membaca indikator dan menentukan prioritas tindak lanjut |
| Monitoring Guru | Aktivitas, kelas, siswa, dan kelengkapan Guru | Mencari Guru, melihat detail, mengaktifkan/nonaktifkan |
| Monitoring Orang Tua | Relasi akun Orang Tua dengan siswa | Menghubungkan, memindahkan, atau memutuskan hubungan anak |
| Siswa & Kelas | Data seluruh siswa dan kelas | Memindahkan Guru/kelas/level dan mengarsipkan siswa |
| Persetujuan Akun | Pendaftaran dan manajemen akun | Menyetujui Guru, membuat akun internal, mengganti role/password, menghapus akun |
| Kelengkapan Laporan | Rekap laporan per Guru | Menilai laporan hari ini, tujuh hari, ujian level, dan munaqosyah |
| Tahun & Kurikulum | Tahun ajaran dan susunan surat | Membuka/menutup tahun, menyalin kurikulum, mengatur level |
| Audit Aktivitas | Riwayat perubahan penting | Memfilter pengguna, jenis aktivitas, dan tanggal |

## 4. Dashboard Monitoring

1. Baca kartu ringkasan akun, siswa, kelas, laporan, dan masalah.
2. Prioritaskan **akun menunggu**, siswa tanpa kelas, NIS ganda, Orang Tua belum terhubung, dan Guru tanpa laporan.
3. Gunakan aktivitas terbaru untuk memastikan perubahan besar memang dilakukan petugas berwenang.
4. Catat masalah yang memerlukan konfirmasi kepada Guru sebelum melakukan koreksi.

Dashboard adalah halaman pemantauan, bukan sumber tunggal untuk mengubah data. Perubahan dilakukan melalui modul yang sesuai agar tercatat dengan benar.

## 5. Persetujuan dan Manajemen Akun

### 5.1 Menyetujui Akun Guru

1. Buka **Persetujuan Akun**.
2. Periksa nama lengkap, username, dan permintaan role Guru.
3. Cocokkan identitas dengan data tenaga pengajar sekolah.
4. Pilih **Setujui** jika valid atau **Tolak** jika tidak sesuai.
5. Pastikan status berubah dari *pending* menjadi *approved* sebelum Guru mencoba masuk.

### 5.2 Akun Orang Tua

Akun Orang Tua mendaftar menggunakan NIS anak. Sistem memeriksa NIS yang terdaftar, membatasi percobaan, dan mencegah satu siswa diklaim sembarang akun. Jika relasi keliru, perbaiki melalui **Monitoring Orang Tua**, bukan dengan membagikan data NIS kepada pihak lain.

### 5.3 Membuat Akun dari Admin

1. Pilih **Tambah Akun**.
2. Isi username, nama lengkap, password, konfirmasi password, dan role.
3. Email bersifat opsional untuk akun internal yang dibuat Admin.
4. Gunakan username unik dan password sementara yang kuat.
5. Sampaikan kredensial secara pribadi dan minta pengguna mengganti password.

### 5.4 Mengubah Role, Password, dan Status

1. Cari akun yang tepat.
2. Pastikan identitas pemilik sebelum memilih **Ubah Sandi** atau mengganti role.
3. Masukkan password baru dan konfirmasi yang sama.
4. Role hanya diubah jika tugas resmi pengguna berubah.
5. Gunakan **Nonaktifkan** untuk akses sementara dan **Hapus** hanya jika data memang boleh dihapus.
6. Sistem melindungi Admin terakhir; siapkan minimal satu Admin aktif lain sebelum menghapus atau menurunkan role Admin.

Password baru berlaku pada proses login berikutnya. Sesi aktif pengguna dapat ditangani sesuai kebijakan keamanan sekolah tanpa meminta pengguna memakai mode Incognito.

## 6. Monitoring Guru

1. Buka **Monitoring Guru**.
2. Cari berdasarkan nama, kelas, username, atau email.
3. Periksa kelas dan jumlah siswa, laporan hari ini, persentase tujuh hari, terakhir aktif, dan status.
4. Buka detail aktivitas untuk menelusuri laporan yang pernah diisi.
5. Hubungi Guru jika laporan belum lengkap; nonaktifkan hanya jika ada keputusan administrasi atau risiko keamanan.

| Indikator | Interpretasi |
|---|---|
| Laporan hari ini 0/n | Belum ada laporan untuk siswa yang menjadi tanggung jawab Guru |
| Persentase 7 hari rendah | Perlu konfirmasi jadwal atau kelengkapan input |
| Belum ada aktivitas | Guru belum membuat data akademik pada sistem |
| Login lama tetapi ada laporan | Periksa apakah laporan diinput pengguna lain atau data lama |
| Status nonaktif | Guru tidak dapat menggunakan akses operasional normal |

## 7. Monitoring Orang Tua

1. Buka **Monitoring Orang Tua**.
2. Cari nama Orang Tua, nama anak, atau NIS.
3. Periksa anak terhubung, kelengkapan biodata, login terakhir, dan status.
4. Pilih **Kelola Anak** untuk menghubungkan atau memindahkan relasi berdasarkan NIS yang valid.
5. Putuskan hubungan hanya setelah identitas dan alasan terkonfirmasi.
6. Nonaktifkan akun jika ada indikasi akses tidak sah.

Admin tidak boleh menghubungkan akun berdasarkan kemiripan nama saja. NIS dan identitas wali harus sama dengan data sekolah.

## 8. Manajemen Siswa dan Kelas

1. Buka **Siswa & Kelas**.
2. Gunakan pencarian nama, NIS, kelas, atau Guru.
3. Periksa tab siswa aktif, data bermasalah, dan arsip.
4. Atur Guru, kelas, serta level siswa sesuai keputusan akademik.
5. Gunakan fitur pindah kelas/naik kelas massal hanya setelah daftar diverifikasi.
6. Arsipkan siswa lulus atau pindah; jangan menghapus riwayat akademik tanpa dasar.
7. Tindak lanjuti NIS ganda, siswa tanpa Orang Tua, kelas kosong, dan data level di luar 1–9.

Jenjang yang digunakan sistem adalah **Level 1–6** serta **Mustawa Muttawasit 1–3**. Kelas sekolah dapat disusun dari **1A sampai 6B** sesuai master kelas aktif.

## 9. Kelengkapan Laporan

1. Buka **Kelengkapan Laporan**.
2. Pilih periode atau tanggal pemeriksaan.
3. Bandingkan jumlah siswa dengan laporan yang masuk.
4. Tinjau laporan harian, ujian kenaikan level, dan munaqosyah.
5. Gunakan status lengkap/perlu dicek untuk membuat daftar tindak lanjut Guru.
6. Jangan mengubah nilai hanya untuk membuat persentase menjadi penuh.

## 10. Tahun Ajaran dan Kurikulum

1. Buka **Tahun & Kurikulum**.
2. Pastikan tahun ajaran yang benar sebelum melakukan perubahan.
3. Buka tahun ajaran baru sesuai keputusan sekolah.
4. Salin data surat dari tahun sebelumnya bila kurikulum tidak berubah.
5. Atur susunan surat Level 1–6 dan Mustawa Muttawasit 1–3.
6. Periksa ulang urutan surat sebelum digunakan Guru pada ujian level.
7. Tutup tahun ajaran hanya setelah laporan dan proses kenaikan kelas selesai.

Perubahan kurikulum tahun berjalan tidak boleh merusak riwayat tahun sebelumnya. Karena itu data surat dipisahkan per tahun ajaran.

## 11. Audit Aktivitas

Audit dipakai untuk menelusuri persetujuan akun, perubahan role/password, penghapusan atau penambahan akun, relasi siswa, perubahan kurikulum, dan data akademik.

1. Pilih rentang tanggal.
2. Filter berdasarkan pengguna atau jenis aktivitas.
3. Cocokkan pelaku, target, waktu, dan rincian perubahan.
4. Simpan bukti audit jika ada insiden.
5. Eskalasi perubahan tidak dikenal kepada pengelola sistem dan Kepala Sekolah.

## 12. Rutinitas Admin

| Frekuensi | Checklist |
|---|---|
| Setiap hari | Periksa akun menunggu, laporan hari ini, peringatan data, dan aktivitas terbaru |
| Setiap minggu | Tinjau kelengkapan per Guru, akun tidak aktif, relasi Orang Tua, serta data bermasalah |
| Setiap bulan | Audit perubahan role/password, validasi jumlah siswa dan kelas, serta tinjau akun lama |
| Awal tahun ajaran | Buat tahun, kelas, penugasan Guru, salin/atur data surat, dan validasi level |
| Akhir semester/tahun | Pastikan rapor lengkap, arsipkan siswa yang tepat, dan tutup periode setelah disahkan |

## 13. Penanganan Kendala

| Kendala | Tindakan |
|---|---|
| Guru tidak bisa masuk setelah daftar | Pastikan status persetujuan approved dan akun aktif |
| Orang Tua gagal memakai NIS | Cocokkan NIS siswa, pastikan belum terhubung, dan tunggu jika terkena batas percobaan |
| Password baru tidak bekerja | Pastikan konfirmasi sama, perubahan sukses, lalu login ulang dengan username yang benar |
| Admin tidak bisa dihapus | Pastikan bukan Admin terakhir dan bukan akun sendiri yang sedang digunakan |
| Data laporan kosong | Periksa tahun ajaran, hubungan Guru–kelas–siswa, dan migrasi database production |
| Fitur database belum aktif | Jalankan migrasi yang belum diterapkan pada project Supabase production yang dipakai Vercel |
| Data tidak sama dengan deployment | Pastikan Vercel memakai commit main terbaru dan environment Supabase yang benar |

## 14. Batas Wewenang dan Keamanan

- Jangan membagikan service role key, password, atau kredensial database.
- Jangan menyetujui Guru tanpa verifikasi identitas.
- Jangan mengubah nilai akademik tanpa instruksi resmi Guru/Koordinator Tahfizh.
- Jangan menghapus akun atau siswa sebelum dampak riwayat diperiksa.
- Gunakan Audit Aktivitas sebagai bukti, bukan untuk menyebarkan data pribadi.
- Keluar dari sistem setelah pekerjaan selesai.

## 15. Checklist Serah Terima Admin

- [ ] Dapat masuk dan keluar dengan aman.
- [ ] Dapat membaca Dashboard Monitoring.
- [ ] Dapat memproses akun Guru menunggu.
- [ ] Dapat membuat akun internal dan mengelola role/password.
- [ ] Dapat memantau Guru dan Orang Tua.
- [ ] Dapat memperbaiki relasi Orang Tua–anak secara terverifikasi.
- [ ] Dapat mengelola siswa, kelas, tahun ajaran, dan kurikulum.
- [ ] Dapat menilai kelengkapan laporan dan membaca audit.
- [ ] Memahami perlindungan Admin terakhir dan kerahasiaan data.

## 16. Pengesahan

| Disusun/Dikelola oleh | Diperiksa oleh | Disahkan oleh |
|---|---|---|
| Administrator Sistem | Koordinator Tahfizh | Kepala Sekolah |
|  | **ULFA DWI HASTUTI, S.LI** | **WIDI NURMARA, S.Pd.I** |
| Tanggal: ____________ | Tanggal: ____________ | Tanggal: ____________ |

Dokumen ini menjadi pedoman operasional role Admin. Perubahan fitur atau kebijakan harus diikuti pembaruan versi panduan.

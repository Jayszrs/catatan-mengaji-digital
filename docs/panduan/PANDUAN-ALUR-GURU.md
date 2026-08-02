# PANDUAN ALUR PENGGUNA GURU

## Catatan Mengaji Digital

**SD Islam Labschool Bani Saleh — Program Tahsin & Tahfizh**

| Informasi Dokumen | Keterangan |
|---|---|
| Sasaran | Guru Tahsin dan Tahfizh |
| Ruang lingkup | Data siswa, kelas, laporan harian, ujian level, munaqosyah, kurikulum, dan rapor |
| Versi panduan | 1.0 |
| Tanggal berlaku | 2 Agustus 2026 |
| Klasifikasi | Dokumen operasional tenaga pengajar |

Panduan ini menjelaskan alur Guru dalam mencatat kegiatan, menilai siswa, dan menerbitkan rapor resmi. Data yang disimpan Guru akan menjadi informasi yang dibaca Orang Tua dan dipantau Administrator.

## 1. Ringkasan Alur Guru

**Daftar/Masuk → Lengkapi Profil → Siapkan Siswa dan Kelas → Periksa Data Surat → Isi Presensi & Harian → Isi Ujian Level/Munaqosyah → Verifikasi 3 Rapor Otomatis → Cetak/Unduh → Keluar**

| Waktu | Pekerjaan Utama |
|---|---|
| Awal penggunaan | Pendaftaran, persetujuan Admin, profil, siswa, dan kelas |
| Setiap pertemuan | Presensi, kegiatan, tadarus, hafalan, surat, dan catatan |
| Saat ujian level | Nilai komponen, surat berdasarkan level, keputusan kenaikan |
| Saat munaqosyah | Nilai, kepribadian, predikat, dan catatan |
| Saat pelaporan | Memeriksa sumber data lalu mencetak template rapor resmi |

## 2. Pendaftaran, Persetujuan, dan Masuk

1. Pada portal pilih **Daftar Sekarang**.
2. Isi username, nama lengkap, pilih role **Guru**, password, dan konfirmasi password.
3. Setelah pendaftaran, akun berstatus menunggu persetujuan Administrator.
4. Hubungi Administrator sekolah jika akun belum disetujui setelah identitas diverifikasi.
5. Setelah disetujui, masuk menggunakan username dan password.
6. Ikuti panduan penggunaan yang tampil atau buka **Panduan Penggunaan** dari sidebar.

Jangan memakai akun Guru lain. Seluruh perubahan nilai dan laporan dapat dicatat pada audit sistem.

## 3. Peta Menu Guru

| Menu | Fungsi |
|---|---|
| Dashboard | Ringkasan siswa, laporan, progres, dan akses cepat |
| Daftar Siswa | Menambah, mengubah, mengimpor, dan memeriksa biodata siswa |
| Data Kelas | Master kelas 1A–6B, penempatan siswa, level, dan rekap nilai kelas |
| Presensi & Harian | Presensi, kegiatan, tadarus, hafalan, surat, dan catatan harian |
| Ujian Kenaikan Level | Penilaian kenaikan level dan surat berdasarkan kurikulum |
| Form Munaqosyah | Penilaian ujian munaqosyah sesuai komponen resmi |
| Data Surat | Daftar surat Level 1–6 dan Mustawa 1–3 per tahun ajaran |
| Komposisi Nilai | Acuan rentang nilai, huruf, predikat, dan target hafalan |
| 3 Rapor Otomatis | Rapor Hafalan Harian, Hafalan Level, dan Munaqosyah |
| Profil Guru | Memperbarui biodata tenaga pengajar |

## 4. Menyiapkan Data Siswa

### 4.1 Tambah Manual

1. Buka **Daftar Siswa** lalu pilih **Tambah Siswa**.
2. Isi NIS dan nama lengkap dengan benar.
3. Lengkapi kelas, jenis kelamin, level Tahfizh, dan biodata lain yang tersedia.
4. Pastikan level berada pada rentang 1–9.
5. Simpan dan periksa siswa muncul pada daftar.

### 4.2 Impor Excel

1. Gunakan file Excel daftar siswa sekolah.
2. Pastikan kolom utama berisi NIS dan nama lengkap; sistem mengenali variasi judul kolom yang didukung.
3. Pilih fitur **Impor Excel**, unggah file, lalu periksa pratinjau/pesan hasil.
4. Koreksi baris dengan NIS kosong, NIS ganda, nama kosong, atau data terlalu panjang.
5. Jangan mengunggah kembali file yang sama sebelum memeriksa apakah data sudah masuk.

Jika muncul pesan kolom database belum ada atau tipe data terlalu pendek, hentikan impor dan minta Administrator memastikan migrasi Supabase production terbaru sudah dijalankan.

## 5. Mengelola Data Kelas

1. Buka **Data Kelas**.
2. Tambahkan master kelas sesuai tahun ajaran: 1A, 1B, 2A, 2B sampai 6A dan 6B.
3. Tentukan wali/Guru dan level Tahfizh yang berlaku.
4. Masukkan atau pindahkan siswa ke kelas yang benar.
5. Gunakan impor Excel bila tersedia, kemudian validasi NIS, kelas, dan level.
6. Buka rekap kelas untuk melihat tabel nilai siswa per surat dan komponen nilai.

Perubahan kelas tidak boleh dilakukan hanya untuk memperbaiki tampilan laporan. Pastikan sesuai data akademik sekolah.

## 6. Memeriksa dan Mengelola Data Surat

1. Buka **Data Surat**.
2. Pilih tahun ajaran yang sedang digunakan.
3. Periksa susunan surat pada Level 1–6 dan Mustawa Muttawasit 1–3.
4. Tambah atau ubah surat jika kurikulum tahun tersebut memang berubah.
5. Pastikan urutan surat benar karena daftar ini digunakan pada dropdown ujian kenaikan level.

Data surat dipisah per tahun ajaran agar perubahan kurikulum baru tidak mengubah riwayat lama. Orang Tua hanya dapat melihat daftar tersebut.

## 7. Presensi dan Laporan Harian

1. Buka **Presensi & Harian**.
2. Pilih siswa dan tanggal yang benar.
3. Pilih status presensi.
4. Isi kegiatan harian dan ringkasan tadarus.
5. Isi hafalan serta pilih/tambahkan seluruh surat yang dikerjakan. Satu hari dapat berisi dua surat atau lebih.
6. Isi rentang ayat dan catatan Guru.
7. Simpan, lalu pastikan data muncul pada tabel riwayat.
8. Gunakan **Edit** jika ada kesalahan.

Riwayat tidak hanya menampilkan hari ini. Pada rapor, gunakan tombol kalender untuk memilih tanggal pada hari, bulan, atau tahun sebelumnya yang memang memiliki laporan.

### Pemeriksaan Sebelum Simpan

- Siswa dan tanggal sudah benar.
- Status presensi sesuai kondisi nyata.
- Semua surat pada hari itu sudah tercatat.
- Tadarus dan hafalan tidak tertukar.
- Catatan menggunakan bahasa yang profesional dan mudah dipahami wali.

## 8. Ujian Kenaikan Level

1. Buka **Ujian Kenaikan Level**.
2. Pilih siswa, tanggal ujian, level asal, dan level tujuan.
3. Pilih surat dari dropdown yang bersumber dari **Data Surat** pada level terkait.
4. Isi nilai kelancaran, makhorijul huruf, hukum tajwid, dan komponen lain yang ditampilkan.
5. Periksa nilai otomatis, predikat, keterangan, dan keputusan kenaikan.
6. Isi catatan Guru bila diperlukan.
7. Simpan ujian.
8. Gunakan preview/cetak rapor resmi untuk memeriksa hasil pada template sekolah.

Jangan mengubah level siswa secara manual sebelum hasil ujian dan kebijakan sekolah menyatakan naik level.

## 9. Form Munaqosyah

1. Buka **Form Munaqosyah**.
2. Pilih peserta didik dan tanggal ujian.
3. Isi Juz dan periode rapor.
4. Isi nilai **Kelancaran, Makhorijul Huruf, Hukum Tajwid, dan Sambung Ayat**.
5. Pilih nilai kepribadian: akhlak, kedisiplinan, dan kerapihan.
6. Isi catatan Guru.
7. Periksa angka, huruf Indonesia, angka Arab, huruf Arab, jumlah, rata-rata, dan predikat otomatis.
8. Simpan data lalu buka preview/cetak rapor resmi.

Preview input membantu pemeriksaan data, sedangkan dokumen yang diterbitkan harus menggunakan template rapor resmi pada **3 Rapor Otomatis**.

## 10. Komposisi Nilai

Menu ini menjadi acuan penilaian, bukan tempat mengubah nilai seorang siswa. Gunakan rentang berikut sesuai tampilan sistem:

| Predikat | Arti | Skala | Huruf |
|---|---|---|---|
| Mumtaz | Istimewa | 90–100 | A |
| Jayyid Jiddan | Sangat Bagus | 80–89,99 | A- |
| Jayyid | Bagus | 65–79,99 | B |
| Maqbul | Diterima/Lulus | 50–64,99 | C |
| Dhaif | Lemah | 35–49,99 | D |
| Dhaif Jiddan | Sangat Lemah | 0–34,99 | E |

## 11. Tiga Rapor Otomatis

1. Buka **3 Rapor Otomatis**.
2. Pilih siswa.
3. Pilih jenis rapor: **Hafalan Harian**, **Hafalan Level**, atau **Munaqosyah**.
4. Pastikan status menunjukkan data tersambung dan jumlah data sesuai.
5. Untuk rapor harian, klik tombol kalender dan pilih tanggal riwayat yang diperlukan.
6. Periksa identitas, periode, tabel nilai/laporan, catatan, dan tanda tangan.
7. Pilih **Download Excel** jika tersedia atau **Cetak / Simpan PDF**.
8. Pada dialog cetak gunakan orientasi dan ukuran kertas yang sesuai template; jangan mencetak halaman dashboard biasa.

| Rapor | Sumber Data |
|---|---|
| Rapor Hafalan Harian | Presensi & Laporan Harian, termasuk banyak surat pada satu tanggal |
| Rapor Hafalan Level | Ujian Kenaikan Level |
| Rapor Munaqosyah | Form Munaqosyah |

## 12. Rutinitas Guru

| Frekuensi | Checklist |
|---|---|
| Sebelum mengajar | Periksa siswa, kelas, tanggal, dan data surat |
| Setelah pertemuan | Simpan presensi, tadarus, seluruh hafalan/surat, dan catatan |
| Akhir hari | Pastikan semua siswa yang hadir sudah memiliki laporan |
| Saat ujian | Verifikasi komponen nilai sebelum menyimpan |
| Akhir minggu | Periksa kelengkapan riwayat dan koreksi data yang salah |
| Periode rapor | Cocokkan tiga rapor otomatis dengan sumber datanya sebelum dicetak |

## 13. Penanganan Kendala

| Kendala | Tindakan |
|---|---|
| Akun menunggu | Minta Administrator memverifikasi dan menyetujui akun |
| Siswa tidak muncul | Periksa Guru/kelas siswa dan tahun ajaran aktif |
| Impor Excel gagal | Periksa NIS, nama, panjang data, format kolom, lalu konfirmasi migrasi database |
| Dropdown surat kosong | Isi/periksa Data Surat pada tahun ajaran dan level yang dipilih |
| Laporan hanya menampilkan satu surat | Edit laporan dan pastikan semua pilihan surat tersimpan |
| Tombol kalender/preview tidak aktif | Pastikan siswa dan jenis rapor dipilih serta sumber data tersedia |
| Rapor kosong | Simpan dahulu form sumber yang sesuai lalu muat ulang rapor |
| Pesan fitur database belum aktif | Hubungi Administrator untuk menjalankan migrasi Supabase production |

## 14. Keamanan dan Mutu Data

- Gunakan akun pribadi dan jangan berbagi password.
- Periksa siswa dan tanggal sebelum menyimpan.
- Hindari data contoh pada production.
- Jangan menghapus riwayat untuk menutupi kesalahan; gunakan edit dan catatan yang benar.
- Lindungi NIS dan informasi siswa.
- Keluar setelah selesai menggunakan perangkat bersama.

## 15. Checklist Serah Terima Guru

- [ ] Dapat masuk setelah disetujui Admin dan melengkapi profil.
- [ ] Dapat menambah serta mengimpor siswa.
- [ ] Dapat mengelola kelas dan level.
- [ ] Dapat memeriksa dan memperbarui Data Surat sesuai kewenangan.
- [ ] Dapat mencatat banyak surat pada satu laporan harian.
- [ ] Dapat mengisi ujian kenaikan level dan munaqosyah.
- [ ] Dapat memilih tanggal lama melalui kalender rapor.
- [ ] Dapat memeriksa dan mencetak tiga template rapor resmi.
- [ ] Memahami komposisi nilai dan keamanan data siswa.

## 16. Pengesahan

| Pengguna/Penerima | Diperiksa oleh | Disahkan oleh |
|---|---|---|
| Guru Tahsin & Tahfizh | Koordinator Tahfizh | Kepala Sekolah |
| Nama: ____________________ | **ULFA DWI HASTUTI, S.LI** | **WIDI NURMARA, S.Pd.I** |
| Tanggal: ____________ | Tanggal: ____________ | Tanggal: ____________ |

Dokumen ini menjadi pedoman operasional role Guru. Setiap nilai yang disimpan harus dapat dipertanggungjawabkan sebagai data akademik sekolah.

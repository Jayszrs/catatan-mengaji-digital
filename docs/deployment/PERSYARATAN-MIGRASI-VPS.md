# PERSYARATAN DAN PANDUAN MIGRASI KE VPS

## Catatan Mengaji Digital

**SD Islam Labschool Bani Saleh — Program Tahsin & Tahfizh**

| Informasi Dokumen | Keterangan |
|---|---|
| Nomor dokumen | INF/CMD/VPS/VIII/2026/001 |
| Sasaran | Administrator sistem, pengelola VPS, dan penyedia layanan TI |
| Ruang lingkup | Infrastruktur, migrasi aplikasi, database, keamanan, backup, dan operasional |
| Versi panduan | 1.0 |
| Tanggal berlaku | 2 Agustus 2026 |
| Klasifikasi | Dokumen teknis internal sekolah |

Dokumen ini menjelaskan persyaratan agar Catatan Mengaji Digital dapat dipindahkan dari Vercel ke Virtual Private Server (VPS) dan tetap online. Aplikasi menggunakan Next.js, Node.js, Supabase Auth, PostgreSQL, Storage, Row Level Security, dan endpoint server yang memerlukan service role key.

## 1. Rekomendasi Arsitektur

### 1.1 Arsitektur yang Direkomendasikan

**VPS untuk aplikasi Next.js + Supabase tetap dikelola sebagai layanan managed.**

Komponen:

- VPS menjalankan Next.js production;
- Nginx atau Caddy menjadi reverse proxy dan pengelola HTTPS;
- Supabase managed tetap menyediakan PostgreSQL, Auth, Storage, RLS, dan RPC;
- domain sekolah diarahkan ke IP VPS;
- backup kode berada di Git dan backup database berada pada Supabase/off-site.

Kelebihan:

- kebutuhan RAM dan storage VPS lebih ringan;
- proses migrasi lebih cepat;
- Auth, Storage, RLS, dan RPC tidak perlu dibangun ulang;
- risiko kehilangan data lebih rendah;
- pemeliharaan database lebih sederhana.

### 1.2 Arsitektur Full Self-hosted

**VPS menjalankan Next.js dan seluruh layanan Supabase self-hosted.**

Pilihan ini hanya disarankan jika sekolah memiliki pengelola DevOps yang memahami Docker, PostgreSQL, backup, object storage, email SMTP, JWT, reverse proxy, dan pembaruan keamanan. Memindahkan PostgreSQL saja tidak cukup karena aplikasi juga bergantung pada Supabase Auth, Storage, RLS, dan fungsi RPC.

## 2. Spesifikasi VPS

### 2.1 Pilihan Kapasitas

| Profil | CPU | RAM | Storage NVMe | Kegunaan |
|---|---|---|---|---|
| Minimum uji coba | 2 vCPU | 4 GB | 40 GB | Uji coba internal, build tidak bersamaan dengan trafik tinggi |
| Rekomendasi sekolah | 4 vCPU | 8 GB | 80–120 GB | Production Next.js, 20–100 pengguna bersamaan, build di VPS |
| Production bertumbuh | 8 vCPU | 16 GB | 160–250 GB | Trafik lebih tinggi, banyak proses laporan, monitoring lengkap |
| Full Supabase self-hosted | 8 vCPU minimum | 16 GB minimum | 250 GB minimum | Next.js, PostgreSQL, Auth, Storage, gateway, dan monitoring dalam satu server |

Rekomendasi awal untuk sekolah adalah **4 vCPU, RAM 8 GB, dan NVMe 100 GB**. Kapasitas ini memberi ruang untuk proses build Next.js, cache, log, swap, backup sementara, dan pertumbuhan aplikasi.

### 2.2 Mengapa RAM 8 GB Direkomendasikan

- proses `npm ci` dan build Next.js membutuhkan memori lebih besar daripada runtime;
- proses Node.js production, Nginx, sistem operasi, dan agent monitoring berjalan bersamaan;
- ekspor Excel dan pembuatan tampilan laporan dapat meningkatkan penggunaan memori sesaat;
- ruang memori tambahan mengurangi risiko proses build dihentikan oleh Out of Memory;
- server tetap memiliki kapasitas untuk pembaruan tanpa menghentikan layanan terlalu lama.

Jika build dilakukan di CI/CD dan VPS hanya menerima hasil build, RAM 4 GB dapat digunakan untuk skala kecil. Tambahkan swap 2–4 GB, tetapi swap bukan pengganti RAM.

### 2.3 Storage dan Perkiraan Pertumbuhan

Alokasi awal NVMe 100 GB dapat dibagi sebagai berikut:

| Penggunaan | Alokasi Awal |
|---|---|
| Sistem operasi dan paket | 15 GB |
| Source code dan dependency | 10–15 GB |
| Build Next.js dan cache | 10–20 GB |
| Log aplikasi/Nginx | 5–10 GB |
| Backup sementara | 20–30 GB |
| Ruang kosong pengamanan | Minimal 20% kapasitas |

Jika Storage Supabase tetap managed, foto siswa dan objek tidak menggunakan disk VPS. Jika Storage dipindahkan ke VPS, hitung kebutuhan menggunakan rumus:

`jumlah file × rata-rata ukuran × faktor pertumbuhan × jumlah salinan backup`

Contoh: 1.000 foto × 1 MB × faktor pertumbuhan 2 × 3 salinan membutuhkan sekitar 6 GB, belum termasuk dokumen lain dan overhead filesystem.

## 3. Koneksi dan Jaringan

| Komponen | Persyaratan |
|---|---|
| Port publik | 80/TCP dan 443/TCP |
| SSH | 22/TCP atau port khusus, dibatasi berdasarkan IP jika memungkinkan |
| Kecepatan jaringan | Minimum 100 Mbps; 1 Gbps lebih baik |
| Kuota transfer | Minimum 1 TB/bulan untuk penggunaan sekolah normal |
| IP | Satu IPv4 publik statis |
| Domain | Subdomain khusus, misalnya `mengaji.sekolah.sch.id` |
| DNS | A record ke IPv4 VPS; AAAA hanya jika IPv6 sudah diuji |
| HTTPS | Sertifikat TLS otomatis dari Let's Encrypt |

Turunkan TTL DNS menjadi 300 detik paling lambat 24 jam sebelum perpindahan agar perubahan alamat lebih cepat menyebar.

## 4. Sistem Operasi dan Perangkat Lunak

| Perangkat Lunak | Rekomendasi |
|---|---|
| Sistem operasi | Ubuntu Server 24.04 LTS 64-bit |
| Runtime | Node.js 22 LTS |
| Package manager | npm yang mengikuti Node.js |
| Reverse proxy | Nginx stable atau Caddy |
| Process manager | systemd; PM2 dapat digunakan bila sudah menjadi standar tim |
| Version control | Git |
| SSL | Certbot untuk Nginx atau TLS otomatis Caddy |
| Firewall | UFW atau firewall dari penyedia VPS |
| Proteksi login | Fail2ban dan autentikasi SSH key |
| Monitoring | Uptime monitor, log rotation, dan metrik CPU/RAM/disk |
| Database lokal | PostgreSQL hanya jika memakai arsitektur self-hosted |

Gunakan versi LTS dan pin versi aplikasi yang telah diuji. Jangan memperbarui versi mayor Node.js, Next.js, atau Supabase langsung di production tanpa staging dan backup.

## 5. Environment Variable Wajib

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY
ADMIN_USERNAME=admin
ADMIN_PASSWORD=PASSWORD_ADMIN_YANG_KUAT
NODE_ENV=production
PORT=3000
```

Ketentuan:

- simpan pada file environment di server dengan izin baca terbatas;
- jangan commit `.env`, `.env.local`, atau service role key ke Git;
- `NEXT_PUBLIC_*` dapat dibaca browser dan hanya boleh berisi nilai publik;
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dipakai endpoint server;
- ganti password Admin bawaan sebelum cutover;
- gunakan password acak minimal 16 karakter untuk kredensial infrastruktur;
- catat pemilik dan tanggal rotasi setiap secret.

## 6. Persiapan Sebelum Migrasi

### 6.1 Inventaris

- [ ] Repository Git dan branch production telah ditentukan.
- [ ] Commit production terakhir telah dicatat.
- [ ] Seluruh environment variable Vercel telah diinventarisasi.
- [ ] Project Supabase production yang benar telah dikonfirmasi.
- [ ] Seluruh migrasi pada `database/migrations` telah diterapkan.
- [ ] Domain, DNS, dan akses pengelola tersedia.
- [ ] Backup database dan daftar bucket Storage tersedia.
- [ ] Akun Admin cadangan telah diuji.
- [ ] Jadwal maintenance dan PIC telah disepakati.

### 6.2 Backup Wajib

Sebelum perubahan:

1. backup PostgreSQL;
2. ekspor daftar user Auth atau pastikan backup Supabase mencakup skema Auth sesuai metode yang didukung;
3. salin objek Storage penting;
4. simpan environment variable secara terenkripsi;
5. tag commit Git yang sedang berjalan;
6. uji bahwa backup dapat dibaca atau dipulihkan pada staging.

Backup yang tidak pernah diuji belum dapat dianggap sebagai backup yang siap digunakan.

## 7. Instalasi VPS untuk Mode Rekomendasi

### 7.1 Menyiapkan Pengguna dan Paket

Gunakan akun non-root untuk deployment. Contoh perintah dasar Ubuntu:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git nginx curl ca-certificates ufw fail2ban
```

Pasang Node.js 22 LTS melalui repositori resmi yang disetujui pengelola server atau version manager yang terdokumentasi. Verifikasi:

```bash
node --version
npm --version
git --version
nginx -v
```

### 7.2 Mengambil Source Code

```bash
sudo mkdir -p /var/www/catatan-mengaji-digital
sudo chown -R deploy:deploy /var/www/catatan-mengaji-digital
git clone REPOSITORY_URL /var/www/catatan-mengaji-digital
cd /var/www/catatan-mengaji-digital
git checkout main
```

Ganti `deploy` dengan nama akun non-root dan `REPOSITORY_URL` dengan repository resmi.

### 7.3 Memasang Dependency dan Build

```bash
cd /var/www/catatan-mengaji-digital
npm ci
npm run build
```

Build harus selesai tanpa error TypeScript. Peringatan harus ditinjau, terutama yang berhubungan dengan environment, database, atau dependency native.

### 7.4 Menjalankan dengan systemd

Buat service `/etc/systemd/system/catatan-mengaji.service`:

```ini
[Unit]
Description=Catatan Mengaji Digital
After=network.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/var/www/catatan-mengaji-digital
EnvironmentFile=/etc/catatan-mengaji-digital.env
ExecStart=/usr/bin/npm start -- --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now catatan-mengaji
sudo systemctl status catatan-mengaji
```

### 7.5 Konfigurasi Nginx

Contoh server block:

```nginx
server {
    listen 80;
    server_name mengaji.sekolah.sch.id;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
```

Uji dan muat ulang:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Pasang HTTPS menggunakan Certbot atau mekanisme TLS yang disetujui. Setelah HTTPS aktif, arahkan seluruh HTTP ke HTTPS.

## 8. Migrasi Database dan Supabase

### 8.1 Jika Supabase Tetap Managed

Tidak perlu memindahkan data database. Lakukan hal berikut:

1. pastikan VPS memakai URL dan key project Supabase production yang sama;
2. tambahkan domain VPS pada pengaturan URL/redirect Auth Supabase;
3. pastikan kebijakan RLS dan RPC telah dimigrasikan;
4. uji Auth Guru, Orang Tua, dan Admin;
5. uji upload/akses Storage;
6. uji endpoint Admin yang memakai service role key.

Mode ini adalah pilihan paling aman untuk tahap pertama.

### 8.2 Jika Seluruh Supabase Dipindahkan

Full self-hosted memerlukan:

- PostgreSQL;
- Supabase Auth/GoTrue;
- REST/PostgREST;
- Realtime jika digunakan;
- Storage API dan object storage;
- API gateway;
- Studio untuk administrasi;
- SMTP untuk email verifikasi/reset password;
- JWT secret dan service role/anon key baru;
- backup semua volume dan database.

Tahapan umum:

1. siapkan server staging dengan versi Supabase yang dipin dan telah diuji;
2. buat backup database sumber menggunakan metode resmi;
3. restore database dan verifikasi extension, schema, function, trigger, RLS, dan policy;
4. migrasikan bucket dan objek Storage;
5. konfigurasi SMTP dan redirect URL Auth;
6. buat ulang key sesuai konfigurasi self-hosted;
7. ubah environment aplikasi pada staging;
8. uji seluruh role dan laporan;
9. lakukan final sync pada maintenance window;
10. arahkan production hanya setelah checklist lulus.

Jangan melakukan restore langsung ke server production kosong tanpa uji staging dan rencana rollback.

## 9. Firewall dan Hardening

Contoh aturan dasar:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from IP_ADMIN_SEKOLAH to any port 22 proto tcp
sudo ufw enable
```

Checklist keamanan:

- [ ] Login SSH menggunakan key, bukan password.
- [ ] Root login melalui SSH dinonaktifkan.
- [ ] Port database tidak dibuka ke internet.
- [ ] Nginx dan Node.js dijalankan sebagai non-root.
- [ ] Fail2ban aktif.
- [ ] Update keamanan otomatis atau jadwal patch tersedia.
- [ ] Secret memiliki izin file `600` dan pemilik yang benar.
- [ ] Password Admin bawaan telah diganti.
- [ ] Backup dienkripsi dan disimpan off-site.
- [ ] Log tidak mencetak token, password, atau service role key.

## 10. Backup, Retensi, dan Pemulihan

### 10.1 Kebijakan Retensi Minimum

| Jenis Backup | Frekuensi | Retensi |
|---|---|---|
| Database harian | Setiap malam | 7 hari |
| Database mingguan | Setiap akhir minggu | 4 minggu |
| Database bulanan | Setiap akhir bulan | 12 bulan |
| Environment terenkripsi | Setiap perubahan | 3 versi terakhir |
| Source code | Setiap commit | Git remote dan tag rilis |
| Storage/object | Harian atau sesuai perubahan | Minimal 30 hari |

Gunakan prinsip **3-2-1**: tiga salinan, dua media berbeda, satu salinan berada di lokasi/off-site berbeda.

### 10.2 Target Pemulihan

| Target | Rekomendasi Awal |
|---|---|
| RPO | Maksimal kehilangan data 24 jam; lebih kecil jika backup lebih sering |
| RTO | Layanan pulih maksimal 4 jam setelah insiden |
| Uji restore | Minimal setiap tiga bulan |

Dokumentasikan waktu mulai, waktu selesai, ukuran backup, hasil verifikasi, dan petugas pelaksana.

## 11. Monitoring dan Batas Peringatan

| Metrik | Peringatan | Tindakan |
|---|---|---|
| CPU | Di atas 80% selama 10 menit | Periksa proses build, trafik, dan query |
| RAM | Di atas 80% | Periksa Node.js, hentikan proses liar, atau tambah RAM |
| Disk | Terpakai 75% | Bersihkan cache/log dan tambah kapasitas |
| Swap | Aktif terus-menerus | Tambah RAM atau optimalkan proses |
| HTTP 5xx | Lebih dari 1% request | Periksa log aplikasi/Nginx dan Supabase |
| Waktu respons | Lebih dari 2 detik konsisten | Periksa jaringan, server, dan query |
| SSL | Kurang dari 21 hari | Periksa pembaruan otomatis sertifikat |
| Backup | Gagal satu kali | Ulangi dan investigasi pada hari yang sama |

Log yang perlu dipantau:

```bash
sudo journalctl -u catatan-mengaji -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Aktifkan log rotation agar disk tidak habis.

## 12. Prosedur Deployment Berikutnya

1. Pastikan perubahan telah lolos review.
2. Jalankan lint file terkait, TypeScript, dan build production.
3. Buat backup sebelum perubahan database.
4. Tarik commit production:

```bash
cd /var/www/catatan-mengaji-digital
git fetch --all --prune
git checkout main
git pull --ff-only
npm ci
npm run build
sudo systemctl restart catatan-mengaji
sudo systemctl status catatan-mengaji
```

5. Uji halaman Login, Admin, Guru, Orang Tua, laporan, dan Audit.
6. Jika gagal, kembalikan ke tag/commit production sebelumnya dan restore database bila migrasi telah dijalankan.

Untuk mengurangi downtime, gunakan build pada direktori release terpisah lalu pindahkan symlink `current` setelah build berhasil.

## 13. Rencana Cutover dari Vercel

### 13.1 Sebelum Cutover

- turunkan TTL DNS;
- pastikan VPS dan HTTPS siap;
- deploy commit yang sama dengan Vercel;
- salin environment variable;
- uji menggunakan domain sementara atau file hosts;
- jadwalkan maintenance;
- siapkan rollback ke Vercel.

### 13.2 Saat Cutover

1. hentikan perubahan besar selama maintenance;
2. buat backup final;
3. deploy release final pada VPS;
4. jalankan smoke test lokal melalui HTTPS;
5. ubah DNS ke IP VPS;
6. pantau akses, error, CPU, RAM, dan database;
7. pertahankan deployment Vercel untuk rollback sementara.

### 13.3 Setelah Cutover

1. uji dari jaringan sekolah dan jaringan seluler;
2. periksa sertifikat HTTPS;
3. uji login ketiga role;
4. uji reset password dan email;
5. uji impor Excel, Presensi Harian, nilai, ujian level, Munaqosyah, rapor, dan Audit;
6. konfirmasi kelas 1A–6B dan relasi Orang Tua;
7. pantau minimal 72 jam;
8. naikkan TTL DNS setelah stabil.

## 14. Smoke Test Wajib

- [ ] Landing page dan portal Login dapat dibuka melalui HTTPS.
- [ ] Admin dapat login dan melihat Dashboard Monitoring.
- [ ] Admin melihat data siswa 1A–6B dengan jumlah yang benar.
- [ ] Monitoring Orang Tua menampilkan tabel kelas dan akun belum terhubung.
- [ ] Guru dapat login dan membuka Data Kelas.
- [ ] Guru dapat menyimpan Presensi & Laporan Harian.
- [ ] Guru dapat menyimpan nilai per surat.
- [ ] Ujian Kenaikan Level dan Munaqosyah dapat disimpan.
- [ ] Tiga Rapor Otomatis dapat dipreview dan dicetak.
- [ ] Orang Tua dapat melihat anak, Data Surat, dan laporan.
- [ ] Reset password email dapat digunakan.
- [ ] Audit menampilkan aktivitas baru.
- [ ] Backup pertama setelah cutover berhasil.

## 15. Rencana Rollback

Rollback dilakukan jika terdapat kegagalan login massal, kehilangan data, error 5xx berulang, atau fitur utama tidak dapat digunakan.

1. hentikan trafik ke VPS jika berisiko merusak data;
2. arahkan DNS kembali ke Vercel atau server lama;
3. kembalikan aplikasi ke commit terakhir yang stabil;
4. restore database hanya jika perubahan database menyebabkan kerusakan;
5. dokumentasikan waktu, penyebab, dampak, dan tindakan;
6. lakukan perbaikan pada staging sebelum cutover ulang.

Jangan menghapus deployment lama sampai masa stabilisasi selesai dan backup baru telah diuji.

## 16. Pembagian Tanggung Jawab

| Peran | Tanggung Jawab |
|---|---|
| Administrator Sekolah | Validasi akun, siswa, kelas, dan fungsi aplikasi |
| Pengelola VPS | OS, firewall, runtime, Nginx, SSL, monitoring, dan backup server |
| Pengelola Supabase | Database, Auth, Storage, RLS, migrasi, dan backup data |
| Guru Perwakilan | Uji Presensi, nilai, ujian, dan rapor |
| Orang Tua Perwakilan | Uji hubungan NIS, biodata, dan akses laporan |
| Kepala Sekolah/Koordinator | Persetujuan jadwal cutover dan penerimaan hasil |

## 17. Kriteria VPS Siap Production

- [ ] Spesifikasi minimal terpenuhi dan disk kosong lebih dari 20%.
- [ ] Node.js, Nginx, Git, firewall, dan monitoring aktif.
- [ ] Domain dan HTTPS valid.
- [ ] Aplikasi berjalan sebagai non-root melalui systemd.
- [ ] Environment variable production lengkap dan aman.
- [ ] Supabase/Auth/Storage dapat diakses dari VPS.
- [ ] Seluruh migrasi database telah diterapkan.
- [ ] Backup dan restore telah diuji.
- [ ] Smoke test seluruh role lulus.
- [ ] Rollback telah disiapkan.
- [ ] PIC operasional dan kontak darurat tersedia.

## 18. Pengesahan

| Disusun/Dikelola oleh | Diperiksa oleh | Disahkan oleh |
|---|---|---|
| Pengelola Sistem/VPS | Koordinator Tahfizh | Kepala Sekolah |
|  | **ULFA DWI HASTUTI, S.LI** | **WIDI NURMARA, S.Pd.I** |
| Tanggal: ____________ | Tanggal: ____________ | Tanggal: ____________ |

Dokumen ini menjadi persyaratan teknis migrasi Catatan Mengaji Digital ke VPS. Spesifikasi akhir dapat dinaikkan berdasarkan hasil load test dan pertumbuhan data, tetapi tidak boleh diturunkan di bawah kebutuhan minimum tanpa persetujuan pengelola teknis.

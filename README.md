# Laporan Harian Tahsin & Tahfidz

Platform digital modern untuk mencatat dan memantau perkembangan pembelajaran Quran siswa. Menghubungkan guru dan orang tua dalam satu sistem terintegrasi.

## 🎯 Fitur Utama

- ✅ **Sistem Authentication**: Login dan signup dengan role selection (Guru/Orang Tua)
- ✅ **Dashboard Guru**: Input laporan tadarus pagi dan progress hafalan siswa
- ✅ **Dashboard Orang Tua**: Pantau perkembangan anak secara real-time
- ✅ **Laporan Digital**: Terstruktur dan mudah digunakan
- ✅ **Analitik & Tracking**: Statistik pembelajaran dan penilaian siswa
- ✅ **Design Modern**: Interface clean dengan warna hijau #2dc653

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ dengan TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## 📋 Prerequisites

- Node.js 18+ dan npm
- Akun Supabase (gratis di https://supabase.com)

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

#### a. Buat Project Baru di Supabase

1. Kunjungi https://supabase.com
2. Sign up atau login dengan akun Anda
3. Buat project baru
4. Copy URL dan Anon Key dari project settings

#### b. Setup Environment Variables

Buat file `.env.local` di root project:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### c. Setup Database Schema

Buka SQL Editor di Supabase dan jalankan script berikut:

```sql
-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('guru', 'orang_tua')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create laporan_tadarus_pagi table
CREATE TABLE laporan_tadarus_pagi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  nama_surah VARCHAR(100) NOT NULL,
  hal_ayat VARCHAR(50),
  keterangan TEXT,
  guru_paraf BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_laporan_teacher_id ON laporan_tadarus_pagi(teacher_id);
CREATE INDEX idx_laporan_tanggal ON laporan_tadarus_pagi(tanggal);

-- Enable RLS (Row Level Security)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_tadarus_pagi ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User roles
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Laporan tadarus - guru dapat lihat laporan mereka sendiri
CREATE POLICY "Teachers can view their own reports"
  ON laporan_tadarus_pagi FOR SELECT
  USING (auth.uid() = teacher_id);

-- Laporan tadarus - guru dapat insert laporan mereka
CREATE POLICY "Teachers can create reports"
  ON laporan_tadarus_pagi FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Laporan tadarus - guru dapat update laporan mereka
CREATE POLICY "Teachers can update their reports"
  ON laporan_tadarus_pagi FOR UPDATE
  USING (auth.uid() = teacher_id);
```

### 3. Run Development Server

```bash
npm run dev
```

Server akan jalan di `http://localhost:3000`

## 📱 Struktur Project

```
.
├── app/
│   ├── auth/
│   │   ├── login/          # Halaman login
│   │   └── signup/         # Halaman signup
│   ├── dashboard/
│   │   ├── guru/           # Dashboard guru
│   │   └── orang-tua/      # Dashboard orang tua
│   ├── page.tsx            # Home page
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Navbar.tsx
│   └── DashboardLayout.tsx
├── lib/
│   └── supabase.ts         # Supabase client & utilities
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/                  # Utility functions
├── .env.local              # Environment variables
├── package.json
├── tailwind.config.js      # Tailwind CSS config
└── tsconfig.json           # TypeScript config
```

## 🎨 Design Colors

- **Primary Green**: #2dc653
- **Dark Green**: #1f9c3b
- **Light Green**: rgba(45, 198, 83, 0.1)

## 🔐 User Roles

### Guru (Teacher)

- Input laporan tadarus pagi
- Catat progress hafalan siswa
- Lihat statistik pembelajaran
- Verifikasi dan paraf laporan

### Orang Tua (Parent)

- Lihat laporan anak secara real-time
- Monitor perkembangan tadarus dan hafalan
- Pantau capaian target hafalan
- Terima update pembelajaran

## 📚 Database Schema

### user_roles

- `id`: UUID
- `user_id`: FK ke auth.users
- `email`: VARCHAR
- `role`: VARCHAR (guru/orang_tua)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### laporan_tadarus_pagi

- `id`: UUID
- `teacher_id`: FK ke auth.users
- `tanggal`: DATE
- `nama_surah`: VARCHAR
- `hal_ayat`: VARCHAR
- `keterangan`: TEXT
- `guru_paraf`: BOOLEAN
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

## 🔗 Links Penting

- Dokumentasi Next.js: https://nextjs.org/docs
- Dokumentasi Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

## 📞 Support

Untuk bantuan, hubungi:

- SD Islam Labschool Bani Saleh
- Bekasi, Jawa Barat

## 📄 License

Copyright © 2026 SD Islam Labschool Bani Saleh. All rights reserved.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

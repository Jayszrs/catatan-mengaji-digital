# Database Schema dan Setup Supabase

## Update penting: NIS dan data lintas akun

Untuk perubahan terbaru, jalankan file [`supabase-nis-shared-data-migration.sql`](./supabase-nis-shared-data-migration.sql) di Supabase SQL Editor setelah backup data.

Perubahan tersebut membuat:

- NIS otomatis wajib terisi dan unik sebagai kunci bisnis utama siswa.
- Import CSV/Excel memakai NIS untuk update data yang sudah ada, bukan membuat duplikat.
- Data siswa dan laporan bisa dilihat lintas akun guru/orang tua/admin selama memakai Supabase project yang sama.

Kalau aplikasi dipasang di beberapa akun/domain Vercel, pastikan semua deployment memakai nilai environment variable yang sama:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 📋 Tabel-tabel yang Diperlukan

### 1. user_roles

Menyimpan informasi role pengguna (Guru atau Orang Tua)

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('guru', 'orang_tua')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
```

### 2. students

Menyimpan daftar siswa yang diajar oleh guru.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap VARCHAR(100) NOT NULL,
  nis VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_teacher_id ON students(teacher_id);
```

### 3. laporan_tadarus_pagi

Menyimpan laporan tadarus pagi dari guru untuk masing-masing siswa.

```sql
CREATE TABLE laporan_tadarus_pagi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  nama_surah VARCHAR(100) NOT NULL,
  hal_ayat VARCHAR(50),
  keterangan TEXT,
  guru_paraf BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_laporan_teacher_id ON laporan_tadarus_pagi(teacher_id);
CREATE INDEX idx_laporan_student_id ON laporan_tadarus_pagi(student_id);
CREATE INDEX idx_laporan_tanggal ON laporan_tadarus_pagi(tanggal);
```

### 4. laporan_tahsin_tahfidz

Menyimpan laporan tahsin dan tahfidz dari guru, mencakup nilai makhraj dan catatan muroja'ah per siswa.

```sql
CREATE TABLE laporan_tahsin_tahfidz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  nama_surah VARCHAR(100) NOT NULL,
  ayat VARCHAR(50) NOT NULL,
  makhraj VARCHAR(50),
  murojaah VARCHAR(100),
  keterangan TEXT,
  guru_paraf BOOLEAN DEFAULT FALSE,
  orangtua_paraf BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tahsin_teacher_id ON laporan_tahsin_tahfidz(teacher_id);
CREATE INDEX idx_tahsin_student_id ON laporan_tahsin_tahfidz(student_id);
CREATE INDEX idx_tahsin_tanggal ON laporan_tahsin_tahfidz(tanggal);
```

## 🚀 Full Setup Script

Salin dan jalankan script berikut di SQL Editor Supabase untuk mereset dan membuat ulang tabel. (Peringatan: jika sudah ada data, backup dulu atau cukup jalankan query ALTER TABLE).

```sql
-- Hapus tabel lama jika ada
DROP TABLE IF EXISTS laporan_tahsin_tahfidz;
DROP TABLE IF EXISTS laporan_tadarus_pagi;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS user_roles;

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('guru', 'orang_tua')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap VARCHAR(100) NOT NULL,
  nis VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create laporan_tadarus_pagi table
CREATE TABLE laporan_tadarus_pagi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  nama_surah VARCHAR(100) NOT NULL,
  hal_ayat VARCHAR(50),
  keterangan TEXT,
  guru_paraf BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create laporan_tahsin_tahfidz table
CREATE TABLE laporan_tahsin_tahfidz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  nama_surah VARCHAR(100) NOT NULL,
  ayat VARCHAR(50) NOT NULL,
  makhraj VARCHAR(50),
  murojaah VARCHAR(100),
  keterangan TEXT,
  guru_paraf BOOLEAN DEFAULT FALSE,
  orangtua_paraf BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_laporan_teacher_id ON laporan_tadarus_pagi(teacher_id);
CREATE INDEX idx_laporan_student_id ON laporan_tadarus_pagi(student_id);
CREATE INDEX idx_laporan_tanggal ON laporan_tadarus_pagi(tanggal);
CREATE INDEX idx_tahsin_teacher_id ON laporan_tahsin_tahfidz(teacher_id);
CREATE INDEX idx_tahsin_student_id ON laporan_tahsin_tahfidz(student_id);
CREATE INDEX idx_tahsin_tanggal ON laporan_tahsin_tahfidz(tanggal);

-- Enable RLS (Row Level Security)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_tadarus_pagi ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_tahsin_tahfidz ENABLE ROW LEVEL SECURITY;

-- Policies user_roles
CREATE POLICY "Users can view their own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert user roles" ON user_roles FOR INSERT WITH CHECK (true);

-- Policies students
CREATE POLICY "Teachers can view their students" ON students FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert students" ON students FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Policies laporan_tadarus_pagi
CREATE POLICY "Teachers can view their own reports" ON laporan_tadarus_pagi FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can create reports" ON laporan_tadarus_pagi FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their reports" ON laporan_tadarus_pagi FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Anyone can view all reports" ON laporan_tadarus_pagi FOR SELECT USING (true);

-- Policies laporan_tahsin_tahfidz
CREATE POLICY "Teachers can view their own tahsin reports" ON laporan_tahsin_tahfidz FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can create tahsin reports" ON laporan_tahsin_tahfidz FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their tahsin reports" ON laporan_tahsin_tahfidz FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Anyone can view all tahsin reports" ON laporan_tahsin_tahfidz FOR SELECT USING (true);
```

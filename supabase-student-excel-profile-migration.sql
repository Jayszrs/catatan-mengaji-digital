-- Kolom profil siswa sesuai format "DAFTAR SISWA KELAS 1 BANI SALEH".
-- Aman dijalankan ulang di Supabase SQL Editor.

alter table public.students
  add column if not exists jenis_kelamin text,
  add column if not exists nik text,
  add column if not exists nama_ayah text,
  add column if not exists nama_ibu text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_jenis_kelamin_check'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_jenis_kelamin_check
      check (jenis_kelamin is null or jenis_kelamin in ('L', 'P'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_nik_format_check'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_nik_format_check
      check (nik is null or nik ~ '^[0-9]{16}$');
  end if;
end $$;

comment on column public.students.jenis_kelamin is
  'L = laki-laki, P = perempuan';
comment on column public.students.nik is
  'Nomor Induk Kependudukan siswa, 16 digit';
comment on column public.students.nama_ayah is
  'Nama ayah sesuai data administrasi sekolah';
comment on column public.students.nama_ibu is
  'Nama ibu sesuai data administrasi sekolah';

-- Minta PostgREST/Supabase membaca kolom baru tanpa menunggu cache kedaluwarsa.
notify pgrst, 'reload schema';

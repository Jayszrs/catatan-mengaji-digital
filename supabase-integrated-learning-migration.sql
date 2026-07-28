-- Jalankan sekali di Supabase SQL Editor.
-- Menambahkan foto siswa dan akses Storage yang dipakai role Guru/Orang Tua.

alter table public.students
  add column if not exists foto_url text,
  add column if not exists level integer not null default 1;

alter table public.laporan_tahsin_tahfidz
  add column if not exists nilai numeric(5,2);

create table if not exists public.student_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  bulan_tahun text not null,
  jenis_rapor text not null check (jenis_rapor in ('rapor', 'munaqosyah')),
  data_rapor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_reports_student_period_idx
  on public.student_reports (student_id, jenis_rapor, bulan_tahun);

alter table public.student_reports enable row level security;

drop policy if exists "Authenticated users can view student reports" on public.student_reports;
create policy "Authenticated users can view student reports"
on public.student_reports for select to authenticated
using (true);

drop policy if exists "Teachers can insert student reports" on public.student_reports;
create policy "Teachers can insert student reports"
on public.student_reports for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can update student reports" on public.student_reports;
create policy "Teachers can update student reports"
on public.student_reports for update to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

-- Master kelas
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  nama_kelas text not null,
  tingkat smallint not null check (tingkat between 1 and 6),
  rombel text not null default 'A',
  wali_kelas text,
  tahun_ajaran text not null,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nama_kelas, tahun_ajaran)
);

create index if not exists classes_active_year_idx
  on public.classes (aktif, tahun_ajaran);

alter table public.classes enable row level security;

drop policy if exists "Authenticated users can view classes" on public.classes;
create policy "Authenticated users can view classes"
on public.classes for select to authenticated
using (true);

drop policy if exists "Teachers can insert classes" on public.classes;
create policy "Teachers can insert classes"
on public.classes for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can update classes" on public.classes;
create policy "Teachers can update classes"
on public.classes for update to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can delete classes" on public.classes;
create policy "Teachers can delete classes"
on public.classes for delete to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

-- Presensi dan laporan pembelajaran harian
create table if not exists public.daily_student_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  tanggal date not null,
  status_presensi text not null
    check (status_presensi in ('Hadir', 'Izin', 'Sakit', 'Alpa')),
  kegiatan text,
  ringkasan_tadarus text,
  ringkasan_hafalan text,
  catatan_guru text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, tanggal)
);

create index if not exists daily_student_reports_student_date_idx
  on public.daily_student_reports (student_id, tanggal desc);
create index if not exists daily_student_reports_teacher_date_idx
  on public.daily_student_reports (teacher_id, tanggal desc);

alter table public.daily_student_reports enable row level security;

drop policy if exists "Authenticated users can view daily reports" on public.daily_student_reports;
create policy "Authenticated users can view daily reports"
on public.daily_student_reports for select to authenticated
using (true);

drop policy if exists "Teachers can insert daily reports" on public.daily_student_reports;
create policy "Teachers can insert daily reports"
on public.daily_student_reports for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can update daily reports" on public.daily_student_reports;
create policy "Teachers can update daily reports"
on public.daily_student_reports for update to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can delete daily reports" on public.daily_student_reports;
create policy "Teachers can delete daily reports"
on public.daily_student_reports for delete to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

-- Ujian kenaikan level
create table if not exists public.level_promotion_exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  tanggal date not null,
  level_asal smallint not null check (level_asal between 1 and 6),
  level_tujuan smallint not null check (level_tujuan between 1 and 6),
  nilai_kelancaran numeric(5,2) not null check (nilai_kelancaran between 0 and 100),
  nilai_makhraj numeric(5,2) not null check (nilai_makhraj between 0 and 100),
  nilai_tajwid numeric(5,2) not null check (nilai_tajwid between 0 and 100),
  nilai_hafalan numeric(5,2) not null check (nilai_hafalan between 0 and 100),
  nilai_rata_rata numeric(5,2) not null check (nilai_rata_rata between 0 and 100),
  status text not null check (status in ('Lulus', 'Mengulang')),
  tahun_ajaran text not null,
  catatan_guru text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, level_tujuan, tahun_ajaran),
  check (level_tujuan > level_asal)
);

create index if not exists level_promotion_exams_student_date_idx
  on public.level_promotion_exams (student_id, tanggal desc);
create index if not exists level_promotion_exams_teacher_year_idx
  on public.level_promotion_exams (teacher_id, tahun_ajaran);

alter table public.level_promotion_exams enable row level security;

drop policy if exists "Authenticated users can view level exams" on public.level_promotion_exams;
create policy "Authenticated users can view level exams"
on public.level_promotion_exams for select to authenticated
using (true);

drop policy if exists "Teachers can insert level exams" on public.level_promotion_exams;
create policy "Teachers can insert level exams"
on public.level_promotion_exams for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can update level exams" on public.level_promotion_exams;
create policy "Teachers can update level exams"
on public.level_promotion_exams for update to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

-- Satu sesi Munaqosah per siswa, dapat dikoreksi tanpa membuat ujian kedua.
create table if not exists public.munaqosyah_exams (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  tanggal date not null,
  jenjang text not null default 'SD/MI' check (jenjang = 'SD/MI'),
  durasi_menit smallint not null default 120 check (durasi_menit = 120),
  status text not null default 'Selesai' check (status in ('Terjadwal', 'Berlangsung', 'Selesai')),
  hasil_ujian jsonb not null default '{}'::jsonb,
  catatan_guru text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists munaqosyah_exams_teacher_date_idx
  on public.munaqosyah_exams (teacher_id, tanggal desc);

alter table public.munaqosyah_exams enable row level security;

drop policy if exists "Authenticated users can view munaqosyah exams" on public.munaqosyah_exams;
create policy "Authenticated users can view munaqosyah exams"
on public.munaqosyah_exams for select to authenticated
using (true);

drop policy if exists "Teachers can insert munaqosyah exams" on public.munaqosyah_exams;
create policy "Teachers can insert munaqosyah exams"
on public.munaqosyah_exams for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can update munaqosyah exams" on public.munaqosyah_exams;
create policy "Teachers can update munaqosyah exams"
on public.munaqosyah_exams for update to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-photos',
  'student-photos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload student photos" on storage.objects;
create policy "Authenticated users can upload student photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'student-photos'
  and (select auth.uid()) is not null
);

drop policy if exists "Authenticated users can update student photos" on storage.objects;
create policy "Authenticated users can update student photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'student-photos'
  and (select auth.uid()) is not null
)
with check (
  bucket_id = 'student-photos'
  and (select auth.uid()) is not null
);

drop policy if exists "Authenticated users can delete student photos" on storage.objects;
create policy "Authenticated users can delete student photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'student-photos'
  and (select auth.uid()) is not null
);

create or replace function public.set_student_photo_url(
  p_student_id uuid,
  p_foto_url text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sesi login tidak ditemukan';
  end if;

  if not exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('guru', 'orang_tua')
  ) then
    raise exception 'Role tidak diizinkan mengubah foto siswa';
  end if;

  if p_foto_url not like '%/storage/v1/object/public/student-photos/%' then
    raise exception 'URL foto tidak valid';
  end if;

  update public.students
  set foto_url = p_foto_url
  where id = p_student_id;

  if not found then
    raise exception 'Siswa tidak ditemukan';
  end if;
end;
$$;

revoke all on function public.set_student_photo_url(uuid, text) from public, anon;
grant execute on function public.set_student_photo_url(uuid, text) to authenticated;

create or replace function public.save_integrated_learning_entry(
  p_student_id uuid,
  p_tanggal date,
  p_nama_surah text,
  p_hal_ayat text,
  p_tadarus_keterangan text,
  p_ayat text,
  p_makhraj text,
  p_murojaah text,
  p_tahfidz_keterangan text,
  p_nilai numeric,
  p_level integer,
  p_bulan_tahun text,
  p_data_rapor jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null or not exists (
    select 1
    from public.user_roles
    where user_id = current_user_id and role = 'guru'
  ) then
    raise exception 'Hanya Guru yang dapat menyimpan catatan terintegrasi';
  end if;

  if not exists (select 1 from public.students where id = p_student_id) then
    raise exception 'Siswa tidak ditemukan';
  end if;

  insert into public.laporan_tadarus_pagi (
    teacher_id,
    student_id,
    tanggal,
    nama_surah,
    hal_ayat,
    keterangan
  )
  values (
    current_user_id,
    p_student_id,
    p_tanggal,
    p_nama_surah,
    p_hal_ayat,
    p_tadarus_keterangan
  );

  insert into public.laporan_tahsin_tahfidz (
    teacher_id,
    student_id,
    tanggal,
    nama_surah,
    ayat,
    makhraj,
    murojaah,
    keterangan,
    nilai
  )
  values (
    current_user_id,
    p_student_id,
    p_tanggal,
    p_nama_surah,
    p_ayat,
    p_makhraj,
    p_murojaah,
    p_tahfidz_keterangan,
    p_nilai
  );

  update public.students
  set level = p_level
  where id = p_student_id;

  update public.student_reports
  set
    data_rapor = p_data_rapor,
    teacher_id = current_user_id,
    updated_at = now()
  where id = (
    select id
    from public.student_reports
    where student_id = p_student_id
      and jenis_rapor = 'munaqosyah'
      and bulan_tahun = p_bulan_tahun
    order by updated_at desc
    limit 1
  );

  if not found then
    insert into public.student_reports (
      student_id,
      teacher_id,
      bulan_tahun,
      jenis_rapor,
      data_rapor
    )
    values (
      p_student_id,
      current_user_id,
      p_bulan_tahun,
      'munaqosyah',
      p_data_rapor
    );
  end if;

  insert into public.munaqosyah_exams (
    student_id,
    teacher_id,
    tanggal,
    jenjang,
    durasi_menit,
    status,
    hasil_ujian,
    catatan_guru
  )
  values (
    p_student_id,
    current_user_id,
    p_tanggal,
    'SD/MI',
    120,
    'Selesai',
    p_data_rapor,
    p_data_rapor ->> 'catatanMunaqosyah'
  )
  on conflict (student_id) do update
  set
    teacher_id = excluded.teacher_id,
    tanggal = excluded.tanggal,
    hasil_ujian = excluded.hasil_ujian,
    catatan_guru = excluded.catatan_guru,
    updated_at = now();
end;
$$;

revoke all on function public.save_integrated_learning_entry(
  uuid, date, text, text, text, text, text, text, text, numeric, integer, text, jsonb
) from public, anon;
grant execute on function public.save_integrated_learning_entry(
  uuid, date, text, text, text, text, text, text, text, numeric, integer, text, jsonb
) to authenticated;

create or replace function public.save_level_promotion_exam(
  p_student_id uuid,
  p_tanggal date,
  p_level_asal integer,
  p_level_tujuan integer,
  p_nilai_kelancaran numeric,
  p_nilai_makhraj numeric,
  p_nilai_tajwid numeric,
  p_nilai_hafalan numeric,
  p_tahun_ajaran text,
  p_catatan_guru text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  average_score numeric(5,2);
  result_status text;
begin
  if current_user_id is null or not exists (
    select 1
    from public.user_roles
    where user_id = current_user_id and role = 'guru'
  ) then
    raise exception 'Hanya Guru yang dapat menyimpan ujian kenaikan level';
  end if;

  if p_level_tujuan <= p_level_asal then
    raise exception 'Level tujuan harus lebih tinggi dari level asal';
  end if;

  average_score := round(
    (p_nilai_kelancaran + p_nilai_makhraj + p_nilai_tajwid + p_nilai_hafalan) / 4,
    2
  );
  result_status := case when average_score >= 75 then 'Lulus' else 'Mengulang' end;

  insert into public.level_promotion_exams (
    student_id,
    teacher_id,
    tanggal,
    level_asal,
    level_tujuan,
    nilai_kelancaran,
    nilai_makhraj,
    nilai_tajwid,
    nilai_hafalan,
    nilai_rata_rata,
    status,
    tahun_ajaran,
    catatan_guru
  )
  values (
    p_student_id,
    current_user_id,
    p_tanggal,
    p_level_asal,
    p_level_tujuan,
    p_nilai_kelancaran,
    p_nilai_makhraj,
    p_nilai_tajwid,
    p_nilai_hafalan,
    average_score,
    result_status,
    p_tahun_ajaran,
    nullif(trim(p_catatan_guru), '')
  )
  on conflict (student_id, level_tujuan, tahun_ajaran) do update
  set
    teacher_id = excluded.teacher_id,
    tanggal = excluded.tanggal,
    level_asal = excluded.level_asal,
    nilai_kelancaran = excluded.nilai_kelancaran,
    nilai_makhraj = excluded.nilai_makhraj,
    nilai_tajwid = excluded.nilai_tajwid,
    nilai_hafalan = excluded.nilai_hafalan,
    nilai_rata_rata = excluded.nilai_rata_rata,
    status = excluded.status,
    catatan_guru = excluded.catatan_guru,
    updated_at = now();

  if result_status = 'Lulus' then
    update public.students
    set level = p_level_tujuan
    where id = p_student_id;
  end if;
end;
$$;

revoke all on function public.save_level_promotion_exam(
  uuid, date, integer, integer, numeric, numeric, numeric, numeric, text, text
) from public, anon;
grant execute on function public.save_level_promotion_exam(
  uuid, date, integer, integer, numeric, numeric, numeric, numeric, text, text
) to authenticated;

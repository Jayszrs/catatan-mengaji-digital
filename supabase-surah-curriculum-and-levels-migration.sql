-- Master data surat tahfidz per tahun ajaran dan perluasan jenjang sampai
-- Mustawa Muttawasit 3. Jalankan sekali di Supabase SQL Editor.

create table if not exists public.surah_curriculum (
  id uuid primary key default gen_random_uuid(),
  tahun_ajaran text not null check (tahun_ajaran ~ '^[0-9]{4}/[0-9]{4}$'),
  level smallint not null check (level between 1 and 9),
  nama_surah text not null check (length(trim(nama_surah)) between 1 and 100),
  urutan smallint not null check (urutan > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_ajaran, level, nama_surah)
);

create index if not exists surah_curriculum_year_level_order_idx
  on public.surah_curriculum (tahun_ajaran desc, level, urutan, id);
create index if not exists surah_curriculum_created_by_idx
  on public.surah_curriculum (created_by);

alter table public.surah_curriculum enable row level security;

drop policy if exists "Authenticated users can view surah curriculum"
  on public.surah_curriculum;
create policy "Authenticated users can view surah curriculum"
on public.surah_curriculum for select to authenticated
using (true);

drop policy if exists "Teachers can insert surah curriculum"
  on public.surah_curriculum;
create policy "Teachers can insert surah curriculum"
on public.surah_curriculum for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can update surah curriculum"
  on public.surah_curriculum;
create policy "Teachers can update surah curriculum"
on public.surah_curriculum for update to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers can delete surah curriculum"
  on public.surah_curriculum;
create policy "Teachers can delete surah curriculum"
on public.surah_curriculum for delete to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

revoke all on public.surah_curriculum from anon;
grant select, insert, update, delete on public.surah_curriculum to authenticated;

-- Data awal sesuai lembar Excel tahun ajaran 2026/2027.
-- Bersihkan nama seed lama tanpa awalan "Surah" agar migrasi yang pernah
-- dijalankan sebelumnya tidak menghasilkan data ganda.
delete from public.surah_curriculum
where tahun_ajaran = '2026/2027'
  and (level, nama_surah) in (
    (1, 'An-Nas'),
    (1, 'Al-Falaq'),
    (1, 'Al-Ikhlas'),
    (1, 'Al-Lahab'),
    (1, 'An-Nasr'),
    (1, 'Al-Kafirun'),
    (1, 'Al-Kautsar'),
    (1, 'Al-Ma''un'),
    (2, 'Quraisy'),
    (2, 'Al-Fil'),
    (2, 'Al-Humazah'),
    (2, 'Al-Asr'),
    (2, 'At-Takasur'),
    (2, 'Al-Qari''ah'),
    (2, 'Al-''Adiyat'),
    (2, 'Az-Zalzalah'),
    (3, 'Al-Bayyinah'),
    (3, 'Al-Qadr'),
    (3, 'Al-''Alaq'),
    (3, 'At-Tin'),
    (3, 'Asy-Syarh'),
    (3, 'Ad-Dhuha'),
    (3, 'Al-Lail'),
    (3, 'Asy-Syams'),
    (3, 'Al-Balad'),
    (4, 'Al-Fajr'),
    (4, 'Al-Ghasyiyah'),
    (4, 'Al-A''la'),
    (4, 'At-Tariq'),
    (4, 'Al-Buruj'),
    (5, 'Al-Insyiqaq'),
    (5, 'Al-Muthaffifin'),
    (5, 'Al-Infitar'),
    (5, 'At-Takwir'),
    (6, 'Abasa'),
    (6, 'An-Naziat'),
    (6, 'An-Naba')
  );

insert into public.surah_curriculum
  (tahun_ajaran, level, nama_surah, urutan)
values
  ('2026/2027', 1, 'Surah An-Nas', 1),
  ('2026/2027', 1, 'Surah Al-Falaq', 2),
  ('2026/2027', 1, 'Surah Al-Ikhlas', 3),
  ('2026/2027', 1, 'Surah Al-Lahab', 4),
  ('2026/2027', 1, 'Surah An-Nasr', 5),
  ('2026/2027', 1, 'Surah Al-Kafirun', 6),
  ('2026/2027', 1, 'Surah Al-Kautsar', 7),
  ('2026/2027', 1, 'Surah Al-Ma''un', 8),
  ('2026/2027', 2, 'Surah Quraisy', 1),
  ('2026/2027', 2, 'Surah Al-Fil', 2),
  ('2026/2027', 2, 'Surah Al-Humazah', 3),
  ('2026/2027', 2, 'Surah Al-Asr', 4),
  ('2026/2027', 2, 'Surah At-Takasur', 5),
  ('2026/2027', 2, 'Surah Al-Qari''ah', 6),
  ('2026/2027', 2, 'Surah Al-''Adiyat', 7),
  ('2026/2027', 2, 'Surah Az-Zalzalah', 8),
  ('2026/2027', 3, 'Surah Al-Bayyinah', 1),
  ('2026/2027', 3, 'Surah Al-Qadr', 2),
  ('2026/2027', 3, 'Surah Al-Alaq', 3),
  ('2026/2027', 3, 'Surah At-Tin', 4),
  ('2026/2027', 3, 'Surah As-Syarh', 5),
  ('2026/2027', 3, 'Surah Ad-Dhuha', 6),
  ('2026/2027', 3, 'Surah Al-Lail', 7),
  ('2026/2027', 3, 'Surah Asy-Syams', 8),
  ('2026/2027', 3, 'Surah Al-Balad', 9),
  ('2026/2027', 4, 'Surah Al-Fajr', 1),
  ('2026/2027', 4, 'Surah Al-Ghasyiyah', 2),
  ('2026/2027', 4, 'Surah Al-A''la', 3),
  ('2026/2027', 4, 'Surah At-Tariq', 4),
  ('2026/2027', 4, 'Surah Al-Buruj', 5),
  ('2026/2027', 5, 'Surah Al-Insyiqaq', 1),
  ('2026/2027', 5, 'Surah Al-Muthaffifin', 2),
  ('2026/2027', 5, 'Surah Al-Infitar', 3),
  ('2026/2027', 5, 'Surah At-Takwir', 4),
  ('2026/2027', 6, 'Surah Abasa', 1),
  ('2026/2027', 6, 'Surah An-Naziat', 2),
  ('2026/2027', 6, 'Surah An-Naba', 3),
  ('2026/2027', 7, 'Al-Mulk', 1),
  ('2026/2027', 7, 'Al-Qalam', 2),
  ('2026/2027', 7, 'Al-Haqqah', 3),
  ('2026/2027', 7, 'Al-Ma''arij', 4),
  ('2026/2027', 7, 'Nuh', 5),
  ('2026/2027', 8, 'Al-Jinn', 1),
  ('2026/2027', 8, 'Al-Muzammil', 2),
  ('2026/2027', 8, 'Al-Muddasir', 3),
  ('2026/2027', 9, 'Al-Qiyamah', 1),
  ('2026/2027', 9, 'Al-Insan', 2),
  ('2026/2027', 9, 'Al-Mursalat', 3)
on conflict (tahun_ajaran, level, nama_surah) do update
set urutan = excluded.urutan,
    updated_at = now();

-- Simpan tahun ajaran pada setiap nilai harian agar riwayat kurikulum tidak
-- berubah ketika daftar surat tahun berikutnya dibuat.
alter table public.laporan_tahsin_tahfidz
  add column if not exists tahun_ajaran text;

update public.laporan_tahsin_tahfidz
set tahun_ajaran = '2026/2027'
where tahun_ajaran is null or trim(tahun_ajaran) = '';

alter table public.laporan_tahsin_tahfidz
  alter column tahun_ajaran set default '2026/2027',
  alter column tahun_ajaran set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'laporan_tahsin_tahun_ajaran_format'
      and conrelid = 'public.laporan_tahsin_tahfidz'::regclass
  ) then
    alter table public.laporan_tahsin_tahfidz
      add constraint laporan_tahsin_tahun_ajaran_format
      check (tahun_ajaran ~ '^[0-9]{4}/[0-9]{4}$');
  end if;
end $$;

-- Perluas level siswa dan ujian dari 1–6 menjadi 1–9.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_tahfidz_level_range'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_tahfidz_level_range
      check (level between 1 and 9);
  end if;
end $$;

alter table public.level_promotion_exams
  drop constraint if exists level_promotion_exams_level_asal_check,
  drop constraint if exists level_promotion_exams_level_tujuan_check,
  drop constraint if exists level_exam_level_asal_range,
  drop constraint if exists level_exam_level_tujuan_range;

alter table public.level_promotion_exams
  add constraint level_exam_level_asal_range
    check (level_asal between 1 and 9),
  add constraint level_exam_level_tujuan_range
    check (level_tujuan between 1 and 9);

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

  if p_level_asal not between 1 and 9
    or p_level_tujuan not between 1 and 9 then
    raise exception 'Jenjang tahfidz harus berada di antara 1 dan 9';
  end if;

  if p_level_tujuan <= p_level_asal then
    raise exception 'Jenjang tujuan harus lebih tinggi dari jenjang asal';
  end if;

  if p_nilai_kelancaran not between 0 and 100
    or p_nilai_makhraj not between 0 and 100
    or p_nilai_tajwid not between 0 and 100
    or p_nilai_hafalan not between 0 and 100 then
    raise exception 'Nilai harus berada di antara 0 dan 100';
  end if;

  average_score := round(
    (p_nilai_kelancaran + p_nilai_makhraj + p_nilai_tajwid + p_nilai_hafalan) / 4,
    2
  );
  result_status := case when average_score >= 75 then 'Lulus' else 'Mengulang' end;

  insert into public.level_promotion_exams (
    student_id, teacher_id, tanggal, level_asal, level_tujuan,
    nilai_kelancaran, nilai_makhraj, nilai_tajwid, nilai_hafalan,
    nilai_rata_rata, status, tahun_ajaran, catatan_guru
  )
  values (
    p_student_id, current_user_id, p_tanggal, p_level_asal, p_level_tujuan,
    p_nilai_kelancaran, p_nilai_makhraj, p_nilai_tajwid, p_nilai_hafalan,
    average_score, result_status, p_tahun_ajaran,
    nullif(trim(p_catatan_guru), '')
  )
  on conflict (student_id, level_tujuan, tahun_ajaran) do update
  set teacher_id = excluded.teacher_id,
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

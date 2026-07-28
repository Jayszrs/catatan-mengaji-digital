-- Jalankan SETELAH supabase-integrated-learning-migration.sql.
-- Migrasi ini mengunci orang tua ke satu anak, menambah profil guru,
-- nilai hafalan harian, dan penyimpanan Munaqosyah otomatis.

-- Satu user hanya boleh memiliki satu role agar upsert verifikasi bersifat atomik.
with duplicate_roles as (
  select
    id,
    row_number() over (
      partition by user_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as duplicate_order
  from public.user_roles
)
delete from public.user_roles
where id in (
  select id from duplicate_roles where duplicate_order > 1
);

create unique index if not exists user_roles_user_id_unique
  on public.user_roles (user_id);

alter table public.laporan_tahsin_tahfidz
  add column if not exists nilai_kelancaran numeric(5,2),
  add column if not exists nilai_makhraj numeric(5,2),
  add column if not exists nilai_tajwid numeric(5,2),
  add column if not exists nilai_hafalan numeric(5,2),
  add column if not exists nilai_rata_rata numeric(5,2);

do $$
declare
  column_name text;
begin
  foreach column_name in array array[
    'nilai_kelancaran', 'nilai_makhraj', 'nilai_tajwid',
    'nilai_hafalan', 'nilai_rata_rata'
  ]
  loop
    if not exists (
      select 1
      from pg_constraint
      where conname = 'laporan_tahsin_' || column_name || '_range'
        and conrelid = 'public.laporan_tahsin_tahfidz'::regclass
    ) then
      execute format(
        'alter table public.laporan_tahsin_tahfidz add constraint %I check (%I between 0 and 100)',
        'laporan_tahsin_' || column_name || '_range',
        column_name
      );
    end if;
  end loop;
end $$;

create table if not exists public.parent_student_links (
  parent_id uuid primary key references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists parent_student_links_student_idx
  on public.parent_student_links (student_id);
create index if not exists parent_student_links_active_parent_student_idx
  on public.parent_student_links (parent_id, student_id)
  where status = 'active';

create table if not exists public.teacher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  nip text,
  phone text,
  address text,
  bio text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parent_student_links enable row level security;
alter table public.teacher_profiles enable row level security;

drop policy if exists "Parents can view own child link" on public.parent_student_links;
create policy "Parents can view own child link"
on public.parent_student_links for select to authenticated
using (parent_id = (select auth.uid()));

drop policy if exists "Teachers can view parent child links" on public.parent_student_links;
create policy "Teachers can view parent child links"
on public.parent_student_links for select to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers manage own profile" on public.teacher_profiles;
create policy "Teachers manage own profile"
on public.teacher_profiles for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

-- Akun yang baru selesai verifikasi boleh membuat atau memperbaiki role miliknya.
alter table public.user_roles enable row level security;
drop policy if exists "System can insert user roles" on public.user_roles;
drop policy if exists "Users can view their own role" on public.user_roles;
drop policy if exists "Users can view own role" on public.user_roles;
create policy "Users can view own role"
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create own role" on public.user_roles;
create policy "Users can create own role"
on public.user_roles for insert to authenticated
with check (
  user_id = (select auth.uid())
  and email = (select auth.jwt() ->> 'email')
  and role in ('guru', 'orang_tua')
  and role = (select auth.jwt() -> 'user_metadata' ->> 'role')
);

drop policy if exists "Users can update own role" on public.user_roles;
create policy "Users can update own role"
on public.user_roles for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and email = (select auth.jwt() ->> 'email')
  and role in ('guru', 'orang_tua')
  and role = (select auth.jwt() -> 'user_metadata' ->> 'role')
);

create or replace function public.claim_parent_student_by_nis(p_nis text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_student_id uuid;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role = 'orang_tua'
  ) then
    raise exception 'Hanya akun Orang Tua yang dapat menghubungkan siswa';
  end if;

  select id into target_student_id
  from public.students
  where trim(nis) = trim(p_nis)
  limit 1;

  if target_student_id is null then
    raise exception 'NIS anak tidak ditemukan';
  end if;

  insert into public.parent_student_links (parent_id, student_id, status)
  values (current_user_id, target_student_id, 'active')
  on conflict (parent_id) do update
  set
    student_id = excluded.student_id,
    status = 'active',
    updated_at = now();

  return target_student_id;
end;
$$;

revoke all on function public.claim_parent_student_by_nis(text) from public, anon;
grant execute on function public.claim_parent_student_by_nis(text) to authenticated;

-- Hapus kebijakan SELECT lama yang membuka seluruh data untuk semua akun.
drop policy if exists "Authenticated users can view shared students" on public.students;
drop policy if exists "Teachers can view their students" on public.students;
drop policy if exists "Parents view linked student only" on public.students;
create policy "Parents view linked student only"
on public.students for select to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
  or exists (
    select 1 from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = students.id
      and status = 'active'
  )
);

drop policy if exists "Authenticated users can view shared tadarus reports" on public.laporan_tadarus_pagi;
drop policy if exists "Anyone can view all reports" on public.laporan_tadarus_pagi;
drop policy if exists "Teachers can view their own reports" on public.laporan_tadarus_pagi;
drop policy if exists "Parents view linked tadarus only" on public.laporan_tadarus_pagi;
create policy "Parents view linked tadarus only"
on public.laporan_tadarus_pagi for select to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
  or exists (
    select 1 from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = laporan_tadarus_pagi.student_id
      and status = 'active'
  )
);

drop policy if exists "Authenticated users can view shared tahsin reports" on public.laporan_tahsin_tahfidz;
drop policy if exists "Anyone can view all tahsin reports" on public.laporan_tahsin_tahfidz;
drop policy if exists "Teachers can view their own tahsin reports" on public.laporan_tahsin_tahfidz;
drop policy if exists "Parents view linked tahfidz only" on public.laporan_tahsin_tahfidz;
create policy "Parents view linked tahfidz only"
on public.laporan_tahsin_tahfidz for select to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
  or exists (
    select 1 from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = laporan_tahsin_tahfidz.student_id
      and status = 'active'
  )
);

drop policy if exists "Authenticated users can view daily reports" on public.daily_student_reports;
drop policy if exists "Parents view linked daily reports only" on public.daily_student_reports;
create policy "Parents view linked daily reports only"
on public.daily_student_reports for select to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
  or exists (
    select 1 from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = daily_student_reports.student_id
      and status = 'active'
  )
);

drop policy if exists "Authenticated users can view level exams" on public.level_promotion_exams;
drop policy if exists "Parents view linked level exams only" on public.level_promotion_exams;
create policy "Parents view linked level exams only"
on public.level_promotion_exams for select to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
  or exists (
    select 1 from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = level_promotion_exams.student_id
      and status = 'active'
  )
);

drop policy if exists "Authenticated users can view munaqosyah exams" on public.munaqosyah_exams;
drop policy if exists "Parents view linked munaqosyah only" on public.munaqosyah_exams;
create policy "Parents view linked munaqosyah only"
on public.munaqosyah_exams for select to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
  or exists (
    select 1 from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = munaqosyah_exams.student_id
      and status = 'active'
  )
);

drop policy if exists "Authenticated users can view student reports" on public.student_reports;
drop policy if exists "Authenticated users can view shared student reports" on public.student_reports;
drop policy if exists "Parents view linked student reports only" on public.student_reports;
create policy "Parents view linked student reports only"
on public.student_reports for select to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
  or exists (
    select 1 from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = student_reports.student_id
      and status = 'active'
  )
);

-- Foto siswa hanya boleh diubah Guru. Ini menggantikan fungsi lama yang
-- sebelumnya juga memperbolehkan semua Orang Tua mengganti foto siswa mana pun.
drop policy if exists "Authenticated users can upload student photos" on storage.objects;
drop policy if exists "Teachers can upload student photos" on storage.objects;
create policy "Teachers can upload student photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'student-photos'
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Authenticated users can update student photos" on storage.objects;
drop policy if exists "Teachers can update student photos" on storage.objects;
create policy "Teachers can update student photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'student-photos'
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
)
with check (
  bucket_id = 'student-photos'
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Authenticated users can delete student photos" on storage.objects;
drop policy if exists "Teachers can delete student photos" on storage.objects;
create policy "Teachers can delete student photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'student-photos'
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
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
  if not exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  ) then
    raise exception 'Hanya Guru yang dapat mengubah foto siswa';
  end if;

  if p_foto_url not like '%/storage/v1/object/public/student-photos/%' then
    raise exception 'URL foto tidak valid';
  end if;

  update public.students set foto_url = p_foto_url where id = p_student_id;
  if not found then raise exception 'Siswa tidak ditemukan'; end if;
end;
$$;

-- Bucket profil guru.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Teachers upload own profile photo" on storage.objects;
create policy "Teachers upload own profile photo"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'guru'
  )
);

drop policy if exists "Teachers update own profile photo" on storage.objects;
create policy "Teachers update own profile photo"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.save_munaqosyah_exam(
  p_student_id uuid,
  p_tanggal date,
  p_nilai_kelancaran numeric,
  p_nilai_makhraj numeric,
  p_nilai_tajwid numeric,
  p_nilai_hafalan numeric,
  p_bulan_tahun text,
  p_catatan_guru text
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  average_score numeric(5,2);
  predicate text;
  report_payload jsonb;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role = 'guru'
  ) then
    raise exception 'Hanya Guru yang dapat menyimpan Munaqosyah';
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
  predicate := case
    when average_score >= 90 then 'Mumtaz'
    when average_score >= 80 then 'Jayyid Jiddan'
    when average_score >= 65 then 'Jayyid'
    when average_score >= 50 then 'Maqbul'
    else 'Perlu Bimbingan'
  end;

  report_payload := jsonb_build_object(
    'rowsMunaqosyah', jsonb_build_array(
      jsonb_build_object('label', 'Kelancaran', 'angka', p_nilai_kelancaran),
      jsonb_build_object('label', 'Makhraj', 'angka', p_nilai_makhraj),
      jsonb_build_object('label', 'Tajwid', 'angka', p_nilai_tajwid),
      jsonb_build_object('label', 'Hafalan', 'angka', p_nilai_hafalan)
    ),
    'nilaiRataRata', average_score,
    'kategoriMunaqosyah', jsonb_build_object('indo', predicate),
    'catatanMunaqosyah', coalesce(p_catatan_guru, ''),
    'tanggalMunaqosyah', p_tanggal
  );

  insert into public.munaqosyah_exams (
    student_id, teacher_id, tanggal, jenjang, durasi_menit,
    status, hasil_ujian, catatan_guru
  )
  values (
    p_student_id, current_user_id, p_tanggal, 'SD/MI', 120,
    'Selesai', report_payload, nullif(trim(p_catatan_guru), '')
  )
  on conflict (student_id) do update
  set teacher_id = excluded.teacher_id,
      tanggal = excluded.tanggal,
      status = excluded.status,
      hasil_ujian = excluded.hasil_ujian,
      catatan_guru = excluded.catatan_guru,
      updated_at = now();

  update public.student_reports
  set data_rapor = report_payload,
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
      student_id, teacher_id, bulan_tahun, jenis_rapor, data_rapor
    )
    values (
      p_student_id, current_user_id, p_bulan_tahun, 'munaqosyah', report_payload
    );
  end if;

  return average_score;
end;
$$;

revoke all on function public.save_munaqosyah_exam(
  uuid, date, numeric, numeric, numeric, numeric, text, text
) from public, anon;
grant execute on function public.save_munaqosyah_exam(
  uuid, date, numeric, numeric, numeric, numeric, text, text
) to authenticated;

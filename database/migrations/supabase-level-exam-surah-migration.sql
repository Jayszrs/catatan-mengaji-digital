-- Simpan surat yang diuji pada setiap hasil ujian kenaikan level.
-- Aman dijalankan ulang di Supabase SQL Editor.

alter table public.level_promotion_exams
  add column if not exists nama_surah text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'level_promotion_exams_nama_surah_length'
      and conrelid = 'public.level_promotion_exams'::regclass
  ) then
    alter table public.level_promotion_exams
      add constraint level_promotion_exams_nama_surah_length
      check (
        nama_surah is null
        or length(trim(nama_surah)) between 1 and 100
      );
  end if;
end $$;

comment on column public.level_promotion_exams.nama_surah is
  'Surat ujian yang dipilih dari kurikulum sesuai tahun ajaran dan level asal';

drop function if exists public.save_level_promotion_exam(
  uuid, date, integer, integer, numeric, numeric, numeric, numeric, text, text
);

create or replace function public.save_level_promotion_exam(
  p_student_id uuid,
  p_tanggal date,
  p_level_asal integer,
  p_level_tujuan integer,
  p_nama_surah text,
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
  selected_surah text := nullif(trim(p_nama_surah), '');
  selected_year text := trim(p_tahun_ajaran);
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

  if not exists (
    select 1
    from public.students
    where id = p_student_id
      and level::text = p_level_asal::text
  ) then
    raise exception 'Jenjang asal tidak sesuai dengan jenjang siswa saat ini';
  end if;

  if selected_surah is null or not exists (
    select 1
    from public.surah_curriculum
    where tahun_ajaran = selected_year
      and level = p_level_asal
      and nama_surah = selected_surah
  ) then
    raise exception
      'Surat ujian tidak terdaftar pada jenjang asal dan tahun ajaran yang dipilih';
  end if;

  if p_nilai_kelancaran not between 0 and 100
    or p_nilai_makhraj not between 0 and 100
    or p_nilai_tajwid not between 0 and 100
    or p_nilai_hafalan not between 0 and 100 then
    raise exception 'Nilai harus berada di antara 0 dan 100';
  end if;

  average_score := round(
    (
      p_nilai_kelancaran
      + p_nilai_makhraj
      + p_nilai_tajwid
      + p_nilai_hafalan
    ) / 4,
    2
  );
  result_status :=
    case when average_score >= 75 then 'Lulus' else 'Mengulang' end;

  insert into public.level_promotion_exams (
    student_id,
    teacher_id,
    tanggal,
    level_asal,
    level_tujuan,
    nama_surah,
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
    selected_surah,
    p_nilai_kelancaran,
    p_nilai_makhraj,
    p_nilai_tajwid,
    p_nilai_hafalan,
    average_score,
    result_status,
    selected_year,
    nullif(trim(p_catatan_guru), '')
  )
  on conflict (student_id, level_tujuan, tahun_ajaran) do update
  set teacher_id = excluded.teacher_id,
      tanggal = excluded.tanggal,
      level_asal = excluded.level_asal,
      nama_surah = excluded.nama_surah,
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
  uuid, date, integer, integer, text, numeric, numeric, numeric, numeric, text, text
) from public, anon;

grant execute on function public.save_level_promotion_exam(
  uuid, date, integer, integer, text, numeric, numeric, numeric, numeric, text, text
) to authenticated;

-- Form Munaqosyah lengkap sesuai rekap Excel.
-- Rapor tetap memakai data_rapor dan template yang sudah ada.

create or replace function public.save_munaqosyah_exam_v2(
  p_student_id uuid,
  p_tanggal date,
  p_juz text,
  p_rows jsonb,
  p_jumlah jsonb,
  p_bulan_tahun text,
  p_kepribadian jsonb,
  p_catatan_guru text
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  score_kelancaran numeric;
  score_makhorijul numeric;
  score_tajwid numeric;
  score_sambung_ayat numeric;
  total_score numeric;
  average_score numeric(5,2);
  predicate text;
  predicate_arab text;
  report_payload jsonb;
begin
  if current_user_id is null or not exists (
    select 1
    from public.user_roles
    where user_id = current_user_id
      and role = 'guru'
  ) then
    raise exception 'Hanya Guru yang dapat menyimpan Munaqosyah';
  end if;

  if not exists (
    select 1
    from public.students
    where id = p_student_id
  ) then
    raise exception 'Data siswa tidak ditemukan';
  end if;

  if p_tanggal is null then
    raise exception 'Tanggal ujian wajib diisi';
  end if;

  if nullif(trim(coalesce(p_juz, '')), '') is null then
    raise exception 'Juz wajib diisi';
  end if;

  if nullif(trim(coalesce(p_bulan_tahun, '')), '') is null then
    raise exception 'Periode rapor wajib diisi';
  end if;

  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'Kategori nilai Munaqosyah tidak valid';
  end if;

  if jsonb_array_length(p_rows) <> 4 then
    raise exception 'Empat kategori nilai Munaqosyah wajib diisi';
  end if;

  begin
    score_kelancaran := nullif(p_rows -> 0 ->> 'angka', '')::numeric;
    score_makhorijul := nullif(p_rows -> 1 ->> 'angka', '')::numeric;
    score_tajwid := nullif(p_rows -> 2 ->> 'angka', '')::numeric;
    score_sambung_ayat := nullif(p_rows -> 3 ->> 'angka', '')::numeric;
  exception
    when invalid_text_representation then
      raise exception 'Nilai Munaqosyah harus berupa angka';
  end;

  if score_kelancaran is null
    or score_makhorijul is null
    or score_tajwid is null
    or score_sambung_ayat is null
    or score_kelancaran not between 0 and 100
    or score_makhorijul not between 0 and 100
    or score_tajwid not between 0 and 100
    or score_sambung_ayat not between 0 and 100 then
    raise exception 'Nilai harus berada di antara 0 dan 100';
  end if;

  if trunc(score_kelancaran) <> score_kelancaran
    or trunc(score_makhorijul) <> score_makhorijul
    or trunc(score_tajwid) <> score_tajwid
    or trunc(score_sambung_ayat) <> score_sambung_ayat then
    raise exception 'Nilai Munaqosyah harus berupa bilangan bulat';
  end if;

  if jsonb_typeof(p_kepribadian) is distinct from 'object'
    or nullif(p_kepribadian #>> '{akhlaq,nilai}', '') is null
    or nullif(p_kepribadian #>> '{kedisiplinan,nilai}', '') is null
    or nullif(p_kepribadian #>> '{kerapihan,nilai}', '') is null then
    raise exception 'Akhlaq, kedisiplinan, dan kerapihan wajib diisi';
  end if;

  total_score :=
    score_kelancaran +
    score_makhorijul +
    score_tajwid +
    score_sambung_ayat;
  average_score := round(total_score / 4, 2);

  if average_score >= 90 then
    predicate := 'Mumtaz';
    predicate_arab := 'ممتاز';
  elsif average_score >= 80 then
    predicate := 'Jayyid Jiddan';
    predicate_arab := 'جيد جدا';
  elsif average_score >= 65 then
    predicate := 'Jayyid';
    predicate_arab := 'جيد';
  elsif average_score >= 50 then
    predicate := 'Maqbul';
    predicate_arab := 'مقبول';
  else
    predicate := 'Perlu Bimbingan';
    predicate_arab := 'يحتاج إلى التوجيه';
  end if;

  report_payload := jsonb_build_object(
    'juz', trim(p_juz),
    'rowsMunaqosyah', p_rows,
    'jumlahMunaqosyah',
      coalesce(p_jumlah, '{}'::jsonb) ||
      jsonb_build_object('angka', total_score),
    'nilaiRataRata', average_score,
    'kategoriMunaqosyah',
      jsonb_build_object('indo', predicate, 'arab', predicate_arab),
    'kepribadianMunaqosyah', p_kepribadian,
    'catatanMunaqosyah', coalesce(p_catatan_guru, ''),
    'tanggalMunaqosyah', p_tanggal
  );

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
    report_payload,
    nullif(trim(coalesce(p_catatan_guru, '')), '')
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
      and bulan_tahun = trim(p_bulan_tahun)
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
      trim(p_bulan_tahun),
      'munaqosyah',
      report_payload
    );
  end if;

  return average_score;
end;
$$;

revoke all on function public.save_munaqosyah_exam_v2(
  uuid,
  date,
  text,
  jsonb,
  jsonb,
  text,
  jsonb,
  text
) from public, anon;

grant execute on function public.save_munaqosyah_exam_v2(
  uuid,
  date,
  text,
  jsonb,
  jsonb,
  text,
  jsonb,
  text
) to authenticated;

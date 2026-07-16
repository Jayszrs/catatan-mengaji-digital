-- Migrasi data bersama lintas akun guru/admin dan NIS sebagai kunci bisnis utama.
-- Jalankan di Supabase SQL Editor setelah backup data.

-- 1) Pastikan semua siswa punya NIS. NIS kosong akan dibuat otomatis berurutan.
WITH max_nis AS (
  SELECT GREATEST(
    1000000,
    COALESCE(MAX(nis::bigint) FILTER (WHERE nis ~ '^[0-9]+$'), 1000000)
  ) AS value
  FROM students
),
blank_students AS (
  SELECT id, (SELECT value FROM max_nis) + ROW_NUMBER() OVER (ORDER BY created_at, id) AS generated_nis
  FROM students
  WHERE NULLIF(TRIM(COALESCE(nis, '')), '') IS NULL
)
UPDATE students
SET nis = blank_students.generated_nis::text
FROM blank_students
WHERE students.id = blank_students.id;

-- 2) Rapikan duplikat NIS lama supaya constraint unik bisa dibuat.
WITH max_nis AS (
  SELECT GREATEST(
    1000000,
    COALESCE(MAX(nis::bigint) FILTER (WHERE nis ~ '^[0-9]+$'), 1000000)
  ) AS value
  FROM students
),
duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY TRIM(nis) ORDER BY created_at, id) AS duplicate_order
  FROM students
  WHERE NULLIF(TRIM(nis), '') IS NOT NULL
),
students_to_fix AS (
  SELECT id, (SELECT value FROM max_nis) + ROW_NUMBER() OVER (ORDER BY id) AS generated_nis
  FROM duplicates
  WHERE duplicate_order > 1
)
UPDATE students
SET nis = students_to_fix.generated_nis::text
FROM students_to_fix
WHERE students.id = students_to_fix.id;

ALTER TABLE students
  ALTER COLUMN nis SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS students_nis_unique ON students (nis);
COMMENT ON COLUMN students.nis IS 'Primary business key siswa untuk import, pencarian, dan sinkronisasi lintas akun.';

-- 3) RLS students: semua akun terautentikasi dapat melihat data siswa bersama.
DROP POLICY IF EXISTS "Teachers can view their students" ON students;
DROP POLICY IF EXISTS "Teachers can insert students" ON students;
DROP POLICY IF EXISTS "Teachers can update students" ON students;
DROP POLICY IF EXISTS "Teachers can delete students" ON students;
DROP POLICY IF EXISTS "Authenticated users can view shared students" ON students;
DROP POLICY IF EXISTS "Teachers can insert shared students" ON students;
DROP POLICY IF EXISTS "Teachers can update shared students" ON students;
DROP POLICY IF EXISTS "Teachers can delete shared students" ON students;

CREATE POLICY "Authenticated users can view shared students"
ON students FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Teachers can insert shared students"
ON students FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

CREATE POLICY "Teachers can update shared students"
ON students FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

CREATE POLICY "Teachers can delete shared students"
ON students FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

-- 4) RLS laporan: laporan bisa dilihat lintas akun, tetapi pembuatan tetap oleh guru.
DROP POLICY IF EXISTS "Teachers can view their own reports" ON laporan_tadarus_pagi;
DROP POLICY IF EXISTS "Teachers can create reports" ON laporan_tadarus_pagi;
DROP POLICY IF EXISTS "Teachers can update their reports" ON laporan_tadarus_pagi;
DROP POLICY IF EXISTS "Anyone can view all reports" ON laporan_tadarus_pagi;
DROP POLICY IF EXISTS "Authenticated users can view shared tadarus reports" ON laporan_tadarus_pagi;
DROP POLICY IF EXISTS "Teachers can create shared tadarus reports" ON laporan_tadarus_pagi;
DROP POLICY IF EXISTS "Teachers can update shared tadarus reports" ON laporan_tadarus_pagi;
DROP POLICY IF EXISTS "Teachers can delete shared tadarus reports" ON laporan_tadarus_pagi;

CREATE POLICY "Authenticated users can view shared tadarus reports"
ON laporan_tadarus_pagi FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Teachers can create shared tadarus reports"
ON laporan_tadarus_pagi FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

CREATE POLICY "Teachers can update shared tadarus reports"
ON laporan_tadarus_pagi FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

CREATE POLICY "Teachers can delete shared tadarus reports"
ON laporan_tadarus_pagi FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

DROP POLICY IF EXISTS "Teachers can view their own tahsin reports" ON laporan_tahsin_tahfidz;
DROP POLICY IF EXISTS "Teachers can create tahsin reports" ON laporan_tahsin_tahfidz;
DROP POLICY IF EXISTS "Teachers can update their tahsin reports" ON laporan_tahsin_tahfidz;
DROP POLICY IF EXISTS "Anyone can view all tahsin reports" ON laporan_tahsin_tahfidz;
DROP POLICY IF EXISTS "Authenticated users can view shared tahsin reports" ON laporan_tahsin_tahfidz;
DROP POLICY IF EXISTS "Teachers can create shared tahsin reports" ON laporan_tahsin_tahfidz;
DROP POLICY IF EXISTS "Teachers can update shared tahsin reports" ON laporan_tahsin_tahfidz;
DROP POLICY IF EXISTS "Teachers can delete shared tahsin reports" ON laporan_tahsin_tahfidz;

CREATE POLICY "Authenticated users can view shared tahsin reports"
ON laporan_tahsin_tahfidz FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Teachers can create shared tahsin reports"
ON laporan_tahsin_tahfidz FOR INSERT TO authenticated
WITH CHECK (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

CREATE POLICY "Teachers can update shared tahsin reports"
ON laporan_tahsin_tahfidz FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

CREATE POLICY "Teachers can delete shared tahsin reports"
ON laporan_tahsin_tahfidz FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'guru'
  )
);

-- 5) Jika tabel student_reports sudah ada, aktifkan akses bersama juga.
DO $$
BEGIN
  IF to_regclass('public.student_reports') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view shared student reports" ON student_reports';
    EXECUTE 'DROP POLICY IF EXISTS "Teachers can create shared student reports" ON student_reports';
    EXECUTE 'DROP POLICY IF EXISTS "Teachers can update shared student reports" ON student_reports';
    EXECUTE 'CREATE POLICY "Authenticated users can view shared student reports" ON student_reports FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "Teachers can create shared student reports" ON student_reports FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Teachers can update shared student reports" ON student_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

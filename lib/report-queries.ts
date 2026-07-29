import { isMissingDatabaseFeatureError } from "@/lib/app-errors";
import { supabase } from "@/lib/supabase";

const memorizationColumns =
  "tanggal,tahun_ajaran,nama_surah,ayat,murojaah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan";

const legacyMemorizationColumns =
  "tanggal,nama_surah,ayat,murojaah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan";

const levelExamColumns =
  "tanggal,level_asal,level_tujuan,nama_surah,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,status,tahun_ajaran,catatan_guru";

const legacyLevelExamColumns =
  "tanggal,level_asal,level_tujuan,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,status,tahun_ajaran,catatan_guru";

export async function loadDailyMemorizationRows(
  studentId: string,
  selectedDate?: string,
) {
  let currentQuery = supabase
    .from("laporan_tahsin_tahfidz")
    .select(memorizationColumns)
    .eq("student_id", studentId);
  if (selectedDate) currentQuery = currentQuery.eq("tanggal", selectedDate);
  const currentResult = await currentQuery.order("tanggal", {
    ascending: false,
  });

  if (
    !currentResult.error ||
    !isMissingDatabaseFeatureError(currentResult.error)
  ) {
    return currentResult;
  }

  // Database lama belum mempunyai kolom tahun_ajaran. Rapor lama tetap dapat
  // ditampilkan; setelah migrasi dijalankan query pertama otomatis dipakai.
  let legacyQuery = supabase
    .from("laporan_tahsin_tahfidz")
    .select(legacyMemorizationColumns)
    .eq("student_id", studentId);
  if (selectedDate) legacyQuery = legacyQuery.eq("tanggal", selectedDate);
  return legacyQuery.order("tanggal", { ascending: false });
}

export async function loadLevelExamRows(studentId: string) {
  const currentResult = await supabase
    .from("level_promotion_exams")
    .select(levelExamColumns)
    .eq("student_id", studentId)
    .order("tanggal", { ascending: false });

  if (
    !currentResult.error ||
    !isMissingDatabaseFeatureError(currentResult.error)
  ) {
    return currentResult;
  }

  // Rapor lama tetap dapat dibuka sebelum kolom surat ujian dimigrasikan.
  return supabase
    .from("level_promotion_exams")
    .select(legacyLevelExamColumns)
    .eq("student_id", studentId)
    .order("tanggal", { ascending: false });
}

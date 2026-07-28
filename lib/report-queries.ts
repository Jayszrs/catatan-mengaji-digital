import { isMissingDatabaseFeatureError } from "@/lib/app-errors";
import { supabase } from "@/lib/supabase";

const memorizationColumns =
  "tanggal,tahun_ajaran,nama_surah,ayat,murojaah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan";

const legacyMemorizationColumns =
  "tanggal,nama_surah,ayat,murojaah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan";

export async function loadDailyMemorizationRows(studentId: string) {
  const currentResult = await supabase
    .from("laporan_tahsin_tahfidz")
    .select(memorizationColumns)
    .eq("student_id", studentId)
    .order("tanggal", { ascending: false });

  if (
    !currentResult.error ||
    !isMissingDatabaseFeatureError(currentResult.error)
  ) {
    return currentResult;
  }

  // Database lama belum mempunyai kolom tahun_ajaran. Rapor lama tetap dapat
  // ditampilkan; setelah migrasi dijalankan query pertama otomatis dipakai.
  return supabase
    .from("laporan_tahsin_tahfidz")
    .select(legacyMemorizationColumns)
    .eq("student_id", studentId)
    .order("tanggal", { ascending: false });
}

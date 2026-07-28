"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Award, BookOpenCheck, Download, GraduationCap, Loader2, Printer } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  DailyMemorizationExportRow,
  downloadDailyMemorizationReports,
  downloadLevelExamReports,
  downloadMunaqosyahReport,
  LevelExamExportRow,
  MunaqosyahExportRow,
} from "@/lib/report-exports";
import { supabase } from "@/lib/supabase";
import { getAppErrorMessage } from "@/lib/app-errors";

interface StudentOption {
  id: string;
  nama_lengkap: string;
  nis?: string | null;
  kelas?: string | null;
}

function AutomaticReportContent() {
  const params = useSearchParams();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState(params.get("studentId") || "");
  const [daily, setDaily] = useState<DailyMemorizationExportRow[]>([]);
  const [levels, setLevels] = useState<LevelExamExportRow[]>([]);
  const [munaq, setMunaq] = useState<MunaqosyahExportRow | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error: queryError } = await supabase.from("students").select("id,nama_lengkap,nis,kelas").order("nama_lengkap");
      if (queryError) throw queryError;
      setStudents(data || []);
      setStudentId((current) => current || data?.[0]?.id || "");
    };
    loadStudents()
      .catch((issue) =>
        setError(getAppErrorMessage(issue, "Gagal memuat daftar siswa.")),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!studentId) return;
    const loadReports = async () => {
      setLoading(true);
      const [dailyResult, levelResult, munaqResult] = await Promise.all([
        supabase.from("laporan_tahsin_tahfidz").select("tanggal,nama_surah,ayat,murojaah,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan").eq("student_id", studentId).order("tanggal", { ascending: false }),
        supabase.from("level_promotion_exams").select("tanggal,level_asal,level_tujuan,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,status,tahun_ajaran,catatan_guru").eq("student_id", studentId).order("tanggal", { ascending: false }),
        supabase.from("munaqosyah_exams").select("tanggal,hasil_ujian,catatan_guru").eq("student_id", studentId).maybeSingle(),
      ]);
      if (dailyResult.error) throw dailyResult.error;
      if (levelResult.error) throw levelResult.error;
      if (munaqResult.error) throw munaqResult.error;
      setDaily(dailyResult.data || []);
      setLevels(levelResult.data || []);
      setMunaq(munaqResult.data || undefined);
    };
    loadReports()
      .catch((issue) =>
        setError(getAppErrorMessage(issue, "Gagal memuat rapor otomatis.")),
      )
      .finally(() => setLoading(false));
  }, [studentId]);

  const selected = students.find((student) => student.id === studentId);
  const name = selected?.nama_lengkap || "siswa";

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div>
          <h1 className="text-4xl font-black text-gray-900">3 Rapor Otomatis</h1>
          <p className="mt-2 font-medium text-gray-500">Nilai dibaca langsung dari form Hafalan Harian, Ujian Level, dan Munaqosyah.</p>
        </div>
        <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="min-w-72 rounded-xl border border-gray-200 bg-white px-5 py-3 font-bold">
          {students.map((student) => <option key={student.id} value={student.id}>{student.nama_lengkap} · {student.nis || "-"}</option>)}
        </select>
      </div>
      {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
      {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={38} /></div> : (
        <div className="space-y-6">
          <ReportSection
            icon={<BookOpenCheck />}
            title="Rapor Hafalan Harian"
            subtitle={`${daily.length} input tersimpan`}
            score={daily[0]?.nilai_rata_rata}
            onDownload={() => downloadDailyMemorizationReports(name, daily)}
          >
            <CompactScores values={daily[0] ? [
              ["Kelancaran", daily[0].nilai_kelancaran],
              ["Makhraj", daily[0].nilai_makhraj],
              ["Tajwid", daily[0].nilai_tajwid],
              ["Hafalan", daily[0].nilai_hafalan],
            ] : []} />
          </ReportSection>
          <ReportSection
            icon={<GraduationCap />}
            title="Rapor Hafalan Level"
            subtitle={levels[0] ? `Level ${levels[0].level_asal} → ${levels[0].level_tujuan} · ${levels[0].status}` : "Belum ada ujian level"}
            score={levels[0]?.nilai_rata_rata}
            onDownload={() => downloadLevelExamReports(name, levels)}
          >
            <CompactScores values={levels[0] ? [
              ["Kelancaran", levels[0].nilai_kelancaran],
              ["Makhraj", levels[0].nilai_makhraj],
              ["Tajwid", levels[0].nilai_tajwid],
              ["Hafalan", levels[0].nilai_hafalan],
            ] : []} />
          </ReportSection>
          <ReportSection
            icon={<Award />}
            title="Rapor Munaqosyah"
            subtitle={munaq?.hasil_ujian?.kategoriMunaqosyah?.indo || "Belum ada ujian Munaqosyah"}
            score={munaq?.hasil_ujian?.nilaiRataRata}
            onDownload={() => downloadMunaqosyahReport(name, munaq)}
          >
            <CompactScores values={(munaq?.hasil_ujian?.rowsMunaqosyah || []).map((row, index) => [row.label || `Komponen ${index + 1}`, row.angka])} />
          </ReportSection>
        </div>
      )}
    </DashboardLayout>
  );
}

function ReportSection({ icon, title, subtitle, score, onDownload, children }: { icon: React.ReactNode; title: string; subtitle: string; score?: number | null; onDownload: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm print:break-inside-avoid">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><span className="rounded-xl bg-emerald-100 p-3 text-emerald-700">{icon}</span><div><h2 className="text-xl font-black text-gray-900">{title}</h2><p className="font-medium text-gray-500">{subtitle}</p></div></div>
        <div className="flex items-center gap-3"><span className="text-4xl font-black text-emerald-700">{score === undefined || score === null ? "-" : Number(score).toFixed(2)}</span><button onClick={onDownload} className="rounded-xl bg-emerald-600 p-3 text-white print:hidden" title="Download"><Download size={19} /></button><button onClick={() => window.print()} className="rounded-xl border border-gray-200 p-3 text-gray-600 print:hidden" title="Cetak"><Printer size={19} /></button></div>
      </div>
      {children}
    </section>
  );
}

function CompactScores({ values }: { values: Array<[string, number | null | undefined]> }) {
  if (!values.length) return <p className="mt-5 rounded-xl bg-gray-50 p-5 text-center font-bold text-gray-500">Belum ada nilai.</p>;
  return <div className="mt-5 grid gap-3 sm:grid-cols-4">{values.map(([label, value]) => <div key={label} className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-sm font-bold text-gray-500">{label}</p><p className="mt-1 text-2xl font-black text-gray-900">{value ?? "-"}</p></div>)}</div>;
}

export default function AutomaticReportPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={38} /></div>}><AutomaticReportContent /></Suspense>;
}

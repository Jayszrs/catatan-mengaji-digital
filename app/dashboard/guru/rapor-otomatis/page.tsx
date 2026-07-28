"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BookOpenCheck,
  Download,
  GraduationCap,
  Loader2,
  Printer,
} from "lucide-react";
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
  level?: number | string | null;
}

type ReportType = "daily" | "level" | "munaqosyah";

const reportOptions: Array<{
  id: ReportType;
  title: string;
  description: string;
  icon: typeof BookOpenCheck;
}> = [
  {
    id: "daily",
    title: "Rapor Hafalan Harian",
    description: "Nilai dari Input Tahsin & Tahfidz",
    icon: BookOpenCheck,
  },
  {
    id: "level",
    title: "Rapor Hafalan Level",
    description: "Nilai dari Ujian Kenaikan Level",
    icon: GraduationCap,
  },
  {
    id: "munaqosyah",
    title: "Rapor Munaqosyah",
    description: "Nilai dari Form Munaqosyah",
    icon: Award,
  },
];

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatScore(value?: number | null) {
  return value === undefined || value === null ? "-" : Number(value).toFixed(0);
}

function AutomaticReportContent() {
  const params = useSearchParams();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState(params.get("studentId") || "");
  const [activeReport, setActiveReport] = useState<ReportType>("daily");
  const [daily, setDaily] = useState<DailyMemorizationExportRow[]>([]);
  const [levels, setLevels] = useState<LevelExamExportRow[]>([]);
  const [munaq, setMunaq] = useState<MunaqosyahExportRow | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error: queryError } = await supabase
        .from("students")
        .select("id,nama_lengkap,nis,kelas,level")
        .order("nama_lengkap");
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
      setError("");
      const [dailyResult, levelResult, munaqResult] = await Promise.all([
        supabase
          .from("laporan_tahsin_tahfidz")
          .select(
            "tanggal,nama_surah,ayat,murojaah,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan",
          )
          .eq("student_id", studentId)
          .order("tanggal", { ascending: false }),
        supabase
          .from("level_promotion_exams")
          .select(
            "tanggal,level_asal,level_tujuan,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,status,tahun_ajaran,catatan_guru",
          )
          .eq("student_id", studentId)
          .order("tanggal", { ascending: false }),
        supabase
          .from("munaqosyah_exams")
          .select("tanggal,hasil_ujian,catatan_guru")
          .eq("student_id", studentId)
          .maybeSingle(),
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
  const hasData =
    activeReport === "daily"
      ? daily.length > 0
      : activeReport === "level"
        ? levels.length > 0
        : Boolean(munaq);

  const handleDownload = () => {
    try {
      setError("");
      if (activeReport === "daily") {
        downloadDailyMemorizationReports(name, daily);
      } else if (activeReport === "level") {
        downloadLevelExamReports(name, levels);
      } else {
        downloadMunaqosyahReport(name, munaq);
      }
    } catch (issue) {
      setError(getAppErrorMessage(issue, "Gagal mengunduh rapor."));
    }
  };

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            3 Rapor Otomatis
          </h1>
          <p className="mt-2 font-medium text-gray-500">
            Template rapor resmi dengan nilai otomatis dari tiga form penilaian.
          </p>
        </div>
        <select
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          className="min-w-72 rounded-xl border border-gray-200 bg-white px-5 py-3 font-bold shadow-sm"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.nama_lengkap} · {student.nis || "-"}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-3 print:hidden">
        {reportOptions.map((option) => {
          const Icon = option.icon;
          const active = activeReport === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveReport(option.id)}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-[#1b4332] bg-[#1b4332] text-white shadow-lg shadow-green-900/15"
                  : "border-gray-200 bg-white text-gray-800 hover:border-emerald-300"
              }`}
            >
              <span
                className={`rounded-xl p-3 ${
                  active ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <Icon size={23} />
              </span>
              <span>
                <span className="block font-black">{option.title}</span>
                <span
                  className={`mt-1 block text-xs font-semibold ${
                    active ? "text-emerald-100" : "text-gray-500"
                  }`}
                >
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-end print:hidden">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!hasData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-bold text-[#1b4332] shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={18} /> Download Excel
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-5 py-3 font-bold text-white shadow-sm"
        >
          <Printer size={18} /> Cetak / Simpan PDF
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700 print:hidden">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={38} />
        </div>
      ) : (
        <OfficialReportTemplate
          reportType={activeReport}
          student={selected}
          daily={daily}
          levels={levels}
          munaq={munaq}
        />
      )}
    </DashboardLayout>
  );
}

function OfficialReportTemplate({
  reportType,
  student,
  daily,
  levels,
  munaq,
}: {
  reportType: ReportType;
  student?: StudentOption;
  daily: DailyMemorizationExportRow[];
  levels: LevelExamExportRow[];
  munaq?: MunaqosyahExportRow;
}) {
  const latestDaily = daily[0];
  const latestLevel = levels[0];
  const title =
    reportType === "daily"
      ? "Rapor Hafalan Harian"
      : reportType === "level"
        ? "Rapor Ujian Kenaikan Level"
        : "Lembar Munaqosyah";
  const period =
    reportType === "daily"
      ? formatDate(latestDaily?.tanggal)
      : reportType === "level"
        ? latestLevel?.tahun_ajaran || formatDate(latestLevel?.tanggal)
        : formatDate(munaq?.tanggal);
  const reportDate =
    reportType === "daily"
      ? latestDaily?.tanggal
      : reportType === "level"
        ? latestLevel?.tanggal
        : munaq?.tanggal;
  const teacherNote =
    reportType === "daily"
      ? latestDaily?.keterangan
      : reportType === "level"
        ? latestLevel?.catatan_guru
        : munaq?.catatan_guru;

  return (
    <div className="w-full overflow-x-auto pb-8 print:overflow-visible print:pb-0">
      <article className="relative mx-auto min-h-[297mm] w-[210mm] min-w-[210mm] overflow-hidden bg-white p-[15mm] text-[13px] leading-relaxed text-gray-900 shadow-xl print:min-h-0 print:w-full print:min-w-0 print:p-[10mm] print:shadow-none">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.06]">
          <img
            src="/logo.png"
            alt=""
            className="h-[400px] w-[400px] object-contain mix-blend-multiply"
          />
        </div>

        <div className="relative z-10">
          <header className="mb-1 flex items-center justify-between border-b-2 border-black pb-4">
            <img
              src="/logo.png"
              alt="Logo SD Islam Labschool Bani Saleh"
              className="h-28 w-28 object-contain mix-blend-multiply"
            />
            <div className="flex-1 text-center">
              <p className="text-sm font-bold uppercase tracking-wider">
                Yayasan Bani Saleh
              </p>
              <h2 className="text-xl font-black uppercase tracking-wider text-[#1b4332]">
                Sekolah Dasar Islam Labschool Bani Saleh
              </h2>
              <h3 className="mt-1 text-xl font-bold uppercase tracking-widest">
                {title}
              </h3>
              <p className="mt-1 font-bold">
                NPSN: 70010942 <span className="ml-4">TERAKREDITASI: A</span>
              </p>
              <p className="mt-1 text-[10px] font-bold">
                Jl. Pangeran RT 001/008 Desa Lubang Buaya Kec. Setu Kab.
                Bekasi · sdilabschoolbanisalehsetu@gmail.com
              </p>
            </div>
            <img
              src="/logo-tahsin.png"
              alt="Logo Tahsin Tahfizh"
              className="h-28 w-28 object-contain mix-blend-multiply"
            />
          </header>
          <div className="mb-6 w-full border-b-4 border-black" />

          <section className="mb-6 flex items-start justify-between font-bold">
            <table className="w-[48%]">
              <tbody>
                <tr>
                  <td className="w-36 py-1">Nama Peserta Didik</td>
                  <td className="w-4">:</td>
                  <td className="uppercase">{student?.nama_lengkap || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1">NIS</td>
                  <td>:</td>
                  <td>{student?.nis || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1">Kelas</td>
                  <td>:</td>
                  <td>{student?.kelas || "-"}</td>
                </tr>
              </tbody>
            </table>
            <table className="w-[42%]">
              <tbody>
                <tr>
                  <td className="w-28 py-1">Level Tahfizh</td>
                  <td className="w-4">:</td>
                  <td>{student?.level ? `Level ${student.level}` : "-"}</td>
                </tr>
                <tr>
                  <td className="py-1">Periode</td>
                  <td>:</td>
                  <td>{period}</td>
                </tr>
                <tr>
                  <td className="py-1">Sumber Nilai</td>
                  <td>:</td>
                  <td>Terisi Otomatis</td>
                </tr>
              </tbody>
            </table>
          </section>

          {reportType === "daily" && <DailyReportTable rows={daily} />}
          {reportType === "level" && <LevelReportTable row={latestLevel} />}
          {reportType === "munaqosyah" && <MunaqosyahReportTable row={munaq} />}

          <section className="mb-10 mt-6 border border-black">
            <h4 className="border-b border-black bg-gray-100 py-2 text-center font-bold uppercase tracking-widest">
              Catatan Guru
            </h4>
            <p className="min-h-24 p-4 text-justify font-medium">
              {teacherNote || "Belum ada catatan guru."}
            </p>
          </section>

          <footer className="mt-8 flex justify-between text-sm">
            <div className="w-1/3 pt-6 text-center">
              <p className="mb-20 font-bold">Orang Tua/Wali</p>
              <div className="mx-auto w-48 border-b-2 border-dotted border-black" />
            </div>
            <div className="w-1/3 pt-6 text-center">
              <p className="mb-20 font-bold">Kepala Sekolah</p>
              <p className="font-bold underline">WIDI NURMARA, S.Pd.I</p>
            </div>
            <div className="w-1/3 text-center">
              <p>Dikeluarkan di : Bekasi</p>
              <p>Tanggal : {formatDate(reportDate)}</p>
              <p className="mb-16 mt-3 font-bold">Koordinator Tahfizh</p>
              <p className="font-bold underline">ULFA DWI HASTUTI, S.LI</p>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}

function DailyReportTable({ rows }: { rows: DailyMemorizationExportRow[] }) {
  const visibleRows = rows.slice(0, 5);
  return (
    <table className="w-full border-collapse border border-black text-center text-xs">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black p-2" rowSpan={2}>No</th>
          <th className="border border-black p-2" rowSpan={2}>Tanggal</th>
          <th className="border border-black p-2" rowSpan={2}>Surah / Ayat</th>
          <th className="border border-black p-2" colSpan={4}>Kriteria Penilaian</th>
          <th className="border border-black p-2" rowSpan={2}>Rata-rata</th>
          <th className="border border-black p-2" rowSpan={2}>Ket.</th>
        </tr>
        <tr className="bg-gray-50">
          <th className="border border-black p-1">Kelancaran</th>
          <th className="border border-black p-1">Makhraj</th>
          <th className="border border-black p-1">Tajwid</th>
          <th className="border border-black p-1">Hafalan</th>
        </tr>
      </thead>
      <tbody>
        {visibleRows.length ? (
          visibleRows.map((row, index) => (
            <tr key={`${row.tanggal}-${index}`} className="h-10">
              <td className="border border-black">{index + 1}</td>
              <td className="border border-black px-2">{formatDate(row.tanggal)}</td>
              <td className="border border-black px-2 text-left">
                {row.nama_surah || "-"} {row.ayat ? `· ${row.ayat}` : ""}
              </td>
              <td className="border border-black">{formatScore(row.nilai_kelancaran)}</td>
              <td className="border border-black">{formatScore(row.nilai_makhraj)}</td>
              <td className="border border-black">{formatScore(row.nilai_tajwid)}</td>
              <td className="border border-black">{formatScore(row.nilai_hafalan)}</td>
              <td className="border border-black font-bold">{formatScore(row.nilai_rata_rata)}</td>
              <td className="border border-black px-2">{row.keterangan || "-"}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td className="border border-black p-8 font-bold text-gray-500" colSpan={9}>
              Belum ada nilai hafalan harian.
            </td>
          </tr>
        )}
      </tbody>
      <tfoot>
        <tr className="bg-gray-100 font-bold">
          <td className="border border-black p-2" colSpan={3}>KKM 75</td>
          <td className="border border-black p-2" colSpan={6}>
            Nilai otomatis dari Input Tahsin & Tahfidz
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

function LevelReportTable({ row }: { row?: LevelExamExportRow }) {
  const scores = row
    ? ([
        ["Kelancaran", row.nilai_kelancaran],
        ["Makhraj", row.nilai_makhraj],
        ["Tajwid", row.nilai_tajwid],
        ["Hafalan", row.nilai_hafalan],
      ] as Array<[string, number | null | undefined]>)
    : [];

  return (
    <div>
      <table className="mb-5 w-full border-collapse border border-black">
        <tbody>
          <tr>
            <th className="w-1/4 border border-black bg-gray-100 p-3 text-left">Tanggal Ujian</th>
            <td className="w-1/4 border border-black p-3">{formatDate(row?.tanggal)}</td>
            <th className="w-1/4 border border-black bg-gray-100 p-3 text-left">Kenaikan Level</th>
            <td className="w-1/4 border border-black p-3 font-bold">
              {row ? `Level ${row.level_asal} → Level ${row.level_tujuan}` : "-"}
            </td>
          </tr>
          <tr>
            <th className="border border-black bg-gray-100 p-3 text-left">Tahun Ajaran</th>
            <td className="border border-black p-3">{row?.tahun_ajaran || "-"}</td>
            <th className="border border-black bg-gray-100 p-3 text-left">Hasil</th>
            <td className="border border-black p-3 font-black">{row?.status || "-"}</td>
          </tr>
        </tbody>
      </table>
      <ScoreTable
        rows={scores}
        average={row?.nilai_rata_rata}
        emptyMessage="Belum ada hasil ujian kenaikan level."
      />
    </div>
  );
}

function MunaqosyahReportTable({ row }: { row?: MunaqosyahExportRow }) {
  const sourceRows = row?.hasil_ujian?.rowsMunaqosyah || [];
  const fallbackLabels = ["Kelancaran", "Makhraj", "Tajwid", "Hafalan"];
  const scores = sourceRows.map((score, index) => [
    score.label || fallbackLabels[index] || `Komponen ${index + 1}`,
    score.angka,
  ] as [string, number | null | undefined]);

  return (
    <div>
      <ScoreTable
        rows={scores}
        average={row?.hasil_ujian?.nilaiRataRata}
        emptyMessage="Belum ada hasil ujian Munaqosyah."
      />
      <div className="mt-5 flex border border-black text-center font-bold">
        <span className="w-1/2 border-r border-black bg-gray-100 p-3 uppercase">
          Predikat
        </span>
        <span className="w-1/2 p-3 uppercase">
          {row?.hasil_ujian?.kategoriMunaqosyah?.indo || "-"}
        </span>
      </div>
    </div>
  );
}

function ScoreTable({
  rows,
  average,
  emptyMessage,
}: {
  rows: Array<[string, number | null | undefined]>;
  average?: number | null;
  emptyMessage: string;
}) {
  return (
    <table className="w-full border-collapse border border-black text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="w-16 border border-black p-2">No</th>
          <th className="border border-black p-2">Kriteria Penilaian</th>
          <th className="w-36 border border-black p-2">Nilai</th>
          <th className="w-40 border border-black p-2">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map(([label, value], index) => (
            <tr key={`${label}-${index}`} className="h-11">
              <td className="border border-black">{index + 1}</td>
              <td className="border border-black px-4 text-left">{label}</td>
              <td className="border border-black font-bold">{formatScore(value)}</td>
              <td className="border border-black">
                {value === undefined || value === null
                  ? "-"
                  : Number(value) >= 75
                    ? "Tercapai"
                    : "Perlu Bimbingan"}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td className="border border-black p-8 font-bold text-gray-500" colSpan={4}>
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
      <tfoot>
        <tr className="bg-gray-100 font-black">
          <td className="border border-black p-3 uppercase" colSpan={2}>Rata-rata</td>
          <td className="border border-black p-3">{formatScore(average)}</td>
          <td className="border border-black p-3">
            {average === undefined || average === null
              ? "-"
              : Number(average) >= 75
                ? "Lulus"
                : "Mengulang"}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

export default function AutomaticReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={38} />
        </div>
      }
    >
      <AutomaticReportContent />
    </Suspense>
  );
}

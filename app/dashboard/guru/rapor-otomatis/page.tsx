"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
  filterRowsByDate,
  getDailyReportDates,
} from "@/lib/daily-report-history";
import {
  DailyMemorizationExportRow,
  DailyReportExportRow,
  downloadCompleteDailyReport,
  downloadLevelExamReports,
  downloadMunaqosyahReport,
  LevelExamExportRow,
  MunaqosyahExportRow,
} from "@/lib/report-exports";
import { supabase } from "@/lib/supabase";
import { getAppErrorMessage } from "@/lib/app-errors";
import { loadDailyMemorizationRows } from "@/lib/report-queries";
import { getTahfidzLevelLabel } from "@/lib/tahfidz-levels";
import { getMunaqosyahCriterionLabel } from "@/lib/munaqosyah";

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
  const requestedReport = params.get("report");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState(params.get("studentId") || "");
  const [activeReport, setActiveReport] = useState<ReportType>(
    requestedReport === "level" || requestedReport === "munaqosyah"
      ? requestedReport
      : "daily",
  );
  const [dailyReports, setDailyReports] = useState<DailyReportExportRow[]>([]);
  const [memorization, setMemorization] = useState<DailyMemorizationExportRow[]>([]);
  const [dailyDate, setDailyDate] = useState(params.get("date") || "");
  const [levels, setLevels] = useState<LevelExamExportRow[]>([]);
  const [munaq, setMunaq] = useState<MunaqosyahExportRow | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const autoPrintTriggered = useRef(false);

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
      const [dailyResult, memorizationResult, levelResult, munaqResult] =
        await Promise.all([
          supabase
            .from("daily_student_reports")
            .select(
              "tanggal,status_presensi,kegiatan,ringkasan_tadarus,ringkasan_hafalan,catatan_guru",
            )
            .eq("student_id", studentId)
            .order("tanggal", { ascending: false }),
          loadDailyMemorizationRows(studentId),
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
      if (memorizationResult.error) throw memorizationResult.error;
      if (levelResult.error) throw levelResult.error;
      if (munaqResult.error) throw munaqResult.error;
      const loadedDailyReports = dailyResult.data || [];
      const loadedMemorization = memorizationResult.data || [];
      const reportDates = getDailyReportDates(
        loadedDailyReports,
        loadedMemorization,
      );
      setDailyReports(loadedDailyReports);
      setMemorization(loadedMemorization);
      setDailyDate((current) =>
        reportDates.includes(current) ? current : reportDates[0] || "",
      );
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
  const dailyDates = useMemo(
    () => getDailyReportDates(dailyReports, memorization),
    [dailyReports, memorization],
  );
  const selectedDailyReports = useMemo(
    () => filterRowsByDate(dailyReports, dailyDate),
    [dailyReports, dailyDate],
  );
  const selectedMemorization = useMemo(
    () => filterRowsByDate(memorization, dailyDate),
    [memorization, dailyDate],
  );
  const hasData =
    activeReport === "daily"
      ? selectedDailyReports.length > 0 || selectedMemorization.length > 0
      : activeReport === "level"
        ? levels.length > 0
        : Boolean(munaq);

  useEffect(() => {
    if (
      params.get("print") !== "1" ||
      loading ||
      !hasData ||
      autoPrintTriggered.current
    ) {
      return;
    }
    autoPrintTriggered.current = true;
    const timeoutId = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timeoutId);
  }, [hasData, loading, params]);

  const handleDownload = () => {
    try {
      setError("");
      if (activeReport === "daily") {
        downloadCompleteDailyReport(
          name,
          selectedDailyReports,
          selectedMemorization,
        );
      } else if (activeReport === "level") {
        downloadLevelExamReports(name, levels, {
          nis: selected?.nis,
          kelas: selected?.kelas,
        });
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
          const connectionStatus =
            option.id === "daily"
              ? `${dailyDates.length} tanggal · ${memorization.length} surat`
              : option.id === "level"
                ? `${levels.length} hasil ujian`
                : munaq
                  ? "1 hasil ujian"
                  : "Belum ada hasil";
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
                <span
                  className={`mt-1 block text-xs font-black ${
                    active ? "text-white" : "text-emerald-700"
                  }`}
                >
                  Tersambung · {connectionStatus}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-end print:hidden">
        {activeReport === "daily" && dailyDates.length > 0 && (
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-black text-gray-600">
              Tanggal rapor
            </span>
            <select
              value={dailyDate}
              onChange={(event) => setDailyDate(event.target.value)}
              className="bg-transparent font-bold text-[#1b4332] outline-none"
            >
              {dailyDates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          </label>
        )}
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
          dailyReports={
            activeReport === "daily" ? selectedDailyReports : dailyReports
          }
          memorization={
            activeReport === "daily" ? selectedMemorization : memorization
          }
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
  dailyReports,
  memorization,
  levels,
  munaq,
}: {
  reportType: ReportType;
  student?: StudentOption;
  dailyReports: DailyReportExportRow[];
  memorization: DailyMemorizationExportRow[];
  levels: LevelExamExportRow[];
  munaq?: MunaqosyahExportRow;
}) {
  const latestDaily = dailyReports[0];
  const latestMemorization = memorization[0];
  const latestLevel = levels[0];
  const title =
    reportType === "daily"
      ? "Rapor Hafalan Harian"
      : reportType === "level"
        ? "Rapor Ujian Kenaikan Level"
        : "Lembar Munaqosyah";
  const period =
    reportType === "daily"
      ? formatDate(latestDaily?.tanggal || latestMemorization?.tanggal)
      : reportType === "level"
        ? latestLevel?.tahun_ajaran || formatDate(latestLevel?.tanggal)
        : formatDate(munaq?.tanggal);
  const reportDate =
    reportType === "daily"
      ? latestDaily?.tanggal || latestMemorization?.tanggal
      : reportType === "level"
        ? latestLevel?.tanggal
        : munaq?.tanggal;
  const teacherNote =
    reportType === "daily"
      ? latestDaily?.catatan_guru || latestMemorization?.keterangan
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
                  <td className="w-28 py-1">Jenjang Tahfizh</td>
                  <td className="w-4">:</td>
                  <td>{getTahfidzLevelLabel(student?.level)}</td>
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

          {reportType === "daily" && (
            <DailyReportTable
              reports={dailyReports}
              memorization={memorization}
            />
          )}
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
            <div className="w-1/3 text-center">
              <p className="font-bold">Orang Tua/Wali</p>
              <div className="h-20" aria-label="Ruang tanda tangan Orang Tua atau Wali" />
              <div className="mx-auto w-48 border-b-2 border-dotted border-black" />
            </div>
            <div className="w-1/3 text-center">
              <p className="font-bold">Kepala Sekolah</p>
              <div className="h-20" aria-label="Ruang tanda tangan Kepala Sekolah" />
              <p className="font-bold underline">WIDI NURMARA, S.Pd.I</p>
            </div>
            <div className="w-1/3 text-center">
              <p>Dikeluarkan di : Bekasi</p>
              <p>Tanggal : {formatDate(reportDate)}</p>
              <p className="mt-3 font-bold">Koordinator Tahfizh</p>
              <div className="h-14" aria-label="Ruang tanda tangan Koordinator Tahfizh" />
              <p className="font-bold underline">ULFA DWI HASTUTI, S.LI</p>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}

function DailyReportTable({
  reports,
  memorization,
}: {
  reports: DailyReportExportRow[];
  memorization: DailyMemorizationExportRow[];
}) {
  return (
    <div className="space-y-5">
      <table className="w-full border-collapse border border-black text-center text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2">No</th>
            <th className="border border-black p-2">Tanggal</th>
            <th className="border border-black p-2">Presensi</th>
            <th className="border border-black p-2">Kegiatan</th>
            <th className="border border-black p-2">Tadarus</th>
            <th className="border border-black p-2">Hafalan</th>
          </tr>
        </thead>
        <tbody>
          {reports.length ? (
            reports.map((row, index) => (
              <tr key={`${row.tanggal}-${index}`} className="h-10">
                <td className="border border-black">{index + 1}</td>
                <td className="border border-black px-2">
                  {formatDate(row.tanggal)}
                </td>
                <td className="border border-black px-2 font-bold">
                  {row.status_presensi || "-"}
                </td>
                <td className="border border-black px-2 text-left">
                  {row.kegiatan || "-"}
                </td>
                <td className="border border-black px-2 text-left">
                  {row.ringkasan_tadarus || "-"}
                </td>
                <td className="border border-black px-2 text-left">
                  {row.ringkasan_hafalan || "-"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="border border-black p-8 font-bold text-gray-500"
                colSpan={6}
              >
                Belum ada Presensi &amp; Laporan Harian.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td className="border border-black p-2" colSpan={6}>
              Data otomatis dari form Presensi &amp; Laporan Harian
            </td>
          </tr>
        </tfoot>
      </table>

      {memorization.length > 0 && (
        <div>
          <h4 className="border border-b-0 border-black bg-gray-100 py-2 text-center font-bold uppercase">
            Penilaian Tahsin &amp; Tahfidz
          </h4>
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black p-2">Tanggal</th>
                <th className="border border-black p-2">Surah / Ayat</th>
                <th className="border border-black p-2">Kelancaran</th>
                <th className="border border-black p-2">Makhraj</th>
                <th className="border border-black p-2">Tajwid</th>
                <th className="border border-black p-2">Hafalan</th>
                <th className="border border-black p-2">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {memorization.map((row, index) => (
                <tr key={`${row.tanggal}-${index}`} className="h-10">
                  <td className="border border-black px-2">
                    {formatDate(row.tanggal)}
                  </td>
                  <td className="border border-black px-2 text-left">
                    {row.nama_surah || "-"} {row.ayat ? `· ${row.ayat}` : ""}
                  </td>
                  <td className="border border-black">
                    {formatScore(row.nilai_kelancaran ?? row.nilai)}
                  </td>
                  <td className="border border-black">
                    {formatScore(row.nilai_makhraj ?? row.nilai)}
                  </td>
                  <td className="border border-black">
                    {formatScore(row.nilai_tajwid ?? row.nilai)}
                  </td>
                  <td className="border border-black">
                    {formatScore(row.nilai_hafalan ?? row.nilai)}
                  </td>
                  <td className="border border-black font-bold">
                    {formatScore(row.nilai_rata_rata ?? row.nilai)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
            <th className="w-1/4 border border-black bg-gray-100 p-3 text-left">Kenaikan Jenjang</th>
            <td className="w-1/4 border border-black p-3 font-bold">
              {row
                ? `${getTahfidzLevelLabel(row.level_asal)} → ${getTahfidzLevelLabel(row.level_tujuan)}`
                : "-"}
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
  const scores = sourceRows.map((score, index) => [
    getMunaqosyahCriterionLabel(score.label, index),
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  Sun,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentAvatar } from "@/components/StudentAvatar";
import { downloadTadarusHarian } from "@/lib/export-tadarus";
import {
  downloadDailyReports,
  downloadLevelExamReports,
} from "@/lib/report-exports";
import { getStudentRouteKey } from "@/lib/students";
import { uploadStudentPhoto } from "@/lib/student-photos";
import { supabase } from "@/lib/supabase";

type ActiveTab = "tadarus" | "tahfidz" | "harian" | "level" | "munaqasyah";

interface StudentData {
  id: string;
  nama_lengkap: string;
  kelas: string;
  nis: string;
  level: string;
  foto_url?: string | null;
  tadarus: TadarusEntry[];
  tahfidz: TahfidzEntry[];
  dailyReports: DailyReportEntry[];
  levelExams: LevelExamEntry[];
  reports: StudentReport[];
}

interface TadarusEntry {
  [key: string]: unknown;
  id: string;
  student_id: string;
  tanggal?: string;
  nama_surah?: string;
  hal_ayat?: string;
  keterangan?: string;
}

interface TahfidzEntry {
  [key: string]: unknown;
  id: string;
  student_id: string;
  tanggal?: string;
  nama_surah?: string;
  ayat?: string;
  makhraj?: string;
  murojaah?: string;
  nilai?: number | string | null;
  keterangan?: string;
}

interface DailyReportEntry {
  [key: string]: unknown;
  id: string;
  student_id: string;
  tanggal?: string;
  status_presensi?: string;
  kegiatan?: string | null;
  ringkasan_tadarus?: string | null;
  ringkasan_hafalan?: string | null;
  catatan_guru?: string | null;
}

interface LevelExamEntry {
  [key: string]: unknown;
  id: string;
  student_id: string;
  tanggal?: string;
  level_asal?: number;
  level_tujuan?: number;
  nilai_kelancaran?: number;
  nilai_makhraj?: number;
  nilai_tajwid?: number;
  nilai_hafalan?: number;
  nilai_rata_rata?: number;
  status?: string;
  tahun_ajaran?: string;
  catatan_guru?: string | null;
}

interface MunaqasyahScoreRow {
  angka?: string | number;
  huruf?: string;
  arab_huruf?: string;
  arab_angka?: string;
}

interface MunaqasyahPayload {
  rowsMunaqosyah?: MunaqasyahScoreRow[];
  kategoriMunaqosyah?: { indo?: string; arab?: string };
  catatanMunaqosyah?: string;
}

interface StudentReport {
  id: string;
  student_id: string;
  bulan_tahun?: string;
  data_rapor?: MunaqasyahPayload;
}

const getPredikat = (nilai: number) => {
  if (nilai >= 90) return "Mumtaz";
  if (nilai >= 80) return "Jayyid Jiddan";
  if (nilai >= 65) return "Jayyid";
  if (nilai >= 50) return "Maqbul";
  return "Perlu Bimbingan";
};

export default function OrangTuaDashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [activeTabs, setActiveTabs] = useState<Record<string, ActiveTab>>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uploadingStudentId, setUploadingStudentId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchAllData = async () => {
    const [
      studentsResult,
      tadarusResult,
      tahfidzResult,
      reportsResult,
      dailyResult,
      levelResult,
    ] =
      await Promise.all([
        supabase.from("students").select("*").order("nama_lengkap", { ascending: true }),
        supabase
          .from("laporan_tadarus_pagi")
          .select("*")
          .order("tanggal", { ascending: false }),
        supabase
          .from("laporan_tahsin_tahfidz")
          .select("*")
          .order("tanggal", { ascending: false }),
        supabase
          .from("student_reports")
          .select("*")
          .eq("jenis_rapor", "munaqosyah")
          .order("updated_at", { ascending: false }),
        supabase
          .from("daily_student_reports")
          .select("*")
          .order("tanggal", { ascending: false }),
        supabase
          .from("level_promotion_exams")
          .select("*")
          .order("tanggal", { ascending: false }),
      ]);

    if (studentsResult.error) throw studentsResult.error;
    if (tadarusResult.error) throw tadarusResult.error;
    if (tahfidzResult.error) throw tahfidzResult.error;

    const studentList: StudentData[] = (studentsResult.data || []).map((student) => ({
      id: student.id,
      nama_lengkap: student.nama_lengkap || "Siswa",
      kelas: student.kelas || "Tanpa Kelas",
      nis: student.nis || "-",
      level: String(student.level || "-"),
      foto_url: student.foto_url,
      tadarus: (tadarusResult.data || []).filter((item) => item.student_id === student.id),
      tahfidz: (tahfidzResult.data || []).filter((item) => item.student_id === student.id),
      dailyReports: dailyResult.error
        ? []
        : (dailyResult.data || []).filter((item) => item.student_id === student.id),
      levelExams: levelResult.error
        ? []
        : (levelResult.data || []).filter((item) => item.student_id === student.id),
      reports: reportsResult.error
        ? []
        : (reportsResult.data || []).filter((item) => item.student_id === student.id),
    }));

    setStudents(studentList);
    setActiveTabs((current) => {
      const next = { ...current };
      studentList.forEach((student) => {
        next[student.id] ||= "tadarus";
      });
      return next;
    });
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleData?.role !== "orang_tua") {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);
        await fetchAllData();
      } catch (error) {
        setNotification({
          type: "error",
          message: error instanceof Error ? error.message : "Gagal memuat data siswa.",
        });
      } finally {
        setLoading(false);
      }
    };

    void checkUser();
  }, [router]);

  const handlePhotoUpload = async (
    student: StudentData,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId) return;

    setUploadingStudentId(student.id);
    setNotification(null);
    try {
      const publicUrl = await uploadStudentPhoto({
        file,
        studentId: student.id,
        userId,
      });
      setStudents((current) =>
        current.map((item) =>
          item.id === student.id ? { ...item, foto_url: publicUrl } : item,
        ),
      );
      setNotification({
        type: "success",
        message: `Foto ${student.nama_lengkap} berhasil diperbarui.`,
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal mengunggah foto.",
      });
    } finally {
      setUploadingStudentId(null);
    }
  };

  const handleDownload = (student: StudentData) => {
    try {
      downloadTadarusHarian(student.nama_lengkap, student.tadarus);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal mengunduh data.",
      });
    }
  };

  const handleDailyDownload = (student: StudentData) => {
    try {
      downloadDailyReports(student.nama_lengkap, student.dailyReports);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal mengunduh laporan harian.",
      });
    }
  };

  const handleLevelDownload = (student: StudentData) => {
    try {
      downloadLevelExamReports(student.nama_lengkap, student.levelExams);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal mengunduh rapor level.",
      });
    }
  };

  const filteredStudents = students
    .filter(
      (student) =>
        student.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filterKelas === "Semua" || student.kelas === filterKelas),
    )
    .sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap));

  const groupedStudents = filteredStudents.reduce<Record<string, StudentData[]>>(
    (groups, student) => {
      const kelas = student.kelas || "Tanpa Kelas";
      groups[kelas] ||= [];
      groups[kelas].push(student);
      return groups;
    },
    {},
  );

  if (loading) {
    return (
      <DashboardLayout userRole="orang_tua">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[#1b4332]" size={44} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="orang_tua">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Progres Mengaji Anak
          </h1>
          <p className="mt-2 font-medium text-gray-500">
            Tadarus, hafalan, level tahfidz, dan rapor munaqasyah dalam satu tampilan.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative z-20 w-full sm:w-44">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((open) => !open)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold text-gray-700 shadow-sm"
            >
              {filterKelas === "Semua" ? "Semua Kelas" : `Kelas ${filterKelas}`}
              <ChevronDown
                size={19}
                className={`transition ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
                {["Semua", "1", "2", "3", "4", "5", "6"].map((kelas) => (
                  <button
                    key={kelas}
                    type="button"
                    onMouseDown={() => {
                      setFilterKelas(kelas);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-5 py-3 text-left text-sm font-bold ${
                      filterKelas === kelas
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {kelas === "Semua" ? "Semua Kelas" : `Kelas ${kelas}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={19}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama anak..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 font-bold text-gray-900 outline-none transition focus:ring-2 focus:ring-[#2dc653]"
            />
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 font-bold ${
            notification.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notification.type === "error" && <XCircle size={21} />}
          <p>{notification.message}</p>
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center shadow-sm">
          <FileText className="mx-auto mb-4 text-gray-300" size={64} />
          <h2 className="text-2xl font-black text-gray-900">Belum ada data siswa</h2>
          <p className="mt-2 font-medium text-gray-500">Coba ubah kata pencarian atau filter kelas.</p>
        </div>
      ) : (
        Object.keys(groupedStudents)
          .sort()
          .map((kelas) => (
            <section key={kelas} className="mb-9">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-black text-gray-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-[#1b4332]">
                  <BookOpen size={18} />
                </span>
                {kelas === "Tanpa Kelas" ? kelas : `Kelas ${kelas}`}
                <span className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                  {groupedStudents[kelas].length} siswa
                </span>
              </h2>

              <div className="space-y-5">
                {groupedStudents[kelas].map((student) => {
                  const selected = selectedStudentId === student.id;
                  const activeTab = activeTabs[student.id] || "tadarus";
                  const latestReport = student.reports[0];
                  const reportPayload: MunaqasyahPayload = latestReport?.data_rapor || {};
                  const rowsMunaqosyah = reportPayload.rowsMunaqosyah || [];
                  const reportAverage =
                    rowsMunaqosyah.length > 0
                      ? Math.round(
                          rowsMunaqosyah.reduce(
                            (sum: number, row: MunaqasyahScoreRow) =>
                              sum + Number(row.angka || 0),
                            0,
                          ) / rowsMunaqosyah.length,
                        )
                      : null;
                  const scoredTahfidz = student.tahfidz.filter(
                    (item) => item.nilai !== null && item.nilai !== undefined,
                  );
                  const dailyAverage =
                    scoredTahfidz.length > 0
                      ? Math.round(
                          scoredTahfidz.reduce(
                            (sum, item) => sum + Number(item.nilai || 0),
                            0,
                          ) / scoredTahfidz.length,
                        )
                      : null;

                  return (
                    <article key={student.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedStudentId(selected ? null : student.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            setSelectedStudentId(selected ? null : student.id);
                          }
                        }}
                        className={`relative flex cursor-pointer flex-col gap-5 overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${
                          selected
                            ? "border-[#2dc653] ring-4 ring-[#2dc653]/10"
                            : "border-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <StudentAvatar
                            name={student.nama_lengkap}
                            photoUrl={student.foto_url}
                            className="h-16 w-16 rounded-2xl"
                            textClassName="text-xl"
                          />
                          <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                              NIS {student.nis} · Kelas {student.kelas} · Level {student.level}
                            </p>
                            <h3 className="text-xl font-black text-gray-900 sm:text-2xl">
                              {student.nama_lengkap}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-3" onClick={(event) => event.stopPropagation()}>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100">
                            {uploadingStudentId === student.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Camera size={16} />
                            )}
                            {student.foto_url ? "Ganti Foto" : "Tambah Foto"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={uploadingStudentId === student.id}
                              onChange={(event) => void handlePhotoUpload(student, event)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(selected ? null : student.id)}
                            className="rounded-xl p-2 text-gray-400 hover:bg-gray-50"
                            aria-label={selected ? "Tutup detail" : "Buka detail"}
                          >
                            {selected ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                          </button>
                        </div>
                      </div>

                      {selected && (
                        <div className="mt-5 animate-in fade-in slide-in-from-top-3">
                          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                              [
                                "Total Catatan",
                                student.tadarus.length +
                                  student.tahfidz.length +
                                  student.dailyReports.length +
                                  student.levelExams.length,
                              ],
                              ["Tadarus", student.tadarus.length],
                              ["Nilai Harian", dailyAverage ?? "-"],
                              ["Munaqasyah", reportAverage ?? "-"],
                            ].map(([label, value], index) => (
                              <div
                                key={label}
                                className={`rounded-2xl border p-5 ${
                                  index === 0
                                    ? "border-[#1b4332] bg-[#1b4332] text-white"
                                    : "border-gray-100 bg-white text-gray-900"
                                }`}
                              >
                                <p className={`text-xs font-bold uppercase tracking-wider ${index === 0 ? "text-white/70" : "text-gray-400"}`}>
                                  {label}
                                </p>
                                <p className="mt-2 text-3xl font-black">{value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {[
                              { key: "tadarus" as const, label: "Tadarus", icon: Sun, activeClass: "bg-green-600" },
                              { key: "tahfidz" as const, label: "Tahfidz", icon: BookOpen, activeClass: "bg-blue-600" },
                              { key: "harian" as const, label: "Harian", icon: CalendarDays, activeClass: "bg-orange-500" },
                              { key: "level" as const, label: "Ujian Level", icon: Award, activeClass: "bg-cyan-600" },
                              { key: "munaqasyah" as const, label: "Munaqasyah", icon: GraduationCap, activeClass: "bg-purple-600" },
                            ].map((tab) => {
                              const Icon = tab.icon;
                              const active = activeTab === tab.key;
                              return (
                                <button
                                  key={tab.key}
                                  type="button"
                                  onClick={() =>
                                    setActiveTabs((current) => ({
                                      ...current,
                                      [student.id]: tab.key,
                                    }))
                                  }
                                  className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold transition ${
                                    active
                                      ? `${tab.activeClass} text-white shadow-lg`
                                      : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon size={20} />
                                  {tab.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                            {activeTab === "tadarus" && (
                              <>
                                <div className="flex flex-col gap-3 border-b border-green-100 bg-green-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    <Sun className="text-green-600" size={22} />
                                    <h4 className="text-lg font-black text-gray-900">Riwayat Tadarus Harian</h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(student)}
                                    disabled={!student.tadarus.length}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-green-700 shadow-sm ring-1 ring-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Download size={16} />
                                    Download Tadarus
                                  </button>
                                </div>
                                <ReportTable
                                  rows={student.tadarus}
                                  columns={[
                                    ["tanggal", "Tanggal"],
                                    ["nama_surah", "Surah"],
                                    ["hal_ayat", "Halaman / Ayat"],
                                    ["keterangan", "Keterangan"],
                                  ]}
                                  emptyText="Belum ada riwayat tadarus."
                                />
                              </>
                            )}

                            {activeTab === "tahfidz" && (
                              <>
                                <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50/70 px-6 py-5">
                                  <BookOpen className="text-blue-600" size={22} />
                                  <h4 className="text-lg font-black text-gray-900">Riwayat Hafalan & Tahfidz</h4>
                                </div>
                                <ReportTable
                                  rows={student.tahfidz}
                                  columns={[
                                    ["tanggal", "Tanggal"],
                                    ["nama_surah", "Surah"],
                                    ["ayat", "Ayat"],
                                    ["makhraj", "Makhraj"],
                                    ["murojaah", "Muroja'ah"],
                                    ["nilai", "Nilai"],
                                    ["keterangan", "Keterangan"],
                                  ]}
                                  emptyText="Belum ada riwayat hafalan."
                                />
                              </>
                            )}

                            {activeTab === "harian" && (
                              <>
                                <div className="flex flex-col gap-3 border-b border-orange-100 bg-orange-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    <CalendarDays className="text-orange-600" size={22} />
                                    <h4 className="text-lg font-black text-gray-900">
                                      Presensi & Laporan Harian
                                    </h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDailyDownload(student)}
                                    disabled={!student.dailyReports.length}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-orange-700 shadow-sm ring-1 ring-orange-200 disabled:opacity-50"
                                  >
                                    <Download size={16} /> Download Harian
                                  </button>
                                </div>
                                <ReportTable
                                  rows={student.dailyReports}
                                  columns={[
                                    ["tanggal", "Tanggal"],
                                    ["status_presensi", "Presensi"],
                                    ["kegiatan", "Kegiatan"],
                                    ["ringkasan_tadarus", "Tadarus"],
                                    ["ringkasan_hafalan", "Hafalan"],
                                    ["catatan_guru", "Catatan Guru"],
                                  ]}
                                  emptyText="Belum ada presensi atau laporan harian."
                                />
                              </>
                            )}

                            {activeTab === "level" && (
                              <>
                                <div className="flex flex-col gap-3 border-b border-cyan-100 bg-cyan-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    <Award className="text-cyan-700" size={22} />
                                    <h4 className="text-lg font-black text-gray-900">
                                      Rapor Ujian Kenaikan Level
                                    </h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleLevelDownload(student)}
                                    disabled={!student.levelExams.length}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-cyan-700 shadow-sm ring-1 ring-cyan-200 disabled:opacity-50"
                                  >
                                    <Download size={16} /> Download Rapor
                                  </button>
                                </div>
                                <ReportTable
                                  rows={student.levelExams}
                                  columns={[
                                    ["tanggal", "Tanggal"],
                                    ["level_asal", "Level Asal"],
                                    ["level_tujuan", "Level Tujuan"],
                                    ["nilai_kelancaran", "Kelancaran"],
                                    ["nilai_makhraj", "Makhraj"],
                                    ["nilai_tajwid", "Tajwid"],
                                    ["nilai_hafalan", "Hafalan"],
                                    ["nilai_rata_rata", "Rata-rata"],
                                    ["status", "Status"],
                                    ["catatan_guru", "Catatan Guru"],
                                  ]}
                                  emptyText="Belum ada ujian kenaikan level."
                                />
                              </>
                            )}

                            {activeTab === "munaqasyah" && (
                              <div className="p-6 md:p-8">
                                {!latestReport ? (
                                  <div className="py-10 text-center">
                                    <GraduationCap className="mx-auto mb-4 text-gray-300" size={60} />
                                    <p className="font-bold text-gray-500">Rapor munaqasyah belum tersedia.</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-purple-500">
                                          Periode {latestReport.bulan_tahun}
                                        </p>
                                        <h4 className="mt-1 text-2xl font-black text-gray-900">
                                          {reportPayload.kategoriMunaqosyah?.indo ||
                                            (reportAverage !== null ? getPredikat(reportAverage) : "-")}
                                        </h4>
                                      </div>
                                      <div className="rounded-2xl bg-purple-50 px-6 py-4 text-center">
                                        <p className="text-xs font-bold uppercase text-purple-500">Rata-rata</p>
                                        <p className="text-3xl font-black text-purple-800">{reportAverage ?? "-"}</p>
                                      </div>
                                    </div>

                                    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                      {["Kelancaran", "Makhorijul Huruf", "Hukum Tajwid", "Sambung Ayat"].map(
                                        (label, index) => (
                                          <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                            <p className="text-xs font-bold text-gray-500">{label}</p>
                                            <p className="mt-1 text-2xl font-black text-gray-900">
                                              {rowsMunaqosyah[index]?.angka || "-"}
                                            </p>
                                          </div>
                                        ),
                                      )}
                                    </div>

                                    {reportPayload.catatanMunaqosyah && (
                                      <div className="mb-6 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-600">Catatan Guru</p>
                                        <p className="font-medium leading-relaxed text-gray-700">
                                          {reportPayload.catatanMunaqosyah}
                                        </p>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/guru/reports/print/${getStudentRouteKey(student)}?type=munaqosyah&mode=view`,
                                        )
                                      }
                                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-bold text-white transition hover:bg-purple-700"
                                    >
                                      <FileText size={18} />
                                      Lihat & Cetak Rapor
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))
      )}
    </DashboardLayout>
  );
}

function ReportTable({
  rows,
  columns,
  emptyText,
}: {
  rows: Array<Record<string, unknown> & { id: string }>;
  columns: [string, string][];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="mx-auto mb-3 text-gray-300" size={48} />
        <p className="font-bold text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            {columns.map(([, label]) => (
              <th key={label} className="whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/50">
              {columns.map(([key]) => (
                <td key={key} className="whitespace-nowrap px-6 py-4 font-medium text-gray-700">
                  {String(row[key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

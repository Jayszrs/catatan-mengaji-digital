"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Save,
  School,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getCurrentAcademicYear,
  getTahfidzLevelLabel,
  TAHFIDZ_LEVELS,
} from "@/lib/tahfidz-levels";
import { normalizeClassName } from "@/lib/class-names";

interface AdminStudent {
  id: string;
  name: string;
  nis: string;
  class_name: string;
  level: number;
  teacher_id: string;
  teacher_name: string;
  archived: boolean;
}

interface AdminClass {
  id: string;
  name: string;
  academic_year: string;
  active: boolean;
  teacher_id: string;
  teacher_name: string;
  homeroom_teacher: string | null;
}

interface AdminTeacher {
  id: string;
  name: string;
  status: "active" | "inactive";
}

interface ScoreRow {
  id: string;
  student_id: string;
  tanggal: string;
  nama_surah?: string | null;
  nilai?: number | null;
  nilai_kelancaran?: number | null;
  nilai_makhraj?: number | null;
  nilai_tajwid?: number | null;
  nilai_hafalan?: number | null;
  nilai_rata_rata?: number | null;
  keterangan?: string | null;
}

interface DailyRow {
  id: string;
  student_id: string;
  tanggal: string;
  status_presensi: string;
  kegiatan?: string | null;
  ringkasan_tadarus?: string | null;
  ringkasan_hafalan?: string | null;
  catatan_guru?: string | null;
}

interface CurriculumRow {
  id: string;
  level: number;
  nama_surah: string;
  urutan: number;
}

interface Props {
  students: AdminStudent[];
  classes: AdminClass[];
  teachers: AdminTeacher[];
  academicYears: string[];
  selectedClass: string;
  onSelectedClassChange: (className: string) => void;
  onDataChanged: () => Promise<void>;
}

const canonicalClassNames = Array.from({ length: 6 }, (_, index) => [
  `${index + 1}A`,
  `${index + 1}B`,
]).flat();

function formatScore(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "-";
  }
  const number = Number(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

function scoreValue(
  row: ScoreRow,
  key:
    | "nilai_kelancaran"
    | "nilai_makhraj"
    | "nilai_tajwid"
    | "nilai_hafalan",
) {
  return row[key] ?? row.nilai ?? null;
}

function scoreAverage(row: ScoreRow) {
  if (row.nilai_rata_rata !== null && row.nilai_rata_rata !== undefined) {
    return Number(row.nilai_rata_rata);
  }
  const values = [
    scoreValue(row, "nilai_kelancaran"),
    scoreValue(row, "nilai_makhraj"),
    scoreValue(row, "nilai_tajwid"),
    scoreValue(row, "nilai_hafalan"),
  ].filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + Number(value), 0) / values.length;
}

async function getAdminHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export function AdminClassAcademicPanel({
  students,
  classes,
  teachers,
  academicYears,
  selectedClass,
  onSelectedClassChange,
  onDataChanged,
}: Props) {
  const yearOptions = useMemo(() => {
    const options = new Set([getCurrentAcademicYear(), ...academicYears]);
    classes.forEach((row) => options.add(row.academic_year));
    return Array.from(options)
      .filter((year) => /^\d{4}\/\d{4}$/.test(year))
      .sort((left, right) => right.localeCompare(left));
  }, [academicYears, classes]);

  const [selectedYear, setSelectedYear] = useState(
    yearOptions[0] || getCurrentAcademicYear(),
  );
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [viewMode, setViewMode] = useState<"scores" | "daily">("scores");
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [dailyRows, setDailyRows] = useState<DailyRow[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [homeroomSelection, setHomeroomSelection] = useState<{
    scope: string;
    teacherId: string;
  } | null>(null);
  const [savingHomeroom, setSavingHomeroom] = useState(false);

  const activeStudents = useMemo(
    () => students.filter((student) => !student.archived),
    [students],
  );

  const teacherScopedStudents = useMemo(
    () =>
      activeStudents.filter(
        (student) =>
          selectedTeacher === "all" || student.teacher_id === selectedTeacher,
      ),
    [activeStudents, selectedTeacher],
  );

  const classStudents = useMemo(
    () =>
      teacherScopedStudents.filter(
        (student) => normalizeClassName(student.class_name) === selectedClass,
      ),
    [selectedClass, teacherScopedStudents],
  );

  const filteredStudents = useMemo(
    () =>
      classStudents.filter(
        (student) =>
          selectedLevel === "all" ||
          Number(student.level || 1) === Number(selectedLevel),
      ),
    [classStudents, selectedLevel],
  );

  const studentLookup = useMemo(
    () => new Map(filteredStudents.map((student) => [student.id, student])),
    [filteredStudents],
  );

  const classLevelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    teacherScopedStudents.forEach((student) => {
      const key = `${normalizeClassName(student.class_name)}:${Number(student.level || 1)}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [teacherScopedStudents]);

  const classRows = useMemo(() => {
    const masters = classes.filter((row) => row.academic_year === selectedYear);
    const additional = masters
      .map((row) => normalizeClassName(row.name))
      .filter((name) => name && !canonicalClassNames.includes(name));
    return Array.from(new Set([...canonicalClassNames, ...additional])).map(
      (name) => ({
        name,
        masters: masters.filter(
          (row) => normalizeClassName(row.name) === name,
        ),
      }),
    );
  }, [classes, selectedYear]);

  const selectedMaster = useMemo(
    () =>
      classes.find(
        (row) =>
          row.academic_year === selectedYear &&
          normalizeClassName(row.name) === selectedClass,
      ),
    [classes, selectedClass, selectedYear],
  );

  const homeroomScope = `${selectedYear}:${selectedClass}`;
  const homeroomTeacherId =
    homeroomSelection?.scope === homeroomScope
      ? homeroomSelection.teacherId
      : selectedMaster?.teacher_id || "";

  const saveHomeroomTeacher = async () => {
    if (!homeroomTeacherId) return;
    setSavingHomeroom(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: {
          ...(await getAdminHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class_name: selectedClass,
          academic_year: selectedYear,
          teacher_id: homeroomTeacherId,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Wali kelas mengaji gagal disimpan.");
      }
      setSuccess(result.message || "Wali kelas mengaji berhasil disimpan.");
      await onDataChanged();
      setHomeroomSelection(null);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Wali kelas mengaji gagal disimpan.",
      );
    } finally {
      setSavingHomeroom(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          year: selectedYear,
          class: selectedClass,
          teacher: selectedTeacher,
          level: selectedLevel,
        });
        const response = await fetch(`/api/admin/classes?${params}`, {
          headers: await getAdminHeaders(),
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Data kelas gagal dimuat.");
        }
        if (active) {
          setScores(result.scores || []);
          setDailyRows(result.daily_reports || []);
          setCurriculum(result.curriculum || []);
        }
      } catch (caughtError: unknown) {
        if (active) {
          setScores([]);
          setDailyRows([]);
          setCurriculum([]);
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Data kelas gagal dimuat.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [reloadKey, selectedClass, selectedLevel, selectedTeacher, selectedYear]);

  const surahColumns = useMemo(() => {
    const names: string[] = [];
    curriculum.forEach((row) => {
      const name = row.nama_surah.trim();
      if (name && !names.includes(name)) names.push(name);
    });
    scores.forEach((row) => {
      const name = String(row.nama_surah || "").trim();
      if (name && !names.includes(name)) names.push(name);
    });
    return names;
  }, [curriculum, scores]);

  const latestScore = useMemo(() => {
    const lookup = new Map<string, ScoreRow>();
    scores.forEach((row) => {
      const surah = String(row.nama_surah || "").trim();
      const key = `${row.student_id}:${surah}`;
      if (surah && !lookup.has(key)) lookup.set(key, row);
    });
    return lookup;
  }, [scores]);

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
              Versi Administrator
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-950">
              Pusat Data Kelas & Nilai
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Tampilan seperti Data Kelas Guru dengan cakupan seluruh Guru,
              kelas, level, nilai per surat, serta Presensi–Tadarus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Perbarui Data
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="text-xs font-black uppercase tracking-wide text-gray-500">
            Tahun Ajaran
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
            >
              {yearOptions.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black uppercase tracking-wide text-gray-500">
            Guru Pengampu
            <select
              value={selectedTeacher}
              onChange={(event) => setSelectedTeacher(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Guru</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}{teacher.status === "inactive" ? " (Nonaktif)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black uppercase tracking-wide text-gray-500">
            Filter Level
            <select
              value={selectedLevel}
              onChange={(event) => setSelectedLevel(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Level Tahfidz</option>
              {TAHFIDZ_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="border-b border-gray-100 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-gray-900">Master Kelas 1A–6B</h3>
            <p className="text-xs text-gray-500">
              Klik kelas untuk membuka rekap akademiknya.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
            {teacherScopedStudents.length} siswa
          </span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-[1180px] w-full text-center text-xs">
            <thead className="bg-[#173f30] text-white">
              <tr>
                <th className="px-4 py-3 text-left">Kelas</th>
                {TAHFIDZ_LEVELS.map((level) => (
                  <th key={level.value} className="px-3 py-3">
                    {level.label.replace("Mustawa Muttawasit ", "M-")}
                  </th>
                ))}
                <th className="px-4 py-3">Total</th>
                <th className="min-w-48 px-4 py-3 text-left">Guru/Wali Kelas</th>
              </tr>
            </thead>
            <tbody>
              {classRows.map(({ name, masters }) => {
                const total = TAHFIDZ_LEVELS.reduce(
                  (sum, level) =>
                    sum + (classLevelCounts.get(`${name}:${level.value}`) || 0),
                  0,
                );
                const teacherNames = Array.from(
                  new Set(
                    masters.flatMap((row) => [
                      row.teacher_name,
                      row.homeroom_teacher || "",
                    ]),
                  ),
                ).filter(Boolean);
                return (
                  <tr
                    key={name}
                    className={`border-t border-gray-100 ${
                      selectedClass === name ? "bg-emerald-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => onSelectedClassChange(name)}
                        className={`inline-flex min-w-14 items-center justify-center rounded-xl px-3 py-2 font-black ${
                          selectedClass === name
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {name}
                      </button>
                    </td>
                    {TAHFIDZ_LEVELS.map((level) => (
                      <td key={level.value} className="border-l border-gray-100 px-3 py-3 font-bold text-gray-700">
                        {classLevelCounts.get(`${name}:${level.value}`) || "-"}
                      </td>
                    ))}
                    <td className="border-l border-gray-100 px-4 py-3 text-base font-black text-emerald-800">
                      {total}
                    </td>
                    <td className="border-l border-gray-100 px-4 py-3 text-left font-semibold text-gray-600">
                      {teacherNames.join(" / ") || "Belum ada master kelas"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-b border-gray-100 bg-gray-50/60 p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
              Kelas {selectedClass} · {selectedYear}
            </p>
            <h3 className="mt-1 text-xl font-black text-gray-900">
              Wali Kelas Mengaji
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Satu Guru penanggung jawab untuk kegiatan mengaji kelas ini.
            </p>
          </div>
          <label className="min-w-72 text-xs font-black uppercase tracking-wide text-gray-500">
            Pilih Guru
            <select
              value={homeroomTeacherId}
              onChange={(event) =>
                setHomeroomSelection({
                  scope: homeroomScope,
                  teacherId: event.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
            >
              <option value="">Belum ditentukan</option>
              {teachers
                .filter((teacher) => teacher.status === "active")
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void saveHomeroomTeacher()}
            disabled={!homeroomTeacherId || savingHomeroom}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-5 py-3 font-black text-white disabled:opacity-50"
          >
            {savingHomeroom ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            Simpan Wali Kelas
          </button>
        </div>
        {success && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {success}
          </p>
        )}
      </div>

      <div className="border-b border-gray-100 p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
              Kelas {selectedClass}
            </p>
            <h3 className="mt-1 text-2xl font-black text-gray-900">
              Data Nilai & Laporan Harian
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredStudents.length} siswa tampil dari {classStudents.length} siswa.
            </p>
          </div>
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("scores")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black ${
                viewMode === "scores"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <BookOpen size={16} /> Nilai per Surat
            </button>
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black ${
                viewMode === "daily"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <ClipboardCheck size={16} /> Presensi & Tadarus
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="m-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-700" size={38} />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Users className="mx-auto mb-4 text-gray-300" size={52} />
          <h3 className="text-lg font-black text-gray-900">
            Belum ada siswa di kelas {selectedClass}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Ubah filter Guru/level atau gunakan tabel manajemen siswa di bawah.
          </p>
        </div>
      ) : viewMode === "scores" ? (
        surahColumns.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <School className="mx-auto mb-4 text-gray-300" size={50} />
            <h3 className="text-lg font-black text-gray-900">
              Belum ada nilai surat pada {selectedYear}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Kolom akan mengikuti Data Surat dan laporan Tahsin & Tahfidz yang tersimpan.
            </p>
          </div>
        ) : (
          <div className="max-h-[68vh] overflow-auto">
            <table className="min-w-max border-collapse text-xs">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#173f30] text-white">
                  <th rowSpan={2} className="sticky left-0 z-30 w-14 border border-white/15 bg-[#173f30] px-3 py-3 text-center">No</th>
                  <th rowSpan={2} className="sticky left-14 z-30 min-w-64 border border-white/15 bg-[#173f30] px-4 py-3 text-left">Nama Peserta Didik</th>
                  <th rowSpan={2} className="min-w-40 border border-white/15 px-4 py-3 text-left">Guru & Level</th>
                  {surahColumns.map((surah, index) => (
                    <th key={surah} colSpan={7} className={`border border-white/15 px-4 py-3 text-center text-sm font-black ${index % 2 === 0 ? "bg-emerald-700" : "bg-teal-700"}`}>
                      {surah}
                    </th>
                  ))}
                </tr>
                <tr className="bg-emerald-50 text-[10px] uppercase tracking-wide text-emerald-950">
                  {surahColumns.flatMap((surah) =>
                    ["Kelancaran", "Makhorijul Huruf", "Hukum Tajwid", "Sambung Ayat", "Jumlah", "Rata-rata", "Ket."].map((label) => (
                      <th key={`${surah}-${label}`} className="min-w-24 border border-emerald-200 px-3 py-3 text-center">{label}</th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, studentIndex) => (
                  <tr key={student.id} className="border-b border-gray-100 odd:bg-white even:bg-gray-50/70 hover:bg-amber-50">
                    <td className="sticky left-0 z-10 border border-gray-200 bg-inherit px-3 py-3 text-center font-bold text-gray-500">{studentIndex + 1}</td>
                    <td className="sticky left-14 z-10 border border-gray-200 bg-inherit px-4 py-3 font-black text-gray-900">
                      {student.name}
                      <span className="mt-0.5 block text-[10px] font-medium text-gray-400">NIS {student.nis || "-"}</span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <p className="font-bold text-gray-800">{getTahfidzLevelLabel(student.level)}</p>
                      <p className="text-[10px] text-gray-400">{student.teacher_name}</p>
                    </td>
                    {surahColumns.map((surah) => {
                      const row = latestScore.get(`${student.id}:${surah}`);
                      if (!row) {
                        return Array.from({ length: 7 }, (_, index) => (
                          <td key={`${surah}-empty-${index}`} className="min-w-24 border border-gray-200 px-3 py-3 text-center text-gray-300">-</td>
                        ));
                      }
                      const components = [
                        scoreValue(row, "nilai_kelancaran"),
                        scoreValue(row, "nilai_makhraj"),
                        scoreValue(row, "nilai_tajwid"),
                        scoreValue(row, "nilai_hafalan"),
                      ];
                      const valid = components.filter((value): value is number => value !== null);
                      const total = valid.length ? valid.reduce((sum, value) => sum + Number(value), 0) : null;
                      const average = scoreAverage(row);
                      const cells = [
                        ...components.map(formatScore),
                        formatScore(total),
                        formatScore(average),
                        row.keterangan || (average !== null && average >= 75 ? "Tercapai" : "Perlu Bimbingan"),
                      ];
                      return cells.map((value, index) => (
                        <td key={`${surah}-${index}`} title={`Data terakhir: ${row.tanggal}`} className={`min-w-24 border border-gray-200 px-3 py-3 text-center font-bold ${index === 5 ? "bg-emerald-50 text-emerald-800" : index === 6 ? "text-gray-600" : "text-gray-800"}`}>
                          {value}
                        </td>
                      ));
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : dailyRows.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <CalendarDays className="mx-auto mb-4 text-gray-300" size={50} />
          <h3 className="text-lg font-black text-gray-900">Belum ada laporan Presensi–Tadarus</h3>
          <p className="mt-2 text-sm text-gray-500">Data muncul setelah Guru menyimpan Presensi & Laporan Harian.</p>
        </div>
      ) : (
        <div className="max-h-[68vh] overflow-auto">
          <table className="min-w-[1250px] w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-20 bg-[#173f30] text-white">
              <tr>
                <th className="px-4 py-4">No</th><th className="min-w-60 px-4 py-4">Nama Siswa</th><th className="min-w-44 px-4 py-4">Guru</th><th className="min-w-32 px-4 py-4">Tanggal</th><th className="px-4 py-4">Presensi</th><th className="min-w-44 px-4 py-4">Kegiatan</th><th className="min-w-52 px-4 py-4">Tadarus</th><th className="min-w-52 px-4 py-4">Hafalan</th><th className="min-w-64 px-4 py-4">Catatan Guru</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((row, index) => {
                const student = studentLookup.get(row.student_id);
                return (
                  <tr key={row.id} className="border-b border-gray-100 odd:bg-white even:bg-gray-50/70 hover:bg-emerald-50/60">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3"><p className="font-black text-gray-900">{student?.name || "Siswa"}</p><p className="text-xs text-gray-400">{getTahfidzLevelLabel(student?.level)}</p></td>
                    <td className="px-4 py-3 font-semibold text-gray-600">{student?.teacher_name || "-"}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">{new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${row.tanggal}T00:00:00`))}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${row.status_presensi === "Hadir" ? "bg-green-50 text-green-700" : row.status_presensi === "Alpa" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{row.status_presensi}</span></td>
                    <td className="px-4 py-3 text-gray-600">{row.kegiatan || "-"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{row.ringkasan_tadarus || "-"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{row.ringkasan_hafalan || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{row.catatan_guru || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

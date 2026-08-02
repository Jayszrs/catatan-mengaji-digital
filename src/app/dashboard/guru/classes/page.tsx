"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Edit2,
  FileSpreadsheet,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Table2,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/Input";
import { getAppErrorMessage, isMissingDatabaseFeatureError } from "@/lib/app-errors";
import { parseStudentWorksheet } from "@/lib/student-import";
import { supabase } from "@/lib/supabase";
import {
  getCurrentAcademicYear,
  getTahfidzLevelLabel,
  TAHFIDZ_LEVELS,
} from "@/lib/tahfidz-levels";
import { normalizeClassName } from "@/lib/class-names";

interface ClassRow {
  id: string;
  teacher_id: string;
  nama_kelas: string;
  tingkat: number;
  rombel: string;
  wali_kelas?: string | null;
  tahun_ajaran: string;
  aktif: boolean;
}

interface StudentClassRow {
  id: string;
  teacher_id?: string;
  nama_lengkap: string;
  nis: string;
  kelas?: string | null;
  level?: number | string | null;
  jenis_kelamin?: string | null;
  nik?: string | null;
  tempat_tanggal_lahir?: string | null;
  nama_ayah?: string | null;
  nama_ibu?: string | null;
  wali_murid?: string | null;
  alamat?: string | null;
  no_telp?: string | null;
}

interface TahsinScoreRow {
  id: string;
  student_id: string;
  tanggal: string;
  tahun_ajaran?: string | null;
  nama_surah?: string | null;
  nilai?: number | null;
  nilai_kelancaran?: number | null;
  nilai_makhraj?: number | null;
  nilai_tajwid?: number | null;
  nilai_hafalan?: number | null;
  nilai_rata_rata?: number | null;
  keterangan?: string | null;
}

interface DailyReportRow {
  id: string;
  student_id: string;
  tanggal: string;
  status_presensi: string;
  kegiatan?: string | null;
  ringkasan_tadarus?: string | null;
  ringkasan_hafalan?: string | null;
  catatan_guru?: string | null;
}

interface CurriculumSurahRow {
  id: string;
  level: number;
  nama_surah: string;
  urutan: number;
}

const currentAcademicYear = getCurrentAcademicYear();
const canonicalClassNames = Array.from({ length: 6 }, (_, index) => [
  `${index + 1}A`,
  `${index + 1}B`,
]).flat();

const createInitialForm = (className = "1A") => ({
  tingkat: className.charAt(0) || "1",
  rombel: className.slice(1) || "A",
  wali_kelas: "",
  tahun_ajaran: currentAcademicYear,
  aktif: true,
});

const normalizeNis = (value: unknown) => String(value ?? "").trim();

const optionalText = (value: string) => value.trim() || null;

const formatScore = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "-";
  }
  const numericValue = Number(value);
  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(2);
};

const getScore = (
  row: TahsinScoreRow,
  key:
    | "nilai_kelancaran"
    | "nilai_makhraj"
    | "nilai_tajwid"
    | "nilai_hafalan",
) => row[key] ?? row.nilai ?? null;

const getAverage = (row: TahsinScoreRow) => {
  if (row.nilai_rata_rata !== null && row.nilai_rata_rata !== undefined) {
    return Number(row.nilai_rata_rata);
  }
  const values = [
    getScore(row, "nilai_kelancaran"),
    getScore(row, "nilai_makhraj"),
    getScore(row, "nilai_tajwid"),
    getScore(row, "nilai_hafalan"),
  ].filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + Number(value), 0) / values.length;
};

const getAcademicYearRange = (academicYear: string) => {
  const [startYearText, endYearText] = academicYear.split("/");
  const startYear = Number(startYearText);
  const endYear = Number(endYearText);
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) return null;
  return {
    startDate: `${startYear}-07-01`,
    endDate: `${endYear}-06-30`,
  };
};

const getNextAvailableNis = (students: StudentClassRow[], reserved: Set<string>) => {
  const numericValues = students
    .map((student) => Number(normalizeNis(student.nis)))
    .filter((value) => Number.isSafeInteger(value) && value > 0);
  let candidate = Math.max(1_000_000, ...numericValues) + 1;
  while (reserved.has(String(candidate))) candidate += 1;
  const result = String(candidate);
  reserved.add(result);
  return result;
};

export default function ClassesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState("");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentClassRow[]>([]);
  const [scoreRows, setScoreRows] = useState<TahsinScoreRow[]>([]);
  const [dailyRows, setDailyRows] = useState<DailyReportRow[]>([]);
  const [curriculumRows, setCurriculumRows] = useState<CurriculumSurahRow[]>([]);
  const [selectedClass, setSelectedClass] = useState("1A");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedYear, setSelectedYear] = useState(currentAcademicYear);
  const [viewMode, setViewMode] = useState<"scores" | "daily">("scores");
  const [form, setForm] = useState(createInitialForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importClass, setImportClass] = useState("1A");
  const [importLevel, setImportLevel] = useState("1");
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const generatedName = `${form.tingkat}${form.rombel.trim().toUpperCase()}`;

  const fetchData = async () => {
    const [classResult, studentResult] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .order("tingkat", { ascending: true })
        .order("rombel", { ascending: true }),
      supabase
        .from("students")
        .select(
          "id,teacher_id,nama_lengkap,nis,kelas,level,jenis_kelamin,nik,tempat_tanggal_lahir,nama_ayah,nama_ibu,wali_murid,alamat,no_telp",
        )
        .order("nama_lengkap", { ascending: true }),
    ]);
    if (classResult.error) throw classResult.error;
    if (studentResult.error) throw studentResult.error;
    setClasses(classResult.data || []);
    setStudents(studentResult.data || []);
  };

  useEffect(() => {
    const load = async () => {
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
        if (roleData?.role !== "guru") {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);
        await fetchData();
      } catch (error) {
        setNotification({
          type: "error",
          message: getAppErrorMessage(error, "Gagal memuat data kelas."),
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const classStudents = useMemo(
    () =>
      students.filter(
        (student) => normalizeClassName(student.kelas) === selectedClass,
      ),
    [selectedClass, students],
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

  useEffect(() => {
    if (loading) return;
    const studentIds = filteredStudents.map((student) => student.id);
    const selectedLevels = Array.from(
      new Set(filteredStudents.map((student) => Number(student.level || 1))),
    ).filter((level) => level >= 1 && level <= 9);

    if (studentIds.length === 0) {
      const clearReports = window.setTimeout(() => {
        setScoreRows([]);
        setDailyRows([]);
        setCurriculumRows([]);
      }, 0);
      return () => window.clearTimeout(clearReports);
    }

    let active = true;
    const loadReports = async () => {
      setLoadingReports(true);
      try {
        const currentScoreResult = await supabase
          .from("laporan_tahsin_tahfidz")
          .select(
            "id,student_id,tanggal,tahun_ajaran,nama_surah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan",
          )
          .in("student_id", studentIds)
          .eq("tahun_ajaran", selectedYear)
          .order("tanggal", { ascending: false });
        let resolvedScoreData = currentScoreResult.data;
        let resolvedScoreError = currentScoreResult.error;
        if (
          currentScoreResult.error &&
          isMissingDatabaseFeatureError(currentScoreResult.error)
        ) {
          const legacyScoreResult = await supabase
            .from("laporan_tahsin_tahfidz")
            .select(
              "id,student_id,tanggal,nama_surah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan",
            )
            .in("student_id", studentIds)
            .order("tanggal", { ascending: false });
          resolvedScoreData = legacyScoreResult.data?.map((row) => ({
            ...row,
            tahun_ajaran: null,
          })) || null;
          resolvedScoreError = legacyScoreResult.error;
        }
        if (resolvedScoreError) throw resolvedScoreError;

        const yearRange = getAcademicYearRange(selectedYear);
        let dailyQuery = supabase
          .from("daily_student_reports")
          .select(
            "id,student_id,tanggal,status_presensi,kegiatan,ringkasan_tadarus,ringkasan_hafalan,catatan_guru",
          )
          .in("student_id", studentIds)
          .order("tanggal", { ascending: false })
          .limit(500);
        if (yearRange) {
          dailyQuery = dailyQuery
            .gte("tanggal", yearRange.startDate)
            .lte("tanggal", yearRange.endDate);
        }

        const [dailyResult, curriculumResult] = await Promise.all([
          dailyQuery,
          selectedLevels.length > 0
            ? supabase
                .from("surah_curriculum")
                .select("id,level,nama_surah,urutan")
                .eq("tahun_ajaran", selectedYear)
                .in("level", selectedLevels)
                .order("level", { ascending: true })
                .order("urutan", { ascending: true })
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (dailyResult.error) throw dailyResult.error;
        if (
          curriculumResult.error &&
          !isMissingDatabaseFeatureError(curriculumResult.error)
        ) {
          throw curriculumResult.error;
        }

        if (active) {
          setScoreRows((resolvedScoreData || []) as TahsinScoreRow[]);
          setDailyRows((dailyResult.data || []) as DailyReportRow[]);
          setCurriculumRows(
            ((curriculumResult.data || []) as CurriculumSurahRow[]).filter(
              (row) => Boolean(row.nama_surah),
            ),
          );
        }
      } catch (error) {
        if (active) {
          setScoreRows([]);
          setDailyRows([]);
          setCurriculumRows([]);
          setNotification({
            type: "error",
            message: getAppErrorMessage(
              error,
              "Gagal memuat rekap nilai kelas.",
            ),
          });
        }
      } finally {
        if (active) setLoadingReports(false);
      }
    };

    void loadReports();
    return () => {
      active = false;
    };
  }, [filteredStudents, loading, selectedYear]);

  const classRows = useMemo(() => {
    const classMap = new Map(
      classes
        .filter((item) => item.tahun_ajaran === selectedYear)
        .map((item) => [normalizeClassName(item.nama_kelas), item]),
    );
    const additionalNames = Array.from(classMap.keys()).filter(
      (name) => name && !canonicalClassNames.includes(name),
    );
    return [...canonicalClassNames, ...additionalNames].map((name) => ({
      name,
      master: classMap.get(name),
    }));
  }, [classes, selectedYear]);

  const classLevelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach((student) => {
      const className = normalizeClassName(student.kelas);
      const level = Number(student.level || 1);
      const key = `${className}:${level}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [students]);

  const surahColumns = useMemo(() => {
    const names: string[] = [];
    curriculumRows.forEach((row) => {
      const name = row.nama_surah.trim();
      if (name && !names.includes(name)) names.push(name);
    });
    scoreRows.forEach((row) => {
      const name = String(row.nama_surah || "").trim();
      if (name && !names.includes(name)) names.push(name);
    });
    return names;
  }, [curriculumRows, scoreRows]);

  const latestScoreByStudentAndSurah = useMemo(() => {
    const lookup = new Map<string, TahsinScoreRow>();
    scoreRows.forEach((row) => {
      const surahName = String(row.nama_surah || "").trim();
      if (!surahName) return;
      const key = `${row.student_id}:${surahName}`;
      if (!lookup.has(key)) lookup.set(key, row);
    });
    return lookup;
  }, [scoreRows]);

  const studentLookup = useMemo(
    () => new Map(filteredStudents.map((student) => [student.id, student])),
    [filteredStudents],
  );

  const academicYearOptions = useMemo(() => {
    const years = new Set([currentAcademicYear, selectedYear]);
    classes.forEach((item) => years.add(item.tahun_ajaran));
    const currentStart = Number(currentAcademicYear.split("/")[0]);
    for (let offset = -2; offset <= 2; offset += 1) {
      years.add(`${currentStart + offset}/${currentStart + offset + 1}`);
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [classes, selectedYear]);

  const resetForm = () => {
    setForm(createInitialForm(selectedClass));
    setEditingId(null);
    setShowForm(false);
  };

  const openClassForm = (className = selectedClass) => {
    const master = classRows.find((item) => item.name === className)?.master;
    if (master) {
      setForm({
        tingkat: String(master.tingkat),
        rombel: master.rombel,
        wali_kelas: master.wali_kelas || "",
        tahun_ajaran: master.tahun_ajaran,
        aktif: master.aktif,
      });
      setEditingId(master.id);
    } else {
      setForm(createInitialForm(className));
      setEditingId(null);
    }
    setShowForm(true);
    document
      .getElementById("main-content")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setNotification(null);

    try {
      const payload = {
        teacher_id: userId,
        nama_kelas: generatedName,
        tingkat: Number(form.tingkat),
        rombel: form.rombel.trim().toUpperCase(),
        wali_kelas: form.wali_kelas.trim() || null,
        tahun_ajaran: form.tahun_ajaran.trim(),
        aktif: form.aktif,
        updated_at: new Date().toISOString(),
      };

      const result = editingId
        ? await supabase.from("classes").update(payload).eq("id", editingId)
        : await supabase
            .from("classes")
            .upsert(payload, { onConflict: "nama_kelas,tahun_ajaran" });
      if (result.error) throw result.error;

      await fetchData();
      setSelectedClass(normalizeClassName(payload.nama_kelas));
      setSelectedYear(payload.tahun_ajaran);
      resetForm();
      setNotification({
        type: "success",
        message: editingId
          ? "Data kelas berhasil diperbarui."
          : "Data kelas berhasil disimpan.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(error, "Gagal menyimpan kelas."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedClasses = async () => {
    if (!userId) return;
    setSeeding(true);
    setNotification(null);
    try {
      const payloads = canonicalClassNames.map((name) => ({
        teacher_id: userId,
        nama_kelas: name,
        tingkat: Number(name.charAt(0)),
        rombel: name.slice(1),
        wali_kelas: null,
        tahun_ajaran: selectedYear,
        aktif: true,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("classes")
        .upsert(payloads, {
          onConflict: "nama_kelas,tahun_ajaran",
          ignoreDuplicates: true,
        });
      if (error) throw error;
      await fetchData();
      setNotification({
        type: "success",
        message: `Master kelas 1A sampai 6B untuk ${selectedYear} sudah disiapkan.`,
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(error, "Gagal menyiapkan master kelas."),
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (classItem: ClassRow) => {
    if (
      !window.confirm(
        `Hapus master kelas ${classItem.nama_kelas} tahun ${classItem.tahun_ajaran}? Data siswa dan nilai tidak ikut dihapus.`,
      )
    ) {
      return;
    }
    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", classItem.id);
    if (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(error, "Gagal menghapus kelas."),
      });
      return;
    }
    setClasses((current) =>
      current.filter((item) => item.id !== classItem.id),
    );
    setNotification({
      type: "success",
      message:
        "Master kelas berhasil dihapus. Data siswa dan nilai tetap tersimpan.",
    });
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    setImporting(true);
    setNotification(null);

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const parsedRows = workbook.SheetNames.flatMap((sheetName) => {
        try {
          return parseStudentWorksheet(workbook.Sheets[sheetName]).rows;
        } catch {
          return [];
        }
      });
      if (parsedRows.length === 0) {
        throw new Error(
          "Tidak ada sheet dengan kolom Nama Peserta Didik atau Nama Lengkap.",
        );
      }

      const reservedNis = new Set(students.map((student) => student.nis));
      const existingByNis = new Map(
        students.map((student) => [normalizeNis(student.nis), student]),
      );
      const uniqueRows = new Map<
        string,
        (typeof parsedRows)[number] & { resolvedNis: string }
      >();

      parsedRows.forEach((row) => {
        const resolvedNis =
          normalizeNis(row.nis) || getNextAvailableNis(students, reservedNis);
        uniqueRows.set(resolvedNis, { ...row, resolvedNis });
      });

      let created = 0;
      let updated = 0;
      for (const row of uniqueRows.values()) {
        const nik = row.nik.replace(/\D/g, "");
        if (nik && nik.length !== 16) {
          throw new Error(
            `NIK ${row.nama_lengkap} harus terdiri dari 16 digit.`,
          );
        }
        const payload = {
          teacher_id: userId,
          nama_lengkap: row.nama_lengkap,
          nis: row.resolvedNis,
          jenis_kelamin: optionalText(row.jenis_kelamin),
          nik: optionalText(nik),
          kelas: importClass,
          level: importLevel,
          tempat_tanggal_lahir: row.tempat_tanggal_lahir,
          nama_ayah: optionalText(row.nama_ayah),
          nama_ibu: optionalText(row.nama_ibu),
          wali_murid: row.wali_murid,
          no_telp: row.no_telp,
          alamat: row.alamat,
        };
        const existingStudent = existingByNis.get(row.resolvedNis);
        let result = existingStudent
          ? await supabase
              .from("students")
              .update(payload)
              .eq("id", existingStudent.id)
          : await supabase.from("students").insert([payload]);

        if (
          result.error &&
          isMissingDatabaseFeatureError(result.error)
        ) {
          const corePayload = {
            teacher_id: payload.teacher_id,
            nama_lengkap: payload.nama_lengkap,
            nis: payload.nis,
            kelas: payload.kelas,
            level: payload.level,
            tempat_tanggal_lahir: payload.tempat_tanggal_lahir,
            wali_murid: payload.wali_murid,
            no_telp: payload.no_telp.slice(0, 20),
            alamat: payload.alamat,
          };
          result = existingStudent
            ? await supabase
                .from("students")
                .update(corePayload)
                .eq("id", existingStudent.id)
            : await supabase.from("students").insert([corePayload]);
        }
        if (result.error) throw result.error;
        if (existingStudent) updated += 1;
        else created += 1;
      }

      await supabase.from("classes").upsert(
        {
          teacher_id: userId,
          nama_kelas: importClass,
          tingkat: Number(importClass.charAt(0)),
          rombel: importClass.slice(1),
          wali_kelas: null,
          tahun_ajaran: selectedYear,
          aktif: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "nama_kelas,tahun_ajaran" },
      );

      await fetchData();
      setSelectedClass(importClass);
      setSelectedLevel(importLevel);
      setShowImport(false);
      setNotification({
        type: "success",
        message: `${created} siswa ditambahkan dan ${updated} siswa diperbarui ke kelas ${importClass}, ${getTahfidzLevelLabel(importLevel)}.`,
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(error, "Gagal mengimpor data siswa."),
      });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
            Akademik & Tahfidz
          </p>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Data Kelas & Rekap Nilai
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-gray-500">
            Kelola kelas 1A–6B, impor siswa dari Excel, dan pantau nilai per
            surat serta riwayat Presensi–Tadarus dalam satu halaman.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowImport((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-[#1b4332] shadow-sm transition hover:bg-emerald-50"
          >
            <Upload size={18} />
            Impor Excel Siswa
          </button>
          <button
            type="button"
            onClick={() => void handleSeedClasses()}
            disabled={seeding}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
          >
            {seeding ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Table2 size={18} />
            )}
            Siapkan 1A–6B
          </button>
          <button
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              else openClassForm();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#133c27]"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Tutup Form" : "Tambah Kelas"}
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 font-bold ${
            notification.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="mt-0.5 shrink-0" size={21} />
          ) : (
            <XCircle className="mt-0.5 shrink-0" size={21} />
          )}
          {notification.message}
        </div>
      )}

      {showImport && (
        <section className="mb-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
            <div className="flex flex-1 items-start gap-4">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Impor Daftar Siswa
                </h2>
                <p className="mt-1 max-w-xl text-sm text-gray-500">
                  Semua sheet yang memiliki kolom Nama Peserta Didik/Nama
                  Lengkap akan dibaca. Pilih tujuan kelas dan level sebelum
                  memilih file.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-black uppercase tracking-wide text-gray-500">
                Tujuan Kelas
                <select
                  value={importClass}
                  onChange={(event) => setImportClass(event.target.value)}
                  className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
                >
                  {canonicalClassNames.map((name) => (
                    <option key={name} value={name}>
                      Kelas {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-black uppercase tracking-wide text-gray-500">
                Level Tahfidz
                <select
                  value={importLevel}
                  onChange={(event) => setImportLevel(event.target.value)}
                  className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
                >
                  {TAHFIDZ_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-[#0a2316] transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {importing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {importing ? "Mengimpor..." : "Pilih File Excel"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => void handleImportExcel(event)}
              />
            </div>
          </div>
        </section>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-3xl border border-gray-100 border-t-4 border-t-[#1b4332] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-[#1b4332]">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                {editingId ? "Edit Master Kelas" : "Master Kelas Baru"}
              </h2>
              <p className="text-sm text-gray-500">
                Nama kelas otomatis: <strong>{generatedName}</strong>
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-3 block text-sm font-bold text-gray-800">
                Tingkat
              </label>
              <select
                value={form.tingkat}
                onChange={(event) =>
                  setForm({ ...form, tingkat: event.target.value })
                }
                className="w-full rounded-xl border-2 border-gray-200 px-5 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#2dc653]"
              >
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <option key={level} value={level}>
                    Kelas {level}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Rombel"
              value={form.rombel}
              maxLength={3}
              onChange={(event) =>
                setForm({ ...form, rombel: event.target.value })
              }
              required
            />
            <Input
              label="Wali Kelas"
              value={form.wali_kelas}
              onChange={(event) =>
                setForm({ ...form, wali_kelas: event.target.value })
              }
              placeholder="Nama wali kelas"
            />
            <Input
              label="Tahun Ajaran"
              value={form.tahun_ajaran}
              onChange={(event) =>
                setForm({ ...form, tahun_ajaran: event.target.value })
              }
              placeholder="2026/2027"
              required
            />
          </div>

          <label className="mt-5 inline-flex items-center gap-3 text-sm font-bold text-gray-700">
            <input
              type="checkbox"
              checked={form.aktif}
              onChange={(event) =>
                setForm({ ...form, aktif: event.target.checked })
              }
              className="h-5 w-5 rounded accent-[#1b4332]"
            />
            Kelas aktif
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[#2dc653] px-6 py-3 font-black text-[#0a2316] transition hover:bg-[#25a244] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={19} />
            ) : (
              <Save size={19} />
            )}
            {submitting ? "Menyimpan..." : "Simpan Kelas"}
          </button>
        </form>
      )}

      <section className="mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-gray-900">
              <Users className="text-emerald-700" size={21} />
              Rekap Kelas 1A–6B
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Jumlah siswa dibagi berdasarkan sembilan level Tahfidz.
            </p>
          </div>
          <label className="text-xs font-black uppercase tracking-wide text-gray-500">
            Tahun Ajaran
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="ml-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
            >
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="animate-spin text-[#1b4332]" size={42} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#173f30] text-white">
                  <th className="px-5 py-4 font-black">Kelas</th>
                  {TAHFIDZ_LEVELS.map((level) => (
                    <th
                      key={level.value}
                      className="min-w-28 border-l border-white/10 px-3 py-4 text-center text-xs font-black"
                      title={level.label}
                    >
                      {level.value <= 6
                        ? `Level ${level.value}`
                        : `Mustawa ${level.value - 6}`}
                    </th>
                  ))}
                  <th className="border-l border-white/10 px-4 py-4 text-center font-black">
                    Total
                  </th>
                  <th className="min-w-40 border-l border-white/10 px-4 py-4 font-black">
                    Wali Kelas
                  </th>
                  <th className="px-4 py-4 text-center font-black">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {classRows.map(({ name, master }) => {
                  const total = TAHFIDZ_LEVELS.reduce(
                    (sum, level) =>
                      sum + (classLevelCounts.get(`${name}:${level.value}`) || 0),
                    0,
                  );
                  const active = selectedClass === name;
                  return (
                    <tr
                      key={name}
                      className={`border-b border-gray-100 transition ${
                        active ? "bg-emerald-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClass(name);
                            setImportClass(name);
                          }}
                          className={`inline-flex h-10 min-w-14 items-center justify-center rounded-xl font-black ${
                            active
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {name}
                        </button>
                      </td>
                      {TAHFIDZ_LEVELS.map((level) => (
                        <td
                          key={level.value}
                          className="border-l border-gray-100 px-3 py-3 text-center font-bold text-gray-700"
                        >
                          {classLevelCounts.get(`${name}:${level.value}`) || "-"}
                        </td>
                      ))}
                      <td className="border-l border-gray-100 px-4 py-3 text-center text-base font-black text-[#1b4332]">
                        {total}
                      </td>
                      <td className="border-l border-gray-100 px-4 py-3 font-semibold text-gray-600">
                        {master?.wali_kelas || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openClassForm(name)}
                            className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                            title={master ? "Edit kelas" : "Lengkapi kelas"}
                          >
                            <Edit2 size={15} />
                          </button>
                          {master && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(master)}
                              className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
                              title="Hapus master kelas"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                Kelas {selectedClass}
              </p>
              <h2 className="mt-1 text-2xl font-black text-gray-900">
                Data Nilai & Laporan Harian
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredStudents.length} siswa tampil dari {classStudents.length} siswa.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-black uppercase tracking-wide text-gray-500">
                Filter Level
                <select
                  value={selectedLevel}
                  onChange={(event) => setSelectedLevel(event.target.value)}
                  className="mt-2 block min-w-52 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua Level Tahfidz</option>
                  {TAHFIDZ_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("scores")}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black transition ${
                    viewMode === "scores"
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <BookOpen size={16} />
                  Nilai per Surat
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("daily")}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black transition ${
                    viewMode === "daily"
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <ClipboardCheck size={16} />
                  Presensi & Tadarus
                </button>
              </div>
            </div>
          </div>
        </div>

        {loadingReports ? (
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
              Gunakan Impor Excel Siswa, lalu pilih kelas {selectedClass} dan
              level Tahfidznya.
            </p>
          </div>
        ) : viewMode === "scores" ? (
          surahColumns.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <BookOpen className="mx-auto mb-4 text-gray-300" size={50} />
              <h3 className="text-lg font-black text-gray-900">
                Belum ada nilai surat pada {selectedYear}
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
                Tabel ini otomatis terisi dari laporan Tahsin & Tahfidz. Surat
                dari Data Surat tetap ditampilkan sebagai kolom walaupun
                nilainya belum diinput.
              </p>
            </div>
          ) : (
            <div className="max-h-[68vh] overflow-auto">
              <table className="min-w-max border-collapse text-xs">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#173f30] text-white">
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-30 w-14 border border-white/15 bg-[#173f30] px-3 py-3 text-center"
                    >
                      No
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky left-14 z-30 min-w-64 border border-white/15 bg-[#173f30] px-4 py-3 text-left"
                    >
                      Nama Peserta Didik
                    </th>
                    <th
                      rowSpan={2}
                      className="min-w-40 border border-white/15 px-4 py-3 text-left"
                    >
                      Level
                    </th>
                    {surahColumns.map((surah, index) => (
                      <th
                        key={surah}
                        colSpan={7}
                        className={`border border-white/15 px-4 py-3 text-center text-sm font-black ${
                          index % 2 === 0 ? "bg-emerald-700" : "bg-teal-700"
                        }`}
                      >
                        {surah}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50 text-[10px] uppercase tracking-wide text-emerald-950">
                    {surahColumns.flatMap((surah) =>
                      [
                        "Kelancaran",
                        "Makhorijul Huruf",
                        "Hukum Tajwid",
                        "Sambung Ayat",
                        "Jumlah",
                        "Rata-rata",
                        "Ket.",
                      ].map((label) => (
                        <th
                          key={`${surah}-${label}`}
                          className="min-w-24 border border-emerald-200 px-3 py-3 text-center"
                        >
                          {label}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, studentIndex) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 odd:bg-white even:bg-gray-50/70 hover:bg-amber-50"
                    >
                      <td className="sticky left-0 z-10 border border-gray-200 bg-inherit px-3 py-3 text-center font-bold text-gray-500">
                        {studentIndex + 1}
                      </td>
                      <td className="sticky left-14 z-10 border border-gray-200 bg-inherit px-4 py-3 font-black text-gray-900">
                        {student.nama_lengkap}
                        <span className="mt-0.5 block text-[10px] font-medium text-gray-400">
                          NIS {student.nis || "-"}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 font-bold text-gray-700">
                        {getTahfidzLevelLabel(student.level)}
                      </td>
                      {surahColumns.map((surah) => {
                        const score = latestScoreByStudentAndSurah.get(
                          `${student.id}:${surah}`,
                        );
                        if (!score) {
                          return Array.from({ length: 7 }, (_, index) => (
                            <td
                              key={`${surah}-empty-${index}`}
                              className="min-w-24 border border-gray-200 px-3 py-3 text-center text-gray-300"
                            >
                              -
                            </td>
                          ));
                        }
                        const componentValues = [
                          getScore(score, "nilai_kelancaran"),
                          getScore(score, "nilai_makhraj"),
                          getScore(score, "nilai_tajwid"),
                          getScore(score, "nilai_hafalan"),
                        ];
                        const validValues = componentValues.filter(
                          (value): value is number => value !== null,
                        );
                        const total =
                          validValues.length > 0
                            ? validValues.reduce(
                                (sum, value) => sum + Number(value),
                                0,
                              )
                            : null;
                        const average = getAverage(score);
                        const cells = [
                          ...componentValues.map(formatScore),
                          formatScore(total),
                          formatScore(average),
                          score.keterangan ||
                            (average !== null && average >= 75
                              ? "Tercapai"
                              : "Perlu Bimbingan"),
                        ];
                        return cells.map((value, index) => (
                          <td
                            key={`${surah}-${index}`}
                            className={`min-w-24 border border-gray-200 px-3 py-3 text-center font-bold ${
                              index === 5
                                ? "bg-emerald-50 text-emerald-800"
                                : index === 6
                                  ? "text-gray-600"
                                  : "text-gray-800"
                            }`}
                            title={`Data terakhir: ${score.tanggal}`}
                          >
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
            <h3 className="text-lg font-black text-gray-900">
              Belum ada laporan Presensi–Tadarus
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Data akan muncul otomatis setelah form Presensi & Laporan Harian
              disimpan.
            </p>
          </div>
        ) : (
          <div className="max-h-[68vh] overflow-auto">
            <table className="min-w-[1150px] w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-20 bg-[#173f30] text-white">
                <tr>
                  <th className="px-4 py-4 font-black">No</th>
                  <th className="min-w-60 px-4 py-4 font-black">Nama Siswa</th>
                  <th className="min-w-32 px-4 py-4 font-black">Tanggal</th>
                  <th className="px-4 py-4 font-black">Presensi</th>
                  <th className="min-w-44 px-4 py-4 font-black">Kegiatan</th>
                  <th className="min-w-52 px-4 py-4 font-black">Tadarus</th>
                  <th className="min-w-52 px-4 py-4 font-black">Hafalan</th>
                  <th className="min-w-64 px-4 py-4 font-black">Catatan Guru</th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.map((row, index) => {
                  const student = studentLookup.get(row.student_id);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 odd:bg-white even:bg-gray-50/70 hover:bg-emerald-50/60"
                    >
                      <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-black text-gray-900">
                          {student?.nama_lengkap || "Siswa"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {getTahfidzLevelLabel(student?.level)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-700">
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(`${row.tanggal}T00:00:00`))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            row.status_presensi === "Hadir"
                              ? "bg-green-50 text-green-700"
                              : row.status_presensi === "Alpa"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {row.status_presensi}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.kegiatan || "-"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {row.ringkasan_tadarus || "-"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {row.ringkasan_hafalan || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.catatan_guru || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

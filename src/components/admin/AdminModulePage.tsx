"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  Copy,
  GraduationCap,
  History,
  Link2,
  Loader2,
  Save,
  School,
  Search,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Unlink,
  UserCheck,
  Users,
  UserRoundCheck,
  UserRoundX,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminClassAcademicPanel } from "@/components/admin/AdminClassAcademicPanel";
import { supabase } from "@/lib/supabase";
import { TAHFIDZ_LEVELS } from "@/lib/tahfidz-levels";

export type AdminSection =
  | "monitoring"
  | "guru"
  | "orang-tua"
  | "siswa-kelas"
  | "kelengkapan-laporan"
  | "tahun-ajaran"
  | "audit";

interface TeacherRow {
  id: string;
  name: string;
  username: string;
  email: string;
  status: "active" | "inactive";
  approval_status: string;
  last_login_at: string | null;
  last_report_at: string | null;
  classes: string[];
  student_count: number;
  reports_today: number;
  expected_today: number;
  today_percentage: number;
  reports_week: number;
  week_percentage: number;
  level_exam_count: number;
  munaqosyah_count: number;
  profile_complete: boolean;
}

interface ParentRow {
  id: string;
  name: string;
  username: string;
  email: string;
  status: "active" | "inactive";
  last_login_at: string | null;
  profile_percentage: number;
  linked_student: {
    id: string;
    name: string;
    nis: string;
    class_name: string;
    level: number;
  } | null;
  link_updated_at: string | null;
}

interface StudentRow {
  id: string;
  name: string;
  nis: string;
  class_name: string;
  level: number;
  teacher_id: string;
  teacher_name: string;
  parent_linked: boolean;
  duplicate_nis: boolean;
  archived: boolean;
  updated_at: string | null;
}

interface ClassRow {
  id: string;
  name: string;
  academic_year: string;
  active: boolean;
  teacher_id: string;
  teacher_name: string;
  homeroom_teacher: string | null;
  student_count: number;
}

interface CompletenessRow {
  teacher_id: string;
  teacher_name: string;
  class_names: string[];
  reports_today: number;
  expected_today: number;
  week_percentage: number;
  level_exam_count: number;
  munaqosyah_count: number;
  status: "Lengkap" | "Hampir Lengkap" | "Perlu Dicek";
}

interface AuditRow {
  id: string | number;
  event_type: string;
  status: "success" | "failed" | "blocked";
  actor_id: string | null;
  actor_name: string;
  target_id: string | null;
  target_name: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface AcademicYearRow {
  year: string;
  active: boolean;
  class_count: number;
  surah_count: number;
}

interface CurriculumRow {
  id: string;
  academic_year: string;
  level: number;
  surah_name: string;
  order: number;
}

interface AcademicSettings {
  daily_weight: number;
  level_exam_weight: number;
  munaqosyah_weight: number;
  minimum_level_score: number;
  minimum_munaqosyah_score: number;
}

interface AdminOverviewData {
  generated_at: string;
  today: string;
  summary: {
    teacher_count: number;
    parent_count: number;
    student_count: number;
    active_class_count: number;
    reports_today: number;
    reports_week: number;
    level_exam_count: number;
    munaqosyah_count: number;
    pending_account_count: number;
    problem_count: number;
  };
  teachers: TeacherRow[];
  parents: ParentRow[];
  students: StudentRow[];
  classes: ClassRow[];
  report_completeness: CompletenessRow[];
  audit_events: AuditRow[];
  academic_years: AcademicYearRow[];
  curriculum: CurriculumRow[];
  academic_settings: AcademicSettings;
  alerts: string[];
}

const sectionMeta: Record<
  AdminSection,
  { eyebrow: string; title: string; description: string }
> = {
  monitoring: {
    eyebrow: "Pusat Kendali",
    title: "Dashboard Monitoring",
    description:
      "Ringkasan kondisi akun, siswa, kelas, laporan, dan peringatan sistem hari ini.",
  },
  guru: {
    eyebrow: "Tenaga Pengajar",
    title: "Monitoring Guru",
    description:
      "Pantau kelas, jumlah siswa, aktivitas laporan, kelengkapan profil, dan status setiap Guru.",
  },
  "orang-tua": {
    eyebrow: "Akun Wali",
    title: "Monitoring Orang Tua",
    description:
      "Periksa relasi Orang Tua–anak, aktivitas login, dan kelengkapan biodata.",
  },
  "siswa-kelas": {
    eyebrow: "Data Sekolah",
    title: "Manajemen Siswa & Kelas",
    description:
      "Pindahkan siswa, naik kelas massal, arsipkan siswa, dan temukan data bermasalah.",
  },
  "kelengkapan-laporan": {
    eyebrow: "Kontrol Pelaporan",
    title: "Kelengkapan Laporan",
    description:
      "Bandingkan laporan harian, ujian level, dan Munaqosyah setiap Guru.",
  },
  "tahun-ajaran": {
    eyebrow: "Kurikulum Tahfidz",
    title: "Tahun Ajaran & Kurikulum",
    description:
      "Buka atau tutup tahun ajaran, salin data surat, serta atur bobot dan batas kelulusan.",
  },
  audit: {
    eyebrow: "Keamanan Sistem",
    title: "Audit Aktivitas",
    description:
      "Telusuri perubahan akun, role, password, relasi siswa, kurikulum, dan data akademik.",
  },
};

const classOptions = Array.from({ length: 6 }, (_, index) => [
  `${index + 1}A`,
  `${index + 1}B`,
]).flat();

const eventLabels: Record<string, string> = {
  admin_account_created: "Akun dibuat",
  admin_role_changed: "Role diubah",
  admin_password_changed: "Password diubah",
  admin_account_deleted: "Akun dihapus",
  teacher_registration_review: "Persetujuan Guru",
  admin_parent_link_connect: "Orang Tua dihubungkan",
  admin_parent_link_disconnect: "Hubungan Orang Tua diputus",
  teacher_activated: "Guru diaktifkan",
  teacher_deactivated: "Guru dinonaktifkan",
  student_assignment_updated: "Penempatan siswa diubah",
  students_mass_promoted: "Kenaikan kelas massal",
  student_archived: "Siswa diarsipkan",
  academic_year_opened: "Tahun ajaran dibuka",
  academic_year_closed: "Tahun ajaran ditutup",
  curriculum_copied: "Kurikulum disalin",
  academic_settings_updated: "Komposisi nilai diubah",
};

function formatDateTime(value?: string | null) {
  if (!value) return "Belum pernah";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatRelative(value?: string | null) {
  if (!value) return "Belum ada aktivitas";
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(difference / 60_000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}

async function getAdminHeaders(includeJson = false) {
  const headers: Record<string, string> = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user.app_metadata?.role === "admin") {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red" | "blue" | "gray";
  children: React.ReactNode;
}) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    gray: "bg-gray-100 text-gray-600 ring-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all ${
          safeValue >= 90
            ? "bg-emerald-500"
            : safeValue >= 60
              ? "bg-amber-400"
              : "bg-red-400"
        }`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: number | string;
  helper: string;
  icon: typeof Users;
  tone?: "green" | "blue" | "amber" | "red";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-500">{helper}</p>
        </div>
        <div className={`rounded-xl p-3 ${colors[tone]}`}>
          <Icon size={22} />
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-gray-100 bg-white">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin text-emerald-700" size={42} />
        <p className="mt-4 text-sm font-bold text-gray-500">
          Menyusun data monitoring...
        </p>
      </div>
    </div>
  );
}

function StudentManagementRow({
  student,
  teachers,
  busy,
  onSave,
  onArchive,
}: {
  student: StudentRow;
  teachers: TeacherRow[];
  busy: boolean;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onArchive: (reason: "LULUS" | "PINDAH") => Promise<void>;
}) {
  const [teacherId, setTeacherId] = useState(student.teacher_id || "");
  const [className, setClassName] = useState(
    classOptions.includes(student.class_name) ? student.class_name : "1A",
  );
  const [level, setLevel] = useState(String(student.level || 1));

  return (
    <tr className="border-b border-gray-100 align-top hover:bg-gray-50/70">
      <td className="px-4 py-4">
        <p className="font-black text-gray-900">{student.name}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="text-xs font-semibold text-gray-500">
            NIS {student.nis || "-"}
          </span>
          {student.duplicate_nis && <StatusPill tone="red">NIS ganda</StatusPill>}
          {!student.parent_linked && (
            <StatusPill tone="amber">Belum ada Orang Tua</StatusPill>
          )}
        </div>
      </td>
      <td className="px-3 py-4">
        <select
          value={teacherId}
          onChange={(event) => setTeacherId(event.target.value)}
          className="w-52 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
        >
          <option value="">Pilih Guru</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-4">
        <select
          value={className}
          onChange={(event) => setClassName(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
        >
          {classOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-4">
        <select
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          className="w-48 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500"
        >
          {TAHFIDZ_LEVELS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4">
        <div className="flex min-w-52 gap-2">
          <button
            type="button"
            disabled={busy || !teacherId}
            onClick={() =>
              void onSave({
                action: "move_student",
                student_id: student.id,
                teacher_id: teacherId,
                class_name: className,
                level: Number(level),
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save size={14} /> Simpan
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onArchive("LULUS")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            <Archive size={14} /> Lulus
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onArchive("PINDAH")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50"
          >
            <Archive size={14} /> Pindah
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AdminModulePage({ section }: { section: AdminSection }) {
  const router = useRouter();
  const meta = sectionMeta[section];
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [expandedTeacher, setExpandedTeacher] = useState("");
  const [selectedParent, setSelectedParent] = useState<ParentRow | null>(null);
  const [parentNis, setParentNis] = useState("");
  const [studentFilter, setStudentFilter] = useState<
    "active" | "problem" | "archived"
  >("active");
  const [sourceClass, setSourceClass] = useState("1A");
  const [targetClass, setTargetClass] = useState("2A");
  const [incrementLevel, setIncrementLevel] = useState(false);
  const [auditStatus, setAuditStatus] = useState("all");
  const [auditDate, setAuditDate] = useState("");
  const [copySourceYear, setCopySourceYear] = useState("");
  const [copyTargetYear, setCopyTargetYear] = useState("");
  const [settings, setSettings] = useState<AcademicSettings>({
    daily_weight: 30,
    level_exam_weight: 30,
    munaqosyah_weight: 40,
    minimum_level_score: 75,
    minimum_munaqosyah_score: 75,
  });

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/overview", {
        headers: await getAdminHeaders(),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) router.push("/auth/login");
        throw new Error(result.error || "Data Admin gagal dimuat.");
      }
      setData(result);
      setSettings(result.academic_settings);
      setCopySourceYear((current) =>
        current || result.academic_years?.[0]?.year || "",
      );
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Data Admin gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchOverview(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchOverview]);

  const runAction = async (
    payload: Record<string, unknown>,
    key = String(payload.action || "action"),
  ) => {
    setBusyKey(key);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/overview", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Operasi Admin gagal.");
      setSuccess(result.message || "Perubahan berhasil disimpan.");
      await fetchOverview();
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Operasi Admin gagal.",
      );
    } finally {
      setBusyKey("");
    }
  };

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!data || !query) return data?.teachers || [];
    return data.teachers.filter((teacher) =>
      [teacher.name, teacher.username, teacher.email, ...teacher.classes]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data, search]);

  const filteredParents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!data || !query) return data?.parents || [];
    return data.parents.filter((parent) =>
      [
        parent.name,
        parent.username,
        parent.email,
        parent.linked_student?.name,
        parent.linked_student?.nis,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data, search]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.students.filter((student) => {
      const matchesMode =
        studentFilter === "archived"
          ? student.archived
          : studentFilter === "problem"
            ? !student.archived &&
              (student.duplicate_nis ||
                !student.parent_linked ||
                !student.teacher_id)
            : !student.archived;
      const matchesSearch =
        !query ||
        [student.name, student.nis, student.class_name, student.teacher_name]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesMode && matchesSearch;
    });
  }, [data, search, studentFilter]);

  const filteredAudit = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.audit_events.filter((event) => {
      const matchesSearch =
        !query ||
        [
          eventLabels[event.event_type] || event.event_type,
          event.actor_name,
          event.target_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        auditStatus === "all" || event.status === auditStatus;
      const matchesDate =
        !auditDate || event.created_at.slice(0, 10) === auditDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [auditDate, auditStatus, data, search]);

  if (loading && !data) {
    return (
      <DashboardLayout userRole="admin">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            {meta.eyebrow}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
            {meta.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-gray-500">
            {meta.description}
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-500 shadow-sm">
            <Clock3 size={16} className="text-emerald-600" />
            Diperbarui {formatRelative(data.generated_at)}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <XCircle className="mt-0.5 shrink-0" size={21} />
          <div>
            <p className="font-black">Terjadi Kesalahan</p>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">
          <CheckCircle2 size={21} /> {success}
        </div>
      )}

      {!data ? (
        <LoadingState />
      ) : section === "monitoring" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Guru" value={data.summary.teacher_count} helper="Akun Guru aktif di sistem" icon={GraduationCap} />
            <StatCard label="Orang Tua" value={data.summary.parent_count} helper="Akun wali terdaftar" icon={UserRoundCheck} tone="blue" />
            <StatCard label="Siswa" value={data.summary.student_count} helper="Siswa aktif seluruh kelas" icon={Users} />
            <StatCard label="Kelas Aktif" value={data.summary.active_class_count} helper="Seluruh tahun ajaran" icon={School} tone="blue" />
            <StatCard label="Laporan Hari Ini" value={data.summary.reports_today} helper={`${data.summary.reports_week} laporan dalam 7 hari`} icon={ClipboardCheck} />
            <StatCard label="Ujian Level" value={data.summary.level_exam_count} helper="Total hasil ujian tersimpan" icon={GraduationCap} tone="amber" />
            <StatCard label="Munaqosyah" value={data.summary.munaqosyah_count} helper="Total hasil Munaqosyah" icon={BookOpen} tone="blue" />
            <StatCard label="Perlu Perhatian" value={data.summary.problem_count + data.summary.pending_account_count} helper="Akun atau data perlu dicek" icon={ShieldAlert} tone="red" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Kelengkapan Hari Ini</h2>
                  <p className="mt-1 text-sm text-gray-500">Laporan Guru dibandingkan jumlah siswa yang ditangani.</p>
                </div>
                <a href="/dashboard/admin/kelengkapan-laporan" className="text-sm font-black text-emerald-700 hover:text-emerald-800">Lihat semua</a>
              </div>
              <div className="divide-y divide-gray-100">
                {data.report_completeness.slice(0, 6).map((row) => {
                  const percentage = row.expected_today > 0 ? Math.round((row.reports_today / row.expected_today) * 100) : 0;
                  return (
                    <div key={row.teacher_id} className="grid gap-3 px-6 py-4 md:grid-cols-[1fr_120px_1fr_auto] md:items-center">
                      <div>
                        <p className="font-black text-gray-900">{row.teacher_name}</p>
                        <p className="text-xs font-semibold text-gray-400">{row.class_names.join(", ") || "Belum ada kelas"}</p>
                      </div>
                      <p className="text-sm font-black text-gray-700">{row.reports_today}/{row.expected_today}</p>
                      <div><ProgressBar value={percentage} /><p className="mt-1 text-right text-[11px] font-bold text-gray-400">{percentage}%</p></div>
                      <StatusPill tone={row.status === "Lengkap" ? "green" : row.status === "Hampir Lengkap" ? "amber" : "red"}>{row.status}</StatusPill>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <h2 className="flex items-center gap-2 text-lg font-black text-amber-950"><AlertTriangle size={20} /> Peringatan Sistem</h2>
                {data.alerts.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-amber-800">Tidak ada peringatan penting.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.alerts.map((alert) => <li key={alert} className="rounded-xl bg-white/70 px-4 py-3 text-sm font-bold text-amber-900">{alert}</li>)}
                  </ul>
                )}
              </section>
              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-black text-gray-900"><Activity size={20} className="text-emerald-600" /> Aktivitas Terbaru</h2>
                <div className="mt-4 space-y-4">
                  {data.audit_events.slice(0, 5).map((event) => (
                    <div key={event.id} className="border-l-2 border-emerald-200 pl-4">
                      <p className="text-sm font-black text-gray-800">{eventLabels[event.event_type] || event.event_type}</p>
                      <p className="mt-0.5 text-xs font-semibold text-gray-500">{event.actor_name} · {formatRelative(event.created_at)}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : section === "guru" ? (
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari Guru, kelas, atau email..." className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-500" /></div>
            <StatusPill tone="blue">{filteredTeachers.length} Guru</StatusPill>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-4">Guru</th><th className="px-5 py-4">Kelas & Siswa</th><th className="px-5 py-4">Laporan Hari Ini</th><th className="px-5 py-4">7 Hari</th><th className="px-5 py-4">Terakhir Aktif</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Aksi</th></tr></thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <Fragment key={teacher.id}>
                    <tr key={teacher.id} className="border-t border-gray-100 align-middle hover:bg-gray-50/70">
                      <td className="px-5 py-4"><p className="font-black text-gray-900">{teacher.name}</p><p className="mt-1 text-xs font-medium text-gray-500">{teacher.username ? `@${teacher.username}` : teacher.email}</p></td>
                      <td className="px-5 py-4"><p className="font-bold text-gray-800">{teacher.classes.join(", ") || "Belum ada kelas"}</p><p className="mt-1 text-xs text-gray-500">{teacher.student_count} siswa</p></td>
                      <td className="px-5 py-4"><p className="font-black text-gray-800">{teacher.reports_today}/{teacher.expected_today}</p><div className="mt-2 w-28"><ProgressBar value={teacher.today_percentage} /></div></td>
                      <td className="px-5 py-4"><p className="font-black text-gray-800">{teacher.week_percentage}%</p><p className="text-xs text-gray-500">{teacher.reports_week} laporan</p></td>
                      <td className="px-5 py-4"><p className="font-bold text-gray-700">{formatRelative(teacher.last_report_at)}</p><p className="text-xs text-gray-400">Login: {formatRelative(teacher.last_login_at)}</p></td>
                      <td className="px-5 py-4"><StatusPill tone={teacher.status === "active" ? "green" : "red"}>{teacher.status === "active" ? "Aktif" : "Nonaktif"}</StatusPill></td>
                      <td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => setExpandedTeacher(expandedTeacher === teacher.id ? "" : teacher.id)} className="rounded-xl bg-gray-100 p-2.5 text-gray-600 hover:bg-gray-200">{expandedTeacher === teacher.id ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button><button type="button" disabled={busyKey === teacher.id} onClick={() => void runAction({ action: "set_teacher_status", teacher_id: teacher.id, active: teacher.status !== "active" }, teacher.id)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${teacher.status === "active" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{teacher.status === "active" ? <ToggleLeft size={17} /> : <ToggleRight size={17} />}{teacher.status === "active" ? "Nonaktifkan" : "Aktifkan"}</button></div></td>
                    </tr>
                    {expandedTeacher === teacher.id && (
                      <tr key={`${teacher.id}-detail`} className="bg-emerald-50/60"><td colSpan={7} className="px-6 py-5"><div className="grid gap-4 md:grid-cols-4"><StatCard label="Siswa" value={teacher.student_count} helper="Siswa yang ditangani" icon={Users} /><StatCard label="Ujian Level" value={teacher.level_exam_count} helper="Hasil ujian tersimpan" icon={GraduationCap} tone="amber" /><StatCard label="Munaqosyah" value={teacher.munaqosyah_count} helper="Hasil ujian tersimpan" icon={BookOpen} tone="blue" /><StatCard label="Profil" value={teacher.profile_complete ? "Lengkap" : "Belum"} helper="Nama dan nomor telepon" icon={teacher.profile_complete ? UserCheck : UserRoundX} tone={teacher.profile_complete ? "green" : "red"} /></div></td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : section === "orang-tua" ? (
        <>
          {selectedParent && (
            <section className="mb-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
                <div className="flex-1"><h2 className="text-xl font-black text-gray-900">Kelola Anak: {selectedParent.name}</h2><p className="mt-1 text-sm font-semibold text-gray-500">{selectedParent.linked_student ? `Terhubung dengan ${selectedParent.linked_student.name} · NIS ${selectedParent.linked_student.nis}` : "Belum terhubung dengan siswa."}</p></div>
                <label className="min-w-72 text-xs font-black uppercase tracking-wide text-gray-500">NIS Siswa<input value={parentNis} onChange={(event) => setParentNis(event.target.value)} placeholder="Masukkan NIS" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" /></label>
                <button type="button" disabled={!parentNis.trim() || Boolean(busyKey)} onClick={() => void runAction({ action: "manage_parent_link", operation: "connect", parent_id: selectedParent.id, nis: parentNis }, selectedParent.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black text-white disabled:opacity-50"><Link2 size={18} /> Hubungkan / Pindahkan</button>
                {selectedParent.linked_student && <button type="button" disabled={Boolean(busyKey)} onClick={() => void runAction({ action: "manage_parent_link", operation: "disconnect", parent_id: selectedParent.id }, selectedParent.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-5 py-3 font-black text-red-700"><Unlink size={18} /> Putuskan</button>}
              </div>
            </section>
          )}
          <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari Orang Tua, anak, atau NIS..." className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-500" /></div><StatusPill tone="blue">{filteredParents.length} Orang Tua</StatusPill></div>
            <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-4">Orang Tua</th><th className="px-5 py-4">Anak Terhubung</th><th className="px-5 py-4">Biodata</th><th className="px-5 py-4">Login Terakhir</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Aksi</th></tr></thead><tbody>{filteredParents.map((parent) => <tr key={parent.id} className="border-t border-gray-100 hover:bg-gray-50/70"><td className="px-5 py-4"><p className="font-black text-gray-900">{parent.name}</p><p className="mt-1 text-xs text-gray-500">{parent.username ? `@${parent.username}` : parent.email}</p></td><td className="px-5 py-4">{parent.linked_student ? <><p className="font-black text-gray-800">{parent.linked_student.name}</p><p className="text-xs text-gray-500">NIS {parent.linked_student.nis} · Kelas {parent.linked_student.class_name}</p></> : <StatusPill tone="amber">Belum terhubung</StatusPill>}</td><td className="px-5 py-4"><p className="font-black text-gray-700">{parent.profile_percentage}%</p><div className="mt-2 w-28"><ProgressBar value={parent.profile_percentage} /></div></td><td className="px-5 py-4 font-semibold text-gray-600">{formatRelative(parent.last_login_at)}</td><td className="px-5 py-4"><StatusPill tone={parent.status === "active" ? "green" : "red"}>{parent.status === "active" ? "Aktif" : "Nonaktif"}</StatusPill></td><td className="px-5 py-4"><button type="button" onClick={() => { setSelectedParent(parent); setParentNis(parent.linked_student?.nis || ""); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700 hover:bg-blue-100"><Link2 size={15} /> Kelola Anak</button></td></tr>)}</tbody></table></div>
          </section>
        </>
      ) : section === "siswa-kelas" ? (
        <>
          <section className="mb-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end"><div className="flex-1"><h2 className="text-xl font-black text-gray-900">Kenaikan Kelas Massal</h2><p className="mt-1 text-sm text-gray-500">Pindahkan seluruh siswa dalam satu rombel dan naikkan level Tahfidz bila diperlukan.</p></div><label className="text-xs font-black uppercase tracking-wide text-gray-500">Kelas Asal<select value={sourceClass} onChange={(event) => setSourceClass(event.target.value)} className="mt-2 block rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold">{classOptions.map((name) => <option key={name}>{name}</option>)}</select></label><ArrowRight className="mb-3 hidden text-gray-300 xl:block" /><label className="text-xs font-black uppercase tracking-wide text-gray-500">Kelas Tujuan<select value={targetClass} onChange={(event) => setTargetClass(event.target.value)} className="mt-2 block rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold">{classOptions.map((name) => <option key={name}>{name}</option>)}</select></label><label className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-gray-700"><input type="checkbox" checked={incrementLevel} onChange={(event) => setIncrementLevel(event.target.checked)} className="h-5 w-5 accent-emerald-600" /> Naikkan level +1</label><button type="button" disabled={Boolean(busyKey)} onClick={() => { if (window.confirm(`Pindahkan semua siswa ${sourceClass} ke ${targetClass}?`)) void runAction({ action: "mass_promote", source_class: sourceClass, target_class: targetClass, increment_level: incrementLevel }, "mass"); }} className="rounded-xl bg-[#1b4332] px-5 py-3 font-black text-white disabled:opacity-50">Proses Kenaikan</button></div>
          </section>
          <AdminClassAcademicPanel
            students={data.students}
            classes={data.classes}
            teachers={data.teachers}
            academicYears={data.academic_years.map((year) => year.year)}
          />
          <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 xl:flex-row xl:items-center xl:justify-between"><div className="relative max-w-md flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari siswa, NIS, kelas, atau Guru..." className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-500" /></div><div className="flex rounded-xl bg-gray-100 p-1">{(["active", "problem", "archived"] as const).map((mode) => <button key={mode} type="button" onClick={() => setStudentFilter(mode)} className={`rounded-lg px-4 py-2 text-xs font-black ${studentFilter === mode ? "bg-white text-emerald-800 shadow-sm" : "text-gray-500"}`}>{mode === "active" ? "Siswa Aktif" : mode === "problem" ? "Data Bermasalah" : "Arsip"}</button>)}</div></div>
            {studentFilter === "archived" ? <div className="divide-y divide-gray-100">{filteredStudents.map((student) => <div key={student.id} className="flex items-center justify-between gap-4 px-6 py-4"><div><p className="font-black text-gray-900">{student.name}</p><p className="text-xs font-semibold text-gray-500">NIS {student.nis} · {student.class_name}</p></div><StatusPill tone="gray">Diarsipkan</StatusPill></div>)}</div> : <div className="overflow-x-auto"><table className="min-w-[1180px] w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-4">Siswa</th><th className="px-3 py-4">Guru</th><th className="px-3 py-4">Kelas</th><th className="px-3 py-4">Level</th><th className="px-4 py-4">Aksi</th></tr></thead><tbody>{filteredStudents.map((student) => <StudentManagementRow key={student.id} student={student} teachers={data.teachers.filter((teacher) => teacher.status === "active")} busy={busyKey === student.id} onSave={(payload) => runAction(payload, student.id)} onArchive={async (reason) => { if (window.confirm(`Arsipkan ${student.name} sebagai ${reason.toLowerCase()}?`)) await runAction({ action: "archive_student", student_id: student.id, reason }, student.id); }} />)}</tbody></table></div>}
          </section>
        </>
      ) : section === "kelengkapan-laporan" ? (
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-3 border-b border-gray-100 p-5 md:grid-cols-4"><StatCard label="Laporan Hari Ini" value={data.summary.reports_today} helper="Seluruh Guru" icon={ClipboardCheck} /><StatCard label="7 Hari" value={data.summary.reports_week} helper="Laporan tersimpan" icon={CalendarRange} tone="blue" /><StatCard label="Ujian Level" value={data.summary.level_exam_count} helper="Total ujian" icon={GraduationCap} tone="amber" /><StatCard label="Munaqosyah" value={data.summary.munaqosyah_count} helper="Total ujian" icon={BookOpen} tone="blue" /></div>
          <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-[#173f30] text-xs uppercase tracking-wide text-white"><tr><th className="px-5 py-4">Guru</th><th className="px-5 py-4">Laporan Hari Ini</th><th className="px-5 py-4">Minggu Ini</th><th className="px-5 py-4">Ujian Level</th><th className="px-5 py-4">Munaqosyah</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{data.report_completeness.map((row) => { const percentage = row.expected_today > 0 ? Math.round((row.reports_today / row.expected_today) * 100) : 0; return <tr key={row.teacher_id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-5 py-4"><p className="font-black text-gray-900">{row.teacher_name}</p><p className="text-xs text-gray-500">{row.class_names.join(", ") || "Belum ada kelas"}</p></td><td className="px-5 py-4"><p className="font-black text-gray-800">{row.reports_today}/{row.expected_today}</p><div className="mt-2 w-32"><ProgressBar value={percentage} /></div></td><td className="px-5 py-4 text-lg font-black text-gray-800">{row.week_percentage}%</td><td className="px-5 py-4 text-lg font-black text-gray-800">{row.level_exam_count}</td><td className="px-5 py-4 text-lg font-black text-gray-800">{row.munaqosyah_count}</td><td className="px-5 py-4"><StatusPill tone={row.status === "Lengkap" ? "green" : row.status === "Hampir Lengkap" ? "amber" : "red"}>{row.status}</StatusPill></td></tr>; })}</tbody></table></div>
        </section>
      ) : section === "tahun-ajaran" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.academic_years.map((year) => <article key={year.year} className={`rounded-3xl border bg-white p-6 shadow-sm ${year.active ? "border-emerald-200" : "border-gray-100"}`}><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Tahun Ajaran</p><h2 className="mt-1 text-2xl font-black text-gray-900">{year.year}</h2></div><StatusPill tone={year.active ? "green" : "gray"}>{year.active ? "Dibuka" : "Ditutup"}</StatusPill></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs font-bold text-gray-400">Kelas</p><p className="mt-1 text-xl font-black">{year.class_count}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs font-bold text-gray-400">Data Surat</p><p className="mt-1 text-xl font-black">{year.surah_count}</p></div></div><button type="button" disabled={Boolean(busyKey)} onClick={() => void runAction({ action: "set_academic_year_status", academic_year: year.year, active: !year.active }, `year-${year.year}`)} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${year.active ? "bg-red-50 text-red-700" : "bg-emerald-600 text-white"}`}>{year.active ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}{year.active ? "Tutup Tahun Ajaran" : "Buka Tahun Ajaran"}</button></article>)}</section>
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-black text-gray-900"><Copy size={20} className="text-blue-600" /> Salin Data Surat</h2><p className="mt-2 text-sm text-gray-500">Data yang sudah ada di tahun tujuan tidak dihapus; surat dengan nama sama akan diperbarui.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-black uppercase tracking-wide text-gray-500">Dari Tahun<select value={copySourceYear} onChange={(event) => setCopySourceYear(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold">{data.academic_years.map((year) => <option key={year.year}>{year.year}</option>)}</select></label><label className="text-xs font-black uppercase tracking-wide text-gray-500">Ke Tahun<input value={copyTargetYear} onChange={(event) => setCopyTargetYear(event.target.value)} placeholder="2027/2028" pattern="[0-9]{4}/[0-9]{4}" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" /></label></div><button type="button" disabled={!copySourceYear || !copyTargetYear || Boolean(busyKey)} onClick={() => void runAction({ action: "copy_curriculum", source_year: copySourceYear, target_year: copyTargetYear }, "copy")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black text-white disabled:opacity-50"><Copy size={18} /> Salin Kurikulum</button><div className="mt-6 border-t border-gray-100 pt-5"><p className="text-xs font-black uppercase tracking-wide text-gray-400">Cakupan 9 Level</p><div className="mt-3 grid grid-cols-3 gap-2">{TAHFIDZ_LEVELS.map((level) => <div key={level.value} className="rounded-lg bg-gray-50 px-3 py-2"><p className="text-xs font-black text-gray-700">{level.label}</p><p className="text-[11px] text-gray-400">{data.curriculum.filter((row) => row.academic_year === copySourceYear && row.level === level.value).length} surat</p></div>)}</div></div></section>
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-black text-gray-900"><ShieldCheck size={20} className="text-emerald-600" /> Komposisi & Syarat Nilai</h2><p className="mt-2 text-sm text-gray-500">Total bobot tiga komponen wajib tepat 100%.</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{([['daily_weight','Harian'],['level_exam_weight','Ujian Level'],['munaqosyah_weight','Munaqosyah']] as const).map(([key,label]) => <label key={key} className="text-xs font-black uppercase tracking-wide text-gray-500">Bobot {label}<div className="relative mt-2"><input type="number" min={0} max={100} value={settings[key]} onChange={(event) => setSettings({ ...settings, [key]: Number(event.target.value) })} className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-9 text-sm font-black outline-none focus:border-emerald-500" /><span className="absolute right-4 top-3 text-sm font-black text-gray-400">%</span></div></label>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-black uppercase tracking-wide text-gray-500">Minimal Ujian Level<input type="number" min={0} max={100} value={settings.minimum_level_score} onChange={(event) => setSettings({ ...settings, minimum_level_score: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-black outline-none focus:border-emerald-500" /></label><label className="text-xs font-black uppercase tracking-wide text-gray-500">Minimal Munaqosyah<input type="number" min={0} max={100} value={settings.minimum_munaqosyah_score} onChange={(event) => setSettings({ ...settings, minimum_munaqosyah_score: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-black outline-none focus:border-emerald-500" /></label></div><div className="mt-5 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3"><span className="text-sm font-black text-emerald-900">Total Bobot</span><span className={`text-xl font-black ${settings.daily_weight + settings.level_exam_weight + settings.munaqosyah_weight === 100 ? "text-emerald-700" : "text-red-600"}`}>{settings.daily_weight + settings.level_exam_weight + settings.munaqosyah_weight}%</span></div><button type="button" disabled={Boolean(busyKey)} onClick={() => void runAction({ action: "save_academic_settings", settings }, "settings")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1b4332] px-5 py-3 font-black text-white disabled:opacity-50"><Save size={18} /> Simpan Pengaturan</button></section>
          </div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-gray-100 p-5 md:grid-cols-[1fr_180px_180px]"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari aktivitas atau pengguna..." className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-500" /></div><select value={auditStatus} onChange={(event) => setAuditStatus(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold"><option value="all">Semua Status</option><option value="success">Berhasil</option><option value="failed">Gagal</option><option value="blocked">Diblokir</option></select><input type="date" value={auditDate} onChange={(event) => setAuditDate(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold" /></div>
          <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-4">Waktu</th><th className="px-5 py-4">Aktivitas</th><th className="px-5 py-4">Pelaku</th><th className="px-5 py-4">Target</th><th className="px-5 py-4">Rincian</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{filteredAudit.map((event) => <tr key={event.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70"><td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-600">{formatDateTime(event.created_at)}</td><td className="px-5 py-4 font-black text-gray-900">{eventLabels[event.event_type] || event.event_type.replaceAll("_", " ")}</td><td className="px-5 py-4 font-bold text-gray-700">{event.actor_name}</td><td className="px-5 py-4 text-gray-600">{event.target_name}</td><td className="max-w-sm px-5 py-4"><code className="line-clamp-3 whitespace-pre-wrap break-words text-xs text-gray-500">{Object.keys(event.details || {}).length > 0 ? JSON.stringify(event.details) : "-"}</code></td><td className="px-5 py-4"><StatusPill tone={event.status === "success" ? "green" : event.status === "failed" ? "red" : "amber"}>{event.status === "success" ? "Berhasil" : event.status === "failed" ? "Gagal" : "Diblokir"}</StatusPill></td></tr>)}</tbody></table></div>
          {filteredAudit.length === 0 && <div className="px-6 py-16 text-center"><History className="mx-auto text-gray-300" size={48} /><p className="mt-4 font-black text-gray-700">Tidak ada aktivitas yang sesuai filter.</p></div>}
        </section>
      )}
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Edit2,
  FileText,
  Loader2,
  Printer,
  Save,
  UserCheck,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/Input";
import { StudentAvatar } from "@/components/StudentAvatar";
import {
  DailyReportExportRow,
  downloadDailyReports,
} from "@/lib/report-exports";
import { supabase } from "@/lib/supabase";

interface StudentRow {
  id: string;
  nama_lengkap: string;
  nis?: string | null;
  kelas?: string | null;
  foto_url?: string | null;
}

interface DailyReportRow extends DailyReportExportRow {
  id: string;
  student_id: string;
}

const initialForm = {
  student_id: "",
  tanggal: new Date().toISOString().split("T")[0],
  status_presensi: "Hadir",
  kegiatan: "",
  ringkasan_tadarus: "",
  ringkasan_hafalan: "",
  catatan_guru: "",
};

export default function DailyReportsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [history, setHistory] = useState<DailyReportRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedStudent = students.find((student) => student.id === form.student_id);

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

        const { data, error } = await supabase
          .from("students")
          .select("id, nama_lengkap, nis, kelas, foto_url")
          .order("nama_lengkap", { ascending: true });
        if (error) throw error;

        setUserId(user.id);
        setStudents(data || []);
        if (data?.[0]) {
          setForm((current) => ({ ...current, student_id: data[0].id }));
        }
      } catch (error) {
        setNotification({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Gagal memuat data laporan.",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  useEffect(() => {
    if (!form.student_id) return;

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("daily_student_reports")
        .select("*")
        .eq("student_id", form.student_id)
        .order("tanggal", { ascending: false });
      if (error) {
        setNotification({ type: "error", message: error.message });
        return;
      }
      setHistory(data || []);
    };

    void loadHistory();
  }, [form.student_id]);

  const refreshHistory = async () => {
    const { data, error } = await supabase
      .from("daily_student_reports")
      .select("*")
      .eq("student_id", form.student_id)
      .order("tanggal", { ascending: false });
    if (error) throw error;
    setHistory(data || []);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !form.student_id) return;

    setSubmitting(true);
    setNotification(null);
    try {
      const { error } = await supabase.from("daily_student_reports").upsert(
        {
          student_id: form.student_id,
          teacher_id: userId,
          tanggal: form.tanggal,
          status_presensi: form.status_presensi,
          kegiatan: form.kegiatan.trim() || null,
          ringkasan_tadarus: form.ringkasan_tadarus.trim() || null,
          ringkasan_hafalan: form.ringkasan_hafalan.trim() || null,
          catatan_guru: form.catatan_guru.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,tanggal" },
      );
      if (error) throw error;

      await refreshHistory();
      setNotification({
        type: "success",
        message: "Presensi dan laporan harian berhasil disimpan.",
      });
      setForm((current) => ({
        ...initialForm,
        student_id: current.student_id,
        tanggal: current.tanggal,
      }));
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan laporan harian.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row: DailyReportRow) => {
    setForm({
      student_id: row.student_id,
      tanggal: row.tanggal || initialForm.tanggal,
      status_presensi: row.status_presensi || "Hadir",
      kegiatan: row.kegiatan || "",
      ringkasan_tadarus: row.ringkasan_tadarus || "",
      ringkasan_hafalan: row.ringkasan_hafalan || "",
      catatan_guru: row.catatan_guru || "",
    });
    document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownload = () => {
    try {
      downloadDailyReports(selectedStudent?.nama_lengkap || "Siswa", history);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal mengunduh laporan.",
      });
    }
  };

  const fieldClass =
    "w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#2dc653]";

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Presensi & Laporan Harian
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Rekap presensi, kegiatan, tadarus, hafalan, dan catatan Guru.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!history.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1b4332] shadow-sm ring-1 ring-gray-200 disabled:opacity-50"
          >
            <Download size={18} /> Download Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!history.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Printer size={18} /> Cetak Laporan
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 font-bold print:hidden ${
            notification.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={21} />
          ) : (
            <XCircle size={21} />
          )}
          {notification.message}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[#1b4332]" size={42} />
        </div>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-3xl border border-gray-100 border-t-4 border-t-[#2dc653] bg-white p-6 shadow-sm md:p-8 print:hidden"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-3 text-green-700">
                <UserCheck size={22} />
              </div>
              <h2 className="text-xl font-black text-gray-900">Input Laporan Harian</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-3 block text-sm font-bold text-gray-800">Siswa</label>
                <select
                  value={form.student_id}
                  onChange={(event) =>
                    setForm({ ...form, student_id: event.target.value })
                  }
                  className={fieldClass}
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nama_lengkap} · Kelas {student.kelas || "-"} · NIS {student.nis || "-"}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Tanggal"
                type="date"
                value={form.tanggal}
                onChange={(event) => setForm({ ...form, tanggal: event.target.value })}
                required
              />
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-800">
                  Status Presensi
                </label>
                <select
                  value={form.status_presensi}
                  onChange={(event) =>
                    setForm({ ...form, status_presensi: event.target.value })
                  }
                  className={fieldClass}
                >
                  {["Hadir", "Izin", "Sakit", "Alpa"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Kegiatan Harian"
                value={form.kegiatan}
                onChange={(event) => setForm({ ...form, kegiatan: event.target.value })}
                placeholder="Contoh: Tahsin dan muroja'ah"
              />
              <Input
                label="Ringkasan Tadarus"
                value={form.ringkasan_tadarus}
                onChange={(event) =>
                  setForm({ ...form, ringkasan_tadarus: event.target.value })
                }
                placeholder="Contoh: Al-Baqarah ayat 1–10"
              />
              <Input
                label="Ringkasan Hafalan"
                value={form.ringkasan_hafalan}
                onChange={(event) =>
                  setForm({ ...form, ringkasan_hafalan: event.target.value })
                }
                placeholder="Contoh: Al-Mulk ayat 1–5"
              />
              <div className="md:col-span-2">
                <label className="mb-3 block text-sm font-bold text-gray-800">
                  Catatan Guru
                </label>
                <textarea
                  value={form.catatan_guru}
                  onChange={(event) =>
                    setForm({ ...form, catatan_guru: event.target.value })
                  }
                  className={`${fieldClass} min-h-24 resize-y`}
                  placeholder="Perkembangan atau arahan untuk orang tua..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex min-w-56 items-center justify-center gap-2 rounded-xl bg-[#2dc653] px-6 py-3 font-black text-[#0a2316] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="animate-spin" size={19} /> : <Save size={19} />}
              {submitting ? "Menyimpan..." : "Simpan Laporan Harian"}
            </button>
          </form>

          <section className="rounded-3xl border border-gray-100 bg-white shadow-sm print:border-0 print:shadow-none">
            <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between print:pb-4">
              <div className="flex items-center gap-4">
                {selectedStudent && (
                  <StudentAvatar
                    name={selectedStudent.nama_lengkap}
                    photoUrl={selectedStudent.foto_url}
                    className="h-14 w-14 rounded-xl"
                    textClassName="text-lg"
                  />
                )}
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    Rapor Harian {selectedStudent?.nama_lengkap || "Siswa"}
                  </h2>
                  <p className="text-sm font-medium text-gray-500">
                    NIS {selectedStudent?.nis || "-"} · Kelas {selectedStudent?.kelas || "-"}
                  </p>
                </div>
              </div>
              <CalendarDays className="hidden text-gray-300 print:block" size={36} />
            </div>

            {history.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto mb-3 text-gray-300" size={52} />
                <p className="font-bold text-gray-500">Belum ada laporan harian.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      {["Tanggal", "Presensi", "Kegiatan", "Tadarus", "Hafalan", "Catatan", "Aksi"].map(
                        (label) => (
                          <th
                            key={label}
                            className={`whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 ${
                              label === "Aksi" ? "print:hidden" : ""
                            }`}
                          >
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((row) => (
                      <tr key={row.id}>
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-gray-800">
                          {row.tanggal || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              row.status_presensi === "Hadir"
                                ? "bg-green-50 text-green-700"
                                : row.status_presensi === "Alpa"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {row.status_presensi || "-"}
                          </span>
                        </td>
                        <td className="min-w-40 px-5 py-4 text-gray-600">{row.kegiatan || "-"}</td>
                        <td className="min-w-40 px-5 py-4 text-gray-600">{row.ringkasan_tadarus || "-"}</td>
                        <td className="min-w-40 px-5 py-4 text-gray-600">{row.ringkasan_hafalan || "-"}</td>
                        <td className="min-w-48 px-5 py-4 text-gray-600">{row.catatan_guru || "-"}</td>
                        <td className="px-5 py-4 print:hidden">
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Printer,
  Save,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/Input";
import { StudentAvatar } from "@/components/StudentAvatar";
import {
  downloadLevelExamReports,
  LevelExamExportRow,
} from "@/lib/report-exports";
import { supabase } from "@/lib/supabase";
import { getAppErrorMessage } from "@/lib/app-errors";
import {
  getTahfidzLevelLabel,
  MAX_TAHFIDZ_LEVEL,
  TAHFIDZ_LEVELS,
} from "@/lib/tahfidz-levels";
import { numberToIndonesianDecimalWords } from "@/lib/munaqosyah";

interface StudentRow {
  id: string;
  nama_lengkap: string;
  nis?: string | null;
  kelas?: string | null;
  level?: number | string | null;
  foto_url?: string | null;
}

interface LevelExamRow extends LevelExamExportRow {
  id: string;
  student_id: string;
}

const initialForm = {
  student_id: "",
  tanggal: new Date().toISOString().split("T")[0],
  level_asal: "1",
  level_tujuan: "2",
  nilai_kelancaran: "80",
  nilai_makhraj: "80",
  nilai_tajwid: "80",
  nilai_hafalan: "80",
  tahun_ajaran: "2026/2027",
  catatan_guru: "",
};

const levelScoreFields = [
  { label: "Kelancaran", key: "nilai_kelancaran" },
  { label: "Makhorijul Huruf", key: "nilai_makhraj" },
  { label: "Hukum Tajwid", key: "nilai_tajwid" },
  { label: "Sambung Ayat", key: "nilai_hafalan" },
] as const;

export default function LevelExamPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [history, setHistory] = useState<LevelExamRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedStudent = students.find((student) => student.id === form.student_id);
  const scoreRows = useMemo(() => {
    return levelScoreFields.map((field) => {
      const score = Number(form[field.key]);
      const safeScore = Number.isFinite(score) ? score : 0;
      return {
        ...field,
        score: safeScore,
        valid: form[field.key].trim() !== "" && Number.isFinite(score),
        words: numberToIndonesianDecimalWords(form[field.key]),
        description: safeScore >= 75 ? "Tercapai" : "Perlu Bimbingan",
      };
    });
  }, [form]);
  const total = scoreRows.reduce((sum, row) => sum + row.score, 0);
  const average = Number((total / scoreRows.length).toFixed(2));
  const predictedStatus = average >= 75 ? "Lulus" : "Mengulang";
  const category = predictedStatus === "Lulus" ? "Naik" : "Tidak Naik";

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
          .select("id, nama_lengkap, nis, kelas, level, foto_url")
          .order("nama_lengkap", { ascending: true });
        if (error) throw error;

        const studentRows = data || [];
        setStudents(studentRows);
        const initialStudent =
          studentRows.find(
            (student) =>
              Number(student.level || 1) < MAX_TAHFIDZ_LEVEL,
          ) ||
          studentRows[0];
        if (initialStudent) {
          const currentLevel = Number(initialStudent.level || 1);
          setForm((current) => ({
            ...current,
            student_id: initialStudent.id,
            level_asal: String(currentLevel),
            level_tujuan:
              currentLevel < MAX_TAHFIDZ_LEVEL
                ? String(currentLevel + 1)
                : "",
          }));
        }
      } catch (error) {
        setNotification({
          type: "error",
          message: getAppErrorMessage(error, "Gagal memuat data ujian."),
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
        .from("level_promotion_exams")
        .select("*")
        .eq("student_id", form.student_id)
        .order("tanggal", { ascending: false });
      if (error) {
        setNotification({
          type: "error",
          message: getAppErrorMessage(error, "Gagal memuat data ujian."),
        });
        return;
      }
      setHistory(data || []);
    };
    void loadHistory();
  }, [form.student_id]);

  const refreshHistory = async () => {
    const { data, error } = await supabase
      .from("level_promotion_exams")
      .select("*")
      .eq("student_id", form.student_id)
      .order("tanggal", { ascending: false });
    if (error) throw error;
    setHistory(data || []);
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find((item) => item.id === studentId);
    const currentLevel = Number(student?.level || 1);
    setForm((current) => ({
      ...current,
      student_id: studentId,
      level_asal: String(currentLevel),
      level_tujuan:
        currentLevel < MAX_TAHFIDZ_LEVEL
          ? String(currentLevel + 1)
          : "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.student_id) return;
    if (Number(form.level_asal) >= MAX_TAHFIDZ_LEVEL) {
      setNotification({
        type: "error",
        message:
          "Siswa sudah berada di Mustawa Muttawasit 3 (jenjang tertinggi), sehingga tidak memiliki jenjang tujuan.",
      });
      return;
    }
    if (!form.level_tujuan) {
      setNotification({
        type: "error",
        message: "Pilih level tujuan sebelum menyimpan hasil ujian.",
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);
    try {
      if (
        scoreRows.some(
          (row) =>
            !row.valid || row.score < 0 || row.score > 100,
        )
      ) {
        throw new Error("Semua nilai harus berada di antara 0 dan 100.");
      }

      const { error } = await supabase.rpc("save_level_promotion_exam", {
        p_student_id: form.student_id,
        p_tanggal: form.tanggal,
        p_level_asal: Number(form.level_asal),
        p_level_tujuan: Number(form.level_tujuan),
        p_nilai_kelancaran: Number(form.nilai_kelancaran),
        p_nilai_makhraj: Number(form.nilai_makhraj),
        p_nilai_tajwid: Number(form.nilai_tajwid),
        p_nilai_hafalan: Number(form.nilai_hafalan),
        p_tahun_ajaran: form.tahun_ajaran,
        p_catatan_guru: form.catatan_guru,
      });
      if (error) throw error;

      await refreshHistory();
      if (predictedStatus === "Lulus") {
        const promotedLevel = Number(form.level_tujuan);
        setStudents((current) =>
          current.map((student) =>
            student.id === form.student_id
              ? { ...student, level: promotedLevel }
              : student,
          ),
        );
        setForm((current) => ({
          ...current,
          level_asal: String(promotedLevel),
          level_tujuan:
            promotedLevel < MAX_TAHFIDZ_LEVEL
              ? String(promotedLevel + 1)
              : "",
        }));
      }
      setNotification({
        type: "success",
        message:
          predictedStatus === "Lulus"
            ? `Siswa lulus dan naik ke ${getTahfidzLevelLabel(form.level_tujuan)}.`
            : "Hasil ujian tersimpan. Siswa perlu mengulang.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(
          error,
          "Gagal menyimpan ujian kenaikan level.",
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    try {
      downloadLevelExamReports(
        selectedStudent?.nama_lengkap || "Siswa",
        history,
        {
          nis: selectedStudent?.nis,
          kelas: selectedStudent?.kelas,
        },
      );
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(error, "Gagal mengunduh rapor."),
      });
    }
  };

  const openOfficialLevelReport = () => {
    if (!form.student_id) {
      setNotification({
        type: "error",
        message: "Pilih siswa terlebih dahulu sebelum membuka rapor.",
      });
      return;
    }
    if (history.length === 0) {
      setNotification({
        type: "error",
        message: "Simpan hasil ujian terlebih dahulu sebelum membuka rapor.",
      });
      return;
    }
    const query = new URLSearchParams({
      studentId: form.student_id,
      report: "level",
    });
    router.push(`/dashboard/guru/rapor-otomatis?${query.toString()}`);
  };

  const fieldClass =
    "w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#2dc653]";

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Ujian Kenaikan Level
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Form rekap sesuai Excel: nilai, terbilang, keterangan, jumlah,
            rata-rata, dan hasil kenaikan level. KKM 75.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!history.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1b4332] shadow-sm ring-1 ring-gray-200 disabled:opacity-50"
          >
            <Download size={18} /> Download Rapor
          </button>
          <button
            type="button"
            onClick={openOfficialLevelReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Printer size={18} /> Preview / Cetak Rapor
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
            className="mb-8 rounded-3xl border border-gray-100 border-t-4 border-t-purple-600 bg-white p-6 shadow-sm md:p-8 print:hidden"
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
                  <GraduationCap size={22} />
                </div>
                <h2 className="text-xl font-black text-gray-900">Input Nilai Ujian</h2>
              </div>
              <div
                className={`rounded-2xl px-5 py-3 text-center ${
                  predictedStatus === "Lulus"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <p className="text-xs font-bold uppercase">Prediksi Hasil</p>
                <p className="text-2xl font-black">
                  {average} · {category}
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-3 block text-sm font-bold text-gray-800">Siswa</label>
                <select
                  value={form.student_id}
                  onChange={(event) => handleStudentChange(event.target.value)}
                  className={fieldClass}
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nama_lengkap} ·{" "}
                      {getTahfidzLevelLabel(student.level || 1)}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Tanggal Ujian"
                type="date"
                value={form.tanggal}
                onChange={(event) => setForm({ ...form, tanggal: event.target.value })}
                required
              />
              <Input
                label="Tahun Ajaran"
                value={form.tahun_ajaran}
                onChange={(event) =>
                  setForm({ ...form, tahun_ajaran: event.target.value })
                }
                required
              />

              <div>
                <label className="mb-3 block text-sm font-bold text-gray-800">
                  Jenjang Asal
                </label>
                <input
                  value={getTahfidzLevelLabel(form.level_asal)}
                  readOnly
                  className={`${fieldClass} bg-gray-50`}
                />
              </div>
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-800">
                  Jenjang Tujuan
                </label>
                <select
                  value={form.level_tujuan}
                  onChange={(event) =>
                    setForm({ ...form, level_tujuan: event.target.value })
                  }
                  className={fieldClass}
                  disabled={
                    Number(form.level_asal) >= MAX_TAHFIDZ_LEVEL
                  }
                >
                  <option value="">
                    {Number(form.level_asal) >= MAX_TAHFIDZ_LEVEL
                      ? "Jenjang maksimum"
                      : "-- Pilih Jenjang Tujuan --"}
                  </option>
                  {TAHFIDZ_LEVELS
                    .filter(
                      (level) => level.value > Number(form.level_asal),
                    )
                    .map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                </select>
                {Number(form.level_asal) >= MAX_TAHFIDZ_LEVEL && (
                  <p className="mt-2 text-sm font-bold text-amber-700">
                    Siswa ini sudah di Mustawa Muttawasit 3 dan tidak memiliki
                    jenjang kenaikan berikutnya.
                  </p>
                )}
              </div>

              {levelScoreFields.map(({ label, key }) => (
                <Input
                  key={key}
                  label={label}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  required
                />
              ))}
            </div>

            <div className="mt-7 overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="border-b border-r border-gray-200 p-3 text-left">
                      Komponen
                    </th>
                    <th className="border-b border-r border-gray-200 p-3">
                      Nilai
                    </th>
                    <th className="border-b border-r border-gray-200 p-3 text-left">
                      Terbilang
                    </th>
                    <th className="border-b border-gray-200 p-3">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scoreRows.map((row) => (
                    <tr key={row.key}>
                      <td className="border-b border-r border-gray-200 p-3 font-bold">
                        {row.label}
                      </td>
                      <td className="border-b border-r border-gray-200 p-3 text-center text-lg font-black">
                        {row.score}
                      </td>
                      <td className="border-b border-r border-gray-200 p-3">
                        {row.words}
                      </td>
                      <td className="border-b border-gray-200 p-3 text-center font-bold">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-purple-50 font-black">
                  <tr>
                    <td className="border-r border-gray-200 p-3">Jumlah</td>
                    <td className="border-r border-gray-200 p-3 text-center">
                      {Number(total.toFixed(2))}
                    </td>
                    <td className="border-r border-gray-200 p-3">
                      {numberToIndonesianDecimalWords(
                        Number(total.toFixed(2)),
                      )}
                    </td>
                    <td className="p-3 text-center">Rata-rata {average}</td>
                  </tr>
                  <tr>
                    <td className="border-r border-t border-gray-200 p-3">
                      Kategori
                    </td>
                    <td
                      className="border-r border-t border-gray-200 p-3 text-center"
                      colSpan={2}
                    >
                      {category}
                    </td>
                    <td className="border-t border-gray-200 p-3 text-center">
                      {form.level_tujuan
                        ? `${category} ke ${getTahfidzLevelLabel(form.level_tujuan)}`
                        : "Pilih jenjang tujuan"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-5">
              <label className="mb-3 block text-sm font-bold text-gray-800">
                Catatan Guru
              </label>
              <textarea
                value={form.catatan_guru}
                onChange={(event) =>
                  setForm({ ...form, catatan_guru: event.target.value })
                }
                className={`${fieldClass} min-h-24 resize-y`}
                placeholder="Evaluasi dan rekomendasi setelah ujian..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex min-w-56 items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-black text-white disabled:opacity-60"
            >
              {submitting ? <Loader2 className="animate-spin" size={19} /> : <Save size={19} />}
              {submitting ? "Menyimpan..." : "Simpan Hasil Ujian"}
            </button>
          </form>

          <section className="rounded-3xl border border-gray-100 bg-white shadow-sm print:border-0 print:shadow-none">
            <div className="flex items-center gap-4 border-b border-gray-100 p-6">
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
                  Rapor Ujian Level {selectedStudent?.nama_lengkap || "Siswa"}
                </h2>
                <p className="text-sm font-medium text-gray-500">
                  NIS/NISN {selectedStudent?.nis || "-"} · Kelas{" "}
                  {selectedStudent?.kelas || "-"}
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto mb-3 text-gray-300" size={52} />
                <p className="font-bold text-gray-500">Belum ada hasil ujian kenaikan level.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      {[
                        "Tanggal",
                        "Kenaikan",
                        "Kelancaran",
                        "Makhorijul Huruf",
                        "Hukum Tajwid",
                        "Sambung Ayat",
                        "Rata-rata",
                        "Status",
                        "Catatan",
                      ].map((label) => (
                        <th
                          key={label}
                          className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((row) => (
                      <tr key={row.id}>
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-gray-800">
                          {row.tanggal || "-"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {getTahfidzLevelLabel(row.level_asal)} →{" "}
                          {getTahfidzLevelLabel(row.level_tujuan)}
                        </td>
                        <td className="px-5 py-4">{row.nilai_kelancaran}</td>
                        <td className="px-5 py-4">{row.nilai_makhraj}</td>
                        <td className="px-5 py-4">{row.nilai_tajwid}</td>
                        <td className="px-5 py-4">{row.nilai_hafalan}</td>
                        <td className="px-5 py-4 text-lg font-black">
                          {row.nilai_rata_rata}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              row.status === "Lulus"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="min-w-48 px-5 py-4 text-gray-600">
                          {row.catatan_guru || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {history[0] && (
              <div className="grid gap-4 border-t border-gray-100 p-6 sm:grid-cols-2 print:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-5 text-center">
                  <p className="mb-16 font-bold text-gray-700">Orang Tua/Wali</p>
                  <div className="mx-auto w-48 border-b border-gray-500" />
                </div>
                <div className="rounded-2xl bg-gray-50 p-5 text-center">
                  <p className="mb-16 font-bold text-gray-700">Guru Tahfidz</p>
                  <div className="mx-auto w-48 border-b border-gray-500" />
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Save,
  Sun,
  Users,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/Input";
import { StudentAvatar } from "@/components/StudentAvatar";
import { downloadTadarusHarian } from "@/lib/export-tadarus";
import { getStudentRouteKey } from "@/lib/students";
import { supabase } from "@/lib/supabase";
import { getAppErrorMessage } from "@/lib/app-errors";

type Notification = {
  type: "success" | "error";
  message: string;
};

interface StudentRow {
  id: string;
  nama_lengkap: string;
  nis?: string | null;
  kelas?: string | null;
  level?: number | string | null;
  foto_url?: string | null;
}

interface TadarusRow {
  id: string;
  student_id: string;
  tanggal?: string;
  nama_surah?: string;
  hal_ayat?: string;
  keterangan?: string;
}

const today = () => new Date().toISOString().split("T")[0];

const getPeriod = (dateValue: string) =>
  new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${dateValue}T12:00:00+07:00`));

const getCategory = (average: number) => {
  if (average >= 90) return { indo: "Mumtaz", arab: "ممتاز" };
  if (average >= 80) return { indo: "Jayyid Jiddan", arab: "جيد جدا" };
  if (average >= 65) return { indo: "Jayyid", arab: "جيد" };
  if (average >= 50) return { indo: "Maqbul", arab: "مقبول" };
  return { indo: "Perlu Bimbingan", arab: "يحتاج إلى إرشاد" };
};

const toArabicDigits = (value: number) =>
  value.toString().replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);

const numberWords = (value: number): string => {
  const words = [
    "",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
    "sepuluh",
    "sebelas",
  ];

  if (value < 12) return words[value];
  if (value < 20) return `${numberWords(value - 10)} belas`;
  if (value < 100) {
    return `${numberWords(Math.floor(value / 10))} puluh${value % 10 ? ` ${numberWords(value % 10)}` : ""}`;
  }
  if (value < 200) {
    return `seratus${value % 100 ? ` ${numberWords(value % 100)}` : ""}`;
  }
  if (value < 1000) {
    return `${numberWords(Math.floor(value / 100))} ratus${value % 100 ? ` ${numberWords(value % 100)}` : ""}`;
  }
  return value.toString();
};

const initialForm = {
  student_id: "",
  tanggal: today(),
  nama_surah: "",
  hal_ayat: "",
  tadarus_keterangan: "Lanjut",
  ayat_hafalan: "",
  makhraj: "",
  murojaah: "",
  tahfidz_keterangan: "Lanjut",
  nilai_harian: "80",
  level: "1",
  juz: "30",
  semester: "1 (satu)",
  tahun_ajaran: "2026/2027",
  kelancaran: "80",
  makhorijul: "80",
  tajwid: "80",
  sambung_ayat: "80",
  catatan_munaqosyah: "",
};

export default function CatatanTerintegrasiPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [history, setHistory] = useState<TadarusRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const selectedStudent = students.find((student) => student.id === form.student_id);
  const scores = [
    Number(form.kelancaran),
    Number(form.makhorijul),
    Number(form.tajwid),
    Number(form.sambung_ayat),
  ];
  const totalScore = scores.reduce((sum, score) => sum + (Number.isFinite(score) ? score : 0), 0);
  const averageScore = Math.round(totalScore / scores.length);
  const category = getCategory(averageScore);

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
          .select("*")
          .order("nama_lengkap", { ascending: true });
        if (error) throw error;

        setUserId(user.id);
        setStudents(data || []);
        if (data?.[0]) {
          setForm((current) => ({
            ...current,
            student_id: data[0].id,
            level: String(data[0].level || 1),
          }));
        }
      } catch (error) {
        setNotification({
          type: "error",
          message: getAppErrorMessage(error, "Gagal memuat data."),
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
      const { data } = await supabase
        .from("laporan_tadarus_pagi")
        .select("*")
        .eq("student_id", form.student_id)
        .order("tanggal", { ascending: false });
      setHistory(data || []);
    };

    void loadHistory();
  }, [form.student_id]);

  const rowsMunaqosyah = useMemo(
    () =>
      [
        { key: "kelancaran", value: Number(form.kelancaran) },
        { key: "makhorijul", value: Number(form.makhorijul) },
        { key: "tajwid", value: Number(form.tajwid) },
        { key: "sambung_ayat", value: Number(form.sambung_ayat) },
      ].map(({ value }) => ({
        angka: String(value),
        huruf: numberWords(value).replace(/^./, (letter) => letter.toUpperCase()),
        arab_huruf: "",
        arab_angka: toArabicDigits(value),
      })),
    [form.kelancaran, form.makhorijul, form.sambung_ayat, form.tajwid],
  );

  const handleStudentChange = (studentId: string) => {
    const student = students.find((item) => item.id === studentId);
    setForm((current) => ({
      ...current,
      student_id: studentId,
      level: String(student?.level || 1),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !selectedStudent) return;

    setSubmitting(true);
    setNotification(null);
    try {
      const payload = {
        juz: form.juz,
        semester: form.semester,
        tahunAjaran: form.tahun_ajaran,
        tanggalMunaqosyah: new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Jakarta",
        }).format(new Date(`${form.tanggal}T12:00:00+07:00`)),
        rowsMunaqosyah,
        jumlahMunaqosyah: {
          angka: String(totalScore),
          huruf: numberWords(totalScore).replace(/^./, (letter) => letter.toUpperCase()),
          arab: toArabicDigits(totalScore),
        },
        kategoriMunaqosyah: category,
        kepribadianMunaqosyah: {
          akhlaq: { nilai: "B", arab: "جيد" },
          kedisiplinan: { nilai: "B", arab: "جيد" },
          kerapihan: { nilai: "B", arab: "جيد" },
        },
        catatanMunaqosyah: form.catatan_munaqosyah,
      };

      const { error } = await supabase.rpc("save_integrated_learning_entry", {
        p_student_id: form.student_id,
        p_tanggal: form.tanggal,
        p_nama_surah: form.nama_surah,
        p_hal_ayat: form.hal_ayat,
        p_tadarus_keterangan: form.tadarus_keterangan,
        p_ayat: form.ayat_hafalan,
        p_makhraj: form.makhraj,
        p_murojaah: form.murojaah,
        p_tahfidz_keterangan: form.tahfidz_keterangan,
        p_nilai: Number(form.nilai_harian),
        p_level: Number(form.level),
        p_bulan_tahun: getPeriod(form.tanggal),
        p_data_rapor: payload,
      });
      if (error) throw error;

      setStudents((current) =>
        current.map((student) =>
          student.id === form.student_id ? { ...student, level: form.level } : student,
        ),
      );
      const { data } = await supabase
        .from("laporan_tadarus_pagi")
        .select("*")
        .eq("student_id", form.student_id)
        .order("tanggal", { ascending: false });
      setHistory(data || []);
      setForm((current) => ({
        ...initialForm,
        student_id: current.student_id,
        tanggal: current.tanggal,
        level: current.level,
      }));
      setNotification({
        type: "success",
        message: "Tadarus, hafalan, level tahfidz, dan rapor munaqasyah berhasil disimpan.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(
          error,
          "Gagal menyimpan catatan terintegrasi.",
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    try {
      downloadTadarusHarian(selectedStudent?.nama_lengkap || "Siswa", history);
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(error, "Gagal mengunduh data."),
      });
    }
  };

  const fieldClass =
    "w-full rounded-xl border-2 border-gray-200 bg-white px-5 py-3 font-medium text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#2dc653]";

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Catatan Mengaji Terintegrasi
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Satu form untuk tadarus harian, surat hafalan, level tahfidz, dan rapor munaqasyah.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!history.length}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1b4332] shadow-sm ring-1 ring-gray-200 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={18} />
          Download Tadarus Harian
        </button>
      </div>

      {notification && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 font-bold ${
            notification.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
          <p>{notification.message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[#1b4332]" size={42} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-7">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-3 text-[#1b4332]"><Users size={22} /></div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Siswa & Tanggal</h2>
                <p className="text-sm text-gray-500">Pilih satu siswa untuk seluruh catatan di bawah.</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-[1fr_240px]">
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-800">Pilih Siswa</label>
                <select
                  value={form.student_id}
                  onChange={(event) => handleStudentChange(event.target.value)}
                  className={fieldClass}
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nama_lengkap} · NIS {student.nis || "-"} · Kelas {student.kelas || "-"}
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
            </div>
            {selectedStudent && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
                <StudentAvatar
                  name={selectedStudent.nama_lengkap}
                  photoUrl={selectedStudent.foto_url}
                  className="h-14 w-14 rounded-xl"
                  textClassName="text-lg"
                />
                <div>
                  <p className="font-black text-gray-900">{selectedStudent.nama_lengkap}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Kelas {selectedStudent.kelas || "-"} · Level {form.level}
                  </p>
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-7 xl:grid-cols-2">
            <section className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-green-50 p-3 text-green-700"><Sun size={22} /></div>
                <h2 className="text-xl font-black text-gray-900">Tadarus Harian</h2>
              </div>
              <div className="space-y-5">
                <Input
                  label="Nama Surat"
                  placeholder="Contoh: Al-Mulk"
                  value={form.nama_surah}
                  onChange={(event) => setForm({ ...form, nama_surah: event.target.value })}
                  required
                />
                <Input
                  label="Halaman / Ayat Tadarus"
                  placeholder="Contoh: Hal. 562 / Ayat 1–10"
                  value={form.hal_ayat}
                  onChange={(event) => setForm({ ...form, hal_ayat: event.target.value })}
                  required
                />
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-800">Status Tadarus</label>
                  <select
                    value={form.tadarus_keterangan}
                    onChange={(event) => setForm({ ...form, tadarus_keterangan: event.target.value })}
                    className={fieldClass}
                  >
                    <option value="Lanjut">Lanjut</option>
                    <option value="Ulang">Ulang</option>
                    <option value="Murojaah">Muroja&apos;ah</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><BookOpen size={22} /></div>
                <h2 className="text-xl font-black text-gray-900">Hafalan & Level Tahfidz</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Ayat Hafalan"
                  placeholder="Ayat 1–10"
                  value={form.ayat_hafalan}
                  onChange={(event) => setForm({ ...form, ayat_hafalan: event.target.value })}
                  required
                />
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-800">Level Hafiz Tahfidz</label>
                  <select
                    value={form.level}
                    onChange={(event) => setForm({ ...form, level: event.target.value })}
                    className={fieldClass}
                  >
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <option key={level} value={level}>Level {level}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Makhraj"
                  placeholder="Contoh: Baik"
                  value={form.makhraj}
                  onChange={(event) => setForm({ ...form, makhraj: event.target.value })}
                />
                <Input
                  label="Muroja'ah"
                  placeholder="Contoh: Juz 30"
                  value={form.murojaah}
                  onChange={(event) => setForm({ ...form, murojaah: event.target.value })}
                />
                <Input
                  label="Nilai Harian"
                  type="number"
                  min="0"
                  max="100"
                  value={form.nilai_harian}
                  onChange={(event) => setForm({ ...form, nilai_harian: event.target.value })}
                  required
                />
                <div>
                  <label className="mb-3 block text-sm font-bold text-gray-800">Status Hafalan</label>
                  <select
                    value={form.tahfidz_keterangan}
                    onChange={(event) => setForm({ ...form, tahfidz_keterangan: event.target.value })}
                    className={fieldClass}
                  >
                    <option value="Lanjut">Lanjut</option>
                    <option value="Ulang">Ulang</option>
                    <option value="Murojaah">Muroja&apos;ah</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-700"><GraduationCap size={22} /></div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">Rapor Munaqasyah</h2>
                  <p className="text-sm text-gray-500">Nilai langsung masuk ke lembar rapor siswa.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-purple-50 px-5 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-500">Rata-rata</p>
                <p className="text-2xl font-black text-purple-800">{averageScore} · {category.indo}</p>
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Frekuensi", "1 kali ujian per siswa"],
                ["Durasi", "120 menit"],
                ["Jenjang", "Khusus SD/MI"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-500">
                    {label}
                  </p>
                  <p className="mt-1 font-black text-purple-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Kelancaran", "kelancaran"],
                ["Makhorijul Huruf", "makhorijul"],
                ["Hukum Tajwid", "tajwid"],
                ["Sambung Ayat", "sambung_ayat"],
              ].map(([label, key]) => (
                <Input
                  key={key}
                  label={label}
                  type="number"
                  min="0"
                  max="100"
                  value={form[key as keyof typeof form]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  required
                />
              ))}
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <Input label="Juz" value={form.juz} onChange={(event) => setForm({ ...form, juz: event.target.value })} />
              <Input label="Semester" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })} />
              <Input label="Tahun Ajaran" value={form.tahun_ajaran} onChange={(event) => setForm({ ...form, tahun_ajaran: event.target.value })} />
            </div>

            <div className="mt-5">
              <label className="mb-3 block text-sm font-bold text-gray-800">Catatan Munaqasyah</label>
              <textarea
                value={form.catatan_munaqosyah}
                onChange={(event) => setForm({ ...form, catatan_munaqosyah: event.target.value })}
                placeholder="Tuliskan evaluasi dan arahan untuk siswa/orang tua..."
                className={`${fieldClass} min-h-28 resize-y`}
              />
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-3xl bg-[#1b4332] p-5 shadow-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-white">
              <Award size={26} />
              <div>
                <p className="font-black">Simpan semua catatan sekaligus</p>
                <p className="text-xs font-medium text-white/70">Data langsung tersedia pada role Orang Tua.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard/guru/reports/print/${getStudentRouteKey(selectedStudent)}?type=munaqosyah`,
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <FileText size={18} />
                  Buka Rapor
                </button>
              )}
              <button
                type="submit"
                disabled={submitting || !selectedStudent}
                className="inline-flex min-w-52 items-center justify-center gap-2 rounded-xl bg-[#2dc653] px-6 py-3 font-black text-[#0a2316] transition hover:bg-[#25a244] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {submitting ? "Menyimpan..." : "Simpan Terintegrasi"}
              </button>
            </div>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, CheckCircle2, Clock3, Loader2, Printer, Save } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { getAppErrorMessage } from "@/lib/app-errors";

interface StudentRow {
  id: string;
  nama_lengkap: string;
  nis?: string | null;
  kelas?: string | null;
}

interface ExamResult {
  student_id: string;
  tanggal: string;
  hasil_ujian?: {
    nilaiRataRata?: number;
    kategoriMunaqosyah?: { indo?: string };
    rowsMunaqosyah?: Array<{ label?: string; angka?: number }>;
  };
  catatan_guru?: string | null;
}

const initialForm = {
  student_id: "",
  tanggal: new Date().toISOString().slice(0, 10),
  nilai_kelancaran: "80",
  nilai_makhraj: "80",
  nilai_tajwid: "80",
  nilai_hafalan: "80",
  bulan_tahun: new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date()),
  catatan_guru: "",
};

export default function MunaqosyahPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const average = useMemo(() => {
    const values = [
      form.nilai_kelancaran,
      form.nilai_makhraj,
      form.nilai_tajwid,
      form.nilai_hafalan,
    ].map(Number);
    return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0) / 4;
  }, [form]);

  const loadData = async () => {
    const [studentResult, examResult] = await Promise.all([
      supabase.from("students").select("id,nama_lengkap,nis,kelas").order("nama_lengkap"),
      supabase.from("munaqosyah_exams").select("student_id,tanggal,hasil_ujian,catatan_guru").order("tanggal", { ascending: false }),
    ]);
    if (studentResult.error) throw studentResult.error;
    if (examResult.error) throw examResult.error;
    setStudents(studentResult.data || []);
    setExams((examResult.data || []) as ExamResult[]);
    if (!form.student_id && studentResult.data?.[0]) {
      setForm((current) => ({ ...current, student_id: studentResult.data[0].id }));
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      loadData()
        .catch((error) =>
          setMessage({
            type: "error",
            text: getAppErrorMessage(error, "Gagal memuat Munaqosyah."),
          }),
        )
        .finally(() => setLoading(false));
    });
    // loadData only runs once; form selection is initialized from the response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectStudent = (studentId: string) => {
    const existing = exams.find((item) => item.student_id === studentId);
    const scores = existing?.hasil_ujian?.rowsMunaqosyah || [];
    const scoreAt = (index: number) => String(scores[index]?.angka ?? 80);
    setForm((current) => ({
      ...current,
      student_id: studentId,
      tanggal: existing?.tanggal || current.tanggal,
      nilai_kelancaran: scoreAt(0),
      nilai_makhraj: scoreAt(1),
      nilai_tajwid: scoreAt(2),
      nilai_hafalan: scoreAt(3),
      catatan_guru: existing?.catatan_guru || "",
    }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const values = [
        form.nilai_kelancaran,
        form.nilai_makhraj,
        form.nilai_tajwid,
        form.nilai_hafalan,
      ].map(Number);
      if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
        throw new Error("Semua nilai harus berada di antara 0 dan 100.");
      }

      const { error } = await supabase.rpc("save_munaqosyah_exam", {
        p_student_id: form.student_id,
        p_tanggal: form.tanggal,
        p_nilai_kelancaran: values[0],
        p_nilai_makhraj: values[1],
        p_nilai_tajwid: values[2],
        p_nilai_hafalan: values[3],
        p_bulan_tahun: form.bulan_tahun,
        p_catatan_guru: form.catatan_guru,
      });
      if (error) throw error;
      await loadData();
      setMessage({
        type: "success",
        text: "Nilai Munaqosyah tersimpan dan rapor otomatis sudah diperbarui.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getAppErrorMessage(error, "Gagal menyimpan Munaqosyah."),
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = students.find((student) => student.id === form.student_id);
  const predicate =
    average >= 90 ? "Mumtaz" : average >= 80 ? "Jayyid Jiddan" : average >= 65 ? "Jayyid" : average >= 50 ? "Maqbul" : "Perlu Bimbingan";

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between print:hidden">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Form Munaqosyah</h1>
          <p className="mt-2 font-medium text-gray-500">
            Satu ujian per siswa, khusus SD/MI, durasi tetap 2 jam.
          </p>
        </div>
        <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-bold text-gray-700">
          <Printer size={18} /> Preview / Cetak
        </button>
      </div>

      {message && (
        <div className={`mb-6 rounded-2xl border p-4 font-bold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={36} /></div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
          <form onSubmit={save} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm print:hidden">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><Award /></div>
              <h2 className="text-2xl font-black text-gray-900">Input Nilai Ujian</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-gray-700">Siswa</span>
                <select value={form.student_id} onChange={(event) => selectStudent(event.target.value)} required className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold">
                  <option value="">Pilih siswa</option>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.nama_lengkap} · {student.nis || "-"}</option>)}
                </select>
              </label>
              <Field label="Tanggal Ujian" type="date" value={form.tanggal} onChange={(value) => setForm({ ...form, tanggal: value })} />
              <Field label="Periode Rapor" value={form.bulan_tahun} onChange={(value) => setForm({ ...form, bulan_tahun: value })} />
              <ScoreField label="Kelancaran" value={form.nilai_kelancaran} onChange={(value) => setForm({ ...form, nilai_kelancaran: value })} />
              <ScoreField label="Makhraj" value={form.nilai_makhraj} onChange={(value) => setForm({ ...form, nilai_makhraj: value })} />
              <ScoreField label="Tajwid" value={form.nilai_tajwid} onChange={(value) => setForm({ ...form, nilai_tajwid: value })} />
              <ScoreField label="Hafalan" value={form.nilai_hafalan} onChange={(value) => setForm({ ...form, nilai_hafalan: value })} />
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-gray-700">Catatan Guru</span>
                <textarea value={form.catatan_guru} onChange={(event) => setForm({ ...form, catatan_guru: event.target.value })} className="min-h-24 w-full rounded-xl border border-gray-200 px-4 py-3" />
              </label>
            </div>
            <button disabled={saving || !form.student_id} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Simpan & Perbarui Rapor Otomatis
            </button>
          </form>

          <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm print:border-0 print:shadow-none">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Preview Hasil</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">{selectedStudent?.nama_lengkap || "Pilih Siswa"}</h2>
                <p className="text-sm font-medium text-gray-500">{selectedStudent?.kelas || "SD/MI"} · NIS {selectedStudent?.nis || "-"}</p>
              </div>
              <Clock3 className="text-gray-400" />
            </div>
            <div className="rounded-2xl bg-emerald-700 p-6 text-white">
              <p className="text-sm font-bold text-emerald-100">Nilai Rata-rata Otomatis</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-5xl font-black">{average.toFixed(2)}</span>
                <span className="rounded-full bg-white/15 px-4 py-2 font-black">{predicate}</span>
              </div>
            </div>
            <dl className="mt-6 space-y-3">
              {[
                ["Kelancaran", form.nilai_kelancaran],
                ["Makhraj", form.nilai_makhraj],
                ["Tajwid", form.nilai_tajwid],
                ["Hafalan", form.nilai_hafalan],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <dt className="font-bold text-gray-600">{label}</dt>
                  <dd className="font-black text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={18} /> Output ini berasal langsung dari form Munaqosyah.
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-gray-700">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold" />
    </label>
  );
}

function ScoreField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-gray-700">{label}</span>
      <input type="number" min="0" max="100" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} required className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold" />
    </label>
  );
}

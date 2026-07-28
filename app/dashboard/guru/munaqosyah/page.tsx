"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock3,
  Loader2,
  Printer,
  Save,
  UserRoundCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getAppErrorMessage } from "@/lib/app-errors";
import {
  buildMunaqosyahScoreRow,
  getMunaqosyahPredicate,
  getPersonalityValue,
  MUNAQOSYAH_CRITERIA,
  MUNAQOSYAH_PERSONALITY_OPTIONS,
  MunaqosyahPersonality,
  MunaqosyahScoreRow,
  numberToIndonesianWords,
  toArabicIndicDigits,
} from "@/lib/munaqosyah";
import { supabase } from "@/lib/supabase";

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
    juz?: string;
    nilaiRataRata?: number;
    kategoriMunaqosyah?: { indo?: string; arab?: string };
    rowsMunaqosyah?: MunaqosyahScoreRow[];
    kepribadianMunaqosyah?: MunaqosyahPersonality;
  };
  catatan_guru?: string | null;
}

const initialForm = {
  student_id: "",
  tanggal: new Date().toISOString().slice(0, 10),
  juz: "30",
  nilai_kelancaran: "80",
  nilai_makhorijul: "80",
  nilai_tajwid: "80",
  nilai_sambung_ayat: "80",
  akhlaq: "B",
  kedisiplinan: "B",
  kerapihan: "B",
  bulan_tahun: new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date()),
  catatan_guru: "",
};

type FormState = typeof initialForm;
type ScoreFieldName =
  | "nilai_kelancaran"
  | "nilai_makhorijul"
  | "nilai_tajwid"
  | "nilai_sambung_ayat";

const scoreFields: Array<{
  key: ScoreFieldName;
  label: string;
  legacyLabels: string[];
}> = [
  {
    key: "nilai_kelancaran",
    label: MUNAQOSYAH_CRITERIA[0].label,
    legacyLabels: ["kelancaran"],
  },
  {
    key: "nilai_makhorijul",
    label: MUNAQOSYAH_CRITERIA[1].label,
    legacyLabels: ["makhorijul huruf", "makhraj"],
  },
  {
    key: "nilai_tajwid",
    label: MUNAQOSYAH_CRITERIA[2].label,
    legacyLabels: ["hukum tajwid", "tajwid"],
  },
  {
    key: "nilai_sambung_ayat",
    label: MUNAQOSYAH_CRITERIA[3].label,
    legacyLabels: ["sambung ayat", "hafalan"],
  },
];

const personalityFields = [
  { key: "akhlaq", label: "Akhlaq" },
  { key: "kedisiplinan", label: "Kedisiplinan" },
  { key: "kerapihan", label: "Kerapihan" },
] as const;

function findScore(
  rows: MunaqosyahScoreRow[],
  labels: string[],
  index: number,
) {
  const matchingRow = rows.find((row) =>
    labels.includes((row.label || "").toLowerCase()),
  );
  return String(matchingRow?.angka ?? rows[index]?.angka ?? 80);
}

export default function MunaqosyahPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const scoreRows = useMemo(
    () => [
      buildMunaqosyahScoreRow(
        MUNAQOSYAH_CRITERIA[0].label,
        form.nilai_kelancaran,
      ),
      buildMunaqosyahScoreRow(
        MUNAQOSYAH_CRITERIA[1].label,
        form.nilai_makhorijul,
      ),
      buildMunaqosyahScoreRow(
        MUNAQOSYAH_CRITERIA[2].label,
        form.nilai_tajwid,
      ),
      buildMunaqosyahScoreRow(
        MUNAQOSYAH_CRITERIA[3].label,
        form.nilai_sambung_ayat,
      ),
    ],
    [
      form.nilai_kelancaran,
      form.nilai_makhorijul,
      form.nilai_tajwid,
      form.nilai_sambung_ayat,
    ],
  );

  const total = useMemo(
    () => scoreRows.reduce((sum, row) => sum + row.angka, 0),
    [scoreRows],
  );
  const average = total / scoreRows.length;
  const predicate = getMunaqosyahPredicate(average);

  const personality = useMemo<MunaqosyahPersonality>(
    () => ({
      akhlaq: getPersonalityValue(form.akhlaq),
      kedisiplinan: getPersonalityValue(form.kedisiplinan),
      kerapihan: getPersonalityValue(form.kerapihan),
    }),
    [form.akhlaq, form.kedisiplinan, form.kerapihan],
  );

  const loadData = async () => {
    const [studentResult, examResult] = await Promise.all([
      supabase
        .from("students")
        .select("id,nama_lengkap,nis,kelas")
        .order("nama_lengkap"),
      supabase
        .from("munaqosyah_exams")
        .select("student_id,tanggal,hasil_ujian,catatan_guru")
        .order("tanggal", { ascending: false }),
    ]);
    if (studentResult.error) throw studentResult.error;
    if (examResult.error) throw examResult.error;
    setStudents(studentResult.data || []);
    setExams((examResult.data || []) as ExamResult[]);
    if (!form.student_id && studentResult.data?.[0]) {
      setForm((current) => ({
        ...current,
        student_id: studentResult.data[0].id,
      }));
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
    // Data awal hanya perlu dimuat sekali.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectStudent = (studentId: string) => {
    const existing = exams.find((item) => item.student_id === studentId);
    const result = existing?.hasil_ujian;
    const rows = result?.rowsMunaqosyah || [];
    const savedPersonality = result?.kepribadianMunaqosyah;

    setForm((current) => ({
      ...current,
      student_id: studentId,
      tanggal: existing?.tanggal || current.tanggal,
      juz: result?.juz || current.juz,
      nilai_kelancaran: findScore(rows, scoreFields[0].legacyLabels, 0),
      nilai_makhorijul: findScore(rows, scoreFields[1].legacyLabels, 1),
      nilai_tajwid: findScore(rows, scoreFields[2].legacyLabels, 2),
      nilai_sambung_ayat: findScore(rows, scoreFields[3].legacyLabels, 3),
      akhlaq: savedPersonality?.akhlaq?.nilai || "B",
      kedisiplinan: savedPersonality?.kedisiplinan?.nilai || "B",
      kerapihan: savedPersonality?.kerapihan?.nilai || "B",
      catatan_guru: existing?.catatan_guru || "",
    }));
  };

  const updateForm = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const scores = scoreFields.map((field) => Number(form[field.key]));
      if (
        scores.some(
          (value) =>
            !Number.isInteger(value) || value < 0 || value > 100,
        )
      ) {
        throw new Error(
          "Semua nilai harus berupa bilangan bulat antara 0 dan 100.",
        );
      }

      const { error } = await supabase.rpc("save_munaqosyah_exam_v2", {
        p_student_id: form.student_id,
        p_tanggal: form.tanggal,
        p_juz: form.juz,
        p_rows: scoreRows,
        p_jumlah: {
          angka: total,
          huruf: numberToIndonesianWords(total),
          arab: toArabicIndicDigits(total),
        },
        p_bulan_tahun: form.bulan_tahun,
        p_kepribadian: personality,
        p_catatan_guru: form.catatan_guru,
      });
      if (error) throw error;

      await loadData();
      setMessage({
        type: "success",
        text: "Nilai Munaqosyah tersimpan dan rapor otomatis sudah diperbarui tanpa mengubah template rapor.",
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

  const selectedStudent = students.find(
    (student) => student.id === form.student_id,
  );

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between print:hidden">
        <div>
          <h1 className="text-4xl font-black text-gray-900">
            Form Munaqosyah
          </h1>
          <p className="mt-2 font-medium text-gray-500">
            Input mengikuti komponen rekap Excel. Template rapor resmi tetap
            menggunakan format yang sudah ada.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-bold text-gray-700"
        >
          <Printer size={18} /> Preview / Cetak
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-2xl border p-4 font-bold ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={36} />
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1fr_1.15fr]">
          <form
            onSubmit={save}
            className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm print:hidden"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <Award />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  Input Nilai Ujian
                </h2>
                <p className="text-sm font-medium text-gray-500">
                  Kolom huruf dan Arab dihitung otomatis.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-gray-700">
                  Nama Peserta Didik
                </span>
                <select
                  value={form.student_id}
                  onChange={(event) => selectStudent(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold"
                >
                  <option value="">Pilih siswa</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nama_lengkap} · {student.nis || "-"} ·{" "}
                      {student.kelas || "-"}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Tanggal Ujian"
                type="date"
                value={form.tanggal}
                onChange={(value) => updateForm("tanggal", value)}
              />
              <Field
                label="Juz"
                value={form.juz}
                onChange={(value) => updateForm("juz", value)}
                placeholder="Contoh: 30"
              />
              <Field
                label="Periode Rapor"
                value={form.bulan_tahun}
                onChange={(value) => updateForm("bulan_tahun", value)}
                placeholder="Contoh: Juli 2026"
                className="sm:col-span-2"
              />
            </div>

            <div className="my-7 border-t border-gray-100" />

            <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-500">
              Kategori Nilai
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              {scoreFields.map((field) => (
                <ScoreField
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={(value) => updateForm(field.key, value)}
                />
              ))}
            </div>

            <div className="my-7 border-t border-gray-100" />

            <div className="mb-4 flex items-center gap-2">
              <UserRoundCheck className="text-emerald-600" size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
                Kepribadian
              </h3>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {personalityFields.map((field) => (
                <PersonalityField
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={(value) => updateForm(field.key, value)}
                />
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-gray-700">
                Catatan Guru
              </span>
              <textarea
                value={form.catatan_guru}
                onChange={(event) =>
                  updateForm("catatan_guru", event.target.value)
                }
                className="min-h-24 w-full rounded-xl border border-gray-200 px-4 py-3"
              />
            </label>

            <button
              disabled={saving || !form.student_id}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              Simpan & Perbarui Rapor Otomatis
            </button>
          </form>

          <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm print:border-0 print:shadow-none">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                  Preview Data Munaqosyah
                </p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">
                  {selectedStudent?.nama_lengkap || "Pilih Siswa"}
                </h2>
                <p className="text-sm font-medium text-gray-500">
                  {selectedStudent?.kelas || "SD/MI"} · NIS{" "}
                  {selectedStudent?.nis || "-"} · Juz {form.juz || "-"}
                </p>
              </div>
              <Clock3 className="text-gray-400" />
            </div>

            <div className="rounded-2xl bg-emerald-700 p-6 text-white">
              <p className="text-sm font-bold text-emerald-100">
                Nilai Rata-rata Otomatis
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <span className="text-5xl font-black">
                  {average.toFixed(2)}
                </span>
                <span className="rounded-full bg-white/15 px-4 py-2 text-center font-black">
                  {predicate.indo} ·{" "}
                  <span dir="rtl">{predicate.arab}</span>
                </span>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-[760px] w-full border-collapse text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="border-b border-r border-gray-200 p-3 text-left">
                      Kategori Nilai
                    </th>
                    <th className="border-b border-r border-gray-200 p-3">
                      Angka
                    </th>
                    <th className="border-b border-r border-gray-200 p-3">
                      Huruf
                    </th>
                    <th className="border-b border-r border-gray-200 p-3">
                      Angka Arab
                    </th>
                    <th className="border-b border-gray-200 p-3">
                      Huruf Arab
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scoreRows.map((row) => (
                    <tr key={row.label}>
                      <td className="border-b border-r border-gray-200 p-3 font-bold">
                        {row.label}
                      </td>
                      <td className="border-b border-r border-gray-200 p-3 text-center font-black">
                        {row.angka}
                      </td>
                      <td className="border-b border-r border-gray-200 p-3">
                        {row.huruf}
                      </td>
                      <td
                        className="border-b border-r border-gray-200 p-3 text-center text-lg font-bold"
                        dir="rtl"
                      >
                        {row.arab_angka}
                      </td>
                      <td
                        className="border-b border-gray-200 p-3 text-right text-lg"
                        dir="rtl"
                      >
                        {row.arab_huruf}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-black">
                  <tr>
                    <td className="border-r border-gray-200 p-3">Jumlah</td>
                    <td className="border-r border-gray-200 p-3 text-center">
                      {total}
                    </td>
                    <td className="border-r border-gray-200 p-3">
                      {numberToIndonesianWords(total)}
                    </td>
                    <td
                      className="border-r border-gray-200 p-3 text-center text-lg"
                      dir="rtl"
                    >
                      {toArabicIndicDigits(total)}
                    </td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {personalityFields.map((field) => {
                const value = personality[field.key];
                const option = MUNAQOSYAH_PERSONALITY_OPTIONS.find(
                  (item) => item.value === value.nilai,
                );
                return (
                  <div
                    key={field.key}
                    className="rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                      {field.label}
                    </p>
                    <p className="mt-1 font-black text-gray-900">
                      {value.nilai} · {option?.label}
                    </p>
                    <p className="mt-1 text-lg text-gray-700" dir="rtl">
                      {value.arab}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={18} />
              Data ini masuk ke template rapor Munaqosyah yang sudah ada.
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold"
      />
    </label>
  );
}

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </span>
      <input
        type="number"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold"
      />
    </label>
  );
}

function PersonalityField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = getPersonalityValue(value);
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold"
      >
        {MUNAQOSYAH_PERSONALITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value} — {option.label}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-right text-sm text-gray-500" dir="rtl">
        {selected.arab}
      </span>
    </label>
  );
}

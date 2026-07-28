"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Edit2,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/Input";
import { supabase } from "@/lib/supabase";

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
  kelas?: string | null;
}

const initialForm = {
  tingkat: "1",
  rombel: "A",
  wali_kelas: "",
  tahun_ajaran: "2026/2027",
  aktif: true,
};

export default function ClassesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentClassRow[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const generatedName = `${form.tingkat}${form.rombel.trim().toUpperCase()}`;

  const studentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((student) => {
      const level = String(student.kelas || "").trim();
      counts[level] = (counts[level] || 0) + 1;
    });
    return counts;
  }, [students]);

  const fetchData = async () => {
    const [classResult, studentResult] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .order("tingkat", { ascending: true })
        .order("rombel", { ascending: true }),
      supabase.from("students").select("id, kelas"),
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
          message:
            error instanceof Error
              ? error.message
              : "Gagal memuat data kelas.",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
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
        message:
          error instanceof Error ? error.message : "Gagal menyimpan kelas.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (classItem: ClassRow) => {
    setForm({
      tingkat: String(classItem.tingkat),
      rombel: classItem.rombel,
      wali_kelas: classItem.wali_kelas || "",
      tahun_ajaran: classItem.tahun_ajaran,
      aktif: classItem.aktif,
    });
    setEditingId(classItem.id);
    setShowForm(true);
    document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (classItem: ClassRow) => {
    if (!window.confirm(`Hapus kelas ${classItem.nama_kelas}?`)) return;
    const { error } = await supabase.from("classes").delete().eq("id", classItem.id);
    if (error) {
      setNotification({ type: "error", message: error.message });
      return;
    }
    setClasses((current) => current.filter((item) => item.id !== classItem.id));
    setNotification({ type: "success", message: "Data kelas berhasil dihapus." });
  };

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Pengelolaan Kelas
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Kelola tingkat, rombongan belajar, wali kelas, dan tahun ajaran.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-5 py-3 font-bold text-white shadow-lg transition hover:bg-[#133c27]"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Tutup Form" : "Tambah Kelas"}
        </button>
      </div>

      {notification && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 font-bold ${
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

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-3xl border border-gray-100 border-t-4 border-t-[#1b4332] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-[#1b4332]">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                {editingId ? "Edit Kelas" : "Kelas Baru"}
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
                onChange={(event) => setForm({ ...form, tingkat: event.target.value })}
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
              onChange={(event) => setForm({ ...form, rombel: event.target.value })}
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
              onChange={(event) => setForm({ ...form, aktif: event.target.checked })}
              className="h-5 w-5 rounded accent-[#1b4332]"
            />
            Kelas aktif
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[#2dc653] px-6 py-3 font-black text-[#0a2316] transition hover:bg-[#25a244] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="animate-spin" size={19} /> : <Save size={19} />}
            {submitting ? "Menyimpan..." : "Simpan Kelas"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-[#1b4332]" size={42} />
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-14 text-center shadow-sm">
          <BookOpen className="mx-auto mb-4 text-gray-300" size={58} />
          <h2 className="text-xl font-black text-gray-900">Belum ada master kelas</h2>
          <p className="mt-2 text-gray-500">Tambahkan kelas pertama untuk tahun ajaran aktif.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => (
            <article
              key={classItem.id}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b4332] text-2xl font-black text-white">
                    {classItem.nama_kelas}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">
                      Kelas {classItem.nama_kelas}
                    </h2>
                    <p className="text-sm font-medium text-gray-500">
                      {classItem.tahun_ajaran}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    classItem.aktif
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {classItem.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-400">Siswa Tingkat</p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-black text-gray-900">
                    <Users size={20} />
                    {studentCounts[String(classItem.tingkat)] || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-400">Wali Kelas</p>
                  <p className="mt-2 truncate font-bold text-gray-800">
                    {classItem.wali_kelas || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => handleEdit(classItem)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(classItem)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

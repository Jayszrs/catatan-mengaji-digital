"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Copy,
  Edit2,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getAppErrorMessage } from "@/lib/app-errors";
import { supabase } from "@/lib/supabase";
import {
  getCurrentAcademicYear,
  getTahfidzLevelLabel,
  TAHFIDZ_LEVELS,
} from "@/lib/tahfidz-levels";

interface SurahCurriculumRow {
  id: string;
  tahun_ajaran: string;
  level: number;
  nama_surah: string;
  urutan: number;
  created_by?: string | null;
}

interface SurahForm {
  tahun_ajaran: string;
  level: string;
  nama_surah: string;
  urutan: string;
}

const academicYearPattern = /^\d{4}\/\d{4}$/;

function initialSurahForm(): SurahForm {
  return {
    tahun_ajaran: getCurrentAcademicYear(),
    level: "1",
    nama_surah: "",
    urutan: "1",
  };
}

export function SurahCurriculumManager({
  role,
}: {
  role: "guru" | "orang_tua";
}) {
  const [rows, setRows] = useState<SurahCurriculumRow[]>([]);
  const [userId, setUserId] = useState("");
  const [verifiedRole, setVerifiedRole] = useState("");
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [form, setForm] = useState<SurahForm>(initialSurahForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCopyForm, setShowCopyForm] = useState(false);
  const [copyTargetYear, setCopyTargetYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const canEdit = role === "guru" && verifiedRole === "guru";

  const loadCurriculum = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi sudah berakhir. Silakan login kembali.");

    const [curriculumResult, roleResult] = await Promise.all([
      supabase
        .from("surah_curriculum")
        .select("id,tahun_ajaran,level,nama_surah,urutan,created_by")
        .order("tahun_ajaran", { ascending: false })
        .order("level", { ascending: true })
        .order("urutan", { ascending: true }),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    if (curriculumResult.error) throw curriculumResult.error;
    if (roleResult.error) throw roleResult.error;
    if (role === "guru" && roleResult.data?.role !== "guru") {
      throw new Error("Hanya Guru yang dapat mengelola data surat.");
    }

    const loadedRows = (curriculumResult.data || []) as SurahCurriculumRow[];
    const loadedYears = Array.from(
      new Set(loadedRows.map((row) => row.tahun_ajaran)),
    ).sort((left, right) => right.localeCompare(left));
    setUserId(user.id);
    setVerifiedRole(roleResult.data?.role || "");
    setRows(loadedRows);
    setSelectedYear((current) =>
      loadedYears.includes(current)
        ? current
        : loadedYears[0] || getCurrentAcademicYear(),
    );
  }, [role]);

  useEffect(() => {
    queueMicrotask(() => {
      loadCurriculum()
        .catch((error) =>
          setNotification({
            type: "error",
            message: getAppErrorMessage(
              error,
              "Data surat belum dapat dimuat. Pastikan migrasi master surat sudah dijalankan.",
            ),
          }),
        )
        .finally(() => setLoading(false));
    });
  }, [loadCurriculum]);

  const availableYears = useMemo(
    () =>
      Array.from(
        new Set([
          getCurrentAcademicYear(),
          ...rows.map((row) => row.tahun_ajaran),
        ]),
      ).sort((left, right) => right.localeCompare(left)),
    [rows],
  );

  const selectedRows = useMemo(
    () => rows.filter((row) => row.tahun_ajaran === selectedYear),
    [rows, selectedYear],
  );

  const nextOrder = (year: string, level: number) => {
    const orders = rows
      .filter((row) => row.tahun_ajaran === year && row.level === level)
      .map((row) => row.urutan);
    return Math.max(0, ...orders) + 1;
  };

  const resetForm = () => {
    setForm({
      tahun_ajaran: selectedYear,
      level: "1",
      nama_surah: "",
      urutan: String(nextOrder(selectedYear, 1)),
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openNewForm = () => {
    const level = 1;
    setForm({
      tahun_ajaran: selectedYear,
      level: String(level),
      nama_surah: "",
      urutan: String(nextOrder(selectedYear, level)),
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit || !userId) return;

    const academicYear = form.tahun_ajaran.trim();
    const level = Number(form.level);
    const order = Number(form.urutan);
    if (!academicYearPattern.test(academicYear)) {
      setNotification({
        type: "error",
        message: "Format tahun ajaran harus seperti 2026/2027.",
      });
      return;
    }
    if (!Number.isInteger(order) || order < 1) {
      setNotification({
        type: "error",
        message: "Nomor urut harus berupa angka mulai dari 1.",
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);
    try {
      const payload = {
        tahun_ajaran: academicYear,
        level,
        nama_surah: form.nama_surah.trim(),
        urutan: order,
        created_by: userId,
        updated_at: new Date().toISOString(),
      };
      const result = editingId
        ? await supabase
            .from("surah_curriculum")
            .update(payload)
            .eq("id", editingId)
        : await supabase.from("surah_curriculum").insert(payload);
      if (result.error) throw result.error;

      await loadCurriculum();
      setSelectedYear(academicYear);
      resetForm();
      setNotification({
        type: "success",
        message: editingId
          ? "Data surat berhasil diperbarui."
          : "Surat berhasil ditambahkan.",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(
          error,
          "Gagal menyimpan surat. Periksa apakah nama surat sudah ada pada level dan tahun yang sama.",
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row: SurahCurriculumRow) => {
    setForm({
      tahun_ajaran: row.tahun_ajaran,
      level: String(row.level),
      nama_surah: row.nama_surah,
      urutan: String(row.urutan),
    });
    setEditingId(row.id);
    setShowForm(true);
    document
      .getElementById("main-content")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (row: SurahCurriculumRow) => {
    if (!window.confirm(`Hapus ${row.nama_surah} dari ${getTahfidzLevelLabel(row.level)}?`)) {
      return;
    }
    const { error } = await supabase
      .from("surah_curriculum")
      .delete()
      .eq("id", row.id);
    if (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(error, "Gagal menghapus surat."),
      });
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id));
    setNotification({
      type: "success",
      message: `${row.nama_surah} berhasil dihapus.`,
    });
  };

  const handleCopyYear = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit || !userId) return;
    const targetYear = copyTargetYear.trim();
    if (!academicYearPattern.test(targetYear)) {
      setNotification({
        type: "error",
        message: "Format tahun tujuan harus seperti 2027/2028.",
      });
      return;
    }
    if (targetYear === selectedYear) {
      setNotification({
        type: "error",
        message: "Tahun tujuan harus berbeda dari tahun sumber.",
      });
      return;
    }
    if (selectedRows.length === 0) {
      setNotification({
        type: "error",
        message: "Tahun sumber belum memiliki data surat.",
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);
    try {
      const payload = selectedRows.map((row) => ({
        tahun_ajaran: targetYear,
        level: row.level,
        nama_surah: row.nama_surah,
        urutan: row.urutan,
        created_by: userId,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("surah_curriculum")
        .upsert(payload, {
          onConflict: "tahun_ajaran,level,nama_surah",
        });
      if (error) throw error;

      await loadCurriculum();
      setSelectedYear(targetYear);
      setCopyTargetYear("");
      setShowCopyForm(false);
      setNotification({
        type: "success",
        message: `Daftar surat ${selectedYear} berhasil disalin ke ${targetYear}. Silakan edit perbedaannya.`,
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: getAppErrorMessage(error, "Gagal menyalin tahun ajaran."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout userRole={role}>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
            Kurikulum Tahsin &amp; Tahfidz
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Data Surat per Jenjang
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-gray-500">
            Daftar surat dipisahkan per tahun ajaran agar perubahan kurikulum
            tidak mengubah riwayat tahun sebelumnya.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowCopyForm((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-bold text-gray-700 shadow-sm"
            >
              {showCopyForm ? <X size={18} /> : <Copy size={18} />}
              {showCopyForm ? "Tutup Salin" : "Salin ke Tahun Baru"}
            </button>
            <button
              type="button"
              onClick={() => (showForm ? resetForm() : openNewForm())}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-5 py-3 font-bold text-white shadow-lg"
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? "Tutup Form" : "Tambah Surat"}
            </button>
          </div>
        )}
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

      {canEdit && showCopyForm && (
        <form
          onSubmit={handleCopyYear}
          className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <p className="font-black text-blue-950">
              Salin seluruh daftar {selectedYear}
            </p>
            <p className="mt-1 text-sm font-medium text-blue-700">
              Setelah disalin, surat pada tahun baru dapat ditambah, diedit,
              atau dihapus tanpa memengaruhi tahun sumber.
            </p>
          </div>
          <label className="min-w-52">
            <span className="mb-2 block text-sm font-bold text-blue-900">
              Tahun ajaran tujuan
            </span>
            <input
              value={copyTargetYear}
              onChange={(event) => setCopyTargetYear(event.target.value)}
              placeholder="2027/2028"
              className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-black text-white disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Copy size={18} />
            )}
            Salin
          </button>
        </form>
      )}

      {canEdit && showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-3xl border border-gray-100 border-t-4 border-t-[#1b4332] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <BookOpenCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                {editingId ? "Edit Data Surat" : "Tambah Surat"}
              </h2>
              <p className="text-sm font-medium text-gray-500">
                Satu surat dapat ditempatkan pada jenjang berbeda di tahun
                ajaran lain.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700">
                Tahun Ajaran
              </span>
              <input
                value={form.tahun_ajaran}
                onChange={(event) =>
                  setForm({ ...form, tahun_ajaran: event.target.value })
                }
                placeholder="2026/2027"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-emerald-300"
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700">
                Jenjang
              </span>
              <select
                value={form.level}
                onChange={(event) => {
                  const level = Number(event.target.value);
                  setForm({
                    ...form,
                    level: event.target.value,
                    urutan: String(nextOrder(form.tahun_ajaran, level)),
                  });
                }}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {TAHFIDZ_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700">
                Nama Surat
              </span>
              <input
                value={form.nama_surah}
                onChange={(event) =>
                  setForm({ ...form, nama_surah: event.target.value })
                }
                placeholder="Contoh: Al-Mulk"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-emerald-300"
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700">
                Nomor Urut
              </span>
              <input
                type="number"
                min="1"
                value={form.urutan}
                onChange={(event) =>
                  setForm({ ...form, urutan: event.target.value })
                }
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-emerald-300"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex min-w-52 items-center justify-center gap-2 rounded-xl bg-[#2dc653] px-6 py-3 font-black text-[#0a2316] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={19} />
            ) : (
              <Save size={19} />
            )}
            {submitting
              ? "Menyimpan..."
              : editingId
                ? "Simpan Perubahan"
                : "Simpan Surat"}
          </button>
        </form>
      )}

      <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-gray-900">Tahun Ajaran</p>
          <p className="text-xs font-medium text-gray-500">
            Pilih tahun untuk melihat susunan surat yang berlaku.
          </p>
        </div>
        <select
          value={selectedYear}
          onChange={(event) => {
            setSelectedYear(event.target.value);
            setShowForm(false);
            setEditingId(null);
          }}
          className="min-w-52 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-black text-[#1b4332] outline-none focus:ring-2 focus:ring-emerald-300"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TAHFIDZ_LEVELS.map((level) => {
            const levelRows = selectedRows.filter(
              (row) => row.level === level.value,
            );
            return (
              <section
                key={level.value}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <header className="flex items-center justify-between bg-[#1b4332] px-5 py-4 text-white">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">
                      Jenjang {level.value}
                    </p>
                    <h2 className="mt-1 text-lg font-black">{level.label}</h2>
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                    {levelRows.length} surat
                  </span>
                </header>
                <ol className="divide-y divide-gray-100">
                  {levelRows.length > 0 ? (
                    levelRows.map((row) => (
                      <li
                        key={row.id}
                        className="flex min-h-14 items-center gap-3 px-5 py-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700">
                          {row.urutan}
                        </span>
                        <span className="flex-1 font-bold text-gray-800">
                          {row.nama_surah}
                        </span>
                        {canEdit && (
                          <span className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(row)}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              aria-label={`Edit ${row.nama_surah}`}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(row)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              aria-label={`Hapus ${row.nama_surah}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="px-5 py-8 text-center text-sm font-semibold text-gray-400">
                      Belum ada surat pada tahun ini.
                    </li>
                  )}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

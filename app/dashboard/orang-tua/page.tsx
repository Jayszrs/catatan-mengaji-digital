"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpenCheck,
  Camera,
  Download,
  GraduationCap,
  Link2,
  Loader2,
  Pencil,
  Printer,
  Save,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OfficialReportTemplate } from "@/components/OfficialReportTemplate";
import { StudentAvatar } from "@/components/StudentAvatar";
import { downloadTadarusHarian } from "@/lib/export-tadarus";
import {
  filterRowsByDate,
  getDailyReportDates,
} from "@/lib/daily-report-history";
import {
  DailyMemorizationExportRow,
  DailyReportExportRow,
  downloadCompleteDailyReport,
  downloadLevelExamReports,
  downloadMunaqosyahReport,
  LevelExamExportRow,
  MunaqosyahExportRow,
} from "@/lib/report-exports";
import { supabase } from "@/lib/supabase";
import { getAppErrorMessage } from "@/lib/app-errors";
import { getTahfidzLevelLabel } from "@/lib/tahfidz-levels";

type ActiveOutput = "harian" | "level" | "munaqosyah";

interface StudentRow {
  id: string;
  nama_lengkap: string;
  nis?: string | null;
  kelas?: string | null;
  level?: number | string | null;
  foto_url?: string | null;
  tempat_tanggal_lahir?: string | null;
  wali_murid?: string | null;
  no_telp?: string | null;
  alamat?: string | null;
}

interface StudentProfileForm {
  nama_lengkap: string;
  tempat_tanggal_lahir: string;
  wali_murid: string;
  no_telp: string;
  alamat: string;
}

interface TadarusRow {
  tanggal?: string;
  nama_surah?: string;
  hal_ayat?: string;
  keterangan?: string;
}

const emptyProfile: StudentProfileForm = {
  nama_lengkap: "",
  tempat_tanggal_lahir: "",
  wali_murid: "",
  no_telp: "",
  alamat: "",
};

function profileFromStudent(student: StudentRow): StudentProfileForm {
  return {
    nama_lengkap: student.nama_lengkap || "",
    tempat_tanggal_lahir: student.tempat_tanggal_lahir || "",
    wali_murid: student.wali_murid || "",
    no_telp: student.no_telp || "",
    alamat: student.alamat || "",
  };
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => ({}));
  return new Error(
    typeof body.error === "string"
      ? body.error
      : "Data anak gagal disimpan.",
  );
}

export default function ParentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [tadarus, setTadarus] = useState<TadarusRow[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReportExportRow[]>([]);
  const [daily, setDaily] = useState<DailyMemorizationExportRow[]>([]);
  const [dailyDate, setDailyDate] = useState("");
  const [levels, setLevels] = useState<LevelExamExportRow[]>([]);
  const [munaqosyah, setMunaqosyah] =
    useState<MunaqosyahExportRow | undefined>();
  const [active, setActive] = useState<ActiveOutput>("harian");
  const [nis, setNis] = useState("");
  const [needsLink, setNeedsLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState<StudentProfileForm>(emptyProfile);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadStudentData = async (studentId: string) => {
    const [
      studentResult,
      tadarusResult,
      dailyReportResult,
      dailyResult,
      levelResult,
      munaqResult,
    ] = await Promise.all([
      supabase
        .from("students")
        .select(
          "id,nama_lengkap,nis,kelas,level,foto_url,tempat_tanggal_lahir,wali_murid,no_telp,alamat",
        )
        .eq("id", studentId)
        .single(),
      supabase
        .from("laporan_tadarus_pagi")
        .select("tanggal,nama_surah,hal_ayat,keterangan")
        .eq("student_id", studentId)
        .order("tanggal", { ascending: false }),
      supabase
        .from("daily_student_reports")
        .select(
          "tanggal,status_presensi,kegiatan,ringkasan_tadarus,ringkasan_hafalan,catatan_guru",
        )
        .eq("student_id", studentId)
        .order("tanggal", { ascending: false }),
      supabase
        .from("laporan_tahsin_tahfidz")
        .select(
          "tanggal,tahun_ajaran,nama_surah,ayat,murojaah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan",
        )
        .eq("student_id", studentId)
        .order("tanggal", { ascending: false }),
      supabase
        .from("level_promotion_exams")
        .select(
          "tanggal,level_asal,level_tujuan,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,status,tahun_ajaran,catatan_guru",
        )
        .eq("student_id", studentId)
        .order("tanggal", { ascending: false }),
      supabase
        .from("munaqosyah_exams")
        .select("tanggal,hasil_ujian,catatan_guru")
        .eq("student_id", studentId)
        .maybeSingle(),
    ]);

    if (studentResult.error) throw studentResult.error;
    if (tadarusResult.error) throw tadarusResult.error;
    if (dailyReportResult.error) throw dailyReportResult.error;
    if (dailyResult.error) throw dailyResult.error;
    if (levelResult.error) throw levelResult.error;
    if (munaqResult.error) throw munaqResult.error;

    const loadedStudent = studentResult.data as StudentRow;
    setStudent(loadedStudent);
    setProfile(profileFromStudent(loadedStudent));
    setTadarus(tadarusResult.data || []);
    const loadedDailyReports = dailyReportResult.data || [];
    const loadedDaily = dailyResult.data || [];
    const reportDates = getDailyReportDates(loadedDailyReports, loadedDaily);
    setDailyReports(loadedDailyReports);
    setDaily(loadedDaily);
    setDailyDate((current) =>
      reportDates.includes(current) ? current : reportDates[0] || "",
    );
    setLevels(levelResult.data || []);
    setMunaqosyah(munaqResult.data || undefined);
    setNeedsLink(false);
  };

  const load = async () => {
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
      .maybeSingle();
    if (roleData?.role !== "orang_tua") {
      router.push("/auth/login");
      return;
    }

    const linkResult = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (linkResult.error) throw linkResult.error;
    let link = linkResult.data;

    const metadataNis = user.user_metadata?.nis_anak;
    if (!link && metadataNis) {
      const { data: claimedId, error } = await supabase.rpc(
        "claim_parent_student_by_nis",
        { p_nis: String(metadataNis) },
      );
      if (!error && claimedId) link = { student_id: claimedId };
    }

    if (!link) {
      setNeedsLink(true);
      return;
    }
    await loadStudentData(link.student_id);
  };

  useEffect(() => {
    queueMicrotask(() => {
      load()
        .catch((error) =>
          setMessage({
            type: "error",
            text: getAppErrorMessage(error, "Gagal memuat data anak."),
          }),
        )
        .finally(() => setLoading(false));
    });
    // Authentication and parent link are checked once on page entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview],
  );

  const connectChild = async (event: React.FormEvent) => {
    event.preventDefault();
    setLinking(true);
    setMessage(null);
    try {
      const { data: studentId, error } = await supabase.rpc(
        "claim_parent_student_by_nis",
        { p_nis: nis.trim() },
      );
      if (error) throw error;
      await loadStudentData(studentId);
      setMessage({
        type: "success",
        text: "Akun orang tua berhasil dihubungkan ke satu anak.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getAppErrorMessage(error, "NIS anak tidak dapat dihubungkan."),
      });
    } finally {
      setLinking(false);
    }
  };

  const cancelProfileEdit = () => {
    if (student) setProfile(profileFromStudent(student));
    setPhotoFile(null);
    setPhotoPreview("");
    setEditingProfile(false);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!student) return;
    setSavingProfile(true);
    setMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sesi sudah berakhir. Silakan login kembali.");
      }
      const headers = {
        Authorization: `Bearer ${session.access_token}`,
      };

      const profileResponse = await fetch("/api/parent/child-profile", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId: student.id, ...profile }),
      });
      if (!profileResponse.ok) throw await responseError(profileResponse);

      if (photoFile) {
        const formData = new FormData();
        formData.append("studentId", student.id);
        formData.append("photo", photoFile);
        const photoResponse = await fetch("/api/parent/child-profile", {
          method: "POST",
          headers,
          body: formData,
        });
        if (!photoResponse.ok) throw await responseError(photoResponse);
      }

      await loadStudentData(student.id);
      setPhotoFile(null);
      setPhotoPreview("");
      setEditingProfile(false);
      setMessage({
        type: "success",
        text: "Foto dan biodata anak berhasil disimpan.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getAppErrorMessage(error, "Data anak gagal disimpan."),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const dailyDates = useMemo(
    () => getDailyReportDates(dailyReports, daily),
    [dailyReports, daily],
  );
  const selectedDailyReports = useMemo(
    () => filterRowsByDate(dailyReports, dailyDate),
    [dailyReports, dailyDate],
  );
  const selectedDaily = useMemo(
    () => filterRowsByDate(daily, dailyDate),
    [daily, dailyDate],
  );
  const selectedDailyAverage = useMemo(() => {
    const scores = selectedDaily
      .map((row) => Number(row.nilai_rata_rata ?? row.nilai))
      .filter(Number.isFinite);
    if (scores.length === 0) return null;
    return scores.reduce((total, score) => total + score, 0) / scores.length;
  }, [selectedDaily]);
  const latestLevel = levels[0];
  const munaqAverage = Number(
    munaqosyah?.hasil_ujian?.nilaiRataRata ?? 0,
  );

  const downloadActive = () => {
    if (!student) return;
    try {
      if (active === "harian") {
        downloadCompleteDailyReport(
          student.nama_lengkap,
          selectedDailyReports,
          selectedDaily,
        );
      }
      if (active === "level") {
        downloadLevelExamReports(student.nama_lengkap, levels, {
          nis: student.nis,
          kelas: student.kelas,
        });
      }
      if (active === "munaqosyah") {
        downloadMunaqosyahReport(student.nama_lengkap, munaqosyah);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: getAppErrorMessage(error, "Data belum tersedia."),
      });
    }
  };

  return (
    <DashboardLayout userRole="orang_tua">
      <div className="mb-8 print:hidden">
        <h1 className="text-4xl font-black text-gray-900">
          Preview Rapor Anak
        </h1>
        <p className="mt-2 font-medium text-gray-500">
          Akun ini hanya dapat melihat dan memperbarui satu anak yang ditautkan.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-2xl border p-4 font-bold print:hidden ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={38} />
        </div>
      ) : needsLink ? (
        <form
          onSubmit={connectChild}
          className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Link2 size={30} />
          </div>
          <h2 className="mt-5 text-2xl font-black text-gray-900">
            Hubungkan Satu Anak
          </h2>
          <p className="mt-2 font-medium text-gray-500">
            Masukkan NIS anak. Setelah terhubung, akun ini tidak akan melihat
            daftar siswa lain.
          </p>
          <input
            value={nis}
            onChange={(event) => setNis(event.target.value)}
            required
            placeholder="NIS anak"
            className="mt-6 w-full rounded-xl border border-gray-200 px-5 py-4 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            disabled={linking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-50"
          >
            {linking ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Link2 size={20} />
            )}{" "}
            Hubungkan Anak
          </button>
        </form>
      ) : student ? (
        <>
          <section className="mb-7 flex flex-col gap-5 rounded-3xl bg-emerald-800 p-6 text-white shadow-lg print:hidden sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <StudentAvatar
                name={student.nama_lengkap}
                photoUrl={student.foto_url}
                className="h-20 w-20 rounded-2xl"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-200">
                  Siswa yang ditautkan
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {student.nama_lengkap}
                </h2>
                <p className="mt-1 font-semibold text-emerald-100">
                  NIS {student.nis || "-"} · Kelas {student.kelas || "-"} ·
                  {getTahfidzLevelLabel(student.level)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setEditingProfile((current) => !current)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-emerald-800 hover:bg-emerald-50"
              >
                <Pencil size={18} /> Edit Biodata Anak
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    downloadTadarusHarian(student.nama_lengkap, tadarus);
                  } catch (error) {
                    setMessage({
                      type: "error",
                      text: getAppErrorMessage(error, "Belum ada tadarus."),
                    });
                  }
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3 font-bold hover:bg-white/25"
              >
                <Download size={18} /> Download Tadarus
              </button>
            </div>
          </section>

          {editingProfile && (
            <form
              onSubmit={saveProfile}
              className="mb-7 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm print:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    Edit Biodata Anak
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-gray-500">
                    NIS, kelas, level, dan nilai hanya dapat diubah oleh Guru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelProfileEdit}
                  className="rounded-xl border border-gray-200 p-3 text-gray-500 hover:bg-gray-50"
                  aria-label="Tutup form biodata"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6 flex flex-col gap-5 rounded-2xl bg-gray-50 p-5 sm:flex-row sm:items-center">
                <StudentAvatar
                  name={profile.nama_lengkap || student.nama_lengkap}
                  photoUrl={photoPreview || student.foto_url}
                  className="h-24 w-24 rounded-2xl"
                />
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-700 shadow-sm">
                    <Camera size={18} /> Pilih Foto Anak
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          setMessage({
                            type: "error",
                            text: "Ukuran foto maksimal 2 MB.",
                          });
                          event.target.value = "";
                          return;
                        }
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    JPG, PNG, atau WebP. Maksimal 2 MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <ProfileInput
                  label="Nama Lengkap"
                  value={profile.nama_lengkap}
                  required
                  onChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      nama_lengkap: value,
                    }))
                  }
                />
                <ProfileInput
                  label="Tempat, Tanggal Lahir"
                  value={profile.tempat_tanggal_lahir}
                  placeholder="Contoh: Bekasi, 10 Juni 2015"
                  onChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      tempat_tanggal_lahir: value,
                    }))
                  }
                />
                <ProfileInput
                  label="Nama Wali Murid / Orang Tua"
                  value={profile.wali_murid}
                  onChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      wali_murid: value,
                    }))
                  }
                />
                <ProfileInput
                  label="No. Telepon / WhatsApp"
                  value={profile.no_telp}
                  onChange={(value) =>
                    setProfile((current) => ({
                      ...current,
                      no_telp: value,
                    }))
                  }
                />
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black text-gray-700">
                    Alamat Lengkap
                  </span>
                  <textarea
                    value={profile.alamat}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        alamat: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-black text-white disabled:opacity-50"
                >
                  {savingProfile ? (
                    <Loader2 className="animate-spin" size={19} />
                  ) : (
                    <Save size={19} />
                  )}{" "}
                  Simpan Biodata
                </button>
                <button
                  type="button"
                  onClick={cancelProfileEdit}
                  disabled={savingProfile}
                  className="rounded-xl border border-gray-200 px-6 py-3 font-bold text-gray-600"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          <div className="mb-7 grid gap-4 print:hidden md:grid-cols-3">
            <OutputCard
              active={active === "harian"}
              onClick={() => setActive("harian")}
              icon={<BookOpenCheck />}
              title="Hafalan Harian"
              value={
                selectedDailyAverage === null
                  ? "-"
                  : selectedDailyAverage.toFixed(2)
              }
              detail={`${selectedDailyReports.length} laporan · ${selectedDaily.length} surat`}
            />
            <OutputCard
              active={active === "level"}
              onClick={() => setActive("level")}
              icon={<GraduationCap />}
              title="Hafalan Level"
              value={latestLevel?.nilai_rata_rata?.toFixed(2) || "-"}
              detail={latestLevel?.status || "Belum ada ujian"}
            />
            <OutputCard
              active={active === "munaqosyah"}
              onClick={() => setActive("munaqosyah")}
              icon={<Award />}
              title="Munaqosyah"
              value={munaqosyah ? munaqAverage.toFixed(2) : "-"}
              detail={
                munaqosyah?.hasil_ujian?.kategoriMunaqosyah?.indo ||
                "Belum ada ujian"
              }
            />
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                Template rapor resmi
              </p>
              <h2 className="mt-1 text-2xl font-black text-gray-900">
                {active === "harian"
                  ? "Rapor Hafalan Harian"
                  : active === "level"
                    ? "Rapor Ujian Kenaikan Level"
                    : "Rapor Munaqosyah"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {active === "harian" && dailyDates.length > 0 && (
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2">
                  <span className="text-sm font-black text-gray-600">
                    Tanggal rapor
                  </span>
                  <select
                    value={dailyDate}
                    onChange={(event) => setDailyDate(event.target.value)}
                    className="bg-transparent font-bold text-emerald-700 outline-none"
                  >
                    {dailyDates.map((date) => (
                      <option key={date} value={date}>
                        {new Intl.DateTimeFormat("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date(`${date}T00:00:00`))}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                onClick={downloadActive}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white"
              >
                <Download size={18} /> Download Excel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-700"
              >
                <Printer size={18} /> Cetak / Simpan PDF
              </button>
            </div>
          </div>

          <OfficialReportTemplate
            reportType={
              active === "harian"
                ? "daily"
                : active === "level"
                  ? "level"
                  : "munaqosyah"
            }
            student={student}
            dailyReports={
              active === "harian" ? selectedDailyReports : dailyReports
            }
            memorization={active === "harian" ? selectedDaily : daily}
            levels={levels}
            munaq={munaqosyah}
          />
        </>
      ) : null}
    </DashboardLayout>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-black text-gray-700">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function OutputCard({
  active,
  onClick,
  icon,
  title,
  value,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-lg"
          : "border-gray-100 bg-white text-gray-900 hover:border-emerald-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={active ? "text-white" : "text-emerald-600"}>
          {icon}
        </span>
        <span className="text-3xl font-black">{value}</span>
      </div>
      <h3 className="mt-4 font-black">{title}</h3>
      <p
        className={`mt-1 text-sm font-semibold ${
          active ? "text-emerald-100" : "text-gray-500"
        }`}
      >
        {detail}
      </p>
    </button>
  );
}

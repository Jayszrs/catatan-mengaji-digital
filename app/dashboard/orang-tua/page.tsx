"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpenCheck,
  Download,
  GraduationCap,
  Link2,
  Loader2,
  Printer,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentAvatar } from "@/components/StudentAvatar";
import { downloadTadarusHarian } from "@/lib/export-tadarus";
import {
  DailyMemorizationExportRow,
  downloadDailyMemorizationReports,
  downloadLevelExamReports,
  downloadMunaqosyahReport,
  LevelExamExportRow,
  MunaqosyahExportRow,
} from "@/lib/report-exports";
import { supabase } from "@/lib/supabase";
import { getAppErrorMessage } from "@/lib/app-errors";

type ActiveOutput = "harian" | "level" | "munaqosyah";

interface StudentRow {
  id: string;
  nama_lengkap: string;
  nis?: string | null;
  kelas?: string | null;
  level?: number | string | null;
  foto_url?: string | null;
}

interface TadarusRow {
  tanggal?: string;
  nama_surah?: string;
  hal_ayat?: string;
  keterangan?: string;
}

export default function ParentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [tadarus, setTadarus] = useState<TadarusRow[]>([]);
  const [daily, setDaily] = useState<DailyMemorizationExportRow[]>([]);
  const [levels, setLevels] = useState<LevelExamExportRow[]>([]);
  const [munaqosyah, setMunaqosyah] = useState<MunaqosyahExportRow | undefined>();
  const [active, setActive] = useState<ActiveOutput>("harian");
  const [nis, setNis] = useState("");
  const [needsLink, setNeedsLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadStudentData = async (studentId: string) => {
    const [studentResult, tadarusResult, dailyResult, levelResult, munaqResult] = await Promise.all([
      supabase.from("students").select("id,nama_lengkap,nis,kelas,level,foto_url").eq("id", studentId).single(),
      supabase.from("laporan_tadarus_pagi").select("tanggal,nama_surah,hal_ayat,keterangan").eq("student_id", studentId).order("tanggal", { ascending: false }),
      supabase.from("laporan_tahsin_tahfidz").select("tanggal,nama_surah,ayat,murojaah,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan").eq("student_id", studentId).order("tanggal", { ascending: false }),
      supabase.from("level_promotion_exams").select("tanggal,level_asal,level_tujuan,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,status,tahun_ajaran,catatan_guru").eq("student_id", studentId).order("tanggal", { ascending: false }),
      supabase.from("munaqosyah_exams").select("tanggal,hasil_ujian,catatan_guru").eq("student_id", studentId).maybeSingle(),
    ]);
    if (studentResult.error) throw studentResult.error;
    if (tadarusResult.error) throw tadarusResult.error;
    if (dailyResult.error) throw dailyResult.error;
    if (levelResult.error) throw levelResult.error;
    if (munaqResult.error) throw munaqResult.error;
    setStudent(studentResult.data);
    setTadarus(tadarusResult.data || []);
    setDaily(dailyResult.data || []);
    setLevels(levelResult.data || []);
    setMunaqosyah(munaqResult.data || undefined);
    setNeedsLink(false);
  };

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
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
      const { data: claimedId, error } = await supabase.rpc("claim_parent_student_by_nis", {
        p_nis: String(metadataNis),
      });
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

  const connectChild = async (event: React.FormEvent) => {
    event.preventDefault();
    setLinking(true);
    setMessage(null);
    try {
      const { data: studentId, error } = await supabase.rpc("claim_parent_student_by_nis", {
        p_nis: nis.trim(),
      });
      if (error) throw error;
      await loadStudentData(studentId);
      setMessage({ type: "success", text: "Akun orang tua berhasil dihubungkan ke satu anak." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getAppErrorMessage(error, "NIS anak tidak dapat dihubungkan."),
      });
    } finally {
      setLinking(false);
    }
  };

  const latestDailyAverage = useMemo(() => Number(daily[0]?.nilai_rata_rata ?? 0), [daily]);
  const latestLevel = levels[0];
  const munaqAverage = Number(munaqosyah?.hasil_ujian?.nilaiRataRata ?? 0);

  const downloadActive = () => {
    if (!student) return;
    try {
      if (active === "harian") downloadDailyMemorizationReports(student.nama_lengkap, daily);
      if (active === "level") downloadLevelExamReports(student.nama_lengkap, levels);
      if (active === "munaqosyah") downloadMunaqosyahReport(student.nama_lengkap, munaqosyah);
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
        <h1 className="text-4xl font-black text-gray-900">Preview Rapor Anak</h1>
        <p className="mt-2 font-medium text-gray-500">Akun ini hanya dapat melihat satu anak yang telah ditautkan.</p>
      </div>

      {message && <div className={`mb-6 rounded-2xl border p-4 font-bold print:hidden ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={38} /></div>
      ) : needsLink ? (
        <form onSubmit={connectChild} className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Link2 size={30} /></div>
          <h2 className="mt-5 text-2xl font-black text-gray-900">Hubungkan Satu Anak</h2>
          <p className="mt-2 font-medium text-gray-500">Masukkan NIS anak. Setelah terhubung, akun ini tidak akan melihat daftar siswa lain.</p>
          <input value={nis} onChange={(event) => setNis(event.target.value)} required placeholder="NIS anak" className="mt-6 w-full rounded-xl border border-gray-200 px-5 py-4 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
          <button disabled={linking} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-50">
            {linking ? <Loader2 className="animate-spin" size={20} /> : <Link2 size={20} />} Hubungkan Anak
          </button>
        </form>
      ) : student ? (
        <>
          <section className="mb-7 flex flex-col gap-5 rounded-3xl bg-emerald-800 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <StudentAvatar name={student.nama_lengkap} photoUrl={student.foto_url} className="h-20 w-20 rounded-2xl" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-200">Siswa yang ditautkan</p>
                <h2 className="mt-1 text-2xl font-black">{student.nama_lengkap}</h2>
                <p className="mt-1 font-semibold text-emerald-100">NIS {student.nis || "-"} · Kelas {student.kelas || "-"} · Level {student.level || "-"}</p>
              </div>
            </div>
            <button
              onClick={() => {
                try { downloadTadarusHarian(student.nama_lengkap, tadarus); }
                catch (error) {
                  setMessage({
                    type: "error",
                    text: getAppErrorMessage(error, "Belum ada tadarus."),
                  });
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3 font-bold hover:bg-white/25 print:hidden"
            >
              <Download size={18} /> Download Tadarus
            </button>
          </section>

          <div className="mb-7 grid gap-4 md:grid-cols-3 print:hidden">
            <OutputCard active={active === "harian"} onClick={() => setActive("harian")} icon={<BookOpenCheck />} title="Hafalan Harian" value={daily.length ? latestDailyAverage.toFixed(2) : "-"} detail={`${daily.length} catatan`} />
            <OutputCard active={active === "level"} onClick={() => setActive("level")} icon={<GraduationCap />} title="Hafalan Level" value={latestLevel?.nilai_rata_rata?.toFixed(2) || "-"} detail={latestLevel?.status || "Belum ada ujian"} />
            <OutputCard active={active === "munaqosyah"} onClick={() => setActive("munaqosyah")} icon={<Award />} title="Munaqosyah" value={munaqosyah ? munaqAverage.toFixed(2) : "-"} detail={munaqosyah?.hasil_ujian?.kategoriMunaqosyah?.indo || "Belum ada ujian"} />
          </div>

          <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm print:border-0 print:shadow-none">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Output otomatis</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">{active === "harian" ? "Rapor Hafalan Harian" : active === "level" ? "Rapor Kenaikan Level" : "Rapor Munaqosyah"}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={downloadActive} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white"><Download size={18} /> Download</button>
                <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-700"><Printer size={18} /> Cetak</button>
              </div>
            </div>

            {active === "harian" && <DailyPreview rows={daily} />}
            {active === "level" && <LevelPreview rows={levels} />}
            {active === "munaqosyah" && <MunaqPreview row={munaqosyah} />}
          </section>
        </>
      ) : null}
    </DashboardLayout>
  );
}

function OutputCard({ active, onClick, icon, title, value, detail }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; value: string; detail: string }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border p-5 text-left transition ${active ? "border-emerald-600 bg-emerald-600 text-white shadow-lg" : "border-gray-100 bg-white text-gray-900 hover:border-emerald-200"}`}>
      <div className="flex items-center justify-between"><span className={active ? "text-white" : "text-emerald-600"}>{icon}</span><span className="text-3xl font-black">{value}</span></div>
      <h3 className="mt-4 font-black">{title}</h3>
      <p className={`mt-1 text-sm font-semibold ${active ? "text-emerald-100" : "text-gray-500"}`}>{detail}</p>
    </button>
  );
}

function EmptyOutput({ text }: { text: string }) {
  return <div className="rounded-2xl bg-gray-50 p-10 text-center font-bold text-gray-500">{text}</div>;
}

function DailyPreview({ rows }: { rows: DailyMemorizationExportRow[] }) {
  if (!rows.length) return <EmptyOutput text="Guru belum menginput nilai hafalan harian." />;
  return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-500"><th className="p-3">Tanggal</th><th className="p-3">Surah / Ayat</th><th className="p-3">Kelancaran</th><th className="p-3">Makhraj</th><th className="p-3">Tajwid</th><th className="p-3">Hafalan</th><th className="p-3">Rata-rata</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.tanggal}-${index}`} className="border-b border-gray-100"><td className="p-3 font-semibold">{row.tanggal}</td><td className="p-3">{row.nama_surah} {row.ayat}</td><td className="p-3">{row.nilai_kelancaran ?? "-"}</td><td className="p-3">{row.nilai_makhraj ?? "-"}</td><td className="p-3">{row.nilai_tajwid ?? "-"}</td><td className="p-3">{row.nilai_hafalan ?? "-"}</td><td className="p-3 font-black text-emerald-700">{row.nilai_rata_rata ?? "-"}</td></tr>)}</tbody></table></div>;
}

function LevelPreview({ rows }: { rows: LevelExamExportRow[] }) {
  if (!rows.length) return <EmptyOutput text="Guru belum menginput ujian kenaikan level." />;
  return <div className="grid gap-4">{rows.map((row, index) => <div key={`${row.tanggal}-${index}`} className="rounded-2xl border border-gray-100 p-5"><div className="flex items-center justify-between"><h3 className="font-black text-gray-900">Level {row.level_asal} → {row.level_tujuan}</h3><span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">{row.status}</span></div><p className="mt-3 text-3xl font-black text-emerald-700">{row.nilai_rata_rata?.toFixed(2) || "-"}</p><p className="mt-1 text-sm font-semibold text-gray-500">{row.tanggal} · {row.tahun_ajaran}</p></div>)}</div>;
}

function MunaqPreview({ row }: { row?: MunaqosyahExportRow }) {
  if (!row) return <EmptyOutput text="Guru belum menginput ujian Munaqosyah." />;
  return <div><div className="rounded-2xl bg-emerald-800 p-6 text-white"><p className="font-bold text-emerald-100">Nilai akhir Munaqosyah</p><div className="mt-2 flex items-end justify-between"><span className="text-5xl font-black">{Number(row.hasil_ujian?.nilaiRataRata || 0).toFixed(2)}</span><span className="rounded-full bg-white/15 px-4 py-2 font-black">{row.hasil_ujian?.kategoriMunaqosyah?.indo || "-"}</span></div></div><div className="mt-5 grid gap-3 sm:grid-cols-4">{(row.hasil_ujian?.rowsMunaqosyah || []).map((score, index) => <div key={`${score.label}-${index}`} className="rounded-xl bg-gray-50 p-4 text-center"><p className="text-sm font-bold text-gray-500">{score.label || `Komponen ${index + 1}`}</p><p className="mt-1 text-2xl font-black text-gray-900">{score.angka ?? "-"}</p></div>)}</div>{row.catatan_guru && <p className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 font-medium text-amber-900">{row.catatan_guru}</p>}</div>;
}

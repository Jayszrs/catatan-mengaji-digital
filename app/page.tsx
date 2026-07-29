"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const featureCards = [
  {
    icon: <CalendarDays size={23} />,
    title: "Catatan harian yang tertata",
    description:
      "Presensi, kegiatan, tadarus, hafalan, dan catatan guru tersimpan dalam satu alur kerja.",
    className: "lg:col-span-7",
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: <FileText size={23} />,
    title: "Tiga rapor otomatis",
    description:
      "Rapor harian, kenaikan level, dan munaqosyah tersusun otomatis dalam format resmi sekolah.",
    className: "lg:col-span-5",
    accent: "bg-amber-50 text-amber-700",
  },
  {
    icon: <BookOpen size={23} />,
    title: "Kurikulum per level",
    description:
      "Target surat dari Level 1 hingga Mustawa Muttawasit tercatat jelas dan mudah diperbarui.",
    className: "lg:col-span-5",
    accent: "bg-sky-50 text-sky-700",
  },
  {
    icon: <Users size={23} />,
    title: "Guru dan orang tua tetap terhubung",
    description:
      "Perkembangan siswa dapat dipantau secara transparan tanpa menunggu pembagian rapor.",
    className: "lg:col-span-7",
    accent: "bg-violet-50 text-violet-700",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Guru mencatat",
    description: "Input kegiatan dan penilaian siswa melalui form yang ringkas.",
  },
  {
    number: "02",
    title: "Sistem merangkum",
    description: "Data harian diolah menjadi progres dan rapor yang konsisten.",
  },
  {
    number: "03",
    title: "Orang tua memantau",
    description: "Capaian anak dapat dilihat kapan saja dari akun orang tua.",
  },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: activeUser },
      } = await supabase.auth.getUser();
      setUser(activeUser);
    };

    checkUser();
  }, []);

  const role = user?.user_metadata?.role;
  const dashboardHref =
    role === "orang_tua"
      ? "/dashboard/orang-tua"
      : role === "admin"
        ? "/dashboard/admin"
        : "/dashboard/guru";

  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f7faf7] text-[#10251c]">
      <nav className="sticky top-0 z-50 w-full max-w-[100vw] overflow-hidden border-b border-[#163e2d]/10 bg-white/95 shadow-sm">
        <div className="mx-auto flex h-[76px] w-full min-w-0 max-w-7xl items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 shrink items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
              <Image
                src="/logo.png"
                alt="Logo SD Islam Labschool Bani Saleh"
                width={44}
                height={44}
                priority
                className="h-full w-full scale-[1.25] object-cover mix-blend-multiply"
              />
            </div>
            <div className="hidden min-w-0 min-[520px]:block">
              <p className="truncate text-sm font-black uppercase tracking-[-0.02em] text-[#173d2e] sm:text-base">
                Catatan Mengaji Digital
              </p>
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#2f8f5b] sm:block">
                SD Islam Labschool Bani Saleh
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {user ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[#173d2e] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f2f23]"
              >
                Buka Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-xl px-2.5 py-2.5 text-sm font-bold text-[#335648] transition hover:bg-[#edf5f0] hover:text-[#173d2e] sm:px-4"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#173d2e] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f2f23]"
                >
                  <span className="hidden sm:inline">Daftar Sekarang</span>
                  <span className="sm:hidden">Daftar</span>
                  <ArrowRight className="hidden sm:block" size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative isolate overflow-hidden">
        <Image
          src="/onboarding-students-quran.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={65}
          className="-z-30 object-cover object-center"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(247,250,247,0.97)_0%,rgba(255,255,255,0.9)_48%,rgba(237,248,241,0.82)_100%)]" />
        <div className="absolute -right-40 -top-32 -z-10 h-[520px] w-[520px] rounded-full bg-[#65c98a]/10" />
        <div className="absolute -bottom-48 -left-48 -z-10 h-[500px] w-[500px] rounded-full bg-[#d9b45b]/8" />

        <div className="mx-auto grid min-h-[calc(100vh-76px)] w-full min-w-0 max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-5 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
          <div className="min-w-0">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b9dcc8] bg-white/90 px-3.5 py-2 text-xs font-bold text-[#267449] shadow-sm">
              <Sparkles size={14} />
              Sistem Tahfidz Terintegrasi
            </div>

            <h1 className="max-w-2xl text-[38px] font-black leading-[1.08] tracking-[-0.045em] text-[#10251c] sm:text-5xl lg:text-[64px]">
              Pendampingan hafalan yang lebih{" "}
              <span className="text-[#2d8d58]">terarah</span>, setiap hari.
            </h1>

            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-[#5a6f65] sm:text-lg">
              Satu ruang digital untuk membantu guru mencatat, sekolah mengevaluasi,
              dan orang tua mengikuti perkembangan Tahsin &amp; Tahfidz siswa secara
              berkelanjutan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? dashboardHref : "/auth/signup"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#173d2e] px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(23,61,46,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0f2f23]"
              >
                {user ? "Masuk ke Dashboard" : "Mulai Menggunakan"}
                <ArrowRight size={17} />
              </Link>
              {!user && (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#bfd3c6] bg-white/80 px-6 py-3.5 text-sm font-bold text-[#173d2e] transition hover:border-[#7eaa8f] hover:bg-white"
                >
                  Saya sudah punya akun
                </Link>
              )}
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 border-t border-[#173d2e]/10 pt-6">
              {[
                ["3", "Rapor otomatis"],
                ["9", "Jenjang tahfidz"],
                ["2", "Akses terhubung"],
              ].map(([value, label]) => (
                <div key={label} className="pr-3">
                  <p className="text-2xl font-black text-[#173d2e]">{value}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-[#718279] sm:text-xs">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full min-w-0 max-w-[590px] lg:mx-0 lg:ml-auto">
            <div className="absolute -left-8 top-20 hidden h-20 w-20 rounded-3xl border border-white/80 bg-white/85 shadow-xl lg:block" />
            <div className="absolute -right-6 bottom-16 hidden h-28 w-28 rounded-full bg-[#d4ae55]/20 blur-sm lg:block" />

            <div className="relative overflow-hidden rounded-[32px] border border-[#315948] bg-[#123729] p-3 shadow-[0_35px_90px_rgba(19,56,42,0.28)] sm:p-4">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#54bd79]/15 blur-2xl" />

              <div className="relative overflow-hidden rounded-[24px] bg-[#f8faf8]">
                <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl ring-1 ring-gray-200">
                      <Image
                        src="/logo.png"
                        alt=""
                        width={36}
                        height={36}
                        className="h-full w-full scale-[1.25] object-cover mix-blend-multiply"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#173d2e]">Dashboard Perkembangan</p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        Tahun Ajaran 2026/2027
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#2dc653]" />
                    <span className="text-[10px] font-bold text-gray-500">Aktif</span>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="rounded-2xl bg-[#173d2e] p-5 text-white shadow-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                          Progres Tahfidz
                        </p>
                        <h2 className="mt-2 text-xl font-black">Calon Penghuni Surga</h2>
                        <p className="mt-1 text-xs font-medium text-white/60">
                          Kelas 5 · Level 4
                        </p>
                      </div>
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[5px] border-[#62ce89] bg-white/10 text-sm font-black">
                        82%
                      </div>
                    </div>
                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full w-[82%] rounded-full bg-[#62ce89]" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {[
                      { icon: <CalendarDays size={16} />, value: "24", label: "Laporan", color: "text-emerald-700 bg-emerald-50" },
                      { icon: <Award size={16} />, value: "A-", label: "Predikat", color: "text-amber-700 bg-amber-50" },
                      { icon: <BookOpen size={16} />, value: "5", label: "Surat", color: "text-sky-700 bg-sky-50" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-3">
                        <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                          {item.icon}
                        </div>
                        <p className="text-lg font-black text-[#173d2e]">{item.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black text-[#173d2e]">Aktivitas Terbaru</p>
                      <span className="text-[10px] font-bold text-[#2d8d58]">Hari ini</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        ["Hafalan", "Al-Fajr ayat 1–10", "Sangat Baik"],
                        ["Tadarus", "Al-Baqarah ayat 1–15", "Selesai"],
                      ].map(([type, detail, status]) => (
                        <div key={type} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e5f4ea] text-[#2d8d58]">
                            <Check size={14} strokeWidth={3} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{type}</p>
                            <p className="truncate text-xs font-bold text-[#31483e]">{detail}</p>
                          </div>
                          <span className="hidden rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700 sm:block">
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-5 hidden items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck size={19} />
              </span>
              <div>
                <p className="text-xs font-black text-[#173d2e]">Data tersimpan aman</p>
                <p className="text-[10px] font-medium text-gray-400">Terhubung secara real-time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="landing-deferred-section bg-white px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2d8d58]">
                Satu sistem yang utuh
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[#10251c] sm:text-4xl">
                Dibuat untuk alur belajar yang benar-benar berjalan.
              </h2>
            </div>
            <p className="max-w-2xl text-base font-medium leading-8 text-[#67796f] lg:justify-self-end">
              Setiap fitur dirancang mengikuti kebutuhan sekolah—mulai dari pencatatan di kelas
              sampai laporan resmi yang diterima orang tua.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            {featureCards.map((feature) => (
              <article
                key={feature.title}
                className={`group rounded-[28px] border border-[#dfe8e2] bg-[#fbfcfb] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#b7cdbf] hover:bg-white hover:shadow-[0_18px_50px_rgba(23,61,46,0.08)] sm:p-8 ${feature.className}`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.accent}`}>
                  {feature.icon}
                </div>
                <h3 className="mt-7 text-xl font-black tracking-[-0.02em] text-[#173d2e]">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-[#6b7d74]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-deferred-section border-y border-[#dfe8e2] bg-[#f1f6f2] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2d8d58]">
              Alur yang sederhana
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[#10251c] sm:text-4xl">
              Dari kelas hingga rumah, tetap tersambung.
            </h2>
          </div>

          <div className="relative mt-12 grid gap-4 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-7 hidden border-t border-dashed border-[#9fb9aa] md:block" />
            {workflowSteps.map((step) => (
              <article key={step.number} className="relative rounded-3xl border border-[#d8e4dc] bg-white p-6 text-center shadow-sm">
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173d2e] text-sm font-black text-white shadow-lg">
                  {step.number}
                </span>
                <h3 className="mt-6 text-lg font-black text-[#173d2e]">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-[#6b7d74]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-deferred-section bg-white px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[36px] bg-[#123729] lg:grid-cols-2">
          <div className="relative border-b border-white/10 p-7 text-white sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-[#4dbd76]/10 blur-2xl" />
            <GraduationCap className="relative text-[#75d695]" size={32} />
            <p className="relative mt-8 text-xs font-black uppercase tracking-[0.18em] text-[#75d695]">
              Untuk Guru
            </p>
            <h2 className="relative mt-3 text-3xl font-black tracking-[-0.03em]">
              Lebih fokus mendampingi, lebih sedikit mengurus administrasi.
            </h2>
            <ul className="relative mt-7 space-y-3">
              {[
                "Input harian dalam satu halaman",
                "Penilaian dan kenaikan level terstruktur",
                "Rapor resmi siap cetak",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-white/75">
                  <CheckCircle2 className="shrink-0 text-[#75d695]" size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative p-7 text-white sm:p-10 lg:p-12">
            <Users className="text-[#f1c96f]" size={30} />
            <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-[#f1c96f]">
              Untuk Orang Tua
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
              Perkembangan anak hadir dengan jelas, bukan sekadar angka.
            </h2>
            <ul className="mt-7 space-y-3">
              {[
                "Riwayat belajar mudah dipahami",
                "Target hafalan terlihat transparan",
                "Catatan guru dapat dipantau kapan saja",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-white/75">
                  <CheckCircle2 className="shrink-0 text-[#f1c96f]" size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-deferred-section bg-white px-5 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 rounded-[32px] border border-[#cfe0d5] bg-[linear-gradient(120deg,#f1f8f3,#ffffff)] p-8 text-center sm:p-10 lg:flex-row lg:text-left">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2d8d58]">
              Mulai sekarang
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-black tracking-[-0.03em] text-[#173d2e] sm:text-3xl">
              Bangun pendampingan Tahsin &amp; Tahfidz yang lebih konsisten.
            </h2>
          </div>
          <Link
            href={user ? dashboardHref : "/auth/signup"}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#173d2e] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0f2f23]"
          >
            {user ? "Buka Dashboard" : "Daftar Sekarang"}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#173d2e]/10 bg-[#f7faf7] px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={34}
              height={34}
              className="h-9 w-9 rounded-lg object-cover mix-blend-multiply"
            />
            <div>
              <p className="text-xs font-black uppercase text-[#173d2e]">Catatan Mengaji Digital</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#718279]">
                SD Islam Labschool Bani Saleh
              </p>
            </div>
          </div>
          <p className="text-xs font-medium text-[#718279]">
            © {new Date().getFullYear()} SD Islam Labschool Bani Saleh. Hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </main>
  );
}

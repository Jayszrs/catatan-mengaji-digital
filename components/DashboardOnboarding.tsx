"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  PartyPopper,
  Printer,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

type OnboardingRole = "guru" | "orang_tua";

interface TourStep {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  points: string[];
}

interface DashboardOnboardingProps {
  role: OnboardingRole;
  userName: string;
  onFinish: () => void;
}

const teacherSteps: TourStep[] = [
  {
    eyebrow: "Selamat Datang",
    title: "Siap mendampingi hafalan dengan lebih terarah?",
    description:
      "Tur singkat ini akan memperkenalkan alur utama Catatan Mengaji Digital untuk Guru.",
    icon: PartyPopper,
    points: [
      "Semua pekerjaan utama tersedia dari menu samping",
      "Data tersimpan dan terhubung ke rapor otomatis",
    ],
  },
  {
    eyebrow: "Langkah Awal",
    title: "Siapkan data siswa dan kelas",
    description:
      "Mulai dari Daftar Siswa untuk menambah atau mengimpor siswa, lalu atur rombongan belajar melalui Data Kelas.",
    icon: Users,
    points: [
      "Tambah siswa satu per satu atau melalui Excel",
      "Pastikan NIS, kelas, dan level Tahfidz sudah benar",
    ],
  },
  {
    eyebrow: "Kegiatan Harian",
    title: "Catat kehadiran dan perkembangan setiap hari",
    description:
      "Menu Presensi & Harian digunakan untuk menyimpan kehadiran, kegiatan, tadarus, hafalan, serta catatan Guru.",
    icon: FileText,
    points: [
      "Satu tanggal dapat memuat beberapa nilai atau surat",
      "Riwayat tanggal sebelumnya tetap tersimpan",
    ],
  },
  {
    eyebrow: "Evaluasi Siswa",
    title: "Kelola kenaikan level dan Munaqosyah",
    description:
      "Gunakan Ujian Kenaikan Level untuk evaluasi per jenjang dan Form Munaqosyah untuk penilaian akhir yang lebih lengkap.",
    icon: Award,
    points: [
      "Pilihan surat mengikuti Data Surat per level",
      "Nilai dan predikat dihitung secara konsisten",
    ],
  },
  {
    eyebrow: "Hasil Akhir",
    title: "Cetak tiga rapor resmi secara otomatis",
    description:
      "Data yang telah diisi akan masuk ke Rapor Hafalan Harian, Rapor Kenaikan Level, dan Rapor Munaqosyah.",
    icon: Printer,
    points: [
      "Pilih siswa dan jenis rapor yang dibutuhkan",
      "Preview dahulu sebelum mencetak atau menyimpan PDF",
    ],
  },
];

const parentSteps: TourStep[] = [
  {
    eyebrow: "Selamat Datang",
    title: "Mari ikuti perkembangan belajar anak dengan lebih dekat",
    description:
      "Tur singkat ini akan menunjukkan informasi utama yang dapat dipantau melalui akun Orang Tua.",
    icon: PartyPopper,
    points: [
      "Data berasal dari catatan dan penilaian Guru",
      "Informasi dapat dilihat kapan saja dari dashboard",
    ],
  },
  {
    eyebrow: "Progres Anak",
    title: "Pilih anak dan lihat ringkasan perkembangannya",
    description:
      "Buka Daftar Siswa & Progres untuk melihat laporan harian, kehadiran, hafalan, evaluasi level, dan hasil Munaqosyah.",
    icon: LayoutDashboard,
    points: [
      "Gunakan pilihan profil jika memiliki lebih dari satu anak",
      "Periksa riwayat berdasarkan tanggal laporan",
    ],
  },
  {
    eyebrow: "Panduan Nilai",
    title: "Pahami arti nilai dan predikat",
    description:
      "Menu Komposisi Nilai menjelaskan rentang angka, huruf, predikat, serta target hafalan pada setiap jenjang.",
    icon: GraduationCap,
    points: [
      "Nilai disajikan dengan standar yang sama",
      "Target membantu memantau kesiapan naik level",
    ],
  },
  {
    eyebrow: "Target Hafalan",
    title: "Lihat susunan surat sesuai level",
    description:
      "Menu Data Surat menampilkan daftar surat yang sedang berlaku untuk setiap level dan tahun ajaran.",
    icon: BookOpen,
    points: [
      "Orang Tua memiliki akses lihat saja",
      "Perubahan kurikulum dikelola oleh Guru",
    ],
  },
  {
    eyebrow: "Selesai",
    title: "Dashboard siap digunakan",
    description:
      "Anda dapat membuka panduan ini kembali kapan saja melalui tombol Panduan Penggunaan pada menu Sistem.",
    icon: Sparkles,
    points: [
      "Pantau perkembangan secara berkala",
      "Hubungi Guru jika ada data yang perlu dikonfirmasi",
    ],
  },
];

export function DashboardOnboarding({
  role,
  userName,
  onFinish,
}: DashboardOnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = role === "guru" ? teacherSteps : parentSteps;
  const step = steps[stepIndex];
  const StepIcon = step.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const displayName = userName || (role === "guru" ? "Bapak/Ibu Guru" : "Orang Tua");

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#071d14]/65 p-4 backdrop-blur-sm print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <section className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-[0_35px_100px_rgba(3,25,16,0.4)]">
        <div className="relative overflow-hidden bg-[#143f2f] px-5 py-5 text-white sm:px-7">
          <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-[#54bd79]/20 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                <Image
                  src="/logo.png"
                  alt=""
                  width={44}
                  height={44}
                  className="h-full w-full scale-[1.22] object-cover mix-blend-multiply"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">Catatan Mengaji Digital</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                  Panduan {role === "guru" ? "Guru" : "Orang Tua"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onFinish}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
              aria-label="Tutup panduan"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-7">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              {step.eyebrow}
            </span>
            <span className="text-xs font-bold text-gray-400">
              {stepIndex + 1} / {steps.length}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e9f5ed] text-[#206b47]">
              <StepIcon size={30} />
            </div>
            <div className="min-w-0">
              {isFirst && (
                <p className="mb-1 text-sm font-bold text-[#2b8053]">
                  Halo, {displayName}!
                </p>
              )}
              <h2
                id="onboarding-title"
                className="text-2xl font-black leading-tight tracking-[-0.03em] text-[#12271d] sm:text-3xl"
              >
                {step.title}
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-gray-500">
                {step.description}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {step.points.map((point) => (
              <div
                key={point}
                className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3"
              >
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#2b8053]" size={16} />
                <span className="text-xs font-semibold leading-5 text-gray-600">{point}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 flex gap-1.5">
            {steps.map((item, index) => (
              <span
                key={item.title}
                className={`h-1.5 rounded-full transition-all ${
                  index === stepIndex
                    ? "w-8 bg-[#216b48]"
                    : index < stepIndex
                      ? "w-4 bg-[#83b89a]"
                      : "w-4 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={onFinish}
            className="text-xs font-bold text-gray-400 transition hover:text-gray-700"
          >
            Lewati panduan
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((current) => current - 1)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-black text-gray-600 transition hover:bg-gray-50"
              >
                <ArrowLeft size={15} />
                Kembali
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) {
                  onFinish();
                } else {
                  setStepIndex((current) => current + 1);
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#17643f] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#0f5132]"
            >
              {isLast ? "Mulai Gunakan" : "Berikutnya"}
              {isLast ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

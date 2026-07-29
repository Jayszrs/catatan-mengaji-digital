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
    title: "Mulai alur kerja Guru dengan lebih terarah",
    description:
      "Panduan ini menjelaskan urutan kerja dari menyiapkan data sampai mencetak rapor resmi. Ikuti langkahnya agar setiap nilai masuk ke laporan yang benar.",
    icon: PartyPopper,
    points: [
      "Kerjakan sesuai urutan menu yang dijelaskan",
      "Gunakan tombol Simpan sebelum berpindah halaman",
      "Panduan dapat dibuka kembali dari menu Sistem",
    ],
  },
  {
    eyebrow: "Langkah 1 · Data Dasar",
    title: "Siapkan siswa, kelas, dan level awal",
    description:
      "Buka Daftar Siswa untuk menambah siswa secara manual atau mengimpor Excel. Setelah itu buka Data Kelas untuk memastikan setiap siswa masuk ke kelas yang tepat.",
    icon: Users,
    points: [
      "Periksa nama, NIS/NISN, jenis kelamin, dan data orang tua",
      "Tentukan kelas serta level Tahfidz awal siswa",
      "Koreksi data siswa sebelum mulai mengisi penilaian",
    ],
  },
  {
    eyebrow: "Langkah 2 · Data Surat",
    title: "Atur target surat per level dan tahun ajaran",
    description:
      "Buka Data Surat, pilih tahun ajaran, lalu periksa daftar surat Level 1 sampai Mustawa Muttawasit 3. Guru dapat menambah atau menyesuaikan surat ketika kurikulum berubah.",
    icon: BookOpen,
    points: [
      "Pastikan tahun ajaran yang dipilih sudah benar",
      "Tambah surat pada level yang sesuai dan periksa urutannya",
      "Daftar ini menjadi pilihan surat di form penilaian",
    ],
  },
  {
    eyebrow: "Langkah 3 · Kegiatan Harian",
    title: "Isi Presensi & Harian untuk setiap pertemuan",
    description:
      "Pilih siswa dan tanggal, isi status hadir, kegiatan, tadarus, hafalan, serta catatan Guru. Jika satu hari memuat beberapa surat atau nilai, masukkan semuanya sebelum menyimpan.",
    icon: FileText,
    points: [
      "Gunakan tanggal kegiatan yang sebenarnya",
      "Satu hari dapat berisi lebih dari satu surat atau capaian",
      "Periksa riwayat tanggal sebelumnya pada tabel laporan",
    ],
  },
  {
    eyebrow: "Langkah 4 · Kenaikan Level",
    title: "Laksanakan Ujian Kenaikan Level",
    description:
      "Pilih siswa, level asal dan tujuan, lalu pilih surat ujian berdasarkan Data Surat. Isi seluruh komponen penilaian dan simpan setelah hasil serta rekomendasi sudah benar.",
    icon: Award,
    points: [
      "Pilihan surat mengikuti level dan tahun ajaran aktif",
      "Isi kelancaran, makhroj, tajwid, dan komponen lain",
      "Periksa status lulus atau rekomendasi naik level",
    ],
  },
  {
    eyebrow: "Langkah 5 · Munaqosyah",
    title: "Lengkapi penilaian Munaqosyah",
    description:
      "Buka Form Munaqosyah, pilih siswa dan periode, lalu isi nilai bacaan, kepribadian, serta catatan Guru. Nilai angka, huruf, Arab, jumlah, dan predikat dirangkum otomatis.",
    icon: GraduationCap,
    points: [
      "Pastikan tanggal, periode, dan juz sudah sesuai",
      "Isi semua kategori nilai serta aspek kepribadian",
      "Gunakan preview rapor resmi untuk memeriksa hasil",
    ],
  },
  {
    eyebrow: "Langkah 6 · Pemeriksaan",
    title: "Tinjau kembali data sebelum membuat rapor",
    description:
      "Buka riwayat pada masing-masing form dan cocokkan siswa, tanggal, surat, nilai, serta catatan. Gunakan Edit bila ada data yang perlu diperbaiki.",
    icon: CheckCircle2,
    points: [
      "Jangan membuat data ganda untuk siswa dan tanggal yang sama",
      "Pastikan ejaan nama dan identitas siswa sudah benar",
      "Simpan ulang perubahan sebelum membuka rapor",
    ],
  },
  {
    eyebrow: "Langkah 7 · Rapor",
    title: "Preview dan cetak tiga rapor resmi",
    description:
      "Buka 3 Rapor Otomatis, pilih siswa, lalu pilih Rapor Hafalan Harian, Rapor Kenaikan Level, atau Rapor Munaqosyah. Template resmi sekolah akan terisi dari form terkait.",
    icon: Printer,
    points: [
      "Periksa periode dan seluruh baris nilai pada preview",
      "Gunakan Cetak / Simpan PDF untuk hasil resmi",
      "Gunakan Download Excel jika membutuhkan arsip data",
    ],
  },
  {
    eyebrow: "Selesai",
    title: "Dashboard Guru siap digunakan",
    description:
      "Alur utamanya adalah data dasar → data surat → laporan harian → ujian level atau Munaqosyah → pemeriksaan → rapor resmi.",
    icon: Sparkles,
    points: [
      "Isi data secara rutin agar progres selalu terbaru",
      "Buka Panduan Penggunaan jika membutuhkan petunjuk ulang",
      "Konfirmasi data siswa sebelum membagikan rapor",
    ],
  },
];

const parentSteps: TourStep[] = [
  {
    eyebrow: "Selamat Datang",
    title: "Pantau perkembangan anak dengan lebih mudah",
    description:
      "Panduan Orang Tua hanya menampilkan informasi yang perlu dipantau. Seluruh catatan dan penilaian berasal dari data yang diisi Guru.",
    icon: PartyPopper,
    points: [
      "Akun Orang Tua tidak dapat mengubah nilai",
      "Data dapat dilihat kapan saja dari dashboard",
      "Panduan dapat dibuka kembali dari menu Sistem",
    ],
  },
  {
    eyebrow: "Langkah 1 · Pilih Anak",
    title: "Pastikan profil anak yang dipantau sudah benar",
    description:
      "Buka Daftar Siswa & Progres, lalu pilih profil anak. Jika memiliki lebih dari satu anak, gunakan pilihan profil untuk berpindah tanpa perlu keluar dari akun.",
    icon: LayoutDashboard,
    points: [
      "Cocokkan nama, kelas, NIS, dan level Tahfidz",
      "Pilih profil lain jika akun terhubung ke beberapa anak",
      "Hubungi Guru bila profil anak belum muncul",
    ],
  },
  {
    eyebrow: "Langkah 2 · Progres",
    title: "Baca laporan harian dan riwayat hafalan",
    description:
      "Pada halaman progres, lihat kehadiran, kegiatan, tadarus, hafalan, surat yang dipelajari, dan catatan Guru berdasarkan tanggal.",
    icon: FileText,
    points: [
      "Gunakan tanggal untuk mengikuti perkembangan dari waktu ke waktu",
      "Perhatikan catatan Guru sebagai arahan belajar di rumah",
      "Nilai terbaru akan muncul setelah disimpan oleh Guru",
    ],
  },
  {
    eyebrow: "Langkah 3 · Panduan Nilai",
    title: "Pahami arti nilai dan predikat",
    description:
      "Menu Komposisi Nilai menjelaskan rentang angka, huruf, predikat, serta target hafalan pada setiap jenjang.",
    icon: GraduationCap,
    points: [
      "Cocokkan nilai dengan kategori dan arti predikatnya",
      "Gunakan target sebagai panduan, bukan perbandingan antar-anak",
      "Tanyakan kepada Guru bila ada hasil yang belum dipahami",
    ],
  },
  {
    eyebrow: "Langkah 4 · Target Hafalan",
    title: "Lihat susunan surat sesuai level",
    description:
      "Menu Data Surat menampilkan daftar surat yang sedang berlaku untuk setiap level dan tahun ajaran.",
    icon: BookOpen,
    points: [
      "Pilih tahun ajaran yang sedang berlangsung",
      "Cari level anak lalu lihat target suratnya",
      "Orang Tua memiliki akses lihat saja",
    ],
  },
  {
    eyebrow: "Langkah 5 · Tindak Lanjut",
    title: "Dampingi latihan anak di rumah",
    description:
      "Gunakan catatan Guru, target surat, dan riwayat nilai untuk menentukan bagian yang perlu diulang. Konfirmasi langsung kepada Guru jika ada data yang terasa berbeda.",
    icon: Users,
    points: [
      "Prioritaskan surat dan ayat yang dicatat Guru",
      "Pantau perkembangan secara rutin tanpa mengubah data",
      "Hubungi Guru untuk koreksi atau penjelasan nilai",
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
      "Gunakan menu Keluar setelah selesai di perangkat umum",
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
      <section className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-[0_35px_100px_rgba(3,25,16,0.4)]">
        <div className="relative shrink-0 overflow-hidden bg-[#143f2f] px-5 py-5 text-white sm:px-7">
          <Image
            src="/onboarding-students-quran.webp"
            alt=""
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            quality={55}
            className="object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,63,47,0.98),rgba(20,63,47,0.72))]" />
          <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-[#54bd79]/20" />
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

        <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
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

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-8">
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

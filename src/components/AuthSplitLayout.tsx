import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";

interface AuthSplitLayoutProps {
  mode: "login" | "signup";
  children: React.ReactNode;
}

const content = {
  login: {
    eyebrow: "Portal Sekolah Terintegrasi",
    title: "Satu catatan, satu arah perkembangan.",
    description:
      "Masuk untuk mengelola dan memantau perjalanan Tahsin & Tahfidz siswa secara berkelanjutan.",
    points: ["Laporan tersusun rapi", "Akses sesuai peran", "Data terhubung real-time"],
  },
  signup: {
    eyebrow: "Mulai Pendampingan Digital",
    title: "Bangun komunikasi belajar yang lebih dekat.",
    description:
      "Buat akun guru atau orang tua untuk terhubung dengan perkembangan Tahsin & Tahfidz siswa.",
    points: ["Pendaftaran akun mudah", "Verifikasi email aman", "Riwayat belajar transparan"],
  },
};

export function AuthSplitLayout({ mode, children }: AuthSplitLayoutProps) {
  const panel = content[mode];

  return (
    <main className="relative grid min-h-screen w-full overflow-hidden bg-[#123729] lg:grid-cols-[1.04fr_0.96fr]">
      <Image
        src="/school-auth-background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover lg:hidden"
      />
      <div className="absolute inset-0 bg-[#0d3a29]/80 lg:hidden" />

      <section className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <Image
          src="/school-auth-background.jpg"
          alt="Kegiatan siswa SD Islam Labschool Bani Saleh"
          fill
          priority
          sizes="52vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(8,55,37,0.92)_0%,rgba(12,83,47,0.82)_54%,rgba(35,105,56,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(196,225,103,0.17),transparent_34%)]" />

        <div className="relative z-10 flex items-center gap-3 px-10 pt-9 xl:px-14">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/95 shadow-lg">
            <Image
              src="/logo.png"
              alt="Logo SD Islam Labschool Bani Saleh"
              width={48}
              height={48}
              className="h-full w-full scale-[1.22] object-cover mix-blend-multiply"
            />
          </div>
          <div className="text-white">
            <p className="text-sm font-black uppercase tracking-[-0.01em]">
              Catatan Mengaji Digital
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
              SD Islam Labschool Bani Saleh
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl px-10 pb-8 xl:px-14">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-[#e2c75b] backdrop-blur">
            <BookOpen size={27} />
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#d7c35f]">
            {panel.eyebrow}
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.12] tracking-[-0.04em] text-white xl:text-5xl">
            {panel.title}
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/72">
            {panel.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {panel.points.map((point) => (
              <span key={point} className="flex items-center gap-2 text-xs font-bold text-white/80">
                <CheckCircle2 size={15} className="text-[#e2c75b]" />
                {point}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 px-10 pb-8 text-[11px] font-semibold text-white/48 xl:px-14">
          © {new Date().getFullYear()} SD Islam Labschool Bani Saleh
        </p>
      </section>

      <section className="relative z-10 flex min-h-screen items-center justify-center overflow-y-auto px-4 py-6 sm:px-8 lg:bg-white lg:px-10 lg:py-8">
        <div className="w-full max-w-[520px] rounded-[28px] bg-white p-6 shadow-[0_24px_80px_rgba(4,32,21,0.28)] sm:p-8 lg:rounded-none lg:p-0 lg:shadow-none">
          <div className="mb-7 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-[#1a6643]"
            >
              <ArrowLeft size={15} />
              Kembali ke beranda
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-7 bg-[#d2b94f]" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#27724c]">
                Portal Sekolah
              </span>
            </div>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

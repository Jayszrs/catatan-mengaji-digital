"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Award, BookOpen, Info, Target } from "lucide-react";

interface KomposisiNilaiContentProps {
  userRole: "guru" | "orang_tua";
}

const dataNilai = [
  { kategori: "Mumtaz", arti: "Istimewa", skala: "90 - 100", huruf: "A", color: "bg-green-50 text-green-700 border-green-200" },
  { kategori: "Jayyid Jiddan", arti: "Sangat Bagus", skala: "80 - 89,99", huruf: "A-", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { kategori: "Jayyid", arti: "Bagus", skala: "65 - 79,99", huruf: "B", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { kategori: "Maqbul", arti: "Diterima/Lulus", skala: "50 - 64,99", huruf: "C", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { kategori: "Dhaif", arti: "Lemah", skala: "35 - 49,99", huruf: "D", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { kategori: "Dhaif Jiddan", arti: "Sangat Lemah", skala: "0 - 34,99", huruf: "E", color: "bg-red-50 text-red-700 border-red-200" },
];

const targetHafalan = [
  { level: "Level 1", surat: ["An-Nas", "Al-Falaq", "Al-Ikhlas", "Al-Lahab", "An-Nasr", "Al-Kafirun", "Al-Kautsar", "Al-Ma'un"] },
  { level: "Level 2", surat: ["Quraisy", "Al-Fiil", "Al-Humazah", "Al-Asr", "At-Takasur", "Al-Qari'ah", "Al-A'adiyat", "Az-Zalzalah"] },
  { level: "Level 3", surat: ["Al-Bayyinah", "Al-Qadr", "Al-Alaq", "At-Tin", "Asy-Syarh", "Ad-Dhuha", "Al-Lail", "Asy-Syams", "Al-Balad"] },
  { level: "Level 4", surat: ["Al-Fajr", "Al-Ghasyiyah", "Al-A'la", "At-Tariq", "Al-Buruj"] },
  { level: "Level 5", surat: ["Al-Insyiqaq", "Al-Muthaffifin", "Al-Infitar", "At-Takwir"] },
  { level: "Level 6", surat: ["Abasa", "An-Naziat", "An-Naba", "Muroja'ah Juz 30", "Surah Pilihan"] },
  { level: "Mustawa Muttawasit 1", surat: ["Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh"] },
  { level: "Mustawa Muttawasit 2", surat: ["Al-Jinn", "Al-Muzammil", "Al-Muddasir"] },
  { level: "Mustawa Muttawasit 3", surat: ["Al-Qiyamah", "Al-Insan", "Al-Mursalat"] },
];

const predikatKelulusan = [
  {
    tingkat: "Mustawa Ibtida'i",
    keterangan: "Tingkat Pemula",
    target: "Juz 30",
  },
  {
    tingkat: "Mustawa Mutawassit",
    keterangan: "Tingkat Menengah",
    target: "Juz 30, Ayat Kursi, Ar-Rahman, Al-Mulk, Al-Waqiah, dan surah pilihan",
  },
  {
    tingkat: "Mustawa Mutaqoddim",
    keterangan: "Tingkat Lanjutan",
    target: "Juz 30, surah pilihan, dan hadits pilihan",
  },
];

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1b4332]/10 text-[#1b4332]">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-black text-gray-900 md:text-xl">{title}</h2>
        <p className="mt-0.5 text-xs font-medium text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export function KomposisiNilaiContent({ userRole }: KomposisiNilaiContentProps) {
  return (
    <DashboardLayout userRole={userRole}>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          Komposisi Nilai
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Panduan skala penilaian harian Tahsin &amp; Tahfidz sesuai standar sekolah.
        </p>
      </div>

      <div className="grid w-full items-start gap-5 xl:grid-cols-[minmax(500px,0.9fr)_minmax(0,1.1fr)]">
        <section className="overflow-hidden rounded-3xl border border-gray-100 border-t-4 border-t-[#1b4332] bg-white p-5 shadow-sm md:p-6">
          <SectionTitle
            icon={<Award size={21} />}
            title="Tabel Komposisi Nilai"
            description="Skala nilai dan predikat yang digunakan sekolah."
          />

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-black uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="w-12 px-3 py-3 text-center">No</th>
                  <th className="px-3 py-3">Kategori</th>
                  <th className="px-3 py-3">Arti</th>
                  <th className="px-3 py-3 text-center">Skala</th>
                  <th className="px-3 py-3 text-center">Huruf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataNilai.map((item, index) => (
                  <tr key={item.kategori} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-3 py-2.5 text-center font-bold text-gray-400">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-black text-gray-900">
                      {item.kategori}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-600">{item.arti}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center font-bold text-gray-800">
                      {item.skala}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 font-black ${item.color}`}>
                        {item.huruf}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <Info className="mt-0.5 shrink-0 text-blue-500" size={18} />
            <div>
              <h3 className="font-bold text-blue-900">Panduan Penggunaan</h3>
              <p className="mt-1 text-xs font-medium leading-relaxed text-blue-800">
                Gunakan skala ini pada Presensi &amp; Harian, Ujian Kenaikan Level,
                dan Form Munaqosyah sesuai kualitas bacaan serta hafalan siswa.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 border-t-4 border-t-[#2dc653] bg-white p-5 shadow-sm md:p-6">
          <SectionTitle
            icon={<Target size={21} />}
            title="Target Hafalan per Level"
            description="Ringkasan surat yang perlu dikuasai pada setiap jenjang."
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {targetHafalan.map((item, index) => (
              <article
                key={item.level}
                className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5 transition-colors hover:border-[#2dc653]/40 hover:bg-green-50/40"
              >
                <div className="mb-2 flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1b4332] text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <h3 className="pt-1 text-sm font-black leading-tight text-gray-900">
                    {item.level}
                  </h3>
                </div>
                <p className="text-xs font-medium leading-relaxed text-gray-600">
                  {item.surat.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
          <SectionTitle
            icon={<BookOpen size={21} />}
            title="Kategori Predikat Kelulusan"
            description="Target umum berdasarkan tingkat kemampuan siswa."
          />

          <div className="grid gap-3 md:grid-cols-3">
            {predikatKelulusan.map((item, index) => (
              <article
                key={item.tingkat}
                className="flex gap-3 rounded-2xl border border-gray-200 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-sm font-black text-purple-700">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-black text-gray-900">{item.tingkat}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-gray-500">
                    {item.keterangan}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-gray-700">
                    {item.target}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

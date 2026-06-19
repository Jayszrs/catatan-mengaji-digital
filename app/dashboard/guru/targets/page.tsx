"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Target, BookOpen, CheckCircle2 } from "lucide-react";

export default function TargetHafalanPage() {
  const targets = [
    { level: 1, range: "An-Nas, Al-Falaq, Al-Ikhlas, Al-Lahab, An-Nasr, Al-Kafirun, Al-Kautsar, Al-Ma'un" },
    { level: 2, range: "Quraisy, Al-Fiil, Al-Humazah, Al-Asr, At-Takasur, Al-Qari'ah, Al-A'adiyat, Az-Zalzalah" },
    { level: 3, range: "Al-Bayyinah, Al-Qadr, Al-Alaq, At-Tin, Asy-Syarh, Ad-Dhuha, Al-Lail, Asy-Syams, Al-Balad" },
    { level: 4, range: "Al-Fajr, Al-Ghasyiyah, Al-A'la, At-Tariq, Al-Buruj" },
    { level: 5, range: "Al-Insyiqaq, Al-Muthaffifin, Al-Infitar, At-Takwir" },
    { level: 6, range: "Abasa, An-Naziat, An-Naba, Muroja'ah Juz 30, Surah Pilihan" },
  ];

  return (
    <DashboardLayout userRole="guru">
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Target className="text-[#2dc653]" size={32} strokeWidth={2.5} />
          <h1 className="text-3xl font-black text-[#0a2316] tracking-tight">
            Target Hafalan
          </h1>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 font-bold text-gray-700 w-32 text-center">Level</th>
                <th className="py-4 px-6 font-bold text-gray-700">Surah Target</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target, index) => (
                <tr key={target.level} className={index !== targets.length - 1 ? "border-b border-gray-100 hover:bg-gray-50/50 transition-colors" : "hover:bg-gray-50/50 transition-colors"}>
                  <td className="py-5 px-6 text-center font-black text-gray-900 text-lg">
                    {target.level}
                  </td>
                  <td className="py-5 px-6 text-gray-600 font-medium leading-relaxed">
                    {target.range}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabel Kategori Predikat Kelulusan */}
        <div className="mt-12 mb-6 flex items-center gap-3">
          <BookOpen className="text-[#2dc653]" size={28} strokeWidth={2.5} />
          <h2 className="text-2xl font-black text-[#0a2316] tracking-tight">
            Kategori Predikat Kelulusan
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-5 px-6 font-bold text-gray-700 w-1/2">Tingkat</th>
                <th className="py-5 px-6 font-bold text-gray-700">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-6 px-6">
                  <div className="font-black text-gray-900 text-lg mb-1">Mustawa Ibtida&apos;i</div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">(Tingkat Pemula)</div>
                </td>
                <td className="py-6 px-6">
                  <span className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100 shadow-sm">
                    JUZ 30
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-6 px-6">
                  <div className="font-black text-gray-900 text-lg mb-1">Mustawa Mutawassit</div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">(Tingkat Menengah)</div>
                </td>
                <td className="py-6 px-6">
                  <ul className="space-y-2 text-gray-700 font-medium list-disc pl-4 marker:text-blue-500">
                    <li>JUZ 30</li>
                    <li>Ayat Kursi</li>
                    <li>Surah Ar-Rahman</li>
                    <li>Surah Al-Mulk</li>
                    <li>Surah Al-Waqiah <span className="text-gray-400 text-sm italic font-normal">(Surah Pilihan)</span></li>
                  </ul>
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="py-6 px-6">
                  <div className="font-black text-gray-900 text-lg mb-1">Mustawa Mutaqoddim</div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">(Tingkat Lanjutan)</div>
                </td>
                <td className="py-6 px-6">
                  <ul className="space-y-2 text-gray-700 font-medium list-disc pl-4 marker:text-purple-500">
                    <li>JUZ 30</li>
                    <li>Surah Pilihan</li>
                    <li>Hadits Pilihan</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

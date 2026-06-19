"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Award, Info, BookOpen } from "lucide-react";

export default function KomposisiNilaiPage() {
  const dataNilai = [
    { kategori: "Mumtaz", arti: "Istimewa", skala: "90 - 100", huruf: "A", color: "bg-green-50 text-green-700 border-green-200" },
    { kategori: "Jayyid Jiddan", arti: "Sangat Bagus", skala: "80 - 89,99", huruf: "A-", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { kategori: "Jayyid", arti: "Bagus", skala: "65 - 79,99", huruf: "B", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { kategori: "Maqbul", arti: "Diterima/Lulus", skala: "50 - 64,99", huruf: "C", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { kategori: "Dhaif", arti: "Lemah", skala: "35 - 49,99", huruf: "D", color: "bg-orange-50 text-orange-700 border-orange-200" },
    { kategori: "Dhaif Jiddan", arti: "Sangat Lemah", skala: "0 - 34,99", huruf: "E", color: "bg-red-50 text-red-700 border-red-200" },
  ];

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
          Komposisi Nilai
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Panduan skala penilaian harian Tahsin & Tahfidz sesuai standar sekolah.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 border-t-4 border-[#1b4332] max-w-4xl relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#1b4332]/5 to-transparent rounded-bl-full -z-10"></div>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1b4332]/10 text-[#1b4332] rounded-xl flex items-center justify-center">
              <Award size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Tabel Komposisi Nilai</h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-black text-gray-600 tracking-wider">
              <tr>
                <th className="px-6 py-5 text-center w-20">No</th>
                <th className="px-6 py-5">Kategori</th>
                <th className="px-6 py-5">Arti</th>
                <th className="px-6 py-5 text-center">Skala Nilai</th>
                <th className="px-6 py-5 text-center">Huruf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dataNilai.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-center font-bold text-gray-400 group-hover:text-gray-900 transition-colors">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-black text-gray-900 text-base">
                    {item.kategori}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-600">
                    {item.arti}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-800">
                    {item.skala}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${item.color} font-black text-lg shadow-sm`}>
                      {item.huruf}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4 items-start mb-12">
          <div className="text-blue-500 mt-0.5">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Panduan Penggunaan</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              Gunakan skala nilai di atas sebagai acuan standar saat memberikan keterangan atau penilaian pada halaman <strong>Input Tadarus</strong> dan <strong>Input Tahsin & Tahfidz</strong>. Pastikan nilai yang diberikan sesuai dengan kualitas bacaan dan hafalan siswa.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 mt-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2dc653]/10 text-[#2dc653] rounded-xl flex items-center justify-center">
              <Award size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Target Hafalan per Level</h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-center text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-black text-gray-600 tracking-wider">
              <tr>
                <th className="px-6 py-5 border-r border-gray-200 w-24">Level</th>
                <th className="px-6 py-5" colSpan={2}>Target Hafalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* LEVEL 1 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-900 text-xl border-r border-gray-200 align-middle">1</td>
                <td className="px-6 py-4 font-medium text-gray-700 border-r border-gray-200 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>An-Nas</span>
                    <span>Al-Falaq</span>
                    <span>Al-Ikhlas</span>
                    <span>Al-Lahab</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>An-Nasr</span>
                    <span>Al-Kafirun</span>
                    <span>Al-Kautsar</span>
                    <span>Al-Ma'un</span>
                  </div>
                </td>
              </tr>
              {/* LEVEL 2 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-900 text-xl border-r border-gray-200 align-middle">2</td>
                <td className="px-6 py-4 font-medium text-gray-700 border-r border-gray-200 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>Quraisy</span>
                    <span>Al-Fiil</span>
                    <span>Al-Humazah</span>
                    <span>Al-Asr</span>
                    <span>At-Takasur</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>At-Takasur</span>
                    <span>Al-Qari'ah</span>
                    <span>Al-A'adiyat</span>
                    <span>Az-Zalzalah</span>
                  </div>
                </td>
              </tr>
              {/* LEVEL 3 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-900 text-xl border-r border-gray-200 align-middle">3</td>
                <td className="px-6 py-4 font-medium text-gray-700 border-r border-gray-200 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>Al-Bayyinah</span>
                    <span>Al-Qadr</span>
                    <span>Al-Alaq</span>
                    <span>At-Tin</span>
                    <span>Asy-Syarh</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>Ad-Dhuha</span>
                    <span>Al-Lail</span>
                    <span>Asy-Syams</span>
                    <span>Al-Balad</span>
                  </div>
                </td>
              </tr>
              {/* LEVEL 4 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-900 text-xl border-r border-gray-200 align-middle">4</td>
                <td className="px-6 py-4 font-medium text-gray-700 border-r border-gray-200 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>Al-Fajr</span>
                    <span>Al-Ghasyiyah</span>
                    <span>Al-A'la</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>At-Tariq</span>
                    <span>Al-Buruj</span>
                  </div>
                </td>
              </tr>
              {/* LEVEL 5 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-900 text-xl border-r border-gray-200 align-middle">5</td>
                <td className="px-6 py-4 font-medium text-gray-700 border-r border-gray-200 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>Al-Insyiqaq</span>
                    <span>Al-Muthaffifin</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>Al-Infitar</span>
                    <span>At-Takwir</span>
                  </div>
                </td>
              </tr>
              {/* LEVEL 6 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-gray-900 text-xl border-r border-gray-200 align-middle">6</td>
                <td className="px-6 py-4 font-medium text-gray-700 border-r border-gray-200 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>Abasa</span>
                    <span>An-Naziat</span>
                    <span>An-Naba</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 w-1/2 align-top leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <span>Muroja'ah Juz 30</span>
                    <span>Surah Pilihan</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Kategori Predikat Kelulusan */}
        <div className="flex items-center justify-between mb-8 mt-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Kategori Predikat Kelulusan</h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-center text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-black text-gray-600 tracking-wider">
              <tr>
                <th className="px-6 py-5 border-r border-gray-200 w-1/2">Tingkat</th>
                <th className="px-6 py-5">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-6 border-r border-gray-200 align-middle">
                  <div className="font-black text-lg text-gray-900 mb-1">Mustawa Ibtida'i</div>
                  <div className="text-sm font-semibold text-gray-500">(Tingkat Pemula)</div>
                </td>
                <td className="px-6 py-6 align-middle font-semibold text-base">
                  JUZ 30
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-6 border-r border-gray-200 align-middle">
                  <div className="font-black text-lg text-gray-900 mb-1">Mustawa Mutawassit</div>
                  <div className="text-sm font-semibold text-gray-500">(Tingkat Menengah)</div>
                </td>
                <td className="px-6 py-6 align-middle font-medium text-base text-left pl-12">
                  <div className="flex flex-col gap-1.5 items-center">
                    <span>JUZ 30,</span>
                    <span>Ayat Kursi</span>
                    <span>Surah Ar-Rahman</span>
                    <span>Surah Al-Mulk</span>
                    <span>Surah Al-Waqiah</span>
                    <span className="text-gray-500 text-sm">(Surah Pilihan)</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-6 border-r border-gray-200 align-middle">
                  <div className="font-black text-lg text-gray-900 mb-1">Mustawa Mutaqoddim</div>
                  <div className="text-sm font-semibold text-gray-500">(Tingkat Lanjutan)</div>
                </td>
                <td className="px-6 py-6 align-middle font-medium text-base text-left pl-12">
                  <div className="flex flex-col gap-1.5 items-center">
                    <span>JUZ 30,</span>
                    <span>Surah Pilihan,</span>
                    <span>Hadits Pilihan</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import Link from "next/link";
import { ArrowLeft, Plus, X, Sun, BookOpen, Calendar, MapPin, MessageSquare, Mic, RefreshCw, FileText, Info, Target, Star, ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";

const getPredikat = (nilai: number | string | null | undefined) => {
  if (nilai === null || nilai === undefined || nilai === "") return { predikat: "-", huruf: "-", warna: "text-gray-500" };
  const n = Number(nilai);
  if (n >= 90) return { predikat: "Mumtaz", huruf: "A", warna: "text-[#2dc653]" };
  if (n >= 80) return { predikat: "Jayyid Jiddan", huruf: "A-", warna: "text-blue-600" };
  if (n >= 65) return { predikat: "Jayyid", huruf: "B", warna: "text-blue-500" };
  if (n >= 50) return { predikat: "Maqbul", huruf: "C", warna: "text-orange-500" };
  if (n >= 35) return { predikat: "Dhaif", huruf: "D", warna: "text-red-500" };
  return { predikat: "Dhaif Jiddan", huruf: "E", warna: "text-red-600" };
};

export default function StudentDashboard(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(props.params);
  const studentId = params.id;

  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"tadarus" | "tahsin">("tadarus");
  
  const [tadarusLaporan, setTadarusLaporan] = useState<any[]>([]);
  const [tahsinLaporan, setTahsinLaporan] = useState<any[]>([]);

  useEffect(() => {
    checkUserAndFetchData();
  }, [studentId]);

  const checkUserAndFetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      // Fetch Student
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentData) {
        setStudent(studentData);
      }

      await fetchLaporan(user.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLaporan = async (teacherId: string) => {
    // Fetch Tadarus
    const { data: dataTadarus } = await supabase
      .from("laporan_tadarus_pagi")
      .select("*")
      .eq("student_id", studentId)
      .eq("teacher_id", teacherId)
      .order("tanggal", { ascending: false })
      .limit(10);
    setTadarusLaporan(dataTadarus || []);

    // Fetch Tahsin
    const { data: dataTahsin } = await supabase
      .from("laporan_tahsin_tahfidz")
      .select("*")
      .eq("student_id", studentId)
      .eq("teacher_id", teacherId)
      .order("tanggal", { ascending: false })
      .limit(10);
    setTahsinLaporan(dataTahsin || []);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#2dc653]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8">
        <Link href="/dashboard/guru/students" className="text-gray-500 hover:text-[#2dc653] font-bold inline-flex items-center gap-2 mb-6 transition-colors">
          <ArrowLeft size={18} /> Kembali ke Daftar Siswa
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
              Laporan: {student?.nama_lengkap || "Siswa"}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-500 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2dc653]"></span>
                {student?.nis ? `NIS: ${student.nis}` : "NIS tidak tersedia"}
                <span className="mx-2 border-l border-gray-300 h-4"></span>
                <span className="text-[#1b4332] font-bold">Kelas {student?.kelas || "-"}</span>
              </p>

            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Info size={20} className="text-[#2dc653]" /> Biodata Siswa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Tempat, Tanggal Lahir</p>
            <p className="text-gray-900 font-semibold">{student?.tempat_tanggal_lahir || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Nama Wali Murid / Orang Tua</p>
            <p className="text-gray-900 font-semibold">{student?.wali_murid || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">No. Telepon / WhatsApp</p>
            <p className="text-gray-900 font-semibold">{student?.no_telp || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Alamat Lengkap</p>
            <p className="text-gray-900 font-semibold">{student?.alamat || "-"}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={() => setActiveTab("tadarus")}
          className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
            activeTab === "tadarus"
              ? "bg-[#2dc653] text-white shadow-xl scale-[1.02]"
              : "bg-white border border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200"
          }`}
        >
          <Sun size={24} /> Tadarus Pagi
        </button>
        <button
          onClick={() => setActiveTab("tahsin")}
          className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
            activeTab === "tahsin"
              ? "bg-blue-600 text-white shadow-xl scale-[1.02]"
              : "bg-white border border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-200"
          }`}
        >
          <BookOpen size={24} /> Tahsin & Tahfidz
        </button>
      </div>



      {/* Tabel Laporan Berdasarkan Tab Aktif */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
        {activeTab === "tadarus" ? (
          <>
            <div className="px-8 py-6 border-b border-gray-100 bg-green-50/50 flex items-center gap-3">
              <Sun className="text-[#2dc653]" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Riwayat Tadarus Pagi</h3>
            </div>
            {tadarusLaporan.length === 0 ? (
              <div className="p-16 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} strokeWidth={1} />
                <p className="text-gray-500 font-medium text-lg">Belum ada riwayat tadarus.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Tanggal</th>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Surah</th>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Hal/Ayat</th>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tadarusLaporan.map((item, i) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5 text-gray-600 font-medium whitespace-nowrap">{item.tanggal}</td>
                        <td className="px-6 py-5 font-bold text-gray-900 whitespace-nowrap">{item.nama_surah}</td>
                        <td className="px-6 py-5 text-gray-700 whitespace-nowrap">{item.hal_ayat}</td>
                        <td className="px-6 py-5 text-gray-600 whitespace-nowrap">{item.keterangan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="px-8 py-6 border-b border-gray-100 bg-blue-50/50 flex items-center gap-3">
              <BookOpen className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Riwayat Tahsin & Tahfidz</h3>
            </div>
            {tahsinLaporan.length === 0 ? (
               <div className="p-16 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} strokeWidth={1} />
                <p className="text-gray-500 font-medium text-lg">Belum ada riwayat tahsin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Tanggal</th>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Surah</th>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Ayat</th>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Makhraj</th>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Muroja'ah</th>
                      <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tahsinLaporan.map((item, i) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5 text-gray-600 font-medium whitespace-nowrap">{item.tanggal}</td>
                        <td className="px-6 py-5 font-bold text-gray-900 whitespace-nowrap">{item.nama_surah}</td>
                        <td className="px-6 py-5 text-gray-700 whitespace-nowrap">{item.ayat}</td>
                        <td className="px-6 py-5 font-bold text-gray-900 whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg">{item.makhraj || "-"}</span>
                        </td>
                        <td className="px-6 py-5 text-gray-700 whitespace-nowrap">{item.murojaah || "-"}</td>
                        <td className="px-6 py-5 text-gray-600 whitespace-nowrap">{item.keterangan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

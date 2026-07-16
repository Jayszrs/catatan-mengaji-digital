"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Printer, Download, Users, FileText, Search, Fingerprint, Award, GraduationCap, ChevronDown } from "lucide-react";
import { Button } from "@/components/Button";
import { getStudentRouteKey } from "@/lib/students";

export default function CetakRaporPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterLevel, setFilterLevel] = useState("Semua");
  const [isKelasOpen, setIsKelasOpen] = useState(false);
  const [isLevelOpen, setIsLevelOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .order("nama_lengkap", { ascending: true });

      setStudents(studentsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const namaLengkap = student.nama_lengkap || "";
    const matchQuery = namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (student.nis && student.nis.includes(searchQuery));
    const matchKelas = filterKelas === "Semua" || student.kelas === filterKelas;
    // Asumsi: jika student.level belum ada di database, kita anggap null/kosong.
    const matchLevel = filterLevel === "Semua" || (student.level && student.level.toString() === filterLevel);
    
    return matchQuery && matchKelas && matchLevel;
  });

  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const k = student.kelas || "Tanpa Kelas";
    if (!acc[k]) acc[k] = [];
    acc[k].push(student);
    return acc;
  }, {} as Record<string, any[]>);

  const handlePrint = (studentId: string) => {
    router.push(`/dashboard/guru/reports/print/${studentId}`);
  };

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Input & Cetak Rapor
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Buat dan unduh laporan bulanan atau semester untuk wali murid.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-48 shrink-0 z-20">
            <button
              onClick={() => { setIsKelasOpen(!isKelasOpen); setIsLevelOpen(false); }}
              onBlur={() => setTimeout(() => setIsKelasOpen(false), 200)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1b4332] shadow-sm transition-all"
            >
              <span>{filterKelas === "Semua" ? "Semua Kelas" : `Kelas ${filterKelas}`}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isKelasOpen ? "rotate-180" : ""}`} />
            </button>
            {isKelasOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <button onMouseDown={() => { setFilterKelas("Semua"); setIsKelasOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterKelas === "Semua" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  Semua Kelas
                </button>
                {["1", "2", "3", "4", "5", "6"].map(k => (
                  <button key={k} onMouseDown={() => { setFilterKelas(k); setIsKelasOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterKelas === k ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    Kelas {k}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-48 shrink-0 z-10">
            <button
              onClick={() => { setIsLevelOpen(!isLevelOpen); setIsKelasOpen(false); }}
              onBlur={() => setTimeout(() => setIsLevelOpen(false), 200)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1b4332] shadow-sm transition-all"
            >
              <span>{filterLevel === "Semua" ? "Semua Level" : `Level ${filterLevel}`}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isLevelOpen ? "rotate-180" : ""}`} />
            </button>
            {isLevelOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <button onMouseDown={() => { setFilterLevel("Semua"); setIsLevelOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterLevel === "Semua" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  Semua Level
                </button>
                {["1", "2", "3", "4", "5", "6"].map(l => (
                  <button key={l} onMouseDown={() => { setFilterLevel(l); setIsLevelOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterLevel === l ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    Level {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari siswa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl w-full sm:w-64 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b4332] transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <FileText className="text-[#1b4332]" size={28} />
            <h2 className="text-xl font-bold text-gray-900">Pilih Siswa</h2>
          </div>

        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#1b4332]"></div>
          </div>
        ) : (
          <div className="p-8 bg-gray-50/30">
            {Object.keys(groupedStudents).sort().map(kelas => (
              <div key={kelas} className="mb-12 last:mb-0">
                <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-gray-100 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center text-lg font-black shadow-sm">
                    {kelas !== "Tanpa Kelas" ? kelas : "-"}
                  </span>
                  {kelas === "Tanpa Kelas" ? "Belum Masuk Kelas" : `Kelas ${kelas}`}
                  <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold">{groupedStudents[kelas].length} Siswa</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedStudents[kelas].map((student: any) => (
                    <div
                      key={student.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#1b4332] hover:shadow-lg transition-all duration-300 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#1b4332] to-[#2dc653] rounded-full flex items-center justify-center text-white text-2xl font-black shadow-sm shrink-0">
                          {(student.nama_lengkap || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                            {student.nama_lengkap || "Tanpa Nama"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-gray-500 font-medium">NIS: {student.nis || "-"}</span>
                            <span className="mx-1 border-l border-gray-300 h-3"></span>
                            <span className="text-[#1b4332] font-bold whitespace-nowrap">Kelas {student.kelas || "-"}</span>
                            <span className="mx-1 border-l border-gray-300 h-3"></span>
                            <span className="text-blue-600 font-bold whitespace-nowrap">Level {student.level || "-"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-4 xl:mt-0 w-full xl:w-auto">
                        <button 
                          onClick={() => router.push(`/dashboard/guru/reports/print/${getStudentRouteKey(student)}?type=rapor`)}
                          className="flex-1 xl:flex-none px-4 py-2 border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-xs shadow-sm"
                        >
                          <FileText size={16} /> Input Rapor
                        </button>
                        <button 
                          onClick={() => router.push(`/dashboard/guru/reports/print/${getStudentRouteKey(student)}?type=munaqosyah`)}
                          className="flex-1 xl:flex-none px-4 py-2 border-2 border-purple-600 text-purple-700 hover:bg-purple-50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-xs shadow-sm"
                        >
                          <GraduationCap size={16} /> Munaqosyah
                        </button>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {filteredStudents.length === 0 && (
              <div className="py-12 text-center text-gray-500 font-medium">
                Siswa tidak ditemukan.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

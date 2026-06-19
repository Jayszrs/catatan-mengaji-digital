"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Sun, BookOpen, FileText, Search, ChevronDown, ChevronUp } from "lucide-react";

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

interface StudentData {
  id: string;
  nama_lengkap: string;
  kelas: string;
  nis: string;
  level: string;
  tadarus: any[];
  tahsin: any[];
}

export default function OrangTuaDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [activeTabs, setActiveTabs] = useState<Record<string, "tadarus" | "tahsin">>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "orang_tua") {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      await fetchLaporan();
    } catch (err) {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchLaporan = async () => {
    try {
      // Ambil data tadarus beserta nama siswa dan kelas
      const { data: dataTadarus } = await supabase
        .from("laporan_tadarus_pagi")
        .select("*, students(nama_lengkap, kelas, nis, level)")
        .order("tanggal", { ascending: false });

      // Ambil data tahsin beserta nama siswa dan kelas
      const { data: dataTahsin } = await supabase
        .from("laporan_tahsin_tahfidz")
        .select("*, students(nama_lengkap, kelas, nis, level)")
        .order("tanggal", { ascending: false });

      // Group by student_id
      const studentMap = new Map<string, StudentData>();

      const addStudent = (id: string, nama: string, kelas: string, nis: string, level: string) => {
        if (!studentMap.has(id)) {
          studentMap.set(id, { id, nama_lengkap: nama, kelas, nis, level, tadarus: [], tahsin: [] });
        }
      };

      dataTadarus?.forEach(item => {
        const sid = item.student_id;
        const nama = item.students?.nama_lengkap || "Siswa";
        const kelas = item.students?.kelas || "Tanpa Kelas";
        const nis = item.students?.nis || "-";
        const level = item.students?.level || "-";
        addStudent(sid, nama, kelas, nis, level);
        studentMap.get(sid)!.tadarus.push(item);
      });

      dataTahsin?.forEach(item => {
        const sid = item.student_id;
        const nama = item.students?.nama_lengkap || "Siswa";
        const kelas = item.students?.kelas || "Tanpa Kelas";
        const nis = item.students?.nis || "-";
        const level = item.students?.level || "-";
        addStudent(sid, nama, kelas, nis, level);
        studentMap.get(sid)!.tahsin.push(item);
      });

      const list = Array.from(studentMap.values());
      
      // Initialize active tabs for all students
      const initialTabs: Record<string, "tadarus" | "tahsin"> = {};
      list.forEach(s => initialTabs[s.id] = "tadarus");
      setActiveTabs(initialTabs);

      setStudentsData(list);

    } catch (err) {
      console.error("Error:", err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="orang_tua">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#2dc653]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const toggleTab = (studentId: string, tab: "tadarus" | "tahsin") => {
    setActiveTabs(prev => ({ ...prev, [studentId]: tab }));
  };

  const filteredStudents = studentsData.filter(s => 
    s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterKelas === "Semua" || s.kelas === filterKelas)
  ).sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap));

  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const kls = student.kelas || "Tanpa Kelas";
    if (!acc[kls]) acc[kls] = [];
    acc[kls].push(student);
    return acc;
  }, {} as Record<string, typeof studentsData>);

  return (
    <DashboardLayout userRole="orang_tua">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
            Selamat Datang, Ayah & Bunda
          </h1>
          <p className="text-gray-500 font-medium">
            Pantau perkembangan dan kemajuan hafalan Ananda secara langsung.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <div className="relative shrink-0 z-20 w-full sm:w-[160px]">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              className="flex items-center justify-between w-full pl-5 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#2dc653] outline-none font-bold text-gray-700 shadow-sm cursor-pointer h-full transition-all"
            >
              <span>{filterKelas === "Semua" ? "Semua Kelas" : `Kelas ${filterKelas}`}</span>
              <ChevronDown 
                size={20} 
                className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} 
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <button
                  onMouseDown={() => { setFilterKelas("Semua"); setIsDropdownOpen(false); }}
                  className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterKelas === "Semua" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Semua Kelas
                </button>
                {["1", "2", "3", "4", "5", "6"].map(k => (
                  <button
                    key={k}
                    onMouseDown={() => { setFilterKelas(k); setIsDropdownOpen(false); }}
                    className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterKelas === k ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Kelas {k}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1 w-full shrink-0">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama anak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#2dc653] focus:border-transparent outline-none transition-all shadow-sm font-bold text-gray-900"
            />
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-16 text-center border border-gray-100">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum ada data</h3>
          <p className="text-gray-500 font-medium">Belum ada laporan yang tersedia untuk anak tersebut.</p>
        </div>
      ) : (
        Object.keys(groupedStudents).sort().map(kelas => (
          <div key={kelas} className="mb-8">
            <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#2dc653]/10 text-[#1b4332] flex items-center justify-center">
                <BookOpen size={18} />
              </span>
              Kelas {kelas}
            </h2>
            <div className="space-y-6">
              {groupedStudents[kelas].map((student) => {
                const totalLaporan = student.tadarus.length + student.tahsin.length;
          const laporanBulanIni = [...student.tadarus, ...student.tahsin].filter((l) => {
            const date = new Date(l.tanggal);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length;
          
          const laporanMingguIni = [...student.tadarus, ...student.tahsin].filter((l) => {
            const date = new Date(l.tanggal);
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo && date <= now;
          }).length;

          const activeTab = activeTabs[student.id] || "tadarus";

          const tahsinWithScores = student.tahsin.filter(t => t.nilai !== null && t.nilai !== undefined && t.nilai !== "");
          const sumNilai = tahsinWithScores.reduce((acc, curr) => acc + Number(curr.nilai), 0);
          const avgNilai = tahsinWithScores.length > 0 ? Math.round(sumNilai / tahsinWithScores.length) : null;
          const predikatRataRata = avgNilai !== null ? getPredikat(avgNilai) : null;

          return (
            <div key={student.id} className="mb-6">
              {/* Profil Anak (Clickable) */}
              <div 
                onClick={() => setSelectedStudentId(selectedStudentId === student.id ? null : student.id)}
                className={`bg-white rounded-3xl p-6 shadow-sm border ${selectedStudentId === student.id ? 'border-[#2dc653] ring-4 ring-[#2dc653]/10' : 'border-gray-100'} flex items-center justify-between cursor-pointer transition-all hover:shadow-md relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#2dc653]/10 to-transparent rounded-bl-full -z-10"></div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-[#1b4332] to-[#2dc653] rounded-full flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg shrink-0">
                    {student.nama_lengkap.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Data Siswa • NIS {student.nis || "-"} • Kelas {student.kelas || "-"} • Level {student.level || "-"}</p>
                    <h2 className="text-2xl font-black text-gray-900">{student.nama_lengkap}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-bold text-sm transition-colors border border-green-200">
                    Cek Kemajuan
                  </button>
                  {selectedStudentId === student.id ? (
                    <ChevronUp size={24} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={24} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {selectedStudentId === student.id && (
                <div className="mt-8 animate-in slide-in-from-top-4 fade-in duration-300">

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-[#1b4332] rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
                  <p className="text-sm font-medium text-white/80 mb-2 uppercase tracking-wider">Total Laporan</p>
                  <p className="text-5xl font-black">{totalLaporan}</p>
                </div>

                <div className="bg-[#2dc653] rounded-3xl shadow-xl p-8 text-[#1b4332] relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-xl"></div>
                  <p className="text-sm font-bold text-[#1b4332]/80 mb-2 uppercase tracking-wider">Bulan Ini</p>
                  <p className="text-5xl font-black">{laporanBulanIni}</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 relative overflow-hidden">
                  <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Minggu Ini</p>
                  <p className="text-5xl font-black text-gray-900">{laporanMingguIni}</p>
                </div>

                <div className={`rounded-3xl shadow-sm p-8 relative overflow-hidden ${predikatRataRata ? 'bg-gradient-to-br from-green-50 to-white border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                  <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Rata-rata Tahsin</p>
                  <div className="flex items-end gap-3">
                    <p className="text-5xl font-black text-gray-900">{avgNilai !== null ? avgNilai : "-"}</p>
                    {predikatRataRata && (
                      <span className={`text-sm font-bold mb-1.5 ${predikatRataRata.warna}`}>{predikatRataRata.predikat}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => toggleTab(student.id, "tadarus")}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                    activeTab === "tadarus"
                      ? "bg-[#2dc653] text-white shadow-xl scale-[1.02]"
                      : "bg-white border border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200"
                  }`}
                >
                  <Sun size={24} /> Tadarus Pagi
                </button>
                <button
                  onClick={() => toggleTab(student.id, "tahsin")}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                    activeTab === "tahsin"
                      ? "bg-blue-600 text-white shadow-xl scale-[1.02]"
                      : "bg-white border border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-200"
                  }`}
                >
                  <BookOpen size={24} /> Tahsin & Tahfidz
                </button>
              </div>

              {/* Tabel Laporan */}
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                {activeTab === "tadarus" ? (
                  <>
                    <div className="px-8 py-6 border-b border-gray-100 bg-green-50/50 flex items-center gap-3">
                      <Sun className="text-[#2dc653]" size={24} />
                      <h3 className="text-xl font-bold text-gray-900">Riwayat Tadarus Pagi</h3>
                    </div>
                    {student.tadarus.length === 0 ? (
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
                            {student.tadarus.map((item) => (
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
                    {student.tahsin.length === 0 ? (
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
                            {student.tahsin.map((item) => (
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
              </div>
              )}
            </div>
          );
        })}
            </div>
          </div>
        ))
      )}
    </DashboardLayout>
  );
}

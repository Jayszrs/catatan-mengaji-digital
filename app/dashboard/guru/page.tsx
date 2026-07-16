"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { getStudentRouteKey } from "@/lib/students";
import Link from "next/link";
import { Users, BookOpen, Sun, GraduationCap, X, Plus, UserPlus, Fingerprint, ChevronRight, Inbox, Save, FileText, ArrowUpRight, Clock, Activity, CheckCircle2, MoreHorizontal } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DaftarSiswaDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("Mingguan");
  const [students, setStudents] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    tadarusToday: 0,
    tahsinToday: 0,
    belumLaporan: 0
  });

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

      if (roleData?.role !== "guru") {
        router.push("/auth/login");
        return;
      }

      setUser(user);
      await fetchDashboardData();
    } catch (err) {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Students
      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .order("nama_lengkap", { ascending: true });

      setStudents(studentsData || []);

      const today = new Date().toISOString().split("T")[0];

      // 2. Fetch Stats Today
      const { count: tadarusCount } = await supabase
        .from("laporan_tadarus_pagi")
        .select('*', { count: 'exact', head: true })
        .eq("tanggal", today);

      const { count: tahsinCount } = await supabase
        .from("laporan_tahsin_tahfidz")
        .select('*', { count: 'exact', head: true })
        .eq("tanggal", today);

      setStats({
        totalStudents: studentsData ? studentsData.length : 0,
        tadarusToday: tadarusCount || 0,
        tahsinToday: tahsinCount || 0,
        belumLaporan: (studentsData ? studentsData.length : 0) - (tahsinCount || 0)
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#1b4332]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const progressPercentage = stats.totalStudents > 0 
    ? Math.round((stats.tahsinToday / stats.totalStudents) * 100) 
    : 0;

  const chartDataMap: Record<string, { name: string, capaian: number }[]> = {
    "Mingguan": [
      { name: 'Sen', capaian: 40 }, { name: 'Sel', capaian: 70 }, { name: 'Rab', capaian: 45 },
      { name: 'Kam', capaian: 90 }, { name: 'Jum', capaian: 60 }, { name: 'Sab', capaian: 30 },
    ],
    "Bulanan": [
      { name: 'Pekan 1', capaian: 65 }, { name: 'Pekan 2', capaian: 80 }, 
      { name: 'Pekan 3', capaian: 75 }, { name: 'Pekan 4', capaian: 95 },
    ],
    "Semester": [
      { name: 'Jul', capaian: 50 }, { name: 'Ags', capaian: 65 }, { name: 'Sep', capaian: 80 },
      { name: 'Okt', capaian: 75 }, { name: 'Nov', capaian: 85 }, { name: 'Des', capaian: 100 },
    ],
    "Tahunan": [
      { name: 'Smt 1', capaian: 75 }, { name: 'Smt 2', capaian: 92 },
    ]
  };

  const currentChartData = chartDataMap[chartPeriod] || chartDataMap["Mingguan"];
  const highestCapaian = Math.max(...currentChartData.map(d => d.capaian));

  return (
    <DashboardLayout userRole="guru">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Kelola laporan, pantau performa, dan bantu hafalan siswa dengan mudah.
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1b4332] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-white/80 font-medium text-sm">Total Siswa</h3>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md cursor-pointer hover:bg-white/20 transition-colors">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <h2 className="text-5xl font-black mb-4 relative z-10">{stats.totalStudents}</h2>
          <div className="flex items-center gap-2 text-white/70 text-xs font-medium relative z-10">
            <span className="bg-white/20 px-2 py-0.5 rounded text-white">+2</span> Siswa baru bulan ini
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Tadarus Selesai</h3>
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <h2 className="text-5xl font-black text-gray-900 mb-4">{stats.tadarusToday}</h2>
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <span className="bg-[#2dc653]/10 text-[#2dc653] px-2 py-0.5 rounded flex items-center gap-1"><Sun size={10} /> {Math.round((stats.tadarusToday / (stats.totalStudents || 1)) * 100)}%</span> Dari total siswa
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Tahsin Selesai</h3>
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <h2 className="text-5xl font-black text-gray-900 mb-4">{stats.tahsinToday}</h2>
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded flex items-center gap-1"><BookOpen size={10} /> {progressPercentage}%</span> Laporan hari ini
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-500 font-medium text-sm">Belum Laporan</h3>
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <h2 className="text-5xl font-black text-gray-900 mb-4">{stats.belumLaporan}</h2>
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <span className="text-orange-500 flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded"><Clock size={10} /> Butuh Perhatian</span>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Grafik Performa */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gray-900">Performa {chartPeriod}</h3>
            <select 
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="bg-gray-50 border-none text-sm font-bold text-gray-600 rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="Mingguan">Mingguan</option>
              <option value="Bulanan">Bulanan</option>
              <option value="Semester">Semester</option>
              <option value="Tahunan">Tahunan</option>
            </select>
          </div>
          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6', radius: 8 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="capaian" radius={[8, 8, 8, 8]} barSize={40}>
                  {currentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.capaian === highestCapaian ? '#2dc653' : '#1b4332'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tindakan Cepat */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Tindakan Cepat</h3>
          
          <Link href="/dashboard/guru/input-tadarus" className="block bg-gradient-to-r from-[#1b4332] to-[#2dc653] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden mb-4 group cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Sun size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-0.5">Input Tadarus</h4>
                <p className="text-white/80 text-xs">Catat hafalan pagi siswa</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/guru/input-tahsin" className="block bg-white border border-gray-100 rounded-2xl p-5 hover:bg-blue-50 hover:border-blue-100 transition-all group cursor-pointer mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BookOpen size={20} />
              </div>
              <div>
                <h5 className="font-bold text-gray-900 text-sm group-hover:text-blue-900">Input Tahsin & Tahfidz</h5>
                <p className="text-gray-500 text-xs">Catat ziyadah & muroja'ah</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/guru/students" className="block bg-white border border-gray-100 rounded-2xl p-5 hover:bg-orange-50 hover:border-orange-100 transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Users size={20} />
              </div>
              <div>
                <h5 className="font-bold text-gray-900 text-sm group-hover:text-orange-900">Kelola Siswa</h5>
                <p className="text-gray-500 text-xs">Tambah atau edit data siswa</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daftar Siswa (Team Collaboration) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Daftar Siswa Kelas</h3>
            <Link href="/dashboard/guru/students" className="text-sm font-bold text-gray-500 flex items-center gap-1 hover:text-[#1b4332] transition-colors">
              <Plus size={16} /> Lihat Semua
            </Link>
          </div>

          <div className="space-y-3">
            {students.slice(0, 5).map((student) => (
              <Link
                key={student.id}
                href={`/dashboard/guru/student/${getStudentRouteKey(student)}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50 hover:shadow-sm transition-all group gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-tr from-[#1b4332] to-[#2dc653] rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                    {student.nama_lengkap.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-[#1b4332] transition-colors">{student.nama_lengkap}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Aktif
                  </span>
                  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-[#1b4332] group-hover:border-[#1b4332] transition-all shrink-0">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            ))}

            {students.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium text-sm">Belum ada siswa.</p>
              </div>
            )}
          </div>
        </div>

        {/* Progres Keseluruhan */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col items-center">
          <h3 className="text-xl font-bold text-gray-900 w-full text-left mb-10">Progres Harian</h3>
          
          <div className="relative w-48 h-48 mb-10 mt-4">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="4"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#1b4332"
                strokeWidth="4"
                strokeDasharray={`${progressPercentage}, 100`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-900">{progressPercentage}%</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Selesai</span>
            </div>
          </div>

          <div className="flex gap-6 w-full justify-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1b4332]"></span>
              <span className="text-sm font-bold text-gray-600">Selesai</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-100"></span>
              <span className="text-sm font-bold text-gray-600">Belum</span>
            </div>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

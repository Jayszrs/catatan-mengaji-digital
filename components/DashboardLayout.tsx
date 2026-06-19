"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Printer, 
  Sun,
  BookOpen, 
  Settings, 
  HelpCircle, 
  LogOut,
  Search,
  Bell,
  Mail,
  Menu,
  X,
  Award,
  FileText
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  userRole?: string;
}

export function DashboardLayout({ children, userRole }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("Guru");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (userRole === "admin") {
      setUserName("Administrator");
      setUserEmail("admin");
      return;
    }
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || "Guru");
        setUserEmail(user.email || "");
      }
    };
    fetchUser();
  }, [userRole]);

  const handleLogout = async () => {
    if (userRole === "admin") {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_logged_in");
      }
      router.push("/");
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen bg-[#f7f9fa] font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="h-24 flex items-center px-6 border-b border-gray-100 bg-white relative">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain mix-blend-multiply" style={{ filter: 'contrast(1.2) brightness(1.1)' }} />
            <div className="flex flex-col justify-center">
              <span className="font-black text-[13px] leading-tight text-[#0a192f] uppercase tracking-tight whitespace-nowrap">CATATAN MENGAJI DIGITAL</span>
              <span className="font-bold text-[9px] leading-tight text-[#2dc653] uppercase tracking-wider mt-0.5 whitespace-nowrap">SD Islam Labschool Bani Saleh</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden text-gray-500 hover:text-gray-900 bg-gray-50 p-1.5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8">
          {userRole === "admin" ? (
            <div>
              <p className="px-4 text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">Admin Panel</p>
              <nav className="space-y-1">
                <Link href="/dashboard/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/admin") ? "bg-[#1b4332] text-white shadow-md shadow-[#1b4332]/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Users size={20} />
                  <span>Manajemen Akun</span>
                </Link>
              </nav>
            </div>
          ) : userRole === "orang_tua" ? (
            <div>
              <p className="px-4 text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">Laporan</p>
              <nav className="space-y-1">
                <Link href="/dashboard/orang-tua" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/orang-tua") ? "bg-[#1b4332] text-white shadow-md shadow-[#1b4332]/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <BookOpen size={20} />
                  <span>Progres Anak</span>
                </Link>
                <Link href="/dashboard/orang-tua/komposisi-nilai" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/orang-tua/komposisi-nilai") ? "bg-[#1b4332] text-white shadow-md shadow-[#1b4332]/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Award size={20} />
                  <span>Komposisi Nilai</span>
                </Link>
              </nav>
            </div>
          ) : (
            <div>
              <p className="px-4 text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">Menu Utama</p>
              <nav className="space-y-1">
                <Link href="/dashboard/guru" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/guru") ? "bg-[#1b4332] text-white shadow-md shadow-[#1b4332]/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </Link>
                <Link href="/dashboard/guru/students" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/guru/students") ? "bg-[#1b4332] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Users size={20} />
                  <span>Daftar Siswa</span>
                </Link>
                <Link href="/dashboard/guru/input-tadarus" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/guru/input-tadarus") ? "bg-[#1b4332] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Sun size={20} />
                  <span>Input Tadarus</span>
                </Link>
                <Link href="/dashboard/guru/input-tahsin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/guru/input-tahsin") ? "bg-[#1b4332] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <BookOpen size={20} />
                  <span className="whitespace-nowrap">Input Tahsin & Tahfidz</span>
                </Link>
                <Link href="/dashboard/guru/komposisi-nilai" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/guru/komposisi-nilai") ? "bg-[#1b4332] text-white shadow-md shadow-[#1b4332]/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Award size={20} />
                  <span>Komposisi Nilai</span>
                </Link>
                <Link href="/dashboard/guru/reports" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive("/dashboard/guru/reports") ? "bg-[#1b4332] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Printer size={20} />
                  <span className="whitespace-nowrap">Input & Cetak Rapor</span>
                </Link>
              </nav>
            </div>
          )}

          <div>
            <p className="px-4 text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase">Sistem</p>
            <nav className="space-y-1">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all">
                <LogOut size={20} />
                <span>Keluar</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-24 bg-[#f7f9fa] flex items-center justify-between px-8 lg:px-12 shrink-0 pt-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
              <Menu size={24} />
            </button>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden md:block h-8 w-px bg-gray-200 mx-2"></div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-11 h-11 bg-gradient-to-tr from-[#1b4332] to-[#2dc653] rounded-full flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900 text-sm leading-tight group-hover:text-[#1b4332] transition-colors">{userName}</span>
                  {userRole && (
                    <span className="text-[10px] font-bold text-[#1b4332] bg-[#1b4332]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {userRole.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-500 mt-0.5">{userEmail}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main id="main-content" className="flex-1 overflow-y-auto px-8 lg:px-12 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}

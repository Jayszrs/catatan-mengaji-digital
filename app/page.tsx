"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/Button";
import { BookOpen, Users, BarChart3, GraduationCap, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // Tampilkan splash screen setiap kali halaman dimuat (termasuk saat di-refresh)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);
    
    // Hapus dari DOM setelah animasi fade out selesai
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Splash Screen */}
      {showSplash && (
        <div 
          className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
        >
          {/* Subtle Background Decor */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2dc653]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#2dc653]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

          {/* Logo dengan Animasi Loading */}
          <div className="relative mb-10 z-10">
            <div className="w-36 h-36 bg-white rounded-full shadow-2xl shadow-[#2dc653]/20 relative z-10 flex items-center justify-center overflow-hidden border border-gray-50">
              <img src="/logo.png" alt="Logo SD ILBS" className="w-full h-full object-cover scale-[1.35]" />
            </div>
            {/* Cincin berputar (Spinning Ring) */}
            <div className="absolute -inset-2 border-[3px] border-gray-100 border-t-[#2dc653] rounded-full animate-spin" style={{ animationDuration: '1.2s' }}></div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 text-center mb-3 tracking-tight z-10">
            Catatan Mengaji Digital
          </h1>
          <p className="text-gray-500 text-base md:text-lg text-center max-w-md px-6 font-medium leading-relaxed z-10">
            Sistem Informasi Laporan Harian Digital
            <br />
            <span className="font-bold text-[#2dc653] mt-3 block tracking-widest uppercase text-xs">SD Islam Labschool Bani Saleh</span>
          </p>

          {/* Indikator Memuat (Loading Text) */}
          <div className="mt-16 flex items-center gap-3 z-10 bg-gray-50/80 px-5 py-2.5 rounded-full border border-gray-100 backdrop-blur-sm">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#2dc653] animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-[#2dc653] animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-[#2dc653] animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-[#2dc653] text-xs font-bold tracking-widest uppercase">Memuat</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo SD Islam Labschool" className="w-12 h-12 object-contain" />
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-gray-900 tracking-tight leading-tight uppercase">
                Catatan Mengaji Digital
              </span>
              <span className="text-xs font-semibold text-[#2dc653] uppercase tracking-wider">
                SD Islam Labschool Bani Saleh
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard/guru">
                <Button>Buka Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden md:block">
                  Masuk
                </Link>
                <Link href="/auth/signup">
                  <Button className="shadow-md hover:shadow-lg">Daftar Sekarang</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-24 px-6 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-green-50 border border-green-100 text-[#2dc653] rounded-full text-sm font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#2dc653] animate-pulse"></span>
            Platform Laporan Digital Resmi
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight tracking-tight">
            Catatan Mengaji <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2dc653] to-[#1f9c3b] uppercase">
              Digital
            </span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Platform modern yang dirancang khusus untuk mempermudah guru mencatat progress dan mempererat komunikasi dengan orang tua secara <i>real-time</i>.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {!user ? (
              <>
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-4 shadow-xl hover:shadow-2xl text-lg rounded-2xl"
                  >
                    Mulai Sekarang
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-4 text-lg rounded-2xl border-2"
                  >
                    Masuk ke Akun
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard/guru">
                <Button size="lg" className="px-8 py-4 shadow-xl text-lg rounded-2xl">Masuk ke Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Sistem terintegrasi yang memudahkan pengelolaan data dan pelaporan capaian siswa.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-10 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-green-50 text-[#2dc653] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Laporan Digital Terstruktur
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Input laporan tadarus pagi dan progress hafalan siswa dengan parameter yang jelas, mudah, dan tersimpan aman.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Sinergi Guru & Orang Tua
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Orang tua dapat mengakses perkembangan hafalan anak secara real-time dari mana saja melalui perangkat mereka.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-10 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Analitik & Tracking
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Evaluasi statistik pembelajaran, makhraj, muroja'ah, dan rekam jejak penilaian siswa secara komprehensif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Satu Platform, Dua Akses
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Sistem peran ganda yang mengoptimalkan alur informasi antara pendidik dan wali murid.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Guru */}
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-12 relative overflow-hidden group">
              <div className="w-16 h-16 bg-white text-[#2dc653] rounded-2xl shadow-sm flex items-center justify-center mb-8">
                <GraduationCap size={32} strokeWidth={2} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-8">Akses Guru</h3>
              <ul className="space-y-5">
                {[
                  "Manajemen daftar siswa dalam satu kelas",
                  "Input laporan tadarus pagi harian dengan efisien",
                  "Pencatatan spesifik makhraj & kelancaran muroja'ah",
                  "Sistem paraf digital tersentralisasi"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <CheckCircle2 className="text-[#2dc653] shrink-0 mt-0.5" size={20} />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Orang Tua */}
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-12 relative overflow-hidden group">
              <div className="w-16 h-16 bg-white text-blue-600 rounded-2xl shadow-sm flex items-center justify-center mb-8">
                <Users size={32} strokeWidth={2} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-8">Akses Orang Tua</h3>
              <ul className="space-y-5">
                {[
                  "Akses transparan ke rekam jejak harian anak",
                  "Monitoring target hafalan secara berkala",
                  "Melihat catatan khusus dan masukan dari guru pengajar",
                  "Notifikasi pembaruan data secara real-time"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <CheckCircle2 className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain grayscale opacity-50" />
            <span className="font-bold text-white tracking-wide">Labschool Bani Saleh</span>
          </div>
          <p className="text-sm font-medium">
            &copy; {new Date().getFullYear()} Hak Cipta Dilindungi. Platform Laporan Harian Digital.
          </p>
        </div>
      </footer>
    </div>
  );
}

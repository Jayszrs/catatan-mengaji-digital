"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "./Button";

interface NavbarProps {
  userRole?: string;
}

export function Navbar({ userRole }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <nav className="bg-white shadow-lg border-b-4 border-[#2dc653] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo SD Islam Labschool" className="w-10 h-10 object-contain" />
          <div className="flex flex-col">
            <span className="font-bold text-lg text-gray-800 leading-tight">
              Laporan Harian
            </span>
            <span className="text-[10px] font-semibold text-[#2dc653] uppercase tracking-wider">
              Labschool Bani Saleh
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          {userRole === "guru" && (
            <div className="flex items-center gap-4 mr-4 text-sm font-semibold text-gray-600">
              <Link href="/dashboard/guru" className="hover:text-[#2dc653] transition-colors">
                Daftar Siswa
              </Link>
            </div>
          )}
          {userRole && (
            <div className="flex items-center gap-4 border-l-2 pl-6">
              <span className="text-sm text-gray-600 capitalize">
                {userRole === "guru" ? "Guru" : "Orang Tua"}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

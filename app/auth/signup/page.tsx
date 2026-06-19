"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { createUserRole } from "@/lib/supabase";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { UserRole } from "@/types";
import { ArrowLeft, UserPlus, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("guru");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Password tidak cocok");
      }

      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (authError) throw authError;

      // Handle the case where the user already exists and email enumeration protection is on
      if (data.user?.identities?.length === 0) {
        throw new Error("Email sudah terdaftar. Silakan gunakan email lain atau login.");
      }

      if (data.user) {
        await createUserRole(data.user.id, email, role);

        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        router.push("/auth/login?message=Pendaftaran berhasil, silakan login");
      }
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2dc653] via-[#2dc653] to-[#1f9c3b] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      
      {/* Button Kembali ke Beranda */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-white font-bold bg-black/20 hover:bg-black/30 px-5 py-2.5 rounded-full backdrop-blur-md transition-all z-20 shadow-lg hover:shadow-xl hover:-translate-x-1"
      >
        <ArrowLeft size={18} /> Beranda
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 relative z-10 max-h-screen overflow-y-auto custom-scrollbar">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo Sekolah" className="w-20 h-20 object-contain drop-shadow-md" />
        </div>

        <h1 className="text-3xl font-black text-center text-gray-900 mb-2">
          Buat Akun Baru
        </h1>
        <p className="text-center text-[#2dc653] font-black mb-8 text-lg uppercase tracking-wider">Catatan Mengaji Digital</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="Nama Lengkap"
            type="text"
            placeholder="Masukkan nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="Masukkan email Anda"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Akun
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="guru"
                  checked={role === "guru"}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mr-2 w-4 h-4 accent-[#2dc653]"
                />
                <span className="text-gray-700">Guru</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="orang_tua"
                  checked={role === "orang_tua"}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mr-2 w-4 h-4 accent-[#2dc653]"
                />
                <span className="text-gray-700">Orang Tua</span>
              </label>
            </div>
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulang password Anda"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-lg">
            {loading ? (
              <><Loader2 className="animate-spin" size={20} /> Memproses...</>
            ) : (
              <><UserPlus size={20} /> Daftar</>
            )}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Sudah punya akun?{" "}
          <Link
            href="/auth/login"
            className="text-[#2dc653] font-semibold hover:underline"
          >
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

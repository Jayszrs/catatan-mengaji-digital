"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ArrowLeft, LogIn, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (email === "admin" && password === "admin123") {
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_logged_in", "true");
        }
        router.push("/dashboard/admin");
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (authError) throw authError;

      if (data.user) {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (roleError) throw roleError;

        if (roleData?.role === "guru") {
          router.push("/dashboard/guru");
        } else if (roleData?.role === "orang_tua") {
          router.push("/dashboard/orang-tua");
        } else {
          setError("Data Role tidak ditemukan. Karena database baru direset, silakan daftar akun (Sign Up) ulang.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Gagal login");
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

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 relative z-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo Sekolah" className="w-24 h-24 object-contain drop-shadow-md" />
        </div>

        <h1 className="text-4xl font-black text-center text-gray-900 mb-2 uppercase">
          Catatan Mengaji
        </h1>
        <p className="text-center text-[#2dc653] font-black mb-8 text-2xl uppercase tracking-widest">
          Digital
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            label="Email atau Username"
            type="text"
            placeholder="nama@email.com atau admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="w-full mt-8 py-3 flex items-center justify-center gap-2 text-lg">
            {loading ? (
              <><Loader2 className="animate-spin" size={20} /> Memproses...</>
            ) : (
              <><LogIn size={20} /> Masuk</>
            )}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-8 font-medium">
          Belum punya akun?{" "}
          <Link
            href="/auth/signup"
            className="text-[#2dc653] font-bold hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";
import { usernameToManagedEmail } from "@/lib/account-identifier";
import { AuthInput } from "@/components/AuthInput";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import { AlertCircle, Loader2, LockKeyhole, LogIn, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNeedsVerification(false);
    setLoading(true);

    try {
      const normalizedIdentifier = email.trim().toLowerCase();
      if (!normalizedIdentifier.includes("@")) {
        const response = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: normalizedIdentifier,
            password,
          }),
        });
        if (response.ok) {
          router.push("/dashboard/admin/monitoring");
          return;
        }
      }

      const normalizedEmail = normalizedIdentifier.includes("@")
        ? normalizedIdentifier
        : usernameToManagedEmail(normalizedIdentifier);

      if (!isSupabaseConfigured) {
        throw new Error(
          "Koneksi database belum dipasang. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local.",
        );
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        const approvalStatus =
          data.user.app_metadata?.approval_status ||
          data.user.user_metadata?.approval_status;
        if (approvalStatus === "pending") {
          await supabase.auth.signOut();
          setError(
            "Pendaftaran Guru masih menunggu persetujuan Administrator.",
          );
          return;
        }
        if (approvalStatus === "rejected") {
          await supabase.auth.signOut();
          setError(
            "Pendaftaran Guru ditolak. Hubungi Administrator sekolah untuk informasi lebih lanjut.",
          );
          return;
        }

        if (data.user.app_metadata?.role === "admin") {
          router.push("/dashboard/admin/monitoring");
          return;
        }

        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (roleError) throw roleError;

        const resolvedRole = roleData?.role;

        if (resolvedRole === "guru") {
          router.push("/dashboard/guru");
        } else if (resolvedRole === "orang_tua") {
          router.push("/dashboard/orang-tua");
        } else {
          setError(
            "Role akun belum diberikan. Minta Administrator memberikan role pada Manajemen Akun.",
          );
        }
      }
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Gagal login";
      if (message.toLowerCase().includes("invalid login credentials")) {
        setError(
          "Username/email atau password tidak cocok. Periksa kembali data akun Anda.",
        );
      } else if (message.toLowerCase().includes("email not confirmed")) {
        setNeedsVerification(true);
        setError(
          "Email belum diverifikasi. Buka halaman status verifikasi untuk mengirim ulang email.",
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout mode="login">
      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2b8053]">
          Selamat Datang Kembali
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#12271d] sm:text-4xl">
          Masuk ke akun
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
          Gunakan akun guru, orang tua, atau administrator Anda.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm font-semibold text-amber-800">
          Status sistem: database belum terhubung. Login akun Supabase belum dapat digunakan.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <AuthInput
          label="Email atau Username"
          icon={Mail}
          type="text"
          inputMode="text"
          autoComplete="username"
          placeholder="nama@email.com atau username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <AuthInput
          label="Password"
          icon={LockKeyhole}
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <div className="-mt-1 text-right">
          {email.trim().includes("@") ? (
            <Link
              href={`/auth/reset-password?email=${encodeURIComponent(email.trim())}`}
              className="text-xs font-bold text-[#246b48] transition hover:text-[#174a32] hover:underline"
            >
              Lupa password?
            </Link>
          ) : (
            <span className="text-xs font-semibold text-gray-500">
              Lupa password akun username? Hubungi Administrator.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e622f] px-5 text-sm font-black uppercase tracking-[0.04em] text-white shadow-[0_12px_28px_rgba(14,98,47,0.18)] transition hover:bg-[#0a5127] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Memproses...
            </>
          ) : (
            <>
              <LogIn size={18} /> Masuk ke Dashboard
            </>
          )}
        </button>
      </form>

      {needsVerification && (
        <Link
          href={`/auth/verify?email=${encodeURIComponent(email)}`}
          className="mt-4 block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700 hover:bg-emerald-100"
        >
          Cek status &amp; kirim ulang verifikasi
        </Link>
      )}

      <p className="mt-7 text-center text-sm font-medium text-gray-500">
        Belum punya akun?{" "}
        <Link href="/auth/signup" className="font-black text-[#246b48] hover:underline">
          Buat akun
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

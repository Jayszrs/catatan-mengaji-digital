"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getAppErrorMessage } from "@/lib/app-errors";

type Mode = "request" | "update" | "success";

function ResetPasswordContent() {
  const params = useSearchParams();
  const code = params.get("code");
  const requestedMode = params.get("mode");
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(Boolean(code || requestedMode === "update"));
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "PASSWORD_RECOVERY") {
        setMode("update");
        setChecking(false);
        setMessage("");
      }
    });

    queueMicrotask(async () => {
      if (!active || (!code && requestedMode !== "update")) return;
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!active) return;
        if (session) {
          setMode("update");
          setMessage("");
        } else {
          setMessage("Tautan reset tidak valid atau sudah kedaluwarsa. Kirim ulang email reset.");
          setMode("request");
        }
      } catch (error) {
        if (active) {
          setMessage(getAppErrorMessage(error, "Tautan reset tidak valid."));
          setMode("request");
        }
      } finally {
        if (active) setChecking(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [code, requestedMode]);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      if (!isSupabaseConfigured) throw new Error("Database belum terhubung.");
      const normalizedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password?mode=update`,
      });
      if (error) throw error;
      setMode("success");
      setMessage("Email reset password sudah dikirim. Periksa inbox dan folder spam.");
    } catch (error) {
      setMessage(getAppErrorMessage(error, "Gagal mengirim email reset."));
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      if (password.length < 6) throw new Error("Password minimal 6 karakter.");
      if (password !== confirmation) throw new Error("Konfirmasi password tidak sama.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setMode("success");
      setMessage("Password berhasil diubah. Silakan login menggunakan password baru.");
    } catch (error) {
      setMessage(getAppErrorMessage(error, "Gagal mengubah password."));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <ResetShell>
        <Loader2 className="mx-auto animate-spin text-emerald-600" size={44} />
        <h1 className="mt-5 text-center text-2xl font-black text-gray-900">Memeriksa Tautan</h1>
        <p className="mt-2 text-center font-medium text-gray-500">Mohon tunggu, sesi pemulihan sedang disiapkan.</p>
      </ResetShell>
    );
  }

  return (
    <ResetShell>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        {mode === "success" ? <CheckCircle2 size={32} /> : mode === "update" ? <KeyRound size={32} /> : <Mail size={32} />}
      </div>
      <h1 className="mt-5 text-center text-3xl font-black text-gray-900">
        {mode === "update" ? "Buat Password Baru" : mode === "success" ? "Permintaan Berhasil" : "Reset Password"}
      </h1>
      <p className="mt-2 text-center font-medium text-gray-500">
        {mode === "update" ? "Masukkan password baru untuk akun Anda." : "Gunakan email yang terdaftar pada akun."}
      </p>

      {message && (
        <div className={`mt-6 flex items-start gap-2 rounded-xl border p-4 text-sm font-bold ${mode === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {mode === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message}</span>
        </div>
      )}

      {mode === "request" && (
        <form onSubmit={requestReset} className="mt-7 space-y-4">
          <label>
            <span className="mb-2 block text-sm font-bold text-gray-700">Email akun</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="nama@email.com" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-medium outline-none focus:border-emerald-500" />
          </label>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
            Kirim Email Reset
          </button>
        </form>
      )}

      {mode === "update" && (
        <form onSubmit={updatePassword} className="mt-7 space-y-4">
          <PasswordField label="Password Baru" value={password} onChange={setPassword} />
          <PasswordField label="Ulangi Password Baru" value={confirmation} onChange={setConfirmation} />
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <KeyRound size={20} />}
            Simpan Password Baru
          </button>
        </form>
      )}

      <Link href="/auth/login" className="mt-4 block rounded-xl border border-gray-200 px-5 py-3 text-center font-bold text-gray-700 hover:bg-gray-50">
        Kembali ke Login
      </Link>
    </ResetShell>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-gray-700">{label}</span>
      <input type="password" minLength={6} value={value} onChange={(event) => onChange(event.target.value)} required className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-medium outline-none focus:border-emerald-500" />
    </label>
  );
}

function ResetShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Image src="/logo.png" alt="Logo sekolah" width={72} height={72} className="mx-auto h-18 w-18 object-contain" />
        {children}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

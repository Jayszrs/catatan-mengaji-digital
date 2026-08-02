"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { AuthInput } from "@/components/AuthInput";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch("/api/auth/password-audit", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        {mode === "success" ? <CheckCircle2 size={32} /> : mode === "update" ? <KeyRound size={32} /> : <Mail size={32} />}
      </div>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#2b8053]">
        Pemulihan Akun
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#12271d] sm:text-4xl">
        {mode === "update" ? "Buat Password Baru" : mode === "success" ? "Permintaan Berhasil" : "Reset Password"}
      </h1>
      <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
        {mode === "update" ? "Masukkan password baru untuk akun Anda." : mode === "success" ? "Lanjutkan sesuai petunjuk pemulihan akun di bawah." : "Gunakan email yang terdaftar pada akun."}
      </p>

      {message && (
        <div className={`mt-6 flex items-start gap-2 rounded-xl border p-4 text-sm font-bold ${mode === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {mode === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message}</span>
        </div>
      )}

      {mode === "request" && (
        <form onSubmit={requestReset} className="mt-7 space-y-4">
          <AuthInput label="Email akun" icon={Mail} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="nama@email.com" />
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e622f] px-5 text-sm font-black uppercase tracking-[0.04em] text-white shadow-[0_12px_28px_rgba(14,98,47,0.18)] transition hover:bg-[#0a5127] disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
            Kirim Email Reset
          </button>
        </form>
      )}

      {mode === "update" && (
        <form onSubmit={updatePassword} className="mt-7 space-y-4">
          <PasswordField label="Password Baru" value={password} onChange={setPassword} />
          <PasswordField label="Ulangi Password Baru" value={confirmation} onChange={setConfirmation} />
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e622f] px-5 text-sm font-black uppercase tracking-[0.04em] text-white shadow-[0_12px_28px_rgba(14,98,47,0.18)] transition hover:bg-[#0a5127] disabled:opacity-50">
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
    <AuthInput
      label={label}
      icon={LockKeyhole}
      type="password"
      minLength={6}
      autoComplete="new-password"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
      placeholder="Minimal 6 karakter"
    />
  );
}

function ResetShell({ children }: { children: React.ReactNode }) {
  return <AuthSplitLayout mode="login">{children}</AuthSplitLayout>;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

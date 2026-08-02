"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MailCheck,
  RefreshCw,
} from "lucide-react";
import { createUserRole, isSupabaseConfigured, supabase } from "@/lib/supabase";

type VerifyStatus = "sent" | "checking" | "success" | "error";

function VerificationContent() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [status, setStatus] = useState<VerifyStatus>(
    params.get("sent") === "1" ? "sent" : "checking",
  );
  const [message, setMessage] = useState(
    params.get("sent") === "1"
      ? "Email verifikasi sudah dikirim. Silakan buka inbox atau folder spam."
      : "Sedang memeriksa status verifikasi akun...",
  );
  const [resending, setResending] = useState(false);

  const finishVerification = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus("error");
      setMessage("Database Supabase belum terhubung pada aplikasi ini.");
      return;
    }

    setStatus("checking");
    setMessage("Sedang memverifikasi tautan dan menyiapkan akun...");

    try {
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus(params.get("sent") === "1" ? "sent" : "error");
        setMessage(
          params.get("sent") === "1"
            ? "Email sudah dikirim. Setelah menekan tombol verifikasi di email, Anda akan kembali ke halaman ini."
            : "Tautan belum berhasil diverifikasi atau sudah kedaluwarsa.",
        );
        return;
      }

      const role = user.user_metadata?.role;
      const approvalStatus = user.user_metadata?.approval_status;
      if (
        (role === "guru" && approvalStatus === "approved") ||
        role === "orang_tua"
      ) {
        await createUserRole(
          user.id,
          user.email || params.get("email") || "",
          role,
        );
      }

      if (role === "orang_tua" && user.user_metadata?.nis_anak) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch("/api/parent/claim-child", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({
            nis: String(user.user_metadata.nis_anak),
          }),
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || "NIS anak tidak dapat dihubungkan.");
        }
      }

      setEmail(user.email || params.get("email") || "");
      setStatus("success");
      setMessage(
        role === "guru" && approvalStatus === "pending"
          ? "Identitas berhasil diverifikasi. Akun Guru menunggu persetujuan Administrator."
          : "Email berhasil diverifikasi. Akun Anda sekarang sudah aktif.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Verifikasi gagal. Silakan kirim ulang email verifikasi.",
      );
    }
  }, [params]);

  useEffect(() => {
    queueMicrotask(() => void finishVerification());
  }, [finishVerification]);

  const resend = async () => {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Masukkan email akun yang akan diverifikasi.");
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/verify` },
      });
      if (error) throw error;
      setStatus("sent");
      setMessage("Email verifikasi baru berhasil dikirim. Periksa inbox dan folder spam.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Gagal mengirim ulang email.");
    } finally {
      setResending(false);
    }
  };

  const icon =
    status === "checking" ? (
      <Loader2 className="animate-spin text-blue-600" size={44} />
    ) : status === "success" ? (
      <CheckCircle2 className="text-emerald-600" size={48} />
    ) : status === "error" ? (
      <AlertCircle className="text-red-600" size={48} />
    ) : (
      <MailCheck className="text-amber-600" size={48} />
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 p-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl md:p-10">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
            {icon}
          </div>
        </div>
        <h1 className="text-center text-3xl font-black text-gray-900">
          Status Verifikasi Akun
        </h1>
        <p className="mt-3 text-center font-medium leading-relaxed text-gray-600">
          {message}
        </p>

        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs font-bold">
          <div className="rounded-xl bg-emerald-50 px-2 py-3 text-emerald-700">1. Daftar</div>
          <div className={`rounded-xl px-2 py-3 ${status === "sent" || status === "checking" ? "bg-amber-100 text-amber-800" : "bg-gray-50 text-gray-400"}`}>
            2. Verifikasi
          </div>
          <div className={`rounded-xl px-2 py-3 ${status === "success" ? "bg-emerald-600 text-white" : "bg-gray-50 text-gray-400"}`}>
            3. Aktif
          </div>
        </div>

        {status !== "success" && (
          <div className="mt-7 space-y-3">
            <label className="block text-sm font-bold text-gray-700">Email akun</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="nama@email.com"
            />
            <button
              type="button"
              onClick={resend}
              disabled={resending || !isSupabaseConfigured}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {resending ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              Kirim Ulang Email Verifikasi
            </button>
          </div>
        )}

        <Link
          href="/auth/login"
          className="mt-4 block w-full rounded-xl border border-gray-200 px-4 py-3 text-center font-bold text-gray-700 hover:bg-gray-50"
        >
          {status === "success" ? "Lanjut ke Login" : "Kembali ke Login"}
        </Link>
      </section>
    </main>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </main>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}

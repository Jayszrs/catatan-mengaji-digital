"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthInput } from "@/components/AuthInput";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import type { UserRole } from "@/types";
import {
  AlertCircle,
  IdCard,
  Loader2,
  LockKeyhole,
  Mail,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("guru");
  const [nisAnak, setNisAnak] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Password tidak cocok");
      }

      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter");
      }

      if (role === "orang_tua" && !nisAnak.trim()) {
        throw new Error("NIS anak wajib diisi untuk akun orang tua");
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          name,
          email,
          password,
          role,
          nis: role === "orang_tua" ? nisAnak : "",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Pendaftaran gagal.");
      }

      setSuccess(result.message || "Pendaftaran berhasil.");
      setUsername("");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setNisAnak("");
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Gagal mendaftar",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout mode="signup">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2b8053]">
          Pendaftaran Akun
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#12271d] sm:text-4xl">
          Buat akun baru
        </h1>
        <p className="mt-1.5 text-sm font-medium leading-6 text-gray-500">
          Pilih akses yang sesuai, lalu lengkapi data akun Anda.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800">
          {success}
          <Link
            href="/auth/login"
            className="mt-2 block text-emerald-700 underline"
          >
            Lanjut ke halaman login
          </Link>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-3.5">
        <AuthInput
          label="Username"
          icon={UserRound}
          type="text"
          autoComplete="username"
          pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}"
          title="Gunakan 3–30 karakter: huruf, angka, titik, garis bawah, atau strip."
          placeholder="Contoh: ahmad.fulan"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <AuthInput
          label="Nama Lengkap"
          icon={UserRound}
          type="text"
          autoComplete="name"
          placeholder="Masukkan nama lengkap"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <AuthInput
          label="Email Kontak (Opsional)"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <fieldset>
          <legend className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#263c32]">
            Tipe Akun
          </legend>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1.5">
            <label
              className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-black transition ${
                role === "guru"
                  ? "bg-white text-[#17643f] shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <input
                type="radio"
                value="guru"
                checked={role === "guru"}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="sr-only"
              />
              <UserRound size={16} />
              Guru
            </label>
            <label
              className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-black transition ${
                role === "orang_tua"
                  ? "bg-white text-[#17643f] shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <input
                type="radio"
                value="orang_tua"
                checked={role === "orang_tua"}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="sr-only"
              />
              <Users size={16} />
              Orang Tua
            </label>
          </div>
        </fieldset>

        {role === "orang_tua" && (
          <>
            <AuthInput
              label="NIS Anak"
              icon={IdCard}
              type="text"
              inputMode="numeric"
              placeholder="Masukkan NIS anak yang terdaftar"
              value={nisAnak}
              onChange={(event) => setNisAnak(event.target.value)}
              required
            />
            <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-blue-700">
              Nama dan data anak baru ditampilkan setelah NIS berhasil
              diverifikasi dan akun selesai dibuat.
            </p>
          </>
        )}

        {role === "guru" && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700">
            Akun Guru akan berstatus menunggu sampai disetujui Administrator.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <AuthInput
            label="Password"
            icon={LockKeyhole}
            type="password"
            autoComplete="new-password"
            minLength={6}
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <AuthInput
            label="Konfirmasi Password"
            icon={LockKeyhole}
            type="password"
            autoComplete="new-password"
            minLength={6}
            placeholder="Ulangi password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0e622f] px-5 text-sm font-black uppercase tracking-[0.04em] text-white shadow-[0_12px_28px_rgba(14,98,47,0.18)] transition hover:bg-[#0a5127] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Memproses...
            </>
          ) : (
            <>
              <UserPlus size={18} /> Daftar Akun
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-medium text-gray-500">
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="font-black text-[#246b48] hover:underline">
          Masuk di sini
        </Link>
      </p>
    </AuthSplitLayout>
  );
}

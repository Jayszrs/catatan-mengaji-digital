"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { supabase } from "@/lib/supabase";
import {
  Users,
  UserPlus,
  Key,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

type AdminRole = "admin" | "guru" | "orang_tua";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role:
    | AdminRole
    | "Belum Ada Role"
    | "Menunggu Persetujuan"
    | "Ditolak";
  approval_status: "pending" | "approved" | "rejected";
  requested_role: AdminRole | null;
  linked_student: {
    id: string;
    name: string;
    nis: string | null;
    class_name: string | null;
  } | null;
  created_at: string;
  is_current_admin: boolean;
}

interface SecurityEvent {
  id: number;
  event_type: string;
  status: "success" | "failed" | "blocked";
  actor_name: string;
  target_name: string;
  reason: string;
  created_at: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function getAdminHeaders(includeJson = false) {
  const headers: Record<string, string> = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user.app_metadata?.role === "admin") {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createPasswordConfirmation, setCreatePasswordConfirmation] =
    useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("guru");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [passwordUpdatingUserId, setPasswordUpdatingUserId] = useState("");
  const [repairingUserId, setRepairingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [reviewingUserId, setReviewingUserId] = useState("");
  const [selectedParent, setSelectedParent] = useState<AdminUser | null>(null);
  const [parentNis, setParentNis] = useState("");
  const [managingParentLink, setManagingParentLink] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        headers: await getAdminHeaders(),
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil data pengguna");
      }

      setUsers(data.users || []);
      setSecurityEvents(data.security_events || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengambil data pengguna"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const verifyAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.app_metadata?.role === "admin") {
        await fetchUsers();
        return;
      }
      const response = await fetch("/api/admin/session");
      if (!response.ok) {
        router.push("/auth/login");
        return;
      }
      await fetchUsers();
    };
    void verifyAdmin();
  }, [fetchUsers, router]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAccount(true);
    setError("");
    setSuccess("");

    if (password !== createPasswordConfirmation) {
      setError("Konfirmasi password akun baru tidak sama.");
      setCreatingAccount(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify({
          action: "create",
          username,
          email,
          password,
          name,
          role
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message || "Akun berhasil dibuat!");
      setShowAddForm(false);
      
      // Reset form
      setUsername("");
      setEmail("");
      setPassword("");
      setCreatePasswordConfirmation("");
      setName("");
      setRole("guru");
      
      await fetchUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal membuat akun"));
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedUser) {
      setError("Pilih akun yang akan diubah passwordnya.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak sama dengan password baru.");
      return;
    }

    const targetUser = selectedUser;
    setPasswordUpdatingUserId(targetUser.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify({
          action: "update_password",
          userId: targetUser.id,
          password: newPassword
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(
        data.message ||
          `Password ${
            targetUser.username
              ? `@${targetUser.username}`
              : targetUser.email
          } berhasil diubah dan diverifikasi.`,
      );
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedUser(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal mengubah password"));
    } finally {
      setPasswordUpdatingUserId("");
    }
  };

  const handleAssignRole = async (
    user: AdminUser,
    selectedRole: AdminRole,
  ) => {
    if (user.role === selectedRole) return;
    const roleLabel =
      selectedRole === "orang_tua"
        ? "Orang Tua"
        : selectedRole === "admin"
          ? "Admin"
          : "Guru";
    const confirmed = window.confirm(
      `Ubah role ${user.name} menjadi ${roleLabel}?`,
    );
    if (!confirmed) return;

    setRepairingUserId(user.id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify({
          action: "assign_role",
          userId: user.id,
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memberikan role");
      setSuccess(data.message || `Role berhasil diubah menjadi ${roleLabel}.`);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memberikan role");
    } finally {
      setRepairingUserId("");
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const accountIdentifier = user.username
      ? `@${user.username}`
      : user.email;
    const confirmed = window.confirm(
      `Hapus akun ${user.name} (${accountIdentifier})?\n\nAkun langsung tidak dapat login lagi. Data siswa, kelas, laporan, dan riwayat penilaian yang terkait tetap disimpan.`,
    );
    if (!confirmed) return;

    setDeletingUserId(user.id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify({ action: "delete", userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus akun");
      setSuccess(
        data.message || `Akun ${user.name} berhasil dihapus dari akses login.`,
      );
      await fetchUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Gagal menghapus akun"));
    } finally {
      setDeletingUserId("");
    }
  };

  const handleTeacherReview = async (
    user: AdminUser,
    decision: "approve" | "reject",
  ) => {
    const confirmed = window.confirm(
      decision === "approve"
        ? `Setujui ${user.name} sebagai Guru?`
        : `Tolak pendaftaran Guru ${user.name}?`,
    );
    if (!confirmed) return;

    setReviewingUserId(user.id);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify({
          action: "review_teacher",
          userId: user.id,
          decision,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Persetujuan Guru gagal diproses.");
      }
      setSuccess(result.message);
      await fetchUsers();
    } catch (caughtError: unknown) {
      setError(
        getErrorMessage(caughtError, "Persetujuan Guru gagal diproses."),
      );
    } finally {
      setReviewingUserId("");
    }
  };

  const handleParentLink = async (
    operation: "connect" | "disconnect",
  ) => {
    if (!selectedParent) return;
    if (
      operation === "disconnect" &&
      !window.confirm(
        `Putuskan hubungan ${selectedParent.name} dengan siswa yang sekarang?`,
      )
    ) {
      return;
    }

    setManagingParentLink(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify({
          action: "manage_parent_link",
          operation,
          userId: selectedParent.id,
          nis: parentNis,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Hubungan Orang Tua gagal diperbarui.",
        );
      }
      setSuccess(result.message);
      setSelectedParent(null);
      setParentNis("");
      await fetchUsers();
    } catch (caughtError: unknown) {
      setError(
        getErrorMessage(caughtError, "Hubungan Orang Tua gagal diperbarui."),
      );
    } finally {
      setManagingParentLink(false);
    }
  };

  const pendingTeachers = users.filter(
    (user) =>
      user.approval_status === "pending" &&
      user.requested_role === "guru",
  );

  return (
    <DashboardLayout userRole="admin">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Manajemen Akun
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Kelola akun, password, serta role Admin, Guru, dan Orang Tua.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowPasswordForm(false);
              setError("");
              setSuccess("");
            }}
            className="px-6 py-3 font-bold rounded-xl bg-[#1b4332] hover:bg-[#133c27] text-white shadow-lg flex items-center gap-2"
          >
            {showAddForm ? <><X size={18} /> Batal</> : <><UserPlus size={18} /> Tambah Akun</>}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3">
          <AlertCircle size={24} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <h4 className="font-bold">Terjadi Kesalahan</h4>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-bold flex items-center gap-3">
          <AlertCircle size={20} className="text-green-500" />
          {success}
        </div>
      )}

      <section className="mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Persetujuan Akun Guru
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-600">
              Guru yang mendaftar sendiri belum memperoleh akses sebelum
              disetujui.
            </p>
          </div>
          <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-black text-amber-900">
            {pendingTeachers.length} menunggu
          </span>
        </div>
        {pendingTeachers.length === 0 ? (
          <p className="px-6 py-6 text-sm font-semibold text-gray-500">
            Tidak ada pendaftaran Guru yang menunggu.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingTeachers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-black text-gray-900">{user.name}</p>
                  <p className="text-sm font-medium text-gray-500">
                    {user.username ? `@${user.username}` : user.email}
                    {user.email !== "-" ? ` · ${user.email}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={reviewingUserId === user.id}
                    onClick={() =>
                      void handleTeacherReview(user, "reject")
                    }
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    disabled={reviewingUserId === user.id}
                    onClick={() =>
                      void handleTeacherReview(user, "approve")
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1b4332] px-4 py-2 text-sm font-bold text-white hover:bg-[#133c27] disabled:opacity-50"
                  >
                    {reviewingUserId === user.id && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
                    Setujui Guru
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedParent && (
        <section className="mb-8 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Kelola Anak: {selectedParent.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {selectedParent.linked_student
                  ? `Saat ini terhubung dengan ${selectedParent.linked_student.name} · NIS ${selectedParent.linked_student.nis || "-"}`
                  : "Akun belum terhubung dengan siswa."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedParent(null);
                setParentNis("");
              }}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="max-w-md flex-1">
              <Input
                label="NIS Siswa"
                placeholder="Masukkan NIS untuk menghubungkan"
                value={parentNis}
                onChange={(event) => setParentNis(event.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={managingParentLink || !parentNis.trim()}
              onClick={() => void handleParentLink("connect")}
              className="h-[50px] bg-blue-600 px-5 font-bold text-white"
            >
              Hubungkan NIS
            </Button>
            {selectedParent.linked_student && (
              <Button
                type="button"
                disabled={managingParentLink}
                onClick={() => void handleParentLink("disconnect")}
                className="h-[50px] bg-red-50 px-5 font-bold text-red-600 hover:bg-red-100"
              >
                Putuskan Hubungan
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Form Tambah Akun */}
      {showAddForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 border-t-4 border-[#1b4332]">
          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <UserPlus className="text-[#1b4332]" /> Buat Akun Baru
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Username"
                placeholder="Contoh: ahmad.fulan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,29}"
                title="Gunakan 3–30 karakter: huruf, angka, titik, garis bawah, atau strip."
                required
              />
              <Input
                label="Nama Lengkap"
                placeholder="Ahmad Fulan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email Kontak (Opsional)"
                type="email"
                placeholder="Boleh dikosongkan"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Role / Peran
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2dc653] focus:border-transparent transition-all font-medium bg-white"
                >
                  <option value="guru">Guru / Wali Kelas</option>
                  <option value="orang_tua">Orang Tua / Wali Murid</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <Input
                label="Password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label="Konfirmasi Password"
                type="password"
                placeholder="Ketik ulang password"
                value={createPasswordConfirmation}
                onChange={(e) =>
                  setCreatePasswordConfirmation(e.target.value)
                }
                required
                minLength={6}
              />
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Akun dibuat langsung aktif dan login memakai username. Email
              hanya data kontak, tidak wajib, dan tidak ada proses verifikasi
              email.
            </div>
            <Button type="submit" disabled={creatingAccount} className="w-full py-4 bg-[#1b4332] text-white rounded-xl font-bold text-lg">
              {creatingAccount ? <Loader2 className="animate-spin mx-auto" /> : "Simpan Akun"}
            </Button>
          </form>
        </div>
      )}

      {/* Form Ubah Password */}
      {showPasswordForm && selectedUser && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 border-t-4 border-blue-600">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <Key className="text-blue-600" /> Ubah Sandi: {selectedUser.name}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(false);
                setSelectedUser(null);
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Akun tujuan:{" "}
              <span className="font-bold">
                {selectedUser.username
                  ? `@${selectedUser.username}`
                  : selectedUser.email}
              </span>
              .
              Sistem akan memeriksa ulang perubahan di Supabase sebelum
              menampilkan status berhasil.
            </div>
            <div className="grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
              <Input
                label="Password Baru"
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                placeholder="Ketik ulang password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <p className="text-xs font-medium text-gray-500">
              Password baru berlaku saat login berikutnya. Sesi yang sedang
              terbuka pada perangkat pengguna dapat tetap aktif sampai keluar
              atau sesi berakhir.
            </p>
            <Button
              type="submit"
              disabled={passwordUpdatingUserId === selectedUser.id}
              className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
            >
              {passwordUpdatingUserId === selectedUser.id ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Memverifikasi...
                </span>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Daftar Pengguna */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <Users className="text-[#1b4332]" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Daftar Pengguna ({users.length})</h2>
        </div>
        
        {loading && users.length === 0 ? (
          <div className="p-16 flex justify-center">
            <Loader2 className="animate-spin text-[#1b4332]" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Nama</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Username</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Email</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Role</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Anak Terhubung</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-gray-900 whitespace-nowrap">{u.name}</td>
                    <td className="px-6 py-5 text-gray-700 font-bold whitespace-nowrap">
                      {u.username ? `@${u.username}` : "-"}
                    </td>
                    <td className="px-6 py-5 text-gray-600 font-medium whitespace-nowrap">{u.email}</td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          value={
                            u.role === "Belum Ada Role" ||
                            u.role === "Menunggu Persetujuan" ||
                            u.role === "Ditolak"
                              ? ""
                              : u.role
                          }
                          disabled={
                            u.is_current_admin ||
                            repairingUserId === u.id ||
                            u.approval_status === "pending"
                          }
                          onChange={(event) =>
                            void handleAssignRole(
                              u,
                              event.target.value as AdminRole,
                            )
                          }
                          title={
                            u.is_current_admin
                              ? "Role akun Admin yang sedang dipakai tidak dapat diubah"
                              : "Ubah role akun"
                          }
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold uppercase text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
                        >
                          <option value="" disabled>
                            Pilih role
                          </option>
                          <option value="admin">Admin</option>
                          <option value="guru">Guru</option>
                          <option value="orang_tua">Orang Tua</option>
                        </select>
                        {repairingUserId === u.id && (
                          <Loader2
                            className="animate-spin text-[#1b4332]"
                            size={16}
                          />
                        )}
                        {u.is_current_admin && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-2 text-xs font-bold text-purple-700">
                            <ShieldCheck size={14} /> Dipakai
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {u.linked_student ? (
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {u.linked_student.name}
                          </p>
                          <p className="text-xs font-medium text-gray-500">
                            NIS {u.linked_student.nis || "-"} · Kelas{" "}
                            {u.linked_student.class_name || "-"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-400">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {(u.role === "orang_tua" ||
                          u.requested_role === "orang_tua") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedParent(u);
                              setParentNis("");
                              setShowAddForm(false);
                              setShowPasswordForm(false);
                              window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }}
                            className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
                          >
                            Kelola Anak
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowPasswordForm(true);
                            setShowAddForm(false);
                            setNewPassword("");
                            setConfirmPassword("");
                            setError("");
                            setSuccess("");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          disabled={Boolean(passwordUpdatingUserId)}
                          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200"
                        >
                          <Key size={16} /> Ubah Sandi
                        </button>
                        <button
                          type="button"
                          disabled={
                            deletingUserId === u.id || u.is_current_admin
                          }
                          onClick={() => handleDeleteUser(u)}
                          title={
                            u.is_current_admin
                              ? "Akun admin yang sedang dipakai tidak dapat dihapus"
                              : "Hapus akun"
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingUserId === u.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-gray-500 font-medium">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {securityEvents.length > 0 && (
        <section className="mt-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">
            <h2 className="text-xl font-black text-gray-900">
              Aktivitas Keamanan Akun
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Riwayat persetujuan Guru, klaim NIS, dan perubahan hubungan
              Orang Tua.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-white text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Aktivitas</th>
                  <th className="px-6 py-4">Pelaku</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {securityEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-500">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(event.created_at))}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {event.event_type.replaceAll("_", " ")}
                      {event.reason ? (
                        <span className="ml-2 text-xs font-medium text-gray-400">
                          ({event.reason.replaceAll("_", " ")})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {event.actor_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {event.target_name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${
                          event.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : event.status === "blocked"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}

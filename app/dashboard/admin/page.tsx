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
  email: string;
  name: string;
  role: AdminRole | "Belum Ada Role";
  created_at: string;
  is_current_admin: boolean;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("guru");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [passwordUpdatingUserId, setPasswordUpdatingUserId] = useState("");
  const [repairingUserId, setRepairingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");

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

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify({
          action: "create",
          email,
          password,
          name,
          role
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Akun berhasil dibuat!");
      setShowAddForm(false);
      
      // Reset form
      setEmail("");
      setPassword("");
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
          `Password ${targetUser.email} berhasil diubah dan diverifikasi.`,
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
    userId: string,
    selectedRole: "admin" | "guru" | "orang_tua",
  ) => {
    setRepairingUserId(userId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: await getAdminHeaders(true),
        body: JSON.stringify({
          action: "assign_role",
          userId,
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memberikan role");
      setSuccess(
        `Role ${
          selectedRole === "orang_tua"
            ? "Orang Tua"
            : selectedRole === "admin"
              ? "Admin"
              : "Guru"
        } berhasil diberikan.`,
      );
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memberikan role");
    } finally {
      setRepairingUserId("");
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Hapus akun ${user.name} (${user.email})?\n\nAkun langsung tidak dapat login lagi. Data siswa, kelas, laporan, dan riwayat penilaian yang terkait tetap disimpan.`,
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

  return (
    <DashboardLayout userRole="admin">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Manajemen Akun
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Kelola akses Admin, Guru, dan Orang Tua.
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

      {/* Form Tambah Akun */}
      {showAddForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 border-t-4 border-[#1b4332]">
          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <UserPlus className="text-[#1b4332]" /> Buat Akun Baru
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nama Lengkap"
                placeholder="Ahmad Fulan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Role / Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1b4332] transition-all font-medium bg-white"
                >
                  <option value="guru">Guru / Wali Kelas</option>
                  <option value="orang_tua">Orang Tua / Wali Murid</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
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
              Akun tujuan: <span className="font-bold">{selectedUser.email}</span>.
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
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Email</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider whitespace-nowrap">Role</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase text-xs tracking-wider text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 font-bold text-gray-900 whitespace-nowrap">{u.name}</td>
                    <td className="px-6 py-5 text-gray-600 font-medium whitespace-nowrap">{u.email}</td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${
                        u.role === 'guru'
                          ? 'bg-green-50 text-green-700'
                          : u.role === 'orang_tua'
                            ? 'bg-blue-50 text-blue-700'
                            : u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      {u.role === "Belum Ada Role" && (
                        <div className="mb-2 flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={repairingUserId === u.id}
                            onClick={() => handleAssignRole(u.id, "orang_tua")}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {repairingUserId === u.id
                              ? "Memproses..."
                              : "Jadikan Orang Tua"}
                          </button>
                          <button
                            type="button"
                            disabled={repairingUserId === u.id}
                            onClick={() => handleAssignRole(u.id, "guru")}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            Jadikan Guru
                          </button>
                          <button
                            type="button"
                            disabled={repairingUserId === u.id}
                            onClick={() => handleAssignRole(u.id, "admin")}
                            className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          >
                            Jadikan Admin
                          </button>
                        </div>
                      )}
                      <div className="inline-flex items-center gap-2">
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
                        {u.role === "admin" && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">
                            <ShieldCheck size={15} /> Admin
                          </span>
                        )}
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
                    <td colSpan={4} className="px-8 py-12 text-center text-gray-500 font-medium">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

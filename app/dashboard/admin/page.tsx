"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Users, UserPlus, Key, AlertCircle, Loader2, X } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("guru");

  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    // Check if admin is logged in (bypass from localStorage)
    const isAdmin = localStorage.getItem("admin_logged_in");
    if (!isAdmin) {
      router.push("/auth/login");
      return;
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil data pengguna");
      }
      
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_password",
          userId: selectedUser.id,
          password: newPassword
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Password berhasil diubah!");
      setShowPasswordForm(false);
      setNewPassword("");
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            Kelola akses guru dan orang tua.
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
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1b4332] transition-all font-medium bg-white"
                >
                  <option value="guru">Guru / Wali Kelas</option>
                  <option value="orang_tua">Orang Tua / Wali Murid</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full py-4 bg-[#1b4332] text-white rounded-xl font-bold text-lg">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Simpan Akun"}
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
            <button onClick={() => setShowPasswordForm(false)} className="text-gray-400 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="max-w-md">
              <Input
                label="Password Baru"
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={loading} className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Update Password"}
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
                        u.role === 'guru' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <button 
                        onClick={() => {
                          setSelectedUser(u);
                          setShowPasswordForm(true);
                          setShowAddForm(false);
                          setNewPassword("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm rounded-lg flex items-center gap-2 inline-flex"
                      >
                        <Key size={16} /> Ubah Sandi
                      </button>
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

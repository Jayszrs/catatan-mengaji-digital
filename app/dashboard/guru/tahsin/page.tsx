"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export default function GuruTahsinDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [laporan, setLaporan] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    nama_surah: "",
    ayat: "",
    makhraj: "",
    murojaah: "",
    keterangan: "",
  });

  useEffect(() => {
    checkUser();
    fetchLaporan();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "guru") {
        router.push("/auth/login");
        return;
      }

      setUser(user);
    } catch (err) {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchLaporan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("laporan_tahsin_tahfidz")
        .select("*")
        .eq("teacher_id", user.id)
        .order("tanggal", { ascending: false })
        .limit(10);

      setLaporan(data || []);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("laporan_tahsin_tahfidz").insert([
        {
          teacher_id: user.id,
          tanggal: formData.tanggal,
          nama_surah: formData.nama_surah,
          ayat: formData.ayat,
          makhraj: formData.makhraj,
          murojaah: formData.murojaah,
          keterangan: formData.keterangan,
          guru_paraf: true,
        },
      ]);

      if (error) throw error;

      setFormData({
        tanggal: new Date().toISOString().split("T")[0],
        nama_surah: "",
        ayat: "",
        makhraj: "",
        murojaah: "",
        keterangan: "",
      });
      setShowForm(false);

      await fetchLaporan();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p>Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-12">
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <h1 className="text-5xl font-black text-gray-900 mb-2">
              📖 Tahsin & Tahfidz
            </h1>
            <p className="text-lg text-gray-700 font-medium">{user?.email}</p>
            <p className="text-gray-500 mt-2">
              Dashboard Guru - Laporan Tahsin dan Tahfidz
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="px-8 py-3 font-bold text-lg bg-blue-600 hover:bg-blue-700"
          >
            {showForm ? "❌ Batal" : "➕ Tambah Laporan"}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 border-l-4 border-blue-600">
            <h2 className="text-3xl font-black text-gray-900 mb-8">
              📝 Input Laporan Tahsin & Tahfidz
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="📅 Tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal: e.target.value })
                  }
                  required
                />

                <Input
                  label="📕 Nama Surah"
                  placeholder="Contoh: Al-Baqarah"
                  value={formData.nama_surah}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_surah: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="📍 Ayat"
                  placeholder="Contoh: 1-5"
                  value={formData.ayat}
                  onChange={(e) =>
                    setFormData({ ...formData, ayat: e.target.value })
                  }
                  required
                />

                <Input
                  label="🗣️ Makhraj"
                  placeholder="Nilai/Catatan Makhraj"
                  value={formData.makhraj}
                  onChange={(e) =>
                    setFormData({ ...formData, makhraj: e.target.value })
                  }
                />

                <Input
                  label="🔄 Muroja'ah"
                  placeholder="Surah Muroja'ah"
                  value={formData.murojaah}
                  onChange={(e) =>
                    setFormData({ ...formData, murojaah: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  💬 Keterangan
                </label>
                <textarea
                  placeholder="Catatan tambahan (contoh: Lancar, Ulang, dll)..."
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all shadow-sm font-medium"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full font-bold text-lg py-3 bg-blue-600 hover:bg-blue-700">
                ✨ Simpan Laporan
              </Button>
            </form>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-8 border-b-2 border-blue-600 bg-gradient-to-r from-blue-600/5 to-transparent">
          <h2 className="text-3xl font-black text-gray-900">
            📊 Data Tahsin & Tahfidz Terbaru
          </h2>
        </div>

        {laporan.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg text-gray-600 font-medium">
              Belum ada laporan. Silakan tambah laporan baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600/10 to-transparent border-b-2 border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900 whitespace-nowrap">
                    📅 Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900 whitespace-nowrap">
                    📕 Surah
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900 whitespace-nowrap">
                    📍 Ayat
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900 whitespace-nowrap">
                    🗣️ Makhraj
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900 whitespace-nowrap">
                    🔄 Muroja'ah
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900 whitespace-nowrap">
                    💬 Keterangan
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-black text-gray-900 whitespace-nowrap">
                    ✅ Paraf
                  </th>
                </tr>
              </thead>
              <tbody>
                {laporan.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium whitespace-nowrap">
                      {item.nama_surah}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {item.ayat}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-bold whitespace-nowrap">
                      {item.makhraj || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {item.murojaah || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {item.keterangan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.guru_paraf && (
                         <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">
                           Guru ✅
                         </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

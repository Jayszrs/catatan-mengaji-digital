"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Sun, Save, Users, Calendar, History, Edit2, Trash2, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

export default function InputTadarusPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'confirm', id?: string, isLoading?: boolean }>({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    student_id: "",
    tanggal: new Date().toISOString().split('T')[0],
    surah: "",
    halaman_ayat: "",
    keterangan: "Lanjut",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (formData.student_id) {
      fetchHistory(formData.student_id);
    }
  }, [formData.student_id]);

  const fetchHistory = async (studentId: string) => {
    try {
      const { data } = await supabase
        .from("laporan_tadarus_pagi")
        .select("*")
        .eq("student_id", studentId)
        .order("tanggal", { ascending: false })
        .limit(10);
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data } = await supabase
        .from("students")
        .select("*")
        .order("nama_lengkap", { ascending: true });

      setStudents(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, student_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.student_id) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Efek loading buatan
      if (editingId) {
        const { error } = await supabase.from("laporan_tadarus_pagi").update({
          tanggal: formData.tanggal,
          nama_surah: formData.surah,
          hal_ayat: formData.halaman_ayat,
          keterangan: formData.keterangan,
        }).eq("id", editingId);
        if (error) throw error;
        setNotification({ show: true, message: "Data tadarus berhasil diperbarui!", type: 'success' });
      } else {
        const { error } = await supabase.from("laporan_tadarus_pagi").insert([
          {
            teacher_id: user.id,
            student_id: formData.student_id,
            tanggal: formData.tanggal,
            nama_surah: formData.surah,
            hal_ayat: formData.halaman_ayat,
            keterangan: formData.keterangan,
          },
        ]);
        if (error) throw error;
        setNotification({ show: true, message: "Data tadarus berhasil disimpan!", type: 'success' });
      }

      setFormData(prev => ({
        ...prev,
        surah: "",
        halaman_ayat: "",
        keterangan: "Lanjut"
      }));
      setEditingId(null);
      fetchHistory(formData.student_id);
    } catch (err: any) {
      setNotification({ show: true, message: "Error: " + err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setNotification({ show: true, message: "Apakah Anda yakin ingin menghapus data ini?", type: 'confirm', id });
  };

  const handleDelete = async (id: string) => {
    setNotification(prev => ({ ...prev, isLoading: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Efek loading buatan
      const { error } = await supabase.from("laporan_tadarus_pagi").delete().eq("id", id);
      if (error) throw error;
      setNotification({ show: true, message: "Data berhasil dihapus.", type: 'success' });
      fetchHistory(formData.student_id);
    } catch (err: any) {
      setNotification({ show: true, message: "Gagal menghapus: " + err.message, type: 'error' });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      student_id: item.student_id,
      tanggal: item.tanggal,
      surah: item.nama_surah,
      halaman_ayat: item.hal_ayat,
      keterangan: item.keterangan,
    });
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
          Input Tadarus Pagi
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Pilih siswa dan masukkan catatan muroja'ah/tadarus pagi mereka.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 border-t-4 border-[#2dc653] max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#2dc653]/10 text-[#1b4332] rounded-xl flex items-center justify-center">
            <Sun size={24} />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Form Laporan Tadarus</h2>
        </div>
        
        {loading ? (
           <div className="flex justify-center items-center h-32">
             <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-[#2dc653]"></div>
           </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Users size={16}/> Pilih Siswa
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2dc653] focus:border-transparent transition-all font-medium appearance-none bg-white"
                  required
                >
                  <option value="" disabled>-- Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nama_lengkap} (NIS: {s.nis || "-"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Calendar size={16}/> Tanggal
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2dc653] focus:border-transparent transition-all font-medium bg-white"
                  required
                />
              </div>

              <Input
                label="Nama Surah"
                placeholder="Contoh: Al-Baqarah"
                value={formData.surah}
                onChange={(e) => setFormData({ ...formData, surah: e.target.value })}
                required
              />

              <Input
                label="Halaman / Ayat"
                placeholder="Contoh: Hal 4 / Ayat 1-5"
                value={formData.halaman_ayat}
                onChange={(e) => setFormData({ ...formData, halaman_ayat: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Keterangan / Nilai</label>
                <select
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2dc653] focus:border-transparent transition-all font-medium appearance-none bg-white"
                >
                  <option value="Lanjut">Lanjut</option>
                  <option value="Ulang">Ulang</option>
                </select>
              </div>

            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1 font-bold py-4 rounded-xl flex items-center justify-center gap-2 bg-[#2dc653] hover:bg-[#25a244] text-[#0a2316] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? (
                  <><Loader2 size={20} className="animate-spin" /> Memproses...</>
                ) : (
                  <><Save size={20} /> {editingId ? "Update Laporan" : "Simpan Laporan Tadarus"}</>
                )}
              </Button>
              {editingId && (
                <Button 
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData(prev => ({ ...prev, surah: "", halaman_ayat: "", keterangan: "Lanjut" }));
                  }}
                  className="font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Batal
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Tabel Riwayat Tadarus */}
      {formData.student_id && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 border-t-4 border-gray-200 mt-8 max-w-5xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-900">
              Riwayat Tadarus: <span className="text-[#1b4332]">{students.find(s => s.id === formData.student_id)?.nama_lengkap || "Siswa"}</span>
            </h2>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-xs uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Tanggal</th>
                  <th className="px-6 py-4 whitespace-nowrap">Surah</th>
                  <th className="px-6 py-4 whitespace-nowrap">Hal/Ayat</th>
                  <th className="px-6 py-4 whitespace-nowrap">Keterangan</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.tanggal}</td>
                      <td className="px-6 py-4 font-bold text-[#1b4332] whitespace-nowrap">{item.nama_surah}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{item.hal_ayat}</td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.keterangan === 'Lanjut' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.keterangan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => confirmDelete(item.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">
                      Belum ada laporan tadarus pagi untuk siswa ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Notifikasi */}
      {notification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-zoom-in">
            <div className="flex flex-col items-center text-center">
              {notification.type === 'success' && (
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
              )}
              {notification.type === 'error' && (
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <X size={40} />
                </div>
              )}
              {notification.type === 'confirm' && (
                <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={40} />
                </div>
              )}
              
              <h3 className="text-2xl font-black text-gray-900 mb-2">
                {notification.type === 'success' ? 'Berhasil!' : notification.type === 'error' ? 'Oops, Gagal!' : 'Konfirmasi Hapus'}
              </h3>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                {notification.message}
              </p>

              {notification.type === 'confirm' ? (
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                    disabled={notification.isLoading}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => notification.id && handleDelete(notification.id)}
                    disabled={notification.isLoading}
                    className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {notification.isLoading ? <><Loader2 size={18} className="animate-spin" /> Menghapus...</> : "Ya, Hapus!"}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                  className="w-full py-4 bg-[#1b4332] hover:bg-[#133c27] text-white rounded-xl font-bold transition-colors shadow-lg"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

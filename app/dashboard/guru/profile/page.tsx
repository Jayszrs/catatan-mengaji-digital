"use client";

import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Loader2, Save, UserRound } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { uploadTeacherPhoto } from "@/lib/profile-photos";
import { supabase } from "@/lib/supabase";

const emptyProfile = {
  full_name: "",
  nip: "",
  phone: "",
  address: "",
  bio: "",
  photo_url: "",
};

export default function TeacherProfilePage() {
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState(emptyProfile);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login tidak ditemukan.");
      setUserId(user.id);
      const { data, error } = await supabase.from("teacher_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      const next = data
        ? {
            full_name: data.full_name || "",
            nip: data.nip || "",
            phone: data.phone || "",
            address: data.address || "",
            bio: data.bio || "",
            photo_url: data.photo_url || "",
          }
        : { ...emptyProfile, full_name: user.user_metadata?.name || "" };
      setForm(next);
      setPreview(next.photo_url);
    };
    load()
      .catch((error) => setMessage({ type: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const selectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      let photoUrl = form.photo_url;
      if (photo) photoUrl = await uploadTeacherPhoto(photo, userId);
      const { error } = await supabase.from("teacher_profiles").upsert({
        user_id: userId,
        ...form,
        photo_url: photoUrl || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      setForm((current) => ({ ...current, photo_url: photoUrl }));
      setPhoto(null);
      setMessage({ type: "success", text: "Biodata dan foto guru berhasil disimpan." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal menyimpan profil." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Profil Guru</h1>
        <p className="mt-2 font-medium text-gray-500">Lengkapi foto dan biodata yang digunakan pada identitas guru.</p>
      </div>
      {message && <div className={`mb-6 rounded-2xl border p-4 font-bold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={36} /></div>
      ) : (
        <form onSubmit={save} className="grid max-w-5xl gap-8 rounded-3xl border border-gray-100 bg-white p-7 shadow-sm lg:grid-cols-[280px_1fr]">
          <div>
            <div className="mx-auto flex h-52 w-52 items-center justify-center overflow-hidden rounded-3xl bg-emerald-50 text-emerald-700">
              {preview ? (
                // URL dapat berasal dari object URL lokal atau bucket Supabase runtime.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Foto guru" className="h-full w-full object-cover" />
              ) : <UserRound size={80} />}
            </div>
            <label className="mx-auto mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">
              <Camera size={18} /> Pilih Foto
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="hidden" />
            </label>
            <p className="mt-3 text-center text-xs font-medium text-gray-500">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField label="Nama Lengkap" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} required />
            <ProfileField label="NIP / Nomor Guru" value={form.nip} onChange={(value) => setForm({ ...form, nip: value })} />
            <ProfileField label="Nomor Telepon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <ProfileField label="Alamat" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-gray-700">Biodata Singkat</span>
              <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="min-h-32 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Pengalaman mengajar, bidang tahfidz, atau informasi lain." />
            </label>
            <button disabled={saving} className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={20} /> : message?.type === "success" ? <CheckCircle2 size={20} /> : <Save size={20} />}
              Simpan Profil Guru
            </button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}

function ProfileField({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-gray-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" />
    </label>
  );
}

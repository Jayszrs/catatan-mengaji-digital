"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getAppErrorMessage } from "@/lib/app-errors";
import { supabase } from "@/lib/supabase";

interface ParentProfileForm {
  full_name: string;
  relationship: string;
  phone: string;
  occupation: string;
  address: string;
}

const emptyProfile: ParentProfileForm = {
  full_name: "",
  relationship: "Orang Tua",
  phone: "",
  occupation: "",
  address: "",
};

function optionalMetadataText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default function ParentProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<ParentProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (roleError) throw roleError;
      if (roleData?.role !== "orang_tua") {
        router.push("/auth/login");
        return;
      }

      const stored =
        user.user_metadata?.parent_profile &&
        typeof user.user_metadata.parent_profile === "object"
          ? (user.user_metadata.parent_profile as Record<string, unknown>)
          : {};

      setEmail(user.email || "");
      setForm({
        full_name:
          optionalMetadataText(stored.full_name) ||
          optionalMetadataText(user.user_metadata?.name),
        relationship:
          optionalMetadataText(stored.relationship) || "Orang Tua",
        phone: optionalMetadataText(stored.phone),
        occupation: optionalMetadataText(stored.occupation),
        address: optionalMetadataText(stored.address),
      });
    };

    loadProfile()
      .catch((error) =>
        setMessage({
          type: "error",
          text: getAppErrorMessage(error, "Gagal memuat biodata Orang Tua."),
        }),
      )
      .finally(() => setLoading(false));
  }, [router]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const fullName = form.full_name.trim();
    if (fullName.length < 2) {
      setMessage({
        type: "error",
        text: "Nama lengkap Orang Tua minimal 2 karakter.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const parentProfile = {
        full_name: fullName.slice(0, 150),
        relationship: form.relationship.trim().slice(0, 30),
        phone: form.phone.trim().slice(0, 50),
        occupation: form.occupation.trim().slice(0, 100),
        address: form.address.trim().slice(0, 500),
      };
      const { error } = await supabase.auth.updateUser({
        data: {
          name: parentProfile.full_name,
          parent_profile: parentProfile,
        },
      });
      if (error) throw error;

      setForm(parentProfile);
      window.dispatchEvent(new Event("cmd-profile-updated"));
      setMessage({
        type: "success",
        text: "Biodata Orang Tua berhasil diperbarui.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getAppErrorMessage(error, "Biodata Orang Tua gagal disimpan."),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="orang_tua">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
          Profil akun
        </p>
        <h1 className="mt-2 text-3xl font-black text-gray-900 md:text-4xl">
          Biodata Orang Tua
        </h1>
        <p className="mt-2 font-medium text-gray-500">
          Data ini merupakan identitas pemilik akun dan terpisah dari biodata
          anak.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 font-bold ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" && <CheckCircle2 size={20} />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={36} />
        </div>
      ) : (
        <form
          onSubmit={saveProfile}
          className="grid max-w-5xl gap-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:grid-cols-[240px_1fr] lg:p-8"
        >
          <aside>
            <div className="flex h-44 w-full items-center justify-center rounded-3xl bg-[linear-gradient(145deg,#e8f6ed,#f8fbf9)] text-emerald-700">
              <UserRound size={76} strokeWidth={1.5} />
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={18} />
                <p className="text-xs font-semibold leading-5 text-emerald-800">
                  Orang Tua hanya dapat mengubah biodata akun sendiri. Nilai dan
                  data akademik tetap dikelola Guru.
                </p>
              </div>
            </div>
          </aside>

          <div className="grid content-start gap-5 sm:grid-cols-2">
            <ProfileField
              label="Nama Lengkap"
              value={form.full_name}
              required
              maxLength={150}
              onChange={(value) =>
                setForm((current) => ({ ...current, full_name: value }))
              }
            />
            <label>
              <span className="mb-2 block text-sm font-bold text-gray-700">
                Hubungan dengan Anak
              </span>
              <select
                value={form.relationship}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    relationship: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option>Ayah</option>
                <option>Ibu</option>
                <option>Wali</option>
                <option>Orang Tua</option>
              </select>
            </label>
            <ProfileField
              label="Nomor Telepon / WhatsApp"
              value={form.phone}
              type="tel"
              maxLength={50}
              placeholder="Contoh: 081234567890"
              onChange={(value) =>
                setForm((current) => ({ ...current, phone: value }))
              }
            />
            <ProfileField
              label="Pekerjaan"
              value={form.occupation}
              maxLength={100}
              onChange={(value) =>
                setForm((current) => ({ ...current, occupation: value }))
              }
            />
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-gray-700">
                Email Akun
              </span>
              <span className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-500">
                <Mail size={17} /> {email || "-"}
              </span>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-gray-700">
                Alamat Lengkap
              </span>
              <textarea
                value={form.address}
                maxLength={500}
                rows={4}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              Simpan Biodata Orang Tua
            </button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

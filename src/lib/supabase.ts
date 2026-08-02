import { createClient } from "@supabase/supabase-js";

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(configuredUrl && configuredAnonKey);

// Nilai fallback hanya menjaga halaman tetap dapat dibuka sehingga UI bisa
// menjelaskan bahwa konfigurasi belum tersedia. Nilai ini tidak dapat login.
const supabaseUrl = configuredUrl || "https://configuration-required.supabase.co";
const supabaseAnonKey =
  configuredAnonKey ||
  "configuration-required.configuration-required.configuration-required";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data?.role;
}

export async function createUserRole(
  userId: string,
  email: string,
  role: "guru" | "orang_tua",
) {
  const { data, error } = await supabase
    .from("user_roles")
    .upsert([{ user_id: userId, email, role }], { onConflict: "user_id" });

  if (error) throw error;
  return data;
}

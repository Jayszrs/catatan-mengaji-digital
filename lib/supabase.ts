import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    .insert([{ user_id: userId, email, role }]);

  if (error) throw error;
  return data;
}

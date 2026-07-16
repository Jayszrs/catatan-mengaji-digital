import { supabase } from "@/lib/supabase";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const getStudentRouteKey = (student: { id: string; nis?: string | null }) =>
  encodeURIComponent(student.nis?.trim() || student.id);

export async function fetchStudentByRouteKey(routeKey: string) {
  const decodedKey = decodeURIComponent(routeKey);

  const { data: studentByNis, error: nisError } = await supabase
    .from("students")
    .select("*")
    .eq("nis", decodedKey)
    .maybeSingle();

  if (studentByNis || nisError) {
    return { data: studentByNis, error: nisError };
  }

  if (!uuidPattern.test(decodedKey)) {
    return { data: null, error: null };
  }

  return supabase
    .from("students")
    .select("*")
    .eq("id", decodedKey)
    .maybeSingle();
}

"use client";

import { supabase } from "@/lib/supabase";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadTeacherPhoto(file: File, userId: string) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Gunakan gambar JPG, PNG, atau WebP.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Ukuran foto maksimal 2 MB.");
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/profile-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("profile-photos").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) throw error;

  return supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
}

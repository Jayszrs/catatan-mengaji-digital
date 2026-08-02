"use client";

import { supabase } from "@/lib/supabase";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadStudentPhoto({
  file,
  studentId,
  userId,
}: {
  file: File;
  studentId: string;
  userId: string;
}) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Gunakan gambar JPG, PNG, atau WebP.");
  }

  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error("Ukuran gambar maksimal 2 MB.");
  }

  const extension = extensionByType[file.type];
  const objectPath = `${studentId}/${userId}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("student-photos")
    .upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("student-photos").getPublicUrl(objectPath);

  const { error: updateError } = await supabase.rpc("set_student_photo_url", {
    p_student_id: studentId,
    p_foto_url: publicUrl,
  });

  if (updateError) {
    await supabase.storage.from("student-photos").remove([objectPath]);
    throw updateError;
  }

  return publicUrl;
}

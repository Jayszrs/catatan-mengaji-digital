import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  isAdminServiceConfigured,
} from "@/lib/admin-auth";

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumPhotoSize = 2 * 1024 * 1024;

interface ParentAccess {
  userId: string;
  studentId: string;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function requireLinkedChild(
  request: NextRequest,
  studentId: string,
): Promise<ParentAccess | NextResponse> {
  if (!isAdminServiceConfigured()) {
    return jsonError(
      "Layanan penyimpanan profil belum dikonfigurasi di server.",
      500,
    );
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  if (!token) return jsonError("Sesi orang tua tidak ditemukan.", 401);

  const admin = createAdminClient();
  const { data: authData, error: authError } =
    await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonError("Sesi orang tua sudah berakhir. Silakan login kembali.", 401);
  }

  const { data: role, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (roleError) return jsonError(roleError.message, 500);
  if (role?.role !== "orang_tua") {
    return jsonError("Fitur ini hanya dapat digunakan oleh akun orang tua.", 403);
  }

  const { data: link, error: linkError } = await admin
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", authData.user.id)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (linkError) return jsonError(linkError.message, 500);
  if (!link) {
    return jsonError(
      "Anak ini tidak terhubung dengan akun orang tua yang sedang login.",
      403,
    );
  }

  return { userId: authData.user.id, studentId: link.student_id };
}

function optionalText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maximumLength) : null;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const studentId =
      typeof body.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId) return jsonError("Data anak tidak valid.", 400);

    const access = await requireLinkedChild(request, studentId);
    if (access instanceof NextResponse) return access;

    const namaLengkap = optionalText(body.nama_lengkap, 150);
    if (!namaLengkap) return jsonError("Nama lengkap anak wajib diisi.", 400);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("students")
      .update({
        nama_lengkap: namaLengkap,
        tempat_tanggal_lahir: optionalText(body.tempat_tanggal_lahir, 150),
        wali_murid: optionalText(body.wali_murid, 150),
        no_telp: optionalText(body.no_telp, 50),
        alamat: optionalText(body.alamat, 500),
      })
      .eq("id", access.studentId)
      .select(
        "id,nama_lengkap,nis,kelas,level,foto_url,tempat_tanggal_lahir,wali_murid,no_telp,alamat",
      )
      .single();
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({
      message: "Biodata anak berhasil disimpan.",
      student: data,
    });
  } catch {
    return jsonError("Permintaan biodata anak tidak valid.", 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const studentId = String(formData.get("studentId") || "").trim();
    const photo = formData.get("photo");
    if (!studentId) return jsonError("Data anak tidak valid.", 400);
    if (!(photo instanceof File)) return jsonError("Pilih foto anak.", 400);
    if (!allowedPhotoTypes.has(photo.type)) {
      return jsonError("Format foto harus JPG, PNG, atau WebP.", 400);
    }
    if (photo.size > maximumPhotoSize) {
      return jsonError("Ukuran foto maksimal 2 MB.", 400);
    }

    const access = await requireLinkedChild(request, studentId);
    if (access instanceof NextResponse) return access;

    const extension =
      photo.type === "image/png"
        ? "png"
        : photo.type === "image/webp"
          ? "webp"
          : "jpg";
    const objectPath = `${access.studentId}/parent-${access.userId}-${Date.now()}.${extension}`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("student-photos")
      .upload(objectPath, photo, {
        contentType: photo.type,
        upsert: false,
      });
    if (uploadError) return jsonError(uploadError.message, 500);

    const { data: publicUrlData } = admin.storage
      .from("student-photos")
      .getPublicUrl(objectPath);
    const photoUrl = publicUrlData.publicUrl;
    const { data, error: updateError } = await admin
      .from("students")
      .update({ foto_url: photoUrl })
      .eq("id", access.studentId)
      .select(
        "id,nama_lengkap,nis,kelas,level,foto_url,tempat_tanggal_lahir,wali_murid,no_telp,alamat",
      )
      .single();
    if (updateError) {
      await admin.storage.from("student-photos").remove([objectPath]);
      return jsonError(updateError.message, 500);
    }

    return NextResponse.json({
      message: "Foto anak berhasil disimpan.",
      student: data,
    });
  } catch {
    return jsonError("Unggahan foto anak tidak valid.", 400);
  }
}

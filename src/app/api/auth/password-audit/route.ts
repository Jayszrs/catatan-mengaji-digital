import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  isAdminServiceConfigured,
} from "@/lib/admin-auth";
import { recordSecurityEvent } from "@/lib/server/account-security";

export async function POST(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: "Layanan audit belum tersedia." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  if (!accessToken) {
    return NextResponse.json(
      { error: "Sesi pemulihan password tidak ditemukan." },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) {
    return NextResponse.json(
      { error: "Sesi pemulihan password tidak valid." },
      { status: 401 },
    );
  }

  const changedAt = new Date().toISOString();
  const { error: metadataError } = await admin.auth.admin.updateUserById(
    data.user.id,
    {
      user_metadata: {
        ...(data.user.user_metadata || {}),
        password_changed_at: changedAt,
        password_changed_by: data.user.id,
        password_change_reason: "forgot_password",
      },
    },
  );
  if (metadataError) {
    return NextResponse.json(
      { error: "Perubahan password berhasil, tetapi audit gagal diperbarui." },
      { status: 500 },
    );
  }

  await recordSecurityEvent(admin, {
    actorUserId: data.user.id,
    targetUserId: data.user.id,
    eventType: "self_password_reset_completed",
    status: "success",
    request,
    details: {
      reason: "forgot_password",
      method: "recovery_link",
    },
  });

  return NextResponse.json({ success: true, changed_at: changedAt });
}

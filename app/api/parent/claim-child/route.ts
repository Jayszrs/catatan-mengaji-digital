import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  isAdminServiceConfigured,
} from "@/lib/admin-auth";
import {
  hashSecurityValue,
  recordSecurityEvent,
} from "@/lib/server/account-security";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return jsonError("Layanan hubungan siswa belum dikonfigurasi.", 500);
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  if (!token) return jsonError("Sesi Orang Tua tidak ditemukan.", 401);

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonError("Sesi sudah berakhir. Silakan login kembali.", 401);
  }

  const user = authData.user;
  const { data: roleRow, error: roleError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (roleError) return jsonError(roleError.message, 500);
  if (roleRow?.role !== "orang_tua") {
    return jsonError("Fitur ini hanya untuk akun Orang Tua.", 403);
  }

  const now = Date.now();
  const security = user.app_metadata?.parent_claim_security || {};
  const windowStartedAt = Date.parse(security.window_started_at || "") || now;
  const sameWindow = now - windowStartedAt < 15 * 60 * 1000;
  const failures = sameWindow ? Number(security.failures || 0) : 0;
  const lockedUntil = Date.parse(security.locked_until || "") || 0;
  if (lockedUntil > now || failures >= 5) {
    await recordSecurityEvent(admin, {
      actorUserId: user.id,
      targetUserId: user.id,
      eventType: "parent_nis_claim",
      status: "blocked",
      request,
      details: { reason: "rate_limited" },
    });
    return jsonError(
      "Terlalu banyak percobaan NIS. Coba kembali 15 menit lagi.",
      429,
    );
  }

  let nis = "";
  try {
    const body = await request.json();
    nis = String(body.nis || "").trim();
  } catch {
    return jsonError("Permintaan NIS tidak valid.", 400);
  }
  if (!nis || nis.length > 50) return jsonError("NIS anak wajib diisi.", 400);

  const registerFailure = async (reason: string, status = 400) => {
    const nextFailures = failures + 1;
    const lockAt = nextFailures >= 5 ? new Date(now + 15 * 60 * 1000) : null;
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        parent_claim_security: {
          failures: nextFailures,
          window_started_at: new Date(
            sameWindow ? windowStartedAt : now,
          ).toISOString(),
          locked_until: lockAt?.toISOString() || null,
          last_attempt_at: new Date(now).toISOString(),
        },
      },
    });
    await recordSecurityEvent(admin, {
      actorUserId: user.id,
      targetUserId: user.id,
      eventType: "parent_nis_claim",
      status: nextFailures >= 5 ? "blocked" : "failed",
      request,
      details: { reason, nis_hash: hashSecurityValue(nis) },
    });
    return jsonError(
      nextFailures >= 5
        ? "Terlalu banyak percobaan NIS. Coba kembali 15 menit lagi."
        : "NIS tidak dapat digunakan. Periksa kembali atau hubungi sekolah.",
      nextFailures >= 5 ? 429 : status,
    );
  };

  const { data: existingParentLink, error: currentLinkError } = await admin
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (currentLinkError) return jsonError(currentLinkError.message, 500);

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id")
    .eq("nis", nis)
    .maybeSingle();
  if (studentError) return jsonError(studentError.message, 500);
  if (!student) return registerFailure("nis_not_found");

  if (existingParentLink) {
    if (existingParentLink.student_id === student.id) {
      return NextResponse.json({
        success: true,
        studentId: student.id,
        message: "Akun sudah terhubung dengan anak tersebut.",
      });
    }
    return registerFailure("parent_already_linked", 409);
  }

  const { data: otherLink, error: otherLinkError } = await admin
    .from("parent_student_links")
    .select("parent_id")
    .eq("student_id", student.id)
    .eq("status", "active")
    .maybeSingle();
  if (otherLinkError) return jsonError(otherLinkError.message, 500);
  if (otherLink) return registerFailure("student_already_linked", 409);

  const { error: linkError } = await admin.from("parent_student_links").upsert(
    {
      parent_id: user.id,
      student_id: student.id,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "parent_id" },
  );
  if (linkError) return jsonError(linkError.message, 500);

  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      parent_claim_security: {
        failures: 0,
        window_started_at: new Date(now).toISOString(),
        locked_until: null,
        last_attempt_at: new Date(now).toISOString(),
      },
    },
  });
  await recordSecurityEvent(admin, {
    actorUserId: user.id,
    targetUserId: user.id,
    eventType: "parent_nis_claim",
    status: "success",
    request,
    details: { student_id: student.id },
  });

  return NextResponse.json({
    success: true,
    studentId: student.id,
    message: "Akun Orang Tua berhasil dihubungkan dengan anak.",
  });
}

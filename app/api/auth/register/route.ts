import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  isAdminServiceConfigured,
} from "@/lib/admin-auth";
import {
  isValidUsername,
  normalizeUsername,
  usernameToManagedEmail,
} from "@/lib/account-identifier";
import {
  getRequestFingerprint,
  hashSecurityValue,
  recordSecurityEvent,
} from "@/lib/server/account-security";

type RegistrationRole = "guru" | "orang_tua";

interface RateWindow {
  attempts: number;
  startedAt: number;
}

const registrationAttempts = new Map<string, RateWindow>();
const registrationWindowMs = 15 * 60 * 1000;
const maximumRegistrationAttempts = 6;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function consumeRegistrationAttempt(request: NextRequest) {
  const fingerprint = getRequestFingerprint(request);
  const now = Date.now();
  const current = registrationAttempts.get(fingerprint);
  if (!current || now - current.startedAt >= registrationWindowMs) {
    registrationAttempts.set(fingerprint, { attempts: 1, startedAt: now });
    return true;
  }
  if (current.attempts >= maximumRegistrationAttempts) return false;
  current.attempts += 1;
  return true;
}

export async function POST(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return jsonError("Layanan pendaftaran belum dikonfigurasi.", 500);
  }
  if (!consumeRegistrationAttempt(request)) {
    return jsonError(
      "Terlalu banyak percobaan pendaftaran. Coba kembali 15 menit lagi.",
      429,
    );
  }

  const admin = createAdminClient();

  try {
    const body = await request.json();
    const username = normalizeUsername(body.username);
    const name = String(body.name || "").trim();
    const contactEmail = String(body.email || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role as RegistrationRole;
    const nis = String(body.nis || "").trim();

    if (!isValidUsername(username)) {
      return jsonError(
        "Username harus 3–30 karakter dan hanya memakai huruf, angka, titik, garis bawah, atau strip.",
        400,
      );
    }
    if (!name || name.length > 150) {
      return jsonError("Nama lengkap wajib diisi.", 400);
    }
    if (password.length < 6) {
      return jsonError("Password minimal 6 karakter.", 400);
    }
    if (role !== "guru" && role !== "orang_tua") {
      return jsonError("Tipe akun tidak valid.", 400);
    }
    if (
      contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
    ) {
      return jsonError("Format email kontak tidak valid.", 400);
    }
    if (role === "orang_tua" && (!nis || nis.length > 50)) {
      return jsonError("NIS anak wajib diisi.", 400);
    }

    const loginEmail = usernameToManagedEmail(username);
    const { data: existingUsers, error: listError } =
      await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return jsonError(listError.message, 500);
    const usernameExists = existingUsers.users.some(
      (user) =>
        !user.deleted_at &&
        (normalizeUsername(user.user_metadata?.username) === username ||
          user.email?.toLowerCase() === loginEmail),
    );
    if (usernameExists) {
      return jsonError("Username sudah digunakan.", 409);
    }

    let studentId = "";
    if (role === "orang_tua") {
      const requestFingerprint = getRequestFingerprint(request);
      const claimWindowStart = new Date(
        Date.now() - registrationWindowMs,
      ).toISOString();
      const { count: recentClaimFailures, error: rateLookupError } =
        await admin
          .from("account_security_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "parent_registration_claim")
          .eq("request_fingerprint", requestFingerprint)
          .in("status", ["failed", "blocked"])
          .gte("created_at", claimWindowStart);
      const auditTableUnavailable = Boolean(
        rateLookupError &&
          /account_security_events|schema cache|does not exist/i.test(
            rateLookupError.message,
          ),
      );
      if (rateLookupError && !auditTableUnavailable) {
        return jsonError(rateLookupError.message, 500);
      }
      if ((recentClaimFailures || 0) >= 5) {
        await recordSecurityEvent(admin, {
          eventType: "parent_registration_claim",
          status: "blocked",
          request,
          details: { reason: "rate_limited" },
        });
        return jsonError(
          "Terlalu banyak percobaan NIS. Coba kembali 15 menit lagi.",
          429,
        );
      }

      const { data: student, error: studentError } = await admin
        .from("students")
        .select("id")
        .eq("nis", nis)
        .maybeSingle();
      if (studentError) return jsonError(studentError.message, 500);
      if (!student) {
        await recordSecurityEvent(admin, {
          eventType: "parent_registration_claim",
          status: "failed",
          request,
          details: { nis_hash: hashSecurityValue(nis) },
        });
        return jsonError(
          "NIS tidak dapat digunakan. Periksa kembali atau hubungi sekolah.",
          400,
        );
      }

      const { data: existingLink, error: linkLookupError } = await admin
        .from("parent_student_links")
        .select("parent_id")
        .eq("student_id", student.id)
        .eq("status", "active")
        .maybeSingle();
      if (linkLookupError) return jsonError(linkLookupError.message, 500);
      if (existingLink) {
        await recordSecurityEvent(admin, {
          eventType: "parent_registration_claim",
          status: "blocked",
          request,
          details: { student_id: student.id, reason: "already_linked" },
        });
        return jsonError(
          "Siswa sudah terhubung dengan akun Orang Tua. Hubungi Administrator jika perlu diperbaiki.",
          409,
        );
      }
      studentId = student.id;
    }

    const approvalStatus = role === "guru" ? "pending" : "approved";
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: loginEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          username,
          contact_email: contactEmail || null,
          requested_role: role,
          role: role === "orang_tua" ? "orang_tua" : null,
          approval_status: approvalStatus,
          nis_anak: role === "orang_tua" ? nis : null,
        },
        app_metadata: {
          managed_username: true,
          requested_role: role,
          role: role === "orang_tua" ? "orang_tua" : null,
          approval_status: approvalStatus,
        },
      });
    if (createError || !created.user) {
      return jsonError(createError?.message || "Akun gagal dibuat.", 400);
    }

    if (role === "orang_tua") {
      const { error: roleError } = await admin.from("user_roles").upsert(
        {
          user_id: created.user.id,
          email: loginEmail,
          role: "orang_tua",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      const { error: linkError } = roleError
        ? { error: null }
        : await admin.from("parent_student_links").upsert(
            {
              parent_id: created.user.id,
              student_id: studentId,
              status: "active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "parent_id" },
          );
      if (roleError || linkError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return jsonError(
          roleError?.message ||
            linkError?.message ||
            "Hubungan siswa gagal disimpan.",
          500,
        );
      }
    }

    await recordSecurityEvent(admin, {
      actorUserId: created.user.id,
      targetUserId: created.user.id,
      eventType:
        role === "guru"
          ? "teacher_registration_pending"
          : "parent_registration_claim",
      status: "success",
      request,
      details:
        role === "orang_tua"
          ? { student_id: studentId }
          : { requested_role: "guru" },
    });

    return NextResponse.json({
      success: true,
      status: approvalStatus,
      message:
        role === "guru"
          ? "Pendaftaran Guru berhasil. Akun menunggu persetujuan Administrator."
          : "Akun Orang Tua berhasil dibuat dan langsung terhubung dengan anak.",
    });
  } catch {
    return jsonError("Permintaan pendaftaran tidak valid.", 400);
  }
}

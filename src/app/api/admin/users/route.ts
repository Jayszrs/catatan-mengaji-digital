import { NextRequest, NextResponse } from "next/server";
import {
  authorizeAdmin,
  createAdminClient,
  isAdminServiceConfigured,
} from "@/lib/admin-auth";
import {
  isManagedAccountEmail,
  isValidUsername,
  normalizeUsername,
  usernameToManagedEmail,
} from "@/lib/account-identifier";
import {
  hashSecurityValue,
  recordSecurityEvent,
} from "@/lib/server/account-security";

const allowedRoles = new Set(["admin", "guru", "orang_tua"]);

async function requireAdmin(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return {
      authorization: null,
      response: NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY belum tersedia pada environment Vercel.",
        },
        { status: 500 },
      ),
    };
  }

  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) {
    return {
      authorization: null,
      response: NextResponse.json(
        { error: "Sesi Administrator tidak valid atau sudah berakhir." },
        { status: 401 },
      ),
    };
  }

  return { authorization, response: null };
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const { data: rolesData, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("user_id,role");
  if (rolesError) {
    return NextResponse.json({ error: rolesError.message }, { status: 500 });
  }

  const { data: parentLinks, error: parentLinksError } = await supabaseAdmin
    .from("parent_student_links")
    .select("parent_id,student_id,status,updated_at");
  if (parentLinksError) {
    return NextResponse.json(
      { error: parentLinksError.message },
      { status: 500 },
    );
  }
  const linkedStudentIds = [
    ...new Set(
      (parentLinks || [])
        .filter((link) => link.status === "active")
        .map((link) => link.student_id),
    ),
  ];
  const { data: linkedStudents, error: linkedStudentsError } =
    linkedStudentIds.length > 0
      ? await supabaseAdmin
          .from("students")
          .select("id,nama_lengkap,nis,kelas")
          .in("id", linkedStudentIds)
      : { data: [], error: null };
  if (linkedStudentsError) {
    return NextResponse.json(
      { error: linkedStudentsError.message },
      { status: 500 },
    );
  }
  const studentsById = new Map(
    (linkedStudents || []).map((student) => [student.id, student]),
  );

  const usersWithRoles = authData.users
    .filter((user) => !user.deleted_at)
    .map((user) => {
      const databaseRole = rolesData?.find(
        (row) => row.user_id === user.id,
      )?.role;
      const appRole = user.app_metadata?.role;
      const username =
        user.user_metadata?.username ||
        (isManagedAccountEmail(user.email)
          ? user.email?.split("@")[0]
          : "");
      const contactEmail = String(
        user.user_metadata?.contact_email || "",
      ).trim();
      const approvalStatus =
        user.app_metadata?.approval_status ||
        user.user_metadata?.approval_status ||
        "approved";
      const requestedRole =
        user.app_metadata?.requested_role ||
        user.user_metadata?.requested_role ||
        user.user_metadata?.role ||
        null;
      const activeParentLink = (parentLinks || []).find(
        (link) => link.parent_id === user.id && link.status === "active",
      );
      const linkedStudent = activeParentLink
        ? studentsById.get(activeParentLink.student_id)
        : null;
      return {
        id: user.id,
        username,
        email: isManagedAccountEmail(user.email)
          ? contactEmail || "-"
          : user.email || "-",
        name: user.user_metadata?.name || "-",
        role:
          approvalStatus === "pending"
            ? "Menunggu Persetujuan"
            : approvalStatus === "rejected"
              ? "Ditolak"
              : appRole === "admin"
            ? "admin"
            : databaseRole || "Belum Ada Role",
        approval_status: approvalStatus,
        requested_role: requestedRole,
        linked_student: linkedStudent
          ? {
              id: linkedStudent.id,
              name: linkedStudent.nama_lengkap,
              nis: linkedStudent.nis,
              class_name: linkedStudent.kelas,
            }
          : null,
        created_at: user.created_at,
        is_current_admin: guard.authorization?.user?.id === user.id,
      };
    });

  const { data: securityEvents, error: securityEventsError } =
    await supabaseAdmin
      .from("account_security_events")
      .select(
        "id,actor_user_id,target_user_id,event_type,status,details,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(30);
  const auditTableUnavailable = Boolean(
    securityEventsError &&
      /account_security_events|schema cache|does not exist/i.test(
        securityEventsError.message,
      ),
  );
  if (securityEventsError && !auditTableUnavailable) {
    return NextResponse.json(
      { error: securityEventsError.message },
      { status: 500 },
    );
  }
  const userNames = new Map(
    usersWithRoles.map((user) => [user.id, user.name]),
  );
  const safeSecurityEvents = (securityEvents || []).map((event) => ({
    id: event.id,
    event_type: event.event_type,
    status: event.status,
    actor_name: event.actor_user_id
      ? userNames.get(event.actor_user_id) || "Akun terhapus"
      : "Sistem/Administrator utama",
    target_name: event.target_user_id
      ? userNames.get(event.target_user_id) || "Akun terhapus"
      : "-",
    reason:
      event.details &&
      typeof event.details === "object" &&
      "reason" in event.details
        ? String(event.details.reason || "")
        : "",
    created_at: event.created_at,
  }));

  return NextResponse.json(
    {
      users: usersWithRoles,
      security_events: safeSecurityEvents,
      audit_database_active: !auditTableUnavailable,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  const supabaseAdmin = createAdminClient();

  try {
    const body = await request.json();
    const { action, email, password, name, role, userId, username } = body;

    if (action === "create") {
      const normalizedUsername = normalizeUsername(username);
      const contactEmail = String(email || "").trim().toLowerCase();
      const normalizedName = String(name || "").trim();
      if (
        !isValidUsername(normalizedUsername) ||
        !password ||
        !normalizedName ||
        !allowedRoles.has(role)
      ) {
        return NextResponse.json(
          {
            error:
              "Username 3–30 karakter, nama lengkap, password, dan role yang valid wajib diisi.",
          },
          { status: 400 },
        );
      }
      if (
        contactEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
      ) {
        return NextResponse.json(
          { error: "Format email opsional tidak valid." },
          { status: 400 },
        );
      }
      if (String(password).length < 6) {
        return NextResponse.json(
          { error: "Password minimal 6 karakter." },
          { status: 400 },
        );
      }

      const loginEmail = usernameToManagedEmail(normalizedUsername);
      const { data: existingUsers, error: existingUsersError } =
        await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
      if (existingUsersError) {
        return NextResponse.json(
          { error: existingUsersError.message },
          { status: 500 },
        );
      }
      const usernameExists = existingUsers.users.some(
        (user) =>
          !user.deleted_at &&
          (normalizeUsername(user.user_metadata?.username) ===
            normalizedUsername ||
            user.email?.toLowerCase() === loginEmail),
      );
      if (usernameExists) {
        return NextResponse.json(
          { error: "Username sudah digunakan oleh akun lain." },
          { status: 409 },
        );
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: loginEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name: normalizedName,
          username: normalizedUsername,
          contact_email: contactEmail || null,
          requested_role: role,
          approval_status: "approved",
          role,
        },
        app_metadata: {
          role,
          requested_role: role,
          approval_status: "approved",
          managed_username: true,
        },
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (data.user && role !== "admin") {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert(
            {
              user_id: data.user.id,
              email: loginEmail,
              role,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

        if (roleError) {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
          return NextResponse.json(
            {
              error: `Role gagal disimpan, sehingga pembuatan akun dibatalkan: ${roleError.message}`,
            },
            { status: 500 },
          );
        }
      }

      await recordSecurityEvent(supabaseAdmin, {
        actorUserId: guard.authorization?.user?.id || null,
        targetUserId: data.user?.id || null,
        eventType: "admin_account_created",
        status: "success",
        request,
        details: { role, username: normalizedUsername },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: data.user?.id,
          username: normalizedUsername,
          name: normalizedName,
          email: contactEmail || null,
          role,
        },
        message: `Akun @${normalizedUsername} berhasil dibuat tanpa verifikasi email.`,
      });
    }

    if (action === "assign_role") {
      if (!userId || !allowedRoles.has(role)) {
        return NextResponse.json(
          { error: "User dan role yang valid wajib dipilih." },
          { status: 400 },
        );
      }
      if (guard.authorization?.user?.id === userId) {
        return NextResponse.json(
          {
            error:
              "Admin tidak dapat mengubah role akun yang sedang dipakai.",
          },
          { status: 400 },
        );
      }

      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !userData.user?.email) {
        return NextResponse.json(
          { error: userError?.message || "Email pengguna tidak ditemukan." },
          { status: 404 },
        );
      }

      const previousUserMetadata = userData.user.user_metadata || {};
      const previousAppMetadata = userData.user.app_metadata || {};
      const { error: metadataError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...previousUserMetadata,
            role,
            requested_role: role,
            approval_status: "approved",
          },
          app_metadata: {
            ...previousAppMetadata,
            role,
            requested_role: role,
            approval_status: "approved",
          },
        });
      if (metadataError) {
        return NextResponse.json(
          { error: metadataError.message },
          { status: 400 },
        );
      }

      if (role === "admin") {
        const { error: cleanupError } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (cleanupError) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: previousUserMetadata,
            app_metadata: previousAppMetadata,
          });
          return NextResponse.json(
            { error: cleanupError.message },
            { status: 400 },
          );
        }
      } else {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert(
            {
              user_id: userId,
              email: userData.user.email.toLowerCase(),
              role,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        if (roleError) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: previousUserMetadata,
            app_metadata: previousAppMetadata,
          });
          return NextResponse.json(
            { error: roleError.message },
            { status: 400 },
          );
        }
      }

      const { data: verifiedUser, error: verificationError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (
        verificationError ||
        verifiedUser.user?.app_metadata?.role !== role
      ) {
        return NextResponse.json(
          {
            error:
              verificationError?.message ||
              "Perubahan role belum berhasil diverifikasi.",
          },
          { status: 502 },
        );
      }
      if (role !== "admin") {
        const { data: verifiedRole, error: verifiedRoleError } =
          await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();
        if (verifiedRoleError || verifiedRole?.role !== role) {
          return NextResponse.json(
            {
              error:
                verifiedRoleError?.message ||
                "Role database belum sesuai dengan role akun.",
            },
            { status: 502 },
          );
        }
      }
      if (role !== "orang_tua") {
        const { error: unlinkError } = await supabaseAdmin
          .from("parent_student_links")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("parent_id", userId)
          .eq("status", "active");
        if (unlinkError) {
          return NextResponse.json(
            {
              error: `Role berubah, tetapi hubungan siswa gagal dinonaktifkan: ${unlinkError.message}`,
            },
            { status: 500 },
          );
        }
      }

      await recordSecurityEvent(supabaseAdmin, {
        actorUserId: guard.authorization?.user?.id || null,
        targetUserId: userId,
        eventType: "admin_role_changed",
        status: "success",
        request,
        details: {
          previous_role:
            previousAppMetadata.role ||
            userData.user.user_metadata?.role ||
            null,
          new_role: role,
        },
      });

      return NextResponse.json({
        success: true,
        role,
        message: `Role ${verifiedUser.user.user_metadata?.name || "akun"} berhasil diubah.`,
      });
    }

    if (action === "review_teacher") {
      const decision = body.decision;
      if (
        !userId ||
        (decision !== "approve" && decision !== "reject")
      ) {
        return NextResponse.json(
          { error: "Permintaan persetujuan Guru tidak valid." },
          { status: 400 },
        );
      }

      const { data: targetData, error: targetError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (targetError || !targetData.user) {
        return NextResponse.json(
          { error: targetError?.message || "Akun Guru tidak ditemukan." },
          { status: 404 },
        );
      }
      const requestedRole =
        targetData.user.app_metadata?.requested_role ||
        targetData.user.user_metadata?.requested_role;
      if (requestedRole !== "guru") {
        return NextResponse.json(
          { error: "Akun ini tidak memiliki permintaan role Guru." },
          { status: 409 },
        );
      }

      const reviewedAt = new Date().toISOString();
      const approved = decision === "approve";
      const nextRole = approved ? "guru" : null;
      const previousUserMetadata = targetData.user.user_metadata || {};
      const previousAppMetadata = targetData.user.app_metadata || {};
      const { error: metadataError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...previousUserMetadata,
            role: nextRole,
            requested_role: "guru",
            approval_status: approved ? "approved" : "rejected",
            reviewed_at: reviewedAt,
          },
          app_metadata: {
            ...previousAppMetadata,
            role: nextRole,
            requested_role: "guru",
            approval_status: approved ? "approved" : "rejected",
            reviewed_at: reviewedAt,
          },
        });
      if (metadataError) {
        return NextResponse.json(
          { error: metadataError.message },
          { status: 400 },
        );
      }

      const roleMutation = approved
        ? await supabaseAdmin.from("user_roles").upsert(
            {
              user_id: userId,
              email: targetData.user.email || "",
              role: "guru",
              updated_at: reviewedAt,
            },
            { onConflict: "user_id" },
          )
        : await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", userId);
      if (roleMutation.error) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: previousUserMetadata,
          app_metadata: previousAppMetadata,
        });
        return NextResponse.json(
          { error: roleMutation.error.message },
          { status: 500 },
        );
      }

      await recordSecurityEvent(supabaseAdmin, {
        actorUserId: guard.authorization?.user?.id || null,
        targetUserId: userId,
        eventType: "teacher_registration_review",
        status: "success",
        request,
        details: {
          decision,
          reviewer_method: guard.authorization?.method,
        },
      });

      return NextResponse.json({
        success: true,
        status: approved ? "approved" : "rejected",
        message: approved
          ? "Akun Guru disetujui dan sekarang dapat login."
          : "Pendaftaran Guru ditolak.",
      });
    }

    if (action === "manage_parent_link") {
      const operation = body.operation;
      const nis = String(body.nis || "").trim();
      if (
        !userId ||
        (operation !== "connect" && operation !== "disconnect")
      ) {
        return NextResponse.json(
          { error: "Permintaan hubungan Orang Tua tidak valid." },
          { status: 400 },
        );
      }

      const { data: targetRole, error: targetRoleError } =
        await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
      if (targetRoleError) {
        return NextResponse.json(
          { error: targetRoleError.message },
          { status: 500 },
        );
      }
      if (targetRole?.role !== "orang_tua") {
        return NextResponse.json(
          { error: "Akun yang dipilih bukan akun Orang Tua." },
          { status: 409 },
        );
      }

      if (operation === "disconnect") {
        const { error: disconnectError } = await supabaseAdmin
          .from("parent_student_links")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("parent_id", userId)
          .eq("status", "active");
        if (disconnectError) {
          return NextResponse.json(
            { error: disconnectError.message },
            { status: 500 },
          );
        }
        await recordSecurityEvent(supabaseAdmin, {
          actorUserId: guard.authorization?.user?.id || null,
          targetUserId: userId,
          eventType: "admin_parent_link_disconnect",
          status: "success",
          request,
        });
        return NextResponse.json({
          success: true,
          message: "Hubungan Orang Tua dan siswa berhasil diputus.",
        });
      }

      if (!nis || nis.length > 50) {
        return NextResponse.json(
          { error: "NIS siswa wajib diisi." },
          { status: 400 },
        );
      }
      const { data: student, error: studentError } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("nis", nis)
        .maybeSingle();
      if (studentError) {
        return NextResponse.json(
          { error: studentError.message },
          { status: 500 },
        );
      }
      if (!student) {
        await recordSecurityEvent(supabaseAdmin, {
          actorUserId: guard.authorization?.user?.id || null,
          targetUserId: userId,
          eventType: "admin_parent_link_connect",
          status: "failed",
          request,
          details: { nis_hash: hashSecurityValue(nis) },
        });
        return NextResponse.json(
          { error: "NIS siswa tidak ditemukan." },
          { status: 404 },
        );
      }

      const { data: occupiedLink, error: occupiedError } =
        await supabaseAdmin
          .from("parent_student_links")
          .select("parent_id")
          .eq("student_id", student.id)
          .eq("status", "active")
          .neq("parent_id", userId)
          .maybeSingle();
      if (occupiedError) {
        return NextResponse.json(
          { error: occupiedError.message },
          { status: 500 },
        );
      }
      if (occupiedLink) {
        return NextResponse.json(
          {
            error:
              "Siswa sudah terhubung dengan akun Orang Tua lain. Putuskan hubungan lama terlebih dahulu.",
          },
          { status: 409 },
        );
      }

      const { error: connectError } = await supabaseAdmin
        .from("parent_student_links")
        .upsert(
          {
            parent_id: userId,
            student_id: student.id,
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "parent_id" },
        );
      if (connectError) {
        return NextResponse.json(
          { error: connectError.message },
          { status: 500 },
        );
      }
      await recordSecurityEvent(supabaseAdmin, {
        actorUserId: guard.authorization?.user?.id || null,
        targetUserId: userId,
        eventType: "admin_parent_link_connect",
        status: "success",
        request,
        details: { student_id: student.id },
      });
      return NextResponse.json({
        success: true,
        message: "Akun Orang Tua berhasil dihubungkan dengan siswa.",
      });
    }

    if (action === "update_password") {
      const normalizedPassword =
        typeof password === "string" ? password : "";
      if (!userId || normalizedPassword.length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter." },
          { status: 400 },
        );
      }

      const { data: targetData, error: targetError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (targetError || !targetData.user) {
        return NextResponse.json(
          { error: targetError?.message || "Akun tidak ditemukan." },
          { status: 404 },
        );
      }
      if (targetData.user.deleted_at) {
        return NextResponse.json(
          { error: "Password akun yang sudah dihapus tidak dapat diubah." },
          { status: 409 },
        );
      }

      const passwordChangedAt = new Date().toISOString();
      const { data: updateData, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: normalizedPassword,
          user_metadata: {
            ...(targetData.user.user_metadata || {}),
            password_changed_at: passwordChangedAt,
            password_changed_by: guard.authorization?.user?.id || null,
          },
        });
      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 },
        );
      }
      if (
        updateData.user?.id !== userId ||
        updateData.user.user_metadata?.password_changed_at !==
          passwordChangedAt
      ) {
        return NextResponse.json(
          {
            error:
              "Supabase belum mengonfirmasi perubahan password. Silakan coba kembali.",
          },
          { status: 502 },
        );
      }

      const { data: verificationData, error: verificationError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (
        verificationError ||
        verificationData.user?.user_metadata?.password_changed_at !==
          passwordChangedAt
      ) {
        return NextResponse.json(
          {
            error:
              verificationError?.message ||
              "Perubahan password belum berhasil diverifikasi.",
          },
          { status: 502 },
        );
      }

      await recordSecurityEvent(supabaseAdmin, {
        actorUserId: guard.authorization?.user?.id || null,
        targetUserId: userId,
        eventType: "admin_password_changed",
        status: "success",
        request,
      });

      return NextResponse.json({
        success: true,
        password_changed_at: passwordChangedAt,
        message: `Password ${
          verificationData.user.user_metadata?.username
            ? `@${verificationData.user.user_metadata.username}`
            : verificationData.user.email || "akun"
        } berhasil diubah dan diverifikasi.`,
      });
    }

    if (action === "delete") {
      if (!userId) {
        return NextResponse.json(
          { error: "Akun yang akan dihapus belum dipilih." },
          { status: 400 },
        );
      }
      if (guard.authorization?.user?.id === userId) {
        return NextResponse.json(
          { error: "Admin tidak dapat menghapus akun yang sedang dipakai." },
          { status: 400 },
        );
      }

      const { data: targetData, error: targetError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (targetError || !targetData.user) {
        return NextResponse.json(
          { error: targetError?.message || "Akun tidak ditemukan." },
          { status: 404 },
        );
      }

      const { data: targetRoleRow, error: targetRoleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (targetRoleError) {
        return NextResponse.json(
          { error: targetRoleError.message },
          { status: 400 },
        );
      }
      const targetRole =
        targetData.user.app_metadata?.role === "admin"
          ? "admin"
          : targetRoleRow?.role;

      // Soft delete keeps historical rows intact. A hard delete would trigger
      // ON DELETE CASCADE on classes, reports, and exam records owned by a Guru.
      const { data: deletedData, error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userId, true);
      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 400 },
        );
      }
      if (deletedData.user?.id && deletedData.user.id !== userId) {
        return NextResponse.json(
          {
            error:
              "Supabase mengembalikan konfirmasi untuk akun yang berbeda.",
          },
          { status: 502 },
        );
      }

      const { data: deletionVerification, error: verificationError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (
        verificationError ||
        !deletionVerification.user?.deleted_at
      ) {
        return NextResponse.json(
          {
            error:
              verificationError?.message ||
              "Supabase belum mengonfirmasi penghapusan akun. Silakan coba kembali.",
          },
          { status: 502 },
        );
      }

      // Remove application access immediately as an extra safeguard. These
      // rows are not needed to preserve academic history.
      const cleanupResults = await Promise.all([
        supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
        targetRole === "orang_tua"
          ? supabaseAdmin
              .from("parent_student_links")
              .delete()
              .eq("parent_id", userId)
          : Promise.resolve({ error: null }),
        targetRole === "guru"
          ? supabaseAdmin
              .from("teacher_profiles")
              .delete()
              .eq("user_id", userId)
          : Promise.resolve({ error: null }),
      ]);
      const cleanupWarnings = cleanupResults
        .map((result) => result.error?.message)
        .filter((message): message is string => Boolean(message));

      await recordSecurityEvent(supabaseAdmin, {
        actorUserId: guard.authorization?.user?.id || null,
        targetUserId: userId,
        eventType: "admin_account_deleted",
        status: "success",
        request,
        details: {
          previous_role: targetRole || null,
          historical_data_preserved: true,
          cleanup_warning_count: cleanupWarnings.length,
        },
      });

      return NextResponse.json({
        success: true,
        deleted_user_id: userId,
        deletion_mode: "soft",
        historical_data_preserved: true,
        warnings: cleanupWarnings,
        message:
          cleanupWarnings.length > 0
            ? "Akun sudah dinonaktifkan dan tidak dapat login. Sebagian data profil pendukung belum dapat dibersihkan."
            : "Akun berhasil dihapus dari akses login. Data akademik terkait tetap tersimpan.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Terjadi kesalahan.",
      },
      { status: 500 },
    );
  }
}

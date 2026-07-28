import { NextRequest, NextResponse } from "next/server";
import {
  authorizeAdmin,
  createAdminClient,
  isAdminServiceConfigured,
} from "@/lib/admin-auth";

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

  const usersWithRoles = authData.users.map((user) => {
    const databaseRole = rolesData?.find((row) => row.user_id === user.id)?.role;
    const appRole = user.app_metadata?.role;
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || "-",
      role: appRole === "admin" ? "admin" : databaseRole || "Belum Ada Role",
      created_at: user.created_at,
      is_current_admin: guard.authorization?.user?.id === user.id,
    };
  });

  return NextResponse.json({ users: usersWithRoles });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  const supabaseAdmin = createAdminClient();

  try {
    const body = await request.json();
    const { action, email, password, name, role, userId } = body;

    if (action === "create") {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const normalizedName = String(name || "").trim();
      if (
        !normalizedEmail ||
        !password ||
        !normalizedName ||
        !allowedRoles.has(role)
      ) {
        return NextResponse.json(
          { error: "Nama, email, password, dan role yang valid wajib diisi." },
          { status: 400 },
        );
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { name: normalizedName, role },
        app_metadata: { role },
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
              email: normalizedEmail,
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

      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === "assign_role") {
      if (!userId || !allowedRoles.has(role)) {
        return NextResponse.json(
          { error: "User dan role yang valid wajib dipilih." },
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

      const metadata = userData.user.user_metadata || {};
      const { error: metadataError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { ...metadata, role },
          app_metadata: { ...userData.user.app_metadata, role },
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
          return NextResponse.json(
            { error: roleError.message },
            { status: 400 },
          );
        }
      }

      return NextResponse.json({ success: true, role });
    }

    if (action === "update_password") {
      if (!userId || !password || String(password).length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter." },
          { status: 400 },
        );
      }
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
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

      if (targetRole === "guru") {
        const { count, error: studentCountError } = await supabaseAdmin
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("teacher_id", userId);
        if (studentCountError) {
          return NextResponse.json(
            { error: studentCountError.message },
            { status: 400 },
          );
        }
        if ((count || 0) > 0) {
          return NextResponse.json(
            {
              error: `Akun Guru masih memiliki ${count} data siswa. Akun tidak dihapus agar data siswa tidak ikut hilang.`,
            },
            { status: 409 },
          );
        }
      }

      if (targetRole === "admin") {
        const { data: allUsers, error: listError } =
          await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          return NextResponse.json(
            { error: listError.message },
            { status: 400 },
          );
        }
        const adminCount = allUsers.users.filter(
          (user) => user.app_metadata?.role === "admin",
        ).length;
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Admin terakhir tidak dapat dihapus." },
            { status: 409 },
          );
        }
      }

      const { error: deleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true });
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

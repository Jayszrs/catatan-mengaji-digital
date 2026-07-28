import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const allowedRoles = new Set(['guru', 'orang_tua']);

function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET() {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables (.env.local). Silakan tambahkan terlebih dahulu agar fitur admin berfungsi.' }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient();

  // Get users from auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Get roles
  const { data: rolesData, error: rolesError } = await supabaseAdmin.from('user_roles').select('*');

  if (rolesError) {
    return NextResponse.json({ error: rolesError.message }, { status: 500 });
  }

  const usersWithRoles = authData.users.map(u => {
    const userRole = rolesData?.find(r => r.user_id === u.id);
    return {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || '-',
      role: userRole ? userRole.role : 'Belum Ada Role',
      created_at: u.created_at
    };
  });

  return NextResponse.json({ users: usersWithRoles });
}

export async function POST(req: Request) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables.' }, { status: 500 });
  }

  const supabaseAdmin = createAdminClient();

  try {
    const body = await req.json();
    const { action, email, password, name, role, userId } = body;

    if (action === 'create') {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const normalizedName = String(name || '').trim();
      if (!normalizedEmail || !password || !normalizedName || !allowedRoles.has(role)) {
        return NextResponse.json(
          { error: 'Nama, email, password, dan role yang valid wajib diisi.' },
          { status: 400 },
        );
      }

      // 1. Create Auth User
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { name: normalizedName, role }
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // 2. Add role. user_roles.email is NOT NULL, so the email must be included.
      if (data.user) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert(
            {
              user_id: data.user.id,
              email: normalizedEmail,
              role,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );

        if (roleError) {
          // Jangan meninggalkan akun Auth tanpa role jika langkah kedua gagal.
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
    } else if (action === 'assign_role') {
      if (!userId || !allowedRoles.has(role)) {
        return NextResponse.json(
          { error: 'User dan role yang valid wajib dipilih.' },
          { status: 400 },
        );
      }

      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !userData.user?.email) {
        return NextResponse.json(
          { error: userError?.message || 'Email pengguna tidak ditemukan.' },
          { status: 404 },
        );
      }

      const metadata = userData.user.user_metadata || {};
      const { error: metadataError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { ...metadata, role },
        });
      if (metadataError) {
        return NextResponse.json({ error: metadataError.message }, { status: 400 });
      }

      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert(
          {
            user_id: userId,
            email: userData.user.email.toLowerCase(),
            role,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
      if (roleError) {
        return NextResponse.json({ error: roleError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, role });
    } else if (action === 'update_password') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

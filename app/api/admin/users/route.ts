import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables (.env.local). Silakan tambahkan terlebih dahulu agar fitur admin berfungsi.' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

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

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const body = await req.json();
    const { action, email, password, name, role, userId } = body;

    if (action === 'create') {
      // 1. Create Auth User
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // 2. Add role
      if (data.user) {
        await supabaseAdmin.from('user_roles').insert([
          { user_id: data.user.id, role }
        ]);
      }

      return NextResponse.json({ success: true, user: data.user });
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

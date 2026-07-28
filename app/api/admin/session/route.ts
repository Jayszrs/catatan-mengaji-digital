import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  authorizeAdmin,
  isAdminServiceConfigured,
  legacyAdminSessionToken,
  verifyLegacyAdminCredentials,
} from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    method: authorization.method,
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: "Konfigurasi layanan admin belum tersedia." },
      { status: 500 },
    );
  }

  const body = await request.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!verifyLegacyAdminCredentials(username, password)) {
    return NextResponse.json(
      { error: "Username atau password Administrator tidak cocok." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ authenticated: true });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.set(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${legacyAdminSessionToken()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 8}${secure}`,
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.set(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  );
  return response;
}

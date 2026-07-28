import { createHash, timingSafeEqual } from "node:crypto";
import { createClient, User } from "@supabase/supabase-js";

export const ADMIN_SESSION_COOKIE = "cmd_admin_session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function isAdminServiceConfigured() {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function legacyAdminUsername() {
  return process.env.ADMIN_USERNAME || "admin";
}

function legacyAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function verifyLegacyAdminCredentials(username: string, password: string) {
  return (
    safeEqual(username, legacyAdminUsername()) &&
    safeEqual(password, legacyAdminPassword())
  );
}

export function legacyAdminSessionToken() {
  return createHash("sha256")
    .update(
      `${supabaseServiceKey}|${legacyAdminUsername()}|${legacyAdminPassword()}|catatan-mengaji-admin`,
    )
    .digest("hex");
}

export interface AdminAuthorization {
  authorized: boolean;
  user?: User;
  method?: "supabase" | "legacy";
}

export async function authorizeAdmin(
  request: Request,
): Promise<AdminAuthorization> {
  if (!isAdminServiceConfigured()) return { authorized: false };

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token) {
      const { data, error } = await createAdminClient().auth.getUser(token);
      if (!error && data.user?.app_metadata?.role === "admin") {
        return {
          authorized: true,
          user: data.user,
          method: "supabase",
        };
      }
    }
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(ADMIN_SESSION_COOKIE.length + 1);
  if (cookie && safeEqual(cookie, legacyAdminSessionToken())) {
    return { authorized: true, method: "legacy" };
  }

  return { authorized: false };
}

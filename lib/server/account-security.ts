import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SecurityEvent {
  actorUserId?: string | null;
  targetUserId?: string | null;
  eventType: string;
  status: "success" | "failed" | "blocked";
  request?: Request;
  details?: Record<string, unknown>;
}

export function hashSecurityValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getRequestFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const address = forwarded.split(",")[0]?.trim() || "unknown";
  const agent = request.headers.get("user-agent") || "unknown";
  return hashSecurityValue(`${address}|${agent}`);
}

export async function recordSecurityEvent(
  admin: SupabaseClient,
  event: SecurityEvent,
) {
  const payload = {
    actor_user_id: event.actorUserId || null,
    target_user_id: event.targetUserId || null,
    event_type: event.eventType,
    status: event.status,
    request_fingerprint: event.request
      ? getRequestFingerprint(event.request)
      : null,
    details: event.details || {},
  };

  // Structured Vercel logs remain useful if the optional audit-table migration
  // has not been applied yet.
  console.info("account_security_event", payload);

  const { error } = await admin.from("account_security_events").insert(payload);
  if (
    error &&
    !/account_security_events|schema cache|does not exist/i.test(error.message)
  ) {
    console.warn("account_security_event_insert_failed", error.message);
  }
}

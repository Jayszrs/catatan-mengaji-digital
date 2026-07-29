export const MANAGED_ACCOUNT_DOMAIN = "akun.catatan-mengaji-digital.id";

export function normalizeUsername(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function isValidUsername(username: string) {
  return /^[a-z0-9][a-z0-9._-]{2,29}$/.test(username);
}

export function usernameToManagedEmail(username: string) {
  return `${normalizeUsername(username)}@${MANAGED_ACCOUNT_DOMAIN}`;
}

export function isManagedAccountEmail(email?: string | null) {
  return Boolean(
    email?.toLowerCase().endsWith(`@${MANAGED_ACCOUNT_DOMAIN}`),
  );
}

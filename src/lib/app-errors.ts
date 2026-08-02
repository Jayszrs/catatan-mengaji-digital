interface ErrorLike {
  code?: string;
  message?: string;
}

const readError = (error: unknown): ErrorLike => {
  if (error instanceof Error) return { message: error.message };
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    return {
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      message:
        typeof candidate.message === "string" ? candidate.message : undefined,
    };
  }
  return {};
};

export function isMissingDatabaseFeatureError(error: unknown) {
  const { code, message } = readError(error);
  const normalized = (message || "").toLowerCase();
  return (
    code === "PGRST204" ||
    code === "PGRST205" ||
    code === "42P01" ||
    code === "42703" ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    normalized.includes("could not find the function") ||
    normalized.includes("could not find the") &&
      normalized.includes("column")
  );
}

export function getAppErrorMessage(error: unknown, fallback: string) {
  const { code, message } = readError(error);
  const normalized = (message || "").toLowerCase();

  if (isMissingDatabaseFeatureError(error)) {
    return "Fitur database belum diaktifkan. Jalankan migrasi Supabase production terlebih dahulu.";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("email rate limit exceeded") ||
    code === "over_email_send_rate_limit"
  ) {
    return "Batas pengiriman email tercapai. Tunggu sekitar 60 menit, lalu kirim satu kali lagi.";
  }

  if (normalized.includes("otp_expired") || normalized.includes("expired")) {
    return "Tautan sudah kedaluwarsa. Minta satu email baru dan gunakan link terbaru.";
  }

  return message || fallback;
}

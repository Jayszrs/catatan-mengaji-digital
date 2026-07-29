"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface ReportDatePickerProps {
  value: string;
  availableDates: string[];
  onChange: (value: string) => void;
  loading?: boolean;
}

function formatDate(value: string) {
  if (!value) return "Pilih tanggal laporan";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function ReportDatePicker({
  value,
  availableDates,
  onChange,
  loading = false,
}: ReportDatePickerProps) {
  const dates = Array.from(new Set(availableDates)).sort((left, right) =>
    right.localeCompare(left),
  );
  const currentIndex = dates.indexOf(value);
  const olderDate =
    currentIndex >= 0
      ? dates[currentIndex + 1]
      : dates.find((date) => date < value);
  const newerDate =
    currentIndex > 0
      ? dates[currentIndex - 1]
      : [...dates].reverse().find((date) => date > value);
  const hasReport = Boolean(value && dates.includes(value));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => olderDate && onChange(olderDate)}
          disabled={!olderDate || loading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Buka tanggal laporan yang lebih lama"
          title="Laporan lebih lama"
        >
          <ChevronLeft size={18} />
        </button>

        <label className="relative flex min-w-[190px] flex-1 cursor-pointer items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
          {loading ? (
            <Loader2 className="shrink-0 animate-spin text-emerald-700" size={18} />
          ) : (
            <CalendarDays className="shrink-0 text-emerald-700" size={18} />
          )}
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
              Tanggal rapor
            </span>
            <span className="block truncate text-sm font-black text-emerald-800">
              {formatDate(value)}
            </span>
          </span>
          <input
            type="date"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Pilih tanggal rapor harian"
          />
        </label>

        <button
          type="button"
          onClick={() => newerDate && onChange(newerDate)}
          disabled={!newerDate || loading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Buka tanggal laporan yang lebih baru"
          title="Laporan lebih baru"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p
        className={`px-2 pt-1.5 text-[10px] font-bold ${
          value && !hasReport ? "text-amber-600" : "text-gray-400"
        }`}
      >
        {loading
          ? "Memuat laporan pada tanggal pilihan..."
          : value && !hasReport
            ? "Kalender aktif. Data tanggal ini sedang diperiksa."
            : dates.length > 0
              ? `${dates.length} tanggal laporan tersedia · gunakan kalender untuk bulan atau tahun lain`
              : "Gunakan kalender untuk mencari laporan lama"}
      </p>
    </div>
  );
}

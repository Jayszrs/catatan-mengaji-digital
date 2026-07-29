"use client";

import { CalendarDays, Loader2 } from "lucide-react";
import { useRef } from "react";

interface ReportDatePickerProps {
  value: string;
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
  onChange,
  loading = false,
}: ReportDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openCalendar = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.focus();
      input.click();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openCalendar}
        disabled={loading}
        className="inline-flex min-h-12 min-w-[220px] cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-70"
        aria-label={`Buka kalender tanggal rapor. Tanggal aktif ${formatDate(value)}`}
      >
        {loading ? (
          <Loader2 className="shrink-0 animate-spin text-emerald-700" size={19} />
        ) : (
          <CalendarDays className="shrink-0 text-emerald-700" size={19} />
        )}
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
            Tanggal rapor
          </span>
          <span className="block truncate text-sm font-black text-emerald-800">
            {loading ? "Memuat..." : formatDate(value)}
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-label="Pilih tanggal rapor harian"
      />
    </>
  );
}

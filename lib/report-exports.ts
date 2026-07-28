"use client";

import * as XLSX from "xlsx";

const safeName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();

export interface DailyReportExportRow {
  tanggal?: string;
  status_presensi?: string;
  kegiatan?: string | null;
  ringkasan_tadarus?: string | null;
  ringkasan_hafalan?: string | null;
  catatan_guru?: string | null;
}

export function downloadDailyReports(
  studentName: string,
  rows: DailyReportExportRow[],
) {
  if (rows.length === 0) throw new Error("Belum ada laporan harian untuk diunduh.");

  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row, index) => ({
      No: index + 1,
      Tanggal: row.tanggal || "-",
      Presensi: row.status_presensi || "-",
      Kegiatan: row.kegiatan || "-",
      Tadarus: row.ringkasan_tadarus || "-",
      Hafalan: row.ringkasan_hafalan || "-",
      "Catatan Guru": row.catatan_guru || "-",
    })),
  );
  sheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 30 },
    { wch: 30 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Laporan Harian");
  XLSX.writeFile(
    workbook,
    `laporan-harian-${safeName(studentName || "siswa")}.xlsx`,
  );
}

export interface LevelExamExportRow {
  tanggal?: string;
  level_asal?: number;
  level_tujuan?: number;
  nilai_kelancaran?: number;
  nilai_makhraj?: number;
  nilai_tajwid?: number;
  nilai_hafalan?: number;
  nilai_rata_rata?: number;
  status?: string;
  tahun_ajaran?: string;
  catatan_guru?: string | null;
}

export function downloadLevelExamReports(
  studentName: string,
  rows: LevelExamExportRow[],
) {
  if (rows.length === 0) throw new Error("Belum ada hasil ujian level untuk diunduh.");

  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row, index) => ({
      No: index + 1,
      Tanggal: row.tanggal || "-",
      "Level Asal": row.level_asal ?? "-",
      "Level Tujuan": row.level_tujuan ?? "-",
      Kelancaran: row.nilai_kelancaran ?? "-",
      Makhraj: row.nilai_makhraj ?? "-",
      Tajwid: row.nilai_tajwid ?? "-",
      Hafalan: row.nilai_hafalan ?? "-",
      "Rata-rata": row.nilai_rata_rata ?? "-",
      Status: row.status || "-",
      "Tahun Ajaran": row.tahun_ajaran || "-",
      "Catatan Guru": row.catatan_guru || "-",
    })),
  );
  sheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Ujian Kenaikan Level");
  XLSX.writeFile(
    workbook,
    `rapor-ujian-level-${safeName(studentName || "siswa")}.xlsx`,
  );
}

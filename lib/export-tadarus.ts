"use client";

import * as XLSX from "xlsx";

interface TadarusExportRow {
  tanggal?: string;
  nama_surah?: string;
  hal_ayat?: string;
  keterangan?: string;
}

const safeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();

export function downloadTadarusHarian(
  studentName: string,
  rows: TadarusExportRow[],
) {
  if (rows.length === 0) {
    throw new Error("Belum ada data tadarus yang dapat diunduh.");
  }

  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row, index) => ({
      No: index + 1,
      Tanggal: row.tanggal || "-",
      "Nama Surah": row.nama_surah || "-",
      "Halaman / Ayat": row.hal_ayat || "-",
      Keterangan: row.keterangan || "-",
    })),
  );

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tadarus Harian");
  XLSX.writeFile(
    workbook,
    `tadarus-harian-${safeFileName(studentName || "siswa")}.xlsx`,
  );
}

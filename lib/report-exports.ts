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

export interface DailyMemorizationExportRow {
  tanggal?: string;
  nama_surah?: string;
  ayat?: string;
  murojaah?: string | null;
  nilai?: number | null;
  nilai_kelancaran?: number | null;
  nilai_makhraj?: number | null;
  nilai_tajwid?: number | null;
  nilai_hafalan?: number | null;
  nilai_rata_rata?: number | null;
  keterangan?: string | null;
}

export function downloadDailyMemorizationReports(
  studentName: string,
  rows: DailyMemorizationExportRow[],
) {
  if (rows.length === 0) throw new Error("Belum ada nilai hafalan harian untuk diunduh.");
  const sheet = XLSX.utils.json_to_sheet(rows.map((row, index) => ({
    No: index + 1,
    Tanggal: row.tanggal || "-",
    Surah: row.nama_surah || "-",
    Ayat: row.ayat || "-",
    Murojaah: row.murojaah || "-",
    Kelancaran: row.nilai_kelancaran ?? row.nilai ?? "-",
    Makhraj: row.nilai_makhraj ?? row.nilai ?? "-",
    Tajwid: row.nilai_tajwid ?? row.nilai ?? "-",
    Hafalan: row.nilai_hafalan ?? row.nilai ?? "-",
    "Rata-rata": row.nilai_rata_rata ?? row.nilai ?? "-",
    Keterangan: row.keterangan || "-",
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Hafalan Harian");
  XLSX.writeFile(workbook, `hafalan-harian-${safeName(studentName || "siswa")}.xlsx`);
}

export function downloadCompleteDailyReport(
  studentName: string,
  reports: DailyReportExportRow[],
  memorization: DailyMemorizationExportRow[],
) {
  if (reports.length === 0 && memorization.length === 0) {
    throw new Error("Belum ada laporan harian untuk diunduh.");
  }

  const workbook = XLSX.utils.book_new();

  if (reports.length > 0) {
    const reportSheet = XLSX.utils.json_to_sheet(
      reports.map((row, index) => ({
        No: index + 1,
        Tanggal: row.tanggal || "-",
        Presensi: row.status_presensi || "-",
        Kegiatan: row.kegiatan || "-",
        Tadarus: row.ringkasan_tadarus || "-",
        Hafalan: row.ringkasan_hafalan || "-",
        "Catatan Guru": row.catatan_guru || "-",
      })),
    );
    XLSX.utils.book_append_sheet(workbook, reportSheet, "Laporan Harian");
  }

  if (memorization.length > 0) {
    const memorizationSheet = XLSX.utils.json_to_sheet(
      memorization.map((row, index) => ({
        No: index + 1,
        Tanggal: row.tanggal || "-",
        Surah: row.nama_surah || "-",
        Ayat: row.ayat || "-",
        Murojaah: row.murojaah || "-",
        Kelancaran: row.nilai_kelancaran ?? row.nilai ?? "-",
        Makhraj: row.nilai_makhraj ?? row.nilai ?? "-",
        Tajwid: row.nilai_tajwid ?? row.nilai ?? "-",
        Hafalan: row.nilai_hafalan ?? row.nilai ?? "-",
        "Rata-rata": row.nilai_rata_rata ?? row.nilai ?? "-",
        Keterangan: row.keterangan || "-",
      })),
    );
    XLSX.utils.book_append_sheet(
      workbook,
      memorizationSheet,
      "Tahsin dan Tahfidz",
    );
  }

  const reportDate =
    reports[0]?.tanggal || memorization[0]?.tanggal || "harian";
  XLSX.writeFile(
    workbook,
    `rapor-harian-${safeName(studentName || "siswa")}-${reportDate}.xlsx`,
  );
}

export interface MunaqosyahExportRow {
  tanggal?: string;
  hasil_ujian?: {
    nilaiRataRata?: number;
    kategoriMunaqosyah?: { indo?: string };
    rowsMunaqosyah?: Array<{ label?: string; angka?: number }>;
  };
  catatan_guru?: string | null;
}

export function downloadMunaqosyahReport(studentName: string, row?: MunaqosyahExportRow) {
  if (!row) throw new Error("Belum ada hasil Munaqosyah untuk diunduh.");
  const scores = row.hasil_ujian?.rowsMunaqosyah || [];
  const score = (label: string, index: number) =>
    scores.find((item) => item.label?.toLowerCase() === label.toLowerCase())?.angka ??
    scores[index]?.angka ??
    "-";
  const sheet = XLSX.utils.json_to_sheet([{
    Tanggal: row.tanggal || "-",
    Kelancaran: score("Kelancaran", 0),
    Makhraj: score("Makhraj", 1),
    Tajwid: score("Tajwid", 2),
    Hafalan: score("Hafalan", 3),
    "Rata-rata": row.hasil_ujian?.nilaiRataRata ?? "-",
    Predikat: row.hasil_ujian?.kategoriMunaqosyah?.indo || "-",
    "Catatan Guru": row.catatan_guru || "-",
  }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Munaqosyah");
  XLSX.writeFile(workbook, `rapor-munaqosyah-${safeName(studentName || "siswa")}.xlsx`);
}

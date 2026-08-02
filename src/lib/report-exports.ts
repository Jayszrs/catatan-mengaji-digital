"use client";

import * as XLSX from "xlsx";
import { getTahfidzLevelLabel } from "@/lib/tahfidz-levels";
import { numberToIndonesianDecimalWords } from "@/lib/munaqosyah";

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
  nama_surah?: string | null;
  nilai_kelancaran?: number;
  nilai_makhraj?: number;
  nilai_tajwid?: number;
  nilai_hafalan?: number;
  nilai_rata_rata?: number;
  status?: string;
  tahun_ajaran?: string;
  catatan_guru?: string | null;
}

export interface LevelExamStudentInfo {
  nis?: string | null;
  kelas?: string | null;
}

export function downloadLevelExamReports(
  studentName: string,
  rows: LevelExamExportRow[],
  student?: LevelExamStudentInfo,
) {
  if (rows.length === 0) throw new Error("Belum ada hasil ujian level untuk diunduh.");

  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row, index) => {
      const scores = [
        row.nilai_kelancaran,
        row.nilai_makhraj,
        row.nilai_tajwid,
        row.nilai_hafalan,
      ];
      const total = scores.reduce<number>(
        (sum, value) => sum + (Number(value) || 0),
        0,
      );
      const scoreDescription = (value?: number) =>
        value === undefined
          ? "-"
          : value >= 75
            ? "Tercapai"
            : "Perlu Bimbingan";
      const category = row.status === "Lulus" ? "Naik" : "Tidak Naik";

      return {
        No: index + 1,
        "Nama Peserta Didik": studentName,
        "NIS/NISN": student?.nis || "-",
        Kelas: student?.kelas || "-",
        Level: getTahfidzLevelLabel(row.level_asal),
        "Surat Ujian": row.nama_surah || "-",
        Tanggal: row.tanggal || "-",
        "Kelancaran Nilai": row.nilai_kelancaran ?? "-",
        "Kelancaran Terbilang":
          row.nilai_kelancaran === undefined
            ? "-"
            : numberToIndonesianDecimalWords(row.nilai_kelancaran),
        "Kelancaran Keterangan": scoreDescription(row.nilai_kelancaran),
        "Makhorijul Huruf Nilai": row.nilai_makhraj ?? "-",
        "Makhorijul Huruf Terbilang":
          row.nilai_makhraj === undefined
            ? "-"
            : numberToIndonesianDecimalWords(row.nilai_makhraj),
        "Makhorijul Huruf Keterangan": scoreDescription(row.nilai_makhraj),
        "Hukum Tajwid Nilai": row.nilai_tajwid ?? "-",
        "Hukum Tajwid Terbilang":
          row.nilai_tajwid === undefined
            ? "-"
            : numberToIndonesianDecimalWords(row.nilai_tajwid),
        "Hukum Tajwid Keterangan": scoreDescription(row.nilai_tajwid),
        "Sambung Ayat Nilai": row.nilai_hafalan ?? "-",
        "Sambung Ayat Terbilang":
          row.nilai_hafalan === undefined
            ? "-"
            : numberToIndonesianDecimalWords(row.nilai_hafalan),
        "Sambung Ayat Keterangan": scoreDescription(row.nilai_hafalan),
        Jumlah: Number(total.toFixed(2)),
        "Rata-rata": row.nilai_rata_rata ?? "-",
        Kategori: category,
        "Naik Level":
          row.status === "Lulus"
            ? `Naik ke ${getTahfidzLevelLabel(row.level_tujuan)}`
            : "Mengulang",
        "Tahun Ajaran": row.tahun_ajaran || "-",
        "Catatan Guru": row.catatan_guru || "-",
      };
    }),
  );
  sheet["!cols"] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 18 },
    { wch: 10 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 12 },
    { wch: 28 },
    { wch: 20 },
    { wch: 12 },
    { wch: 28 },
    { wch: 20 },
    { wch: 12 },
    { wch: 28 },
    { wch: 20 },
    { wch: 12 },
    { wch: 28 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
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
  tahun_ajaran?: string | null;
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
    "Tahun Ajaran": row.tahun_ajaran || "-",
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
        "Tahun Ajaran": row.tahun_ajaran || "-",
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
    juz?: string;
    nilaiRataRata?: number;
    kategoriMunaqosyah?: { indo?: string; arab?: string };
    jumlahMunaqosyah?: {
      angka?: number | string;
      huruf?: string;
      arab?: string;
    };
    rowsMunaqosyah?: Array<{
      label?: string;
      angka?: number;
      huruf?: string;
      arab_angka?: string;
      arab_huruf?: string;
    }>;
    kepribadianMunaqosyah?: {
      akhlaq?: { nilai?: string; arab?: string };
      kedisiplinan?: { nilai?: string; arab?: string };
      kerapihan?: { nilai?: string; arab?: string };
    };
  };
  catatan_guru?: string | null;
}

export function downloadMunaqosyahReport(studentName: string, row?: MunaqosyahExportRow) {
  if (!row) throw new Error("Belum ada hasil Munaqosyah untuk diunduh.");
  const result = row.hasil_ujian;
  const scores = result?.rowsMunaqosyah || [];
  const score = (labels: string[], index: number) =>
    scores.find((item) =>
      labels.includes((item.label || "").toLowerCase()),
    ) || scores[index];
  const kelancaran = score(["kelancaran"], 0);
  const makhorijul = score(["makhorijul huruf", "makhraj"], 1);
  const tajwid = score(["hukum tajwid", "tajwid"], 2);
  const sambungAyat = score(["sambung ayat", "hafalan"], 3);
  const personality = result?.kepribadianMunaqosyah;
  const sheet = XLSX.utils.json_to_sheet([{
    Tanggal: row.tanggal || "-",
    Juz: result?.juz || "-",
    "Kategori Nilai": result?.kategoriMunaqosyah?.indo || "-",
    "Kategori Nilai Arab": result?.kategoriMunaqosyah?.arab || "-",
    "Kelancaran Angka": kelancaran?.angka ?? "-",
    "Kelancaran Huruf": kelancaran?.huruf || "-",
    "Kelancaran Angka Arab": kelancaran?.arab_angka || "-",
    "Kelancaran Huruf Arab": kelancaran?.arab_huruf || "-",
    "Makhorijul Huruf Angka": makhorijul?.angka ?? "-",
    "Makhorijul Huruf": makhorijul?.huruf || "-",
    "Makhorijul Huruf Angka Arab": makhorijul?.arab_angka || "-",
    "Makhorijul Huruf Arab": makhorijul?.arab_huruf || "-",
    "Hukum Tajwid Angka": tajwid?.angka ?? "-",
    "Hukum Tajwid Huruf": tajwid?.huruf || "-",
    "Hukum Tajwid Angka Arab": tajwid?.arab_angka || "-",
    "Hukum Tajwid Huruf Arab": tajwid?.arab_huruf || "-",
    "Sambung Ayat Angka": sambungAyat?.angka ?? "-",
    "Sambung Ayat Huruf": sambungAyat?.huruf || "-",
    "Sambung Ayat Angka Arab": sambungAyat?.arab_angka || "-",
    "Sambung Ayat Huruf Arab": sambungAyat?.arab_huruf || "-",
    "Jumlah Nilai": result?.jumlahMunaqosyah?.angka ?? "-",
    "Jumlah Nilai Huruf": result?.jumlahMunaqosyah?.huruf || "-",
    "Jumlah Nilai Arab": result?.jumlahMunaqosyah?.arab || "-",
    "Rata-rata": result?.nilaiRataRata ?? "-",
    Akhlaq: personality?.akhlaq?.nilai || "-",
    "Akhlaq Arab": personality?.akhlaq?.arab || "-",
    Kedisiplinan: personality?.kedisiplinan?.nilai || "-",
    "Kedisiplinan Arab": personality?.kedisiplinan?.arab || "-",
    Kerapihan: personality?.kerapihan?.nilai || "-",
    "Kerapihan Arab": personality?.kerapihan?.arab || "-",
    "Catatan Guru": row.catatan_guru || "-",
  }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Munaqosyah");
  XLSX.writeFile(workbook, `rapor-munaqosyah-${safeName(studentName || "siswa")}.xlsx`);
}

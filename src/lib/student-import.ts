import * as XLSX from "xlsx";

export interface ImportedStudentRow {
  nama_lengkap: string;
  nis: string;
  jenis_kelamin: string;
  nik: string;
  tempat_tanggal_lahir: string;
  nama_ayah: string;
  nama_ibu: string;
  wali_murid: string;
  alamat: string;
  no_telp: string;
  kelas: string;
  level: string;
}

export interface StudentWorksheetResult {
  rows: ImportedStudentRow[];
  headerRowNumber: number;
  detectedHeaders: string[];
  defaultClass: string;
  skippedRows: number;
}

const headerAliases = {
  name: ["Nama Peserta Didik", "Nama Lengkap", "Nama Siswa", "Nama"],
  nis: ["NIS", "NISN", "Nomor Induk Siswa", "No Induk"],
  gender: ["L/P", "LP", "Jenis Kelamin", "JK"],
  nik: ["NIK", "Nomor Induk Kependudukan"],
  birth: [
    "Tempat/Tanggal Lahir",
    "Tempat, Tanggal Lahir",
    "Tempat Tanggal Lahir",
    "TTL",
  ],
  father: ["Ayah", "Nama Ayah"],
  mother: ["Ibu", "Nama Ibu"],
  guardian: ["Wali Murid", "Orang Tua", "Nama Wali Murid", "Nama Wali"],
  address: ["Alamat", "Alamat Lengkap"],
  phone: [
    "Nomor Telepon",
    "No Telepon",
    "No Telp",
    "No HP",
    "WhatsApp",
    "Whatsapp",
  ],
  className: ["Kelas", "Rombel"],
  level: ["Level", "Jenjang", "Jenjang Tahfidz"],
} as const;

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const normalizedAliases = Object.fromEntries(
  Object.entries(headerAliases).map(([key, aliases]) => [
    key,
    aliases.map(normalizeHeader),
  ]),
) as Record<keyof typeof headerAliases, string[]>;

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/^'+/, "")
    .trim();
}

function getRowValue(
  row: Record<string, unknown>,
  aliasKey: keyof typeof headerAliases,
) {
  const aliases = normalizedAliases[aliasKey];
  const entry = Object.entries(row).find(([key]) =>
    aliases.includes(normalizeHeader(key)),
  );
  return cleanText(entry?.[1]);
}

function normalizeGender(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === "L" || normalized.startsWith("LAKI")) return "L";
  if (normalized === "P" || normalized.startsWith("PEREMPUAN")) return "P";
  return "";
}

function normalizePhone(value: string) {
  return value.replace(/'/g, "").replace(/\s{2,}/g, " / ").trim();
}

function detectHeaderRow(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const headers = row.map(normalizeHeader).filter(Boolean);
    const hasName = headers.some((header) =>
      normalizedAliases.name.includes(header),
    );
    const hasNis = headers.some((header) =>
      normalizedAliases.nis.includes(header),
    );
    const recognizedColumns = Object.values(normalizedAliases).filter(
      (aliases) => headers.some((header) => aliases.includes(header)),
    ).length;
    return hasName && (hasNis || recognizedColumns >= 3);
  });
}

function detectClass(rows: unknown[][], headerRowIndex: number) {
  const titleText = rows
    .slice(0, Math.max(headerRowIndex, 0))
    .flat()
    .map(cleanText)
    .filter(Boolean)
    .join(" ");
  const match = titleText.match(/\bkelas\s*([1-6])\b/i);
  return match?.[1] || "1";
}

export function parseStudentWorksheet(
  worksheet: XLSX.WorkSheet,
): StudentWorksheetResult {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const headerRowIndex = detectHeaderRow(matrix);

  if (headerRowIndex < 0) {
    throw new Error(
      "Header data siswa tidak ditemukan. Pastikan file memiliki kolom Nama Peserta Didik atau Nama Lengkap.",
    );
  }

  const detectedHeaders = matrix[headerRowIndex].map(cleanText).filter(Boolean);
  const defaultClass = detectClass(matrix, headerRowIndex);
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    range: headerRowIndex,
    defval: "",
    raw: false,
  });

  let skippedRows = 0;
  const rows = rawRows.flatMap<ImportedStudentRow>((row) => {
    const namaLengkap = getRowValue(row, "name");
    const hasAnyValue = Object.values(row).some(
      (value) => cleanText(value) !== "",
    );
    if (!namaLengkap) {
      if (hasAnyValue) skippedRows += 1;
      return [];
    }

    const namaAyah = getRowValue(row, "father");
    const namaIbu = getRowValue(row, "mother");
    const guardian =
      getRowValue(row, "guardian") ||
      [namaAyah, namaIbu].filter(Boolean).join(" / ");

    return [
      {
        nama_lengkap: namaLengkap,
        nis: getRowValue(row, "nis"),
        jenis_kelamin: normalizeGender(getRowValue(row, "gender")),
        nik: getRowValue(row, "nik"),
        tempat_tanggal_lahir: getRowValue(row, "birth"),
        nama_ayah: namaAyah,
        nama_ibu: namaIbu,
        wali_murid: guardian,
        alamat: getRowValue(row, "address"),
        no_telp: normalizePhone(getRowValue(row, "phone")),
        kelas: getRowValue(row, "className") || defaultClass,
        level: getRowValue(row, "level") || "1",
      },
    ];
  });

  if (rows.length === 0) {
    throw new Error(
      `Header ditemukan pada baris ${headerRowIndex + 1}, tetapi tidak ada nama siswa yang dapat dibaca.`,
    );
  }

  return {
    rows,
    headerRowNumber: headerRowIndex + 1,
    detectedHeaders,
    defaultClass,
    skippedRows,
  };
}

export const MUNAQOSYAH_CRITERIA = [
  { key: "kelancaran", label: "Kelancaran" },
  { key: "makhorijul", label: "Makhorijul Huruf" },
  { key: "tajwid", label: "Hukum Tajwid" },
  { key: "sambung", label: "Sambung Ayat" },
] as const;

export const MUNAQOSYAH_PERSONALITY_OPTIONS = [
  { value: "A", label: "Sangat Baik", arab: "ممتاز" },
  { value: "B", label: "Baik", arab: "جيد" },
  { value: "C", label: "Cukup", arab: "مقبول" },
  { value: "D", label: "Perlu Bimbingan", arab: "يحتاج إلى التوجيه" },
] as const;

export interface MunaqosyahScoreRow {
  label: string;
  angka: number;
  huruf: string;
  arab_angka: string;
  arab_huruf: string;
}

export interface MunaqosyahPersonalityValue {
  nilai: string;
  arab: string;
}

export interface MunaqosyahPersonality {
  akhlaq: MunaqosyahPersonalityValue;
  kedisiplinan: MunaqosyahPersonalityValue;
  kerapihan: MunaqosyahPersonalityValue;
}

const INDONESIAN_UNITS = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
] as const;

const ARABIC_UNITS = [
  "صفر",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
] as const;

const ARABIC_TEENS = [
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
] as const;

const ARABIC_TENS: Record<number, string> = {
  20: "عشرون",
  30: "ثلاثون",
  40: "أربعون",
  50: "خمسون",
  60: "ستون",
  70: "سبعون",
  80: "ثمانون",
  90: "تسعون",
};

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function indonesianWords(value: number): string {
  if (value === 0) return "nol";
  if (value < 10) return INDONESIAN_UNITS[value];
  if (value === 10) return "sepuluh";
  if (value === 11) return "sebelas";
  if (value < 20) return `${INDONESIAN_UNITS[value - 10]} belas`;
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const remainder = value % 10;
    return `${INDONESIAN_UNITS[tens]} puluh${remainder ? ` ${indonesianWords(remainder)}` : ""}`;
  }
  if (value === 100) return "seratus";
  if (value < 200) return `seratus ${indonesianWords(value - 100)}`;
  if (value < 1000) {
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    return `${INDONESIAN_UNITS[hundreds]} ratus${remainder ? ` ${indonesianWords(remainder)}` : ""}`;
  }
  return String(value);
}

export function numberToIndonesianWords(value: number) {
  return capitalize(indonesianWords(Math.round(value)));
}

export function toArabicIndicDigits(value: number | string) {
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

export function numberToArabicWords(value: number) {
  const rounded = Math.round(value);
  if (rounded >= 0 && rounded < 10) return ARABIC_UNITS[rounded];
  if (rounded >= 10 && rounded < 20) return ARABIC_TEENS[rounded - 10];
  if (rounded < 100) {
    const tens = Math.floor(rounded / 10) * 10;
    const remainder = rounded % 10;
    return remainder
      ? `${ARABIC_UNITS[remainder]} و${ARABIC_TENS[tens]}`
      : ARABIC_TENS[tens];
  }
  if (rounded === 100) return "مائة";
  return toArabicIndicDigits(rounded);
}

export function getMunaqosyahPredicate(average: number) {
  if (average >= 90) return { indo: "Mumtaz", arab: "ممتاز" };
  if (average >= 80) return { indo: "Jayyid Jiddan", arab: "جيد جدا" };
  if (average >= 65) return { indo: "Jayyid", arab: "جيد" };
  if (average >= 50) return { indo: "Maqbul", arab: "مقبول" };
  return { indo: "Perlu Bimbingan", arab: "يحتاج إلى التوجيه" };
}

export function buildMunaqosyahScoreRow(
  label: string,
  rawScore: string | number,
): MunaqosyahScoreRow {
  const score = Number(rawScore);
  const safeScore = Number.isFinite(score) ? Math.round(score) : 0;
  return {
    label,
    angka: safeScore,
    huruf: numberToIndonesianWords(safeScore),
    arab_angka: toArabicIndicDigits(safeScore),
    arab_huruf: numberToArabicWords(safeScore),
  };
}

export function getPersonalityValue(value: string): MunaqosyahPersonalityValue {
  const option =
    MUNAQOSYAH_PERSONALITY_OPTIONS.find((item) => item.value === value) ||
    MUNAQOSYAH_PERSONALITY_OPTIONS[1];
  return { nilai: option.value, arab: option.arab };
}

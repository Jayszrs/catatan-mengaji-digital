export const TAHFIDZ_LEVELS = [
  { value: 1, label: "Level 1" },
  { value: 2, label: "Level 2" },
  { value: 3, label: "Level 3" },
  { value: 4, label: "Level 4" },
  { value: 5, label: "Level 5" },
  { value: 6, label: "Level 6" },
  { value: 7, label: "Mustawa Muttawasit 1" },
  { value: 8, label: "Mustawa Muttawasit 2" },
  { value: 9, label: "Mustawa Muttawasit 3" },
] as const;

export const MAX_TAHFIDZ_LEVEL =
  TAHFIDZ_LEVELS[TAHFIDZ_LEVELS.length - 1].value;

export function getTahfidzLevelLabel(
  value?: number | string | null,
  fallback = "-",
) {
  if (value === null || value === undefined || value === "") return fallback;
  const numericValue = Number(value);
  return (
    TAHFIDZ_LEVELS.find((level) => level.value === numericValue)?.label ||
    `Level ${value}`
  );
}

export function getCurrentAcademicYear(date = new Date()) {
  const year = date.getFullYear();
  const startsThisYear = date.getMonth() >= 6;
  const startYear = startsThisYear ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
}

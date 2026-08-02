export function normalizeClassName(value: unknown) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/KELAS/g, "")
    .replace(/[^1-6A-Z]/g, "");
  const match = normalized.match(/^([1-6])([A-Z])?/);
  if (!match) return "";
  return `${match[1]}${match[2] || "A"}`;
}

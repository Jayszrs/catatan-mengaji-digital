interface DatedRow {
  tanggal?: string;
}

export function getDailyReportDates(...collections: DatedRow[][]) {
  return Array.from(
    new Set(
      collections.flatMap((rows) =>
        rows.flatMap((row) => (row.tanggal ? [row.tanggal] : [])),
      ),
    ),
  ).sort((left, right) => right.localeCompare(left));
}

export function filterRowsByDate<T extends DatedRow>(
  rows: T[],
  selectedDate: string,
) {
  if (!selectedDate) return [];
  return rows.filter((row) => row.tanggal === selectedDate);
}

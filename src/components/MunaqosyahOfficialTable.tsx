import {
  getMunaqosyahCriterionLabel,
  numberToArabicWords,
  numberToIndonesianWords,
  toArabicIndicDigits,
} from "@/lib/munaqosyah";
import { MunaqosyahExportRow } from "@/lib/report-exports";

const personalityLabels: Record<string, string> = {
  A: "Sangat Baik",
  B: "Baik",
  C: "Cukup",
  D: "Perlu Bimbingan",
};

function formatAverage(value?: number | null) {
  return value === undefined || value === null
    ? "-"
    : Number(value).toFixed(2);
}

export function MunaqosyahOfficialTable({
  row,
}: {
  row?: MunaqosyahExportRow;
}) {
  const result = row?.hasil_ujian;
  const scores = result?.rowsMunaqosyah || [];
  const calculatedTotal = scores.reduce(
    (sum, score) => sum + (Number(score.angka) || 0),
    0,
  );
  const totalValue =
    result?.jumlahMunaqosyah?.angka === undefined
      ? calculatedTotal
      : Number(result.jumlahMunaqosyah.angka);
  const total = Number.isFinite(totalValue) ? totalValue : calculatedTotal;
  const personality = result?.kepribadianMunaqosyah;

  if (!row || scores.length === 0) {
    return (
      <div className="border border-black p-8 text-center font-bold text-gray-500">
        Belum ada hasil ujian Munaqosyah.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <table className="w-full border-collapse border border-black text-xs">
        <tbody>
          <tr>
            <th className="w-1/5 border border-black bg-gray-100 p-2 text-left">
              Juz
            </th>
            <td className="w-[13%] border border-black p-2 font-black">
              {result?.juz || "-"}
            </td>
            <th className="w-1/5 border border-black bg-gray-100 p-2 text-left">
              Kategori Nilai
            </th>
            <td className="border border-black p-2 font-black uppercase">
              {result?.kategoriMunaqosyah?.indo || "-"}
            </td>
            <td
              className="w-1/5 border border-black p-2 text-center text-base font-bold"
              dir="rtl"
            >
              {result?.kategoriMunaqosyah?.arab || "-"}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black text-center text-[11px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="w-10 border border-black p-2">No</th>
            <th className="border border-black p-2">Kriteria Penilaian</th>
            <th className="w-16 border border-black p-2">Angka</th>
            <th className="w-[28%] border border-black p-2">Huruf</th>
            <th className="w-20 border border-black p-2">Angka Arab</th>
            <th className="w-[24%] border border-black p-2">Huruf Arab</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => {
            const numericScore = Number(score.angka) || 0;
            return (
              <tr key={`${score.label || "nilai"}-${index}`} className="h-11">
                <td className="border border-black">{index + 1}</td>
                <td className="border border-black px-3 text-left font-bold">
                  {getMunaqosyahCriterionLabel(score.label, index)}
                </td>
                <td className="border border-black font-black">
                  {numericScore}
                </td>
                <td className="border border-black px-2 text-left">
                  {score.huruf || numberToIndonesianWords(numericScore)}
                </td>
                <td className="border border-black text-base font-black">
                  {score.arab_angka || toArabicIndicDigits(numericScore)}
                </td>
                <td
                  className="border border-black px-2 text-right text-sm"
                  dir="rtl"
                >
                  {score.arab_huruf || numberToArabicWords(numericScore)}
                </td>
              </tr>
            );
          })}
          <tr className="bg-gray-100 font-black">
            <td className="border border-black p-2 uppercase" colSpan={2}>
              Jumlah
            </td>
            <td className="border border-black bg-white">{total}</td>
            <td className="border border-black bg-white px-2 text-left font-medium">
              {result?.jumlahMunaqosyah?.huruf ||
                numberToIndonesianWords(total)}
            </td>
            <td className="border border-black bg-white text-base">
              {result?.jumlahMunaqosyah?.arab ||
                toArabicIndicDigits(total)}
            </td>
            <td className="border border-black bg-white">-</td>
          </tr>
          <tr className="bg-gray-100 font-black">
            <td className="border border-black p-2 uppercase" colSpan={2}>
              Nilai Akhir
            </td>
            <td className="border border-black bg-white" colSpan={2}>
              {formatAverage(result?.nilaiRataRata)}
            </td>
            <td
              className="border border-black bg-white uppercase"
              colSpan={2}
            >
              {result?.kategoriMunaqosyah?.indo || "-"}
            </td>
          </tr>
        </tbody>
      </table>

      <section>
        <h4 className="border border-b-0 border-black bg-gray-100 py-2 text-center text-xs font-black uppercase tracking-widest">
          Kepribadian
        </h4>
        <div className="grid grid-cols-3 border border-black text-center text-xs">
          {[
            ["Akhlaq", personality?.akhlaq],
            ["Kedisiplinan", personality?.kedisiplinan],
            ["Kerapihan", personality?.kerapihan],
          ].map(([label, value], index) => {
            const personalityValue = value as
              | { nilai?: string; arab?: string }
              | undefined;
            const grade = personalityValue?.nilai || "-";
            return (
              <div
                key={label as string}
                className={index < 2 ? "border-r border-black p-3" : "p-3"}
              >
                <p className="font-black uppercase">{label as string}</p>
                <p className="mt-1 font-bold">
                  {grade}
                  {grade !== "-"
                    ? ` – ${personalityLabels[grade] || grade}`
                    : ""}
                </p>
                <p className="mt-1 text-sm" dir="rtl">
                  {personalityValue?.arab || "-"}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

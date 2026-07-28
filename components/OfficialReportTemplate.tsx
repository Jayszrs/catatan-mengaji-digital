import {
  DailyMemorizationExportRow,
  DailyReportExportRow,
  LevelExamExportRow,
  MunaqosyahExportRow,
} from "@/lib/report-exports";

export type OfficialReportType = "daily" | "level" | "munaqosyah";

export interface OfficialReportStudent {
  nama_lengkap: string;
  nis?: string | null;
  kelas?: string | null;
  level?: number | string | null;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatScore(value?: number | null) {
  return value === undefined || value === null ? "-" : Number(value).toFixed(0);
}

export function OfficialReportTemplate({
  reportType,
  student,
  dailyReports,
  memorization,
  levels,
  munaq,
}: {
  reportType: OfficialReportType;
  student?: OfficialReportStudent;
  dailyReports: DailyReportExportRow[];
  memorization: DailyMemorizationExportRow[];
  levels: LevelExamExportRow[];
  munaq?: MunaqosyahExportRow;
}) {
  const latestDaily = dailyReports[0];
  const latestMemorization = memorization[0];
  const latestLevel = levels[0];
  const title =
    reportType === "daily"
      ? "Rapor Hafalan Harian"
      : reportType === "level"
        ? "Rapor Ujian Kenaikan Level"
        : "Lembar Munaqosyah";
  const period =
    reportType === "daily"
      ? formatDate(latestDaily?.tanggal || latestMemorization?.tanggal)
      : reportType === "level"
        ? latestLevel?.tahun_ajaran || formatDate(latestLevel?.tanggal)
        : formatDate(munaq?.tanggal);
  const reportDate =
    reportType === "daily"
      ? latestDaily?.tanggal || latestMemorization?.tanggal
      : reportType === "level"
        ? latestLevel?.tanggal
        : munaq?.tanggal;
  const teacherNote =
    reportType === "daily"
      ? latestDaily?.catatan_guru || latestMemorization?.keterangan
      : reportType === "level"
        ? latestLevel?.catatan_guru
        : munaq?.catatan_guru;

  return (
    <div className="w-full overflow-x-auto pb-8 print:overflow-visible print:pb-0">
      <article className="relative mx-auto min-h-[297mm] w-[210mm] min-w-[210mm] overflow-hidden bg-white p-[15mm] text-[13px] leading-relaxed text-gray-900 shadow-xl print:min-h-0 print:w-full print:min-w-0 print:p-[10mm] print:shadow-none">
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.06]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="h-[400px] w-[400px] object-contain mix-blend-multiply"
          />
        </div>

        <div className="relative z-10">
          <header className="mb-1 flex items-center justify-between border-b-2 border-black pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Logo SD Islam Labschool Bani Saleh"
              className="h-28 w-28 object-contain mix-blend-multiply"
            />
            <div className="flex-1 text-center">
              <p className="text-sm font-bold uppercase tracking-wider">
                Yayasan Bani Saleh
              </p>
              <h2 className="text-xl font-black uppercase tracking-wider text-[#1b4332]">
                Sekolah Dasar Islam Labschool Bani Saleh
              </h2>
              <h3 className="mt-1 text-xl font-bold uppercase tracking-widest">
                {title}
              </h3>
              <p className="mt-1 font-bold">
                NPSN: 70010942 <span className="ml-4">TERAKREDITASI: A</span>
              </p>
              <p className="mt-1 text-[10px] font-bold">
                Jl. Pangeran RT 001/008 Desa Lubang Buaya Kec. Setu Kab.
                Bekasi · sdilabschoolbanisalehsetu@gmail.com
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-tahsin.png"
              alt="Logo Tahsin Tahfizh"
              className="h-28 w-28 object-contain mix-blend-multiply"
            />
          </header>
          <div className="mb-6 w-full border-b-4 border-black" />

          <section className="mb-6 flex items-start justify-between font-bold">
            <table className="w-[48%]">
              <tbody>
                <tr>
                  <td className="w-36 py-1">Nama Peserta Didik</td>
                  <td className="w-4">:</td>
                  <td className="uppercase">{student?.nama_lengkap || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1">NIS</td>
                  <td>:</td>
                  <td>{student?.nis || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1">Kelas</td>
                  <td>:</td>
                  <td>{student?.kelas || "-"}</td>
                </tr>
              </tbody>
            </table>
            <table className="w-[42%]">
              <tbody>
                <tr>
                  <td className="w-28 py-1">Level Tahfizh</td>
                  <td className="w-4">:</td>
                  <td>{student?.level ? `Level ${student.level}` : "-"}</td>
                </tr>
                <tr>
                  <td className="py-1">Periode</td>
                  <td>:</td>
                  <td>{period}</td>
                </tr>
                <tr>
                  <td className="py-1">Sumber Nilai</td>
                  <td>:</td>
                  <td>Terisi Otomatis</td>
                </tr>
              </tbody>
            </table>
          </section>

          {reportType === "daily" && (
            <DailyReportTable
              reports={dailyReports}
              memorization={memorization}
            />
          )}
          {reportType === "level" && <LevelReportTable row={latestLevel} />}
          {reportType === "munaqosyah" && (
            <MunaqosyahReportTable row={munaq} />
          )}

          <section className="mb-10 mt-6 border border-black">
            <h4 className="border-b border-black bg-gray-100 py-2 text-center font-bold uppercase tracking-widest">
              Catatan Guru
            </h4>
            <p className="min-h-24 p-4 text-justify font-medium">
              {teacherNote || "Belum ada catatan guru."}
            </p>
          </section>

          <footer className="mt-8 flex justify-between text-sm">
            <div className="w-1/3 text-center">
              <p className="font-bold">Orang Tua/Wali</p>
              <div
                className="h-20"
                aria-label="Ruang tanda tangan Orang Tua atau Wali"
              />
              <div className="mx-auto w-48 border-b-2 border-dotted border-black" />
            </div>
            <div className="w-1/3 text-center">
              <p className="font-bold">Kepala Sekolah</p>
              <div
                className="h-20"
                aria-label="Ruang tanda tangan Kepala Sekolah"
              />
              <p className="font-bold underline">WIDI NURMARA, S.Pd.I</p>
            </div>
            <div className="w-1/3 text-center">
              <p>Dikeluarkan di : Bekasi</p>
              <p>Tanggal : {formatDate(reportDate)}</p>
              <p className="mt-3 font-bold">Koordinator Tahfizh</p>
              <div
                className="h-14"
                aria-label="Ruang tanda tangan Koordinator Tahfizh"
              />
              <p className="font-bold underline">ULFA DWI HASTUTI, S.LI</p>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}

function DailyReportTable({
  reports,
  memorization,
}: {
  reports: DailyReportExportRow[];
  memorization: DailyMemorizationExportRow[];
}) {
  return (
    <div className="space-y-5">
      <table className="w-full border-collapse border border-black text-center text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2">No</th>
            <th className="border border-black p-2">Tanggal</th>
            <th className="border border-black p-2">Presensi</th>
            <th className="border border-black p-2">Kegiatan</th>
            <th className="border border-black p-2">Tadarus</th>
            <th className="border border-black p-2">Hafalan</th>
          </tr>
        </thead>
        <tbody>
          {reports.length ? (
            reports.map((row, index) => (
              <tr key={`${row.tanggal}-${index}`} className="h-10">
                <td className="border border-black">{index + 1}</td>
                <td className="border border-black px-2">
                  {formatDate(row.tanggal)}
                </td>
                <td className="border border-black px-2 font-bold">
                  {row.status_presensi || "-"}
                </td>
                <td className="border border-black px-2 text-left">
                  {row.kegiatan || "-"}
                </td>
                <td className="border border-black px-2 text-left">
                  {row.ringkasan_tadarus || "-"}
                </td>
                <td className="border border-black px-2 text-left">
                  {row.ringkasan_hafalan || "-"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="border border-black p-8 font-bold text-gray-500"
                colSpan={6}
              >
                Belum ada Presensi &amp; Laporan Harian.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td className="border border-black p-2" colSpan={6}>
              Data otomatis dari form Presensi &amp; Laporan Harian
            </td>
          </tr>
        </tfoot>
      </table>

      {memorization.length > 0 && (
        <div>
          <h4 className="border border-b-0 border-black bg-gray-100 py-2 text-center font-bold uppercase">
            Penilaian Tahsin &amp; Tahfidz
          </h4>
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black p-2">Tanggal</th>
                <th className="border border-black p-2">Surah / Ayat</th>
                <th className="border border-black p-2">Kelancaran</th>
                <th className="border border-black p-2">Makhraj</th>
                <th className="border border-black p-2">Tajwid</th>
                <th className="border border-black p-2">Hafalan</th>
                <th className="border border-black p-2">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {memorization.map((row, index) => (
                <tr key={`${row.tanggal}-${index}`} className="h-10">
                  <td className="border border-black px-2">
                    {formatDate(row.tanggal)}
                  </td>
                  <td className="border border-black px-2 text-left">
                    {row.nama_surah || "-"} {row.ayat ? `· ${row.ayat}` : ""}
                  </td>
                  <td className="border border-black">
                    {formatScore(row.nilai_kelancaran ?? row.nilai)}
                  </td>
                  <td className="border border-black">
                    {formatScore(row.nilai_makhraj ?? row.nilai)}
                  </td>
                  <td className="border border-black">
                    {formatScore(row.nilai_tajwid ?? row.nilai)}
                  </td>
                  <td className="border border-black">
                    {formatScore(row.nilai_hafalan ?? row.nilai)}
                  </td>
                  <td className="border border-black font-bold">
                    {formatScore(row.nilai_rata_rata ?? row.nilai)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LevelReportTable({ row }: { row?: LevelExamExportRow }) {
  const scores = row
    ? ([
        ["Kelancaran", row.nilai_kelancaran],
        ["Makhraj", row.nilai_makhraj],
        ["Tajwid", row.nilai_tajwid],
        ["Hafalan", row.nilai_hafalan],
      ] as Array<[string, number | null | undefined]>)
    : [];

  return (
    <div>
      <table className="mb-5 w-full border-collapse border border-black">
        <tbody>
          <tr>
            <th className="w-1/4 border border-black bg-gray-100 p-3 text-left">
              Tanggal Ujian
            </th>
            <td className="w-1/4 border border-black p-3">
              {formatDate(row?.tanggal)}
            </td>
            <th className="w-1/4 border border-black bg-gray-100 p-3 text-left">
              Kenaikan Level
            </th>
            <td className="w-1/4 border border-black p-3 font-bold">
              {row
                ? `Level ${row.level_asal} → Level ${row.level_tujuan}`
                : "-"}
            </td>
          </tr>
          <tr>
            <th className="border border-black bg-gray-100 p-3 text-left">
              Tahun Ajaran
            </th>
            <td className="border border-black p-3">
              {row?.tahun_ajaran || "-"}
            </td>
            <th className="border border-black bg-gray-100 p-3 text-left">
              Hasil
            </th>
            <td className="border border-black p-3 font-black">
              {row?.status || "-"}
            </td>
          </tr>
        </tbody>
      </table>
      <ScoreTable
        rows={scores}
        average={row?.nilai_rata_rata}
        emptyMessage="Belum ada hasil ujian kenaikan level."
      />
    </div>
  );
}

function MunaqosyahReportTable({ row }: { row?: MunaqosyahExportRow }) {
  const sourceRows = row?.hasil_ujian?.rowsMunaqosyah || [];
  const fallbackLabels = ["Kelancaran", "Makhraj", "Tajwid", "Hafalan"];
  const scores = sourceRows.map(
    (score, index) =>
      [
        score.label || fallbackLabels[index] || `Komponen ${index + 1}`,
        score.angka,
      ] as [string, number | null | undefined],
  );

  return (
    <div>
      <ScoreTable
        rows={scores}
        average={row?.hasil_ujian?.nilaiRataRata}
        emptyMessage="Belum ada hasil ujian Munaqosyah."
      />
      <div className="mt-5 flex border border-black text-center font-bold">
        <span className="w-1/2 border-r border-black bg-gray-100 p-3 uppercase">
          Predikat
        </span>
        <span className="w-1/2 p-3 uppercase">
          {row?.hasil_ujian?.kategoriMunaqosyah?.indo || "-"}
        </span>
      </div>
    </div>
  );
}

function ScoreTable({
  rows,
  average,
  emptyMessage,
}: {
  rows: Array<[string, number | null | undefined]>;
  average?: number | null;
  emptyMessage: string;
}) {
  return (
    <table className="w-full border-collapse border border-black text-center">
      <thead>
        <tr className="bg-gray-100">
          <th className="w-16 border border-black p-2">No</th>
          <th className="border border-black p-2">Kriteria Penilaian</th>
          <th className="w-36 border border-black p-2">Nilai</th>
          <th className="w-40 border border-black p-2">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map(([label, value], index) => (
            <tr key={`${label}-${index}`} className="h-11">
              <td className="border border-black">{index + 1}</td>
              <td className="border border-black px-4 text-left">{label}</td>
              <td className="border border-black font-bold">
                {formatScore(value)}
              </td>
              <td className="border border-black">
                {value === undefined || value === null
                  ? "-"
                  : Number(value) >= 75
                    ? "Tercapai"
                    : "Perlu Bimbingan"}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              className="border border-black p-8 font-bold text-gray-500"
              colSpan={4}
            >
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
      <tfoot>
        <tr className="bg-gray-100 font-black">
          <td className="border border-black p-3 uppercase" colSpan={2}>
            Rata-rata
          </td>
          <td className="border border-black p-3">{formatScore(average)}</td>
          <td className="border border-black p-3">
            {average === undefined || average === null
              ? "-"
              : Number(average) >= 75
                ? "Lulus"
                : "Mengulang"}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

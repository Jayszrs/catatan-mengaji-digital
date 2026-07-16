"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchStudentByRouteKey } from "@/lib/students";
import { Printer, ArrowLeft, FileText, Award, Save, Loader2, CheckCircle2 } from "lucide-react";

export default function PrintReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const searchParams = useSearchParams();
  
  // Print Type
  const initialType = searchParams.get("type") as "rapor" | "munaqosyah" | null;
  const [printType, setPrintType] = useState<"rapor" | "munaqosyah">(initialType === "munaqosyah" ? "munaqosyah" : "rapor");

  // Editable fields before printing
  const [kelas, setKelas] = useState("V");
  const [juz, setJuz] = useState("29");
  const [semester, setSemester] = useState("2 (dua)");
  const [tahunAjaran, setTahunAjaran] = useState("2025/2026");
  
  // Table Data State - RAPOR
  const [rowsRapor, setRowsRapor] = useState([
    { surah: "Al-Mulk", kelancaran: "85", makhorijul: "80", tajwid: "80", sambung: "88", jumlah: "333", rata: "83", ket: "Tercapai" },
    { surah: "Muroja'ah Juz 30", kelancaran: "80", makhorijul: "80", tajwid: "80", sambung: "80", jumlah: "320", rata: "80", ket: "Tercapai" },
    { surah: "-", kelancaran: "-", makhorijul: "-", tajwid: "-", sambung: "-", jumlah: "-", rata: "-", ket: "-" },
    { surah: "-", kelancaran: "-", makhorijul: "-", tajwid: "-", sambung: "-", jumlah: "-", rata: "-", ket: "-" },
    { surah: "-", kelancaran: "-", makhorijul: "-", tajwid: "-", sambung: "-", jumlah: "-", rata: "-", ket: "-" },
  ]);

  // Table Data State - MUNAQOSYAH
  const [rowsMunaqosyah, setRowsMunaqosyah] = useState([
    { angka: "94", huruf: "Sembilan puluh empat", arab_huruf: "أربعة وتسعون", arab_angka: "٩٤" }, // Kelancaran
    { angka: "86", huruf: "Delapan puluh enam", arab_huruf: "ستة وثمانون", arab_angka: "٨٦" }, // Makhorijul Huruf
    { angka: "86", huruf: "Delapan puluh enam", arab_huruf: "ستة وثمانون", arab_angka: "٨٦" }, // Hukum Tajwid
    { angka: "92", huruf: "Sembilan puluh dua", arab_huruf: "اثنان وتسعون", arab_angka: "٩٢" }, // Sambung Ayat
  ]);
  const [jumlahMunaqosyah, setJumlahMunaqosyah] = useState({ angka: "358", huruf: "Tiga ratus lima puluh delapan", arab: "٣٥٨" });
  const [kategoriMunaqosyah, setKategoriMunaqosyah] = useState({ indo: "Mumtaz", arab: "ممتاز" });

  // Kepribadian & Absensi - RAPOR
  const [kepribadian, setKepribadian] = useState({ akhlaq: "A", kerajinan: "A", kedisiplinan: "B", kerapihan: "B" });
  const [absensi, setAbsensi] = useState({ sakit: "-", izin: "-", alpa: "-", jumlah: "-" });
  
  // Kepribadian - MUNAQOSYAH
  const [kepribadianMunaqosyah, setKepribadianMunaqosyah] = useState({ 
    akhlaq: { nilai: "B", arab: "جيد" },
    kedisiplinan: { nilai: "B", arab: "جيد" },
    kerapihan: { nilai: "B", arab: "جيد" }
  });

  const [catatan, setCatatan] = useState("Alhamdulillah ananda menunjukkan perkembangan dalam penguasaan materi Tahsin yang sangat baik, dan terus menunjukkan peningkatan dalam kelancaran hafalan serta muroja'ah. Semoga selalu Allah SWT mudahkan dalam menghafal.");
  const [catatanMunaqosyah, setCatatanMunaqosyah] = useState("Selamat atas kelulusan Munaqosyah juz 30. Ananda sudah menunjukkan kemajuan yang sangat baik. Ananda hanya perlu bimbingan dalam makhraj dan hukum bacaan. Diharapkan ananda tetap menjaga hafalan dengan selalu muroja'ah di rumah. Semoga Allah SWT senantiasa memudahkan langkah kita menuju kebaikan. Barakallahufiik.");
  
  const [tanggal, setTanggal] = useState("23 Mei 2026");
  const [tanggalMunaqosyah, setTanggalMunaqosyah] = useState("24 Mei 2025");

  useEffect(() => {
    if (id) {
      fetchStudentData(id as string);
    }
  }, [id]);

  const fetchStudentData = async (studentId: string) => {
    try {
      const { data, error } = await fetchStudentByRouteKey(studentId);
        
      if (error) throw error;
      if (!data) return;
      setStudent(data);
      const reportStudentId = data.id;

      const { data: reportData } = await supabase
        .from("student_reports")
        .select("data_rapor")
        .eq("student_id", reportStudentId)
        .eq("jenis_rapor", "rapor")
        .eq("bulan_tahun", "Juni 2026")
        .maybeSingle();

      if (reportData && reportData.data_rapor) {
        const payload = reportData.data_rapor;
        setKelas(payload.kelas || "V");
        setJuz(payload.juz || "29");
        setSemester(payload.semester || "2 (dua)");
        setTahunAjaran(payload.tahunAjaran || "2025/2026");
        setTanggal(payload.tanggal || "23 Mei 2026");
        if (payload.rowsRapor) setRowsRapor(payload.rowsRapor);
        if (payload.kepribadian) setKepribadian(payload.kepribadian);
        if (payload.absensi) setAbsensi(payload.absensi);
        if (payload.catatan) setCatatan(payload.catatan);
      }

      // Coba fetch laporan munaqosyah
      const { data: munaqosyahData } = await supabase
        .from("student_reports")
        .select("data_rapor")
        .eq("student_id", reportStudentId)
        .eq("jenis_rapor", "munaqosyah")
        .eq("bulan_tahun", "Juni 2026")
        .maybeSingle();

      if (munaqosyahData && munaqosyahData.data_rapor) {
        const payload = munaqosyahData.data_rapor;
        setTanggalMunaqosyah(payload.tanggalMunaqosyah || "24 Mei 2025");
        if (payload.rowsMunaqosyah) setRowsMunaqosyah(payload.rowsMunaqosyah);
        if (payload.jumlahMunaqosyah) setJumlahMunaqosyah(payload.jumlahMunaqosyah);
        if (payload.kategoriMunaqosyah) setKategoriMunaqosyah(payload.kategoriMunaqosyah);
        if (payload.kepribadianMunaqosyah) setKepribadianMunaqosyah(payload.kepribadianMunaqosyah);
        if (payload.catatanMunaqosyah) setCatatanMunaqosyah(payload.catatanMunaqosyah);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveData = async () => {
    if (!student) return;
    setIsSubmitting(true);
    
    // Siapkan payload sesuai tipe cetakan saat ini
    let payload = {};
    if (printType === "rapor") {
      payload = {
        kelas, juz, semester, tahunAjaran, tanggal,
        rowsRapor, kepribadian, absensi, catatan
      };
    } else {
      payload = {
        juz, semester, tahunAjaran, tanggalMunaqosyah,
        rowsMunaqosyah, jumlahMunaqosyah, kategoriMunaqosyah, 
        kepribadianMunaqosyah, catatanMunaqosyah
      };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi telah habis, silakan login kembali.");

      const { data: existing } = await supabase
        .from("student_reports")
        .select("id")
        .eq("student_id", student.id)
        .eq("jenis_rapor", printType)
        .eq("bulan_tahun", "Juni 2026")
        .maybeSingle();

      if (existing) {
        await supabase.from("student_reports").update({
          data_rapor: payload,
          updated_at: new Date().toISOString()
        }).eq("id", existing.id);
      } else {
        await supabase.from("student_reports").insert([{
          student_id: student.id,
          teacher_id: user.id,
          bulan_tahun: "Juni 2026",
          jenis_rapor: printType,
          data_rapor: payload
        }]);
      }

      setNotification({ show: true, message: `Data ${printType === "rapor" ? "Rapor" : "Munaqosyah"} Berhasil Disimpan!`, type: 'success' });
      setTimeout(() => setNotification({ ...notification, show: false }), 3000);
    } catch (err: any) {
      setNotification({ show: true, message: "Gagal menyimpan: " + err.message, type: 'error' });
      setTimeout(() => setNotification({ ...notification, show: false }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowRaporChange = (index: number, field: string, value: string) => {
    const newRows = [...rowsRapor];
    (newRows[index] as any)[field] = value;
    setRowsRapor(newRows);
  };

  const handleRowMunaqosyahChange = (index: number, field: string, value: string) => {
    const newRows = [...rowsMunaqosyah];
    (newRows[index] as any)[field] = value;
    setRowsMunaqosyah(newRows);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold">Memuat data rapor...</div>;
  }

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center font-bold">Siswa tidak ditemukan</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 print:p-0 print:bg-white font-sans text-gray-900">
      {/* Controls - Hidden during print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex flex-col gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm font-bold border border-gray-200"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          


          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={handleSaveData}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg shadow-sm font-bold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : <><Save size={18} /> Simpan Data</>}
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#1b4332] text-white px-6 py-2 rounded-lg shadow-sm font-bold hover:bg-[#133c27] transition-colors"
            >
              <Printer size={18} /> Cetak Dokumen
            </button>
          </div>
        </div>
        
        {notification.show && (
          <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-[#2dc653]/20 text-[#1b4332] border border-[#2dc653]/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            <CheckCircle2 size={20} />
            <p className="font-bold text-sm">{notification.message}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-sm font-medium text-orange-600 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
          *Anda bisa klik dan edit langsung teks pada tabel sebelum dicetak!
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="w-full overflow-x-auto pb-8 print:pb-0 print:overflow-visible">
        <div className="w-[210mm] min-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-lg print:shadow-none print:p-0 relative overflow-hidden text-[13px] leading-relaxed">
        
        {/* Background Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none">
          <img src="/logo.png" alt="Watermark" className="w-[400px] h-[400px] object-contain mix-blend-multiply" style={{ filter: 'contrast(1.2) brightness(1.1)' }} />
        </div>

        <div className="relative z-10">
          {/* KOP SURAT */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-1">
            <img src="/logo.png" alt="Logo SD ILBS" className="w-32 h-32 object-contain mix-blend-multiply scale-110 origin-left" style={{ filter: 'contrast(1.2) brightness(1.1)' }} />
            <div className="text-center flex-1">
              <h3 className="text-sm font-bold uppercase tracking-wider">Yayasan Bani Saleh</h3>
              <h1 className="text-xl font-black uppercase tracking-widest text-[#1b4332]">Sekolah Dasar Islam Labschool Bani Saleh</h1>
              <h2 className="text-xl font-bold uppercase tracking-widest mt-1">
                {printType === "rapor" ? "Rapor Tahsin Tahfizh" : "Lembar Munaqosyah"}
              </h2>
              <p className="text-sm font-bold mt-1">NPSN: 70010942 <span className="ml-4">TERAKREDITASI: A</span></p>
              <p className="text-[10px] mt-1 font-bold">Jl. Pangeran RT 001/008 Desa Lubang Buaya Kec. Setu Kab. Bekasi E-mail : sdilabschoolbanisalehsetu@gmail.com</p>
            </div>
            {printType === "rapor" ? (
              <img src="/logo-tahsin.png" alt="Logo Tahfizh" className="w-32 h-32 object-contain mix-blend-multiply scale-110 origin-right" style={{ filter: 'contrast(1.2) brightness(1.1)' }} />
            ) : (
              <div className="w-32 h-32"></div>
            )}
          </div>
          <div className="border-b-4 border-black w-full mb-6"></div>

          {/* IDENTITAS SISWA */}
          <div className="flex justify-between items-start mb-6 font-bold text-sm">
            <table className="w-[45%]">
              <tbody>
                <tr><td className="py-1 w-36">Nama Peserta Didik</td><td className="w-4">:</td><td className="uppercase">{student.nama_lengkap}</td></tr>
                <tr><td className="py-1">NIS</td><td>:</td><td>{student.nis || "-"}</td></tr>
                <tr><td className="py-1">Kelas</td><td>:</td><td><input value={kelas} onChange={e=>setKelas(e.target.value)} className="outline-none border-b border-transparent focus:border-gray-300 w-full uppercase bg-transparent" /></td></tr>
              </tbody>
            </table>
            <table className="w-[45%]">
              <tbody>
                <tr><td className="py-1 w-24">Juz</td><td className="w-4">:</td><td><input value={juz} onChange={e=>setJuz(e.target.value)} className="outline-none border-b border-transparent focus:border-gray-300 w-full bg-transparent" /></td></tr>
                <tr><td className="py-1">Semester</td><td>:</td><td><input value={semester} onChange={e=>setSemester(e.target.value)} className="outline-none border-b border-transparent focus:border-gray-300 w-full bg-transparent" /></td></tr>
                <tr><td className="py-1">Tahun Pelajaran</td><td>:</td><td><input value={tahunAjaran} onChange={e=>setTahunAjaran(e.target.value)} className="outline-none border-b border-transparent focus:border-gray-300 w-full bg-transparent" /></td></tr>
              </tbody>
            </table>
          </div>

          {/* -------------------- LAYOUT RAPOR BULANAN -------------------- */}
          {printType === "rapor" && (
            <>
              {/* TABEL NILAI RAPOR */}
              <table className="w-full border-collapse border border-black mb-6 text-center text-xs">
                <thead>
                  <tr>
                    <th className="border border-black p-2 bg-gray-100" rowSpan={3} style={{ width: "5%" }}>NO</th>
                    <th className="border border-black p-2 bg-gray-100" rowSpan={3} style={{ width: "30%" }}>Nama Surah</th>
                    <th className="border border-black p-2 bg-gray-100" colSpan={4}>Kriteria Penilaian</th>
                    <th className="border border-black p-2 bg-gray-100" rowSpan={3} style={{ width: "8%" }}>Jumlah</th>
                    <th className="border border-black p-2 bg-gray-100" rowSpan={3} style={{ width: "8%" }}>Rata-rata</th>
                    <th className="border border-black p-2 bg-gray-100" rowSpan={3} style={{ width: "12%" }}>Ket.</th>
                  </tr>
                  <tr>
                    <th className="border border-black p-1 bg-gray-50 text-[10px]" rowSpan={2}>Kelancaran</th>
                    <th className="border border-black p-1 bg-gray-50 text-[10px]" rowSpan={2}>Makhorijul<br/>Huruf</th>
                    <th className="border border-black p-1 bg-gray-50 text-[10px]" rowSpan={2}>Hukum<br/>Tajwid</th>
                    <th className="border border-black p-1 bg-gray-50 text-[10px]" rowSpan={2}>Sambung<br/>Ayat</th>
                  </tr>
                  <tr></tr>
                  <tr>
                    <th className="border border-black p-1 bg-gray-200" colSpan={2}>KKM 75</th>
                    <th className="border border-black p-1 bg-gray-200" colSpan={4}></th>
                    <th className="border border-black p-1 bg-gray-200" colSpan={3}></th>
                  </tr>
                </thead>
                <tbody>
                  {rowsRapor.map((row, idx) => (
                    <tr key={idx} className="h-8">
                      <td className="border border-black">{idx + 1}</td>
                      <td className="border border-black text-left px-2"><input className="w-full outline-none text-left bg-transparent" value={row.surah} onChange={e => handleRowRaporChange(idx, "surah", e.target.value)} /></td>
                      <td className="border border-black"><input className="w-full outline-none text-center bg-transparent" value={row.kelancaran} onChange={e => handleRowRaporChange(idx, "kelancaran", e.target.value)} /></td>
                      <td className="border border-black"><input className="w-full outline-none text-center bg-transparent" value={row.makhorijul} onChange={e => handleRowRaporChange(idx, "makhorijul", e.target.value)} /></td>
                      <td className="border border-black"><input className="w-full outline-none text-center bg-transparent" value={row.tajwid} onChange={e => handleRowRaporChange(idx, "tajwid", e.target.value)} /></td>
                      <td className="border border-black"><input className="w-full outline-none text-center bg-transparent" value={row.sambung} onChange={e => handleRowRaporChange(idx, "sambung", e.target.value)} /></td>
                      <td className="border border-black"><input className="w-full outline-none text-center bg-transparent" value={row.jumlah} onChange={e => handleRowRaporChange(idx, "jumlah", e.target.value)} /></td>
                      <td className="border border-black font-bold"><input className="w-full outline-none text-center font-bold bg-transparent" value={row.rata} onChange={e => handleRowRaporChange(idx, "rata", e.target.value)} /></td>
                      <td className="border border-black"><input className="w-full outline-none text-center text-[11px] bg-transparent" value={row.ket} onChange={e => handleRowRaporChange(idx, "ket", e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* KEPRIBADIAN, ABSENSI, CATATAN GURU */}
              <div className="flex items-stretch border border-black mb-10 h-auto text-sm">
                <div className="flex-[1.5] border-r border-black flex flex-col">
                  <div className="font-bold text-center border-b border-black py-2 bg-gray-100">KEPRIBADIAN</div>
                  <div className="flex justify-between border-b border-black px-2 py-1 flex-1 items-center">
                    <span>Akhlaq</span> <div className="flex font-bold">:<input className="w-6 text-center outline-none ml-1 bg-transparent" value={kepribadian.akhlaq} onChange={e=>setKepribadian({...kepribadian, akhlaq: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-between border-b border-black px-2 py-1 flex-1 items-center">
                    <span>Kerajinan</span> <div className="flex font-bold">:<input className="w-6 text-center outline-none ml-1 bg-transparent" value={kepribadian.kerajinan} onChange={e=>setKepribadian({...kepribadian, kerajinan: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-between border-b border-black px-2 py-1 flex-1 items-center">
                    <span>Kedisiplinan</span> <div className="flex font-bold">:<input className="w-6 text-center outline-none ml-1 bg-transparent" value={kepribadian.kedisiplinan} onChange={e=>setKepribadian({...kepribadian, kedisiplinan: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-between px-2 py-1 flex-1 items-center">
                    <span>Kerapihan</span> <div className="flex font-bold">:<input className="w-6 text-center outline-none ml-1 bg-transparent" value={kepribadian.kerapihan} onChange={e=>setKepribadian({...kepribadian, kerapihan: e.target.value})} /></div>
                  </div>
                </div>

                <div className="flex-[1.5] border-r border-black flex flex-col">
                  <div className="font-bold text-center border-b border-black py-2 bg-gray-100">ABSENSI</div>
                  <div className="flex justify-between border-b border-black px-2 py-1 flex-1 items-center">
                    <span>Sakit</span> <div className="flex font-bold">:<input className="w-6 text-center outline-none ml-1 bg-transparent" value={absensi.sakit} onChange={e=>setAbsensi({...absensi, sakit: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-between border-b border-black px-2 py-1 flex-1 items-center">
                    <span>Izin</span> <div className="flex font-bold">:<input className="w-6 text-center outline-none ml-1 bg-transparent" value={absensi.izin} onChange={e=>setAbsensi({...absensi, izin: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-between border-b border-black px-2 py-1 flex-1 items-center">
                    <span>Alpa</span> <div className="flex font-bold">:<input className="w-6 text-center outline-none ml-1 bg-transparent" value={absensi.alpa} onChange={e=>setAbsensi({...absensi, alpa: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-between px-2 py-1 flex-1 items-center bg-gray-50">
                    <span className="font-bold">Jumlah</span> <div className="flex font-bold">:<input className="w-6 text-center outline-none ml-1 bg-transparent" value={absensi.jumlah} onChange={e=>setAbsensi({...absensi, jumlah: e.target.value})} /></div>
                  </div>
                </div>

                <div className="flex-[3] flex flex-col">
                  <div className="font-bold text-center border-b border-black py-2 bg-gray-100">CATATAN GURU</div>
                  <div className="p-3 flex-1">
                    <textarea 
                      className="w-full h-full min-h-[100px] outline-none resize-none text-justify bg-transparent" 
                      value={catatan} 
                      onChange={e => setCatatan(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* TTD SECTION RAPOR */}
              <div className="flex justify-between mt-8 relative text-sm">
                <div className="text-center w-1/3 relative z-10 pt-6">
                  <p className="font-bold mb-20">Orang Tua/Wali</p>
                  <div className="w-48 border-b-2 border-black mx-auto border-dotted"></div>
                </div>
                <div className="text-center w-1/3 relative z-10 pt-6">
                  <p className="font-bold mb-20">Kepala Sekolah</p>
                  <p className="font-bold underline">WIDI NURMARA, S.Pd.I</p>
                </div>
                <div className="text-center w-1/3 relative z-10">
                  <div className="mb-2">
                    <span>Dikeluarkan di : Bekasi</span><br/>
                    <span className="flex items-center justify-center gap-2">
                      Tanggal : <input className="w-24 text-left outline-none font-medium bg-transparent" value={tanggal} onChange={e=>setTanggal(e.target.value)} />
                    </span>
                  </div>
                  <p className="font-bold mb-16 mt-2">Koordinator Tahfizh</p>
                  <p className="font-bold underline">ULFA DWI HASTUTI, S.LI</p>
                </div>
              </div>
            </>
          )}

          {/* -------------------- LAYOUT LEMBAR MUNAQOSYAH -------------------- */}
          {printType === "munaqosyah" && (
            <>
              {/* TABEL NILAI MUNAQOSYAH */}
              <table className="w-full border-collapse border border-black mb-6 text-center text-sm font-bold">
                <thead>
                  <tr>
                    <th className="border border-black p-2 bg-gray-100" colSpan={2} style={{ width: "35%" }}>Kriteria Penilaian</th>
                    <th className="border border-black p-2 bg-gray-100" colSpan={2} style={{ width: "35%" }}>Hasil Tes</th>
                    <th className="border border-black p-2 bg-gray-100" colSpan={2} style={{ width: "15%" }} dir="rtl">الْعَمَلِيَّةِ الدَّرَجَاتِ</th>
                    <th className="border border-black p-2 bg-gray-100" rowSpan={2} style={{ width: "15%" }} dir="rtl">مَعَايِيْرُ التَّقْيِيْمِ</th>
                  </tr>
                  <tr>
                    <th className="border border-black p-1 bg-gray-50 text-[10px]" style={{ width: "5%" }}></th>
                    <th className="border border-black p-1 bg-gray-50"></th>
                    <th className="border border-black p-1 bg-gray-50">Angka</th>
                    <th className="border border-black p-1 bg-gray-50">Huruf</th>
                    <th className="border border-black p-1 bg-gray-50 text-base" dir="rtl">كِتَابَةً</th>
                    <th className="border border-black p-1 bg-gray-50 text-base" dir="rtl">رَقْمًا</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Kelancaran", arab_label: "نُعُوْمَة", id: 0 },
                    { label: "Makhorijul Huruf", arab_label: "مَاهُوْرِيْجُوْل حُرُوْف", id: 1 },
                    { label: "Hukum Tajwid", arab_label: "قَانُوْن التَّجْوِيْد", id: 2 },
                    { label: "Sambung Ayat", arab_label: "أَكْمَل الآيَة", id: 3 },
                  ].map((crit, idx) => (
                    <tr key={idx} className="h-10 text-sm">
                      <td className="border border-black font-normal">{idx + 1}</td>
                      <td className="border border-black text-left px-2 font-normal">{crit.label}</td>
                      <td className="border border-black">
                        <input className="w-full outline-none text-center bg-transparent font-bold" value={rowsMunaqosyah[idx].angka} onChange={e => handleRowMunaqosyahChange(idx, "angka", e.target.value)} />
                      </td>
                      <td className="border border-black font-normal text-xs px-1 leading-tight">
                        <input className="w-full outline-none text-center bg-transparent" value={rowsMunaqosyah[idx].huruf} onChange={e => handleRowMunaqosyahChange(idx, "huruf", e.target.value)} />
                      </td>
                      <td className="border border-black text-base font-normal px-1" dir="rtl">
                        <input className="w-full outline-none text-center bg-transparent" dir="rtl" value={rowsMunaqosyah[idx].arab_huruf} onChange={e => handleRowMunaqosyahChange(idx, "arab_huruf", e.target.value)} />
                      </td>
                      <td className="border border-black font-bold text-base">
                        <input className="w-full outline-none text-center bg-transparent" value={rowsMunaqosyah[idx].arab_angka} onChange={e => handleRowMunaqosyahChange(idx, "arab_angka", e.target.value)} />
                      </td>
                      <td className="border border-black text-base font-normal px-2" dir="rtl">
                        <div className="flex justify-between items-center w-full">
                          <span className="flex-1 text-right">{crit.arab_label}</span>
                          <span className="ml-2">{idx + 1 === 1 ? '١' : idx + 1 === 2 ? '٢' : idx + 1 === 3 ? '٣' : '٤'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100">
                    <td className="border border-black p-2 uppercase" colSpan={2}>Jumlah</td>
                    <td className="border border-black font-black bg-white">
                      <input className="w-full outline-none text-center bg-transparent" value={jumlahMunaqosyah.angka} onChange={e=>setJumlahMunaqosyah({...jumlahMunaqosyah, angka: e.target.value})} />
                    </td>
                    <td className="border border-black font-normal text-xs bg-white">
                      <input className="w-full outline-none text-center bg-transparent" value={jumlahMunaqosyah.huruf} onChange={e=>setJumlahMunaqosyah({...jumlahMunaqosyah, huruf: e.target.value})} />
                    </td>
                    <td className="border border-black font-black text-lg bg-white" colSpan={2}>
                      <input className="w-full outline-none text-center bg-transparent" value={jumlahMunaqosyah.arab} onChange={e=>setJumlahMunaqosyah({...jumlahMunaqosyah, arab: e.target.value})} />
                    </td>
                    <td className="border border-black text-lg font-bold" dir="rtl">الْجُمْلَة</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="border border-black p-2 uppercase" colSpan={2}>Kategori</td>
                    <td className="border border-black font-black bg-white uppercase tracking-wider" colSpan={2}>
                      <input className="w-full outline-none text-center bg-transparent" value={kategoriMunaqosyah.indo} onChange={e=>setKategoriMunaqosyah({...kategoriMunaqosyah, indo: e.target.value})} />
                    </td>
                    <td className="border border-black font-bold text-xl bg-white" colSpan={2} dir="rtl">
                      <input className="w-full outline-none text-center bg-transparent" value={kategoriMunaqosyah.arab} onChange={e=>setKategoriMunaqosyah({...kategoriMunaqosyah, arab: e.target.value})} />
                    </td>
                    <td className="border border-black text-lg font-bold" dir="rtl">فِئَة</td>
                  </tr>
                </tbody>
              </table>

              {/* KEPRIBADIAN MUNAQOSYAH */}
              <table className="w-full border-collapse border border-black mb-6 text-center text-sm font-bold">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2" style={{ width: "40%" }}>KEPRIBADIAN</th>
                    <th className="border border-black p-2" style={{ width: "20%" }}></th>
                    <th className="border border-black p-2" style={{ width: "20%" }}></th>
                    <th className="border border-black p-2 text-lg" style={{ width: "20%" }} dir="rtl">أَحْوَالُ الطَّالِب</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Akhlaq", id: "akhlaq", arab: "أَخْلَاق" },
                    { label: "Kedisiplinan", id: "kedisiplinan", arab: "تَأْدِيْب" },
                    { label: "Kerapihan", id: "kerapihan", arab: "نَظَافَة" },
                  ].map((crit, idx) => (
                    <tr key={idx} className="h-8 text-sm">
                      <td className="border border-black text-left px-4 font-normal">{crit.label}</td>
                      <td className="border border-black">
                        <input 
                          className="w-full outline-none text-center bg-transparent font-bold" 
                          value={(kepribadianMunaqosyah as any)[crit.id].nilai} 
                          onChange={e => setKepribadianMunaqosyah({
                            ...kepribadianMunaqosyah, 
                            [crit.id]: { ...(kepribadianMunaqosyah as any)[crit.id], nilai: e.target.value }
                          })} 
                        />
                      </td>
                      <td className="border border-black text-lg font-normal">
                        <input 
                          className="w-full outline-none text-center bg-transparent" 
                          dir="rtl"
                          value={(kepribadianMunaqosyah as any)[crit.id].arab} 
                          onChange={e => setKepribadianMunaqosyah({
                            ...kepribadianMunaqosyah, 
                            [crit.id]: { ...(kepribadianMunaqosyah as any)[crit.id], arab: e.target.value }
                          })} 
                        />
                      </td>
                      <td className="border border-black text-lg font-normal" dir="rtl">{crit.arab}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* CATATAN GURU MUNAQOSYAH */}
              <div className="border border-black mb-8">
                <div className="font-bold text-center border-b border-black py-2 bg-gray-100 uppercase tracking-widest text-sm">CATATAN GURU</div>
                <div className="p-4 text-justify leading-relaxed">
                  <textarea 
                    className="w-full h-full min-h-[100px] outline-none resize-none text-justify bg-transparent font-medium" 
                    value={catatanMunaqosyah} 
                    onChange={e => setCatatanMunaqosyah(e.target.value)}
                  />
                </div>
              </div>

              {/* TTD SECTION MUNAQOSYAH */}
              <div className="flex justify-between mt-8 relative text-sm">
                <div className="text-center w-1/3 relative z-10 pt-6">
                  <p className="font-bold mb-20">Orang Tua/Wali</p>
                  <div className="w-48 border-b-2 border-black mx-auto border-dotted"></div>
                </div>
                <div className="text-center w-1/3 relative z-10 pt-6">
                  <p className="font-bold mb-20">Kepala Sekolah</p>
                  <p className="font-bold underline">WIDI NURMARA, S.Pd.I</p>
                </div>
                <div className="text-center w-1/3 relative z-10">
                  <div className="mb-2">
                    <span>Dikeluarkan di : Bekasi</span><br/>
                    <span className="flex items-center justify-center gap-2">
                      Tanggal : <input className="w-24 text-left outline-none font-medium bg-transparent" value={tanggalMunaqosyah} onChange={e=>setTanggalMunaqosyah(e.target.value)} />
                    </span>
                  </div>
                  <p className="font-bold mb-16 mt-2">Guru Tahfizh</p>
                  <p className="font-bold underline">ULFA DWI HASTUTI, S.Li</p>
                </div>
              </div>
            </>
          )}
          
        </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import Link from "next/link";
import { Users, BookOpen, Sun, ChevronRight, Inbox, Search, Fingerprint, Plus, X, UserPlus, Save, Edit2, Trash2, Upload, Loader2, CheckCircle2, AlertCircle, ChevronDown, Camera, FileDown } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { StudentAvatar } from "@/components/StudentAvatar";
import { getStudentRouteKey } from "@/lib/students";
import { uploadStudentPhoto } from "@/lib/student-photos";
import {
  getTahfidzLevelLabel,
  TAHFIDZ_LEVELS,
} from "@/lib/tahfidz-levels";
import { parseStudentWorksheet } from "@/lib/student-import";
import * as XLSX from "xlsx";

const getNextAvailableNis = (students: any[]) => {
  const usedNis = new Set(
    students
      .map((student) => student.nis?.toString().trim())
      .filter(Boolean),
  );
  const numericNis = Array.from(usedNis)
    .map((nis) => Number(nis))
    .filter((nis) => Number.isInteger(nis));
  let nextNis = Math.max(1000000, ...numericNis) + 1;

  while (usedNis.has(nextNis.toString())) {
    nextNis += 1;
  }

  return nextNis.toString();
};

const normalizeNis = (value: unknown) => value?.toString().trim() || "";

const createInitialStudentForm = () => ({
  nama_lengkap: "",
  nis: "",
  jenis_kelamin: "",
  nik: "",
  tempat_tanggal_lahir: "",
  nama_ayah: "",
  nama_ibu: "",
  wali_murid: "",
  alamat: "",
  no_telp: "",
  kelas: "1",
  level: "1",
});

const optionalText = (value: string) => value.trim() || null;

const getStudentSaveError = (error: unknown, prefix: string) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "Terjadi kesalahan yang tidak diketahui.";
  const needsMigration =
    /jenis_kelamin|nama_ayah|nama_ibu|students.*nik|schema cache/i.test(
      message,
    );

  return `${prefix}${message}${
    needsMigration
      ? " Jalankan supabase-student-excel-profile-migration.sql di Supabase SQL Editor."
      : ""
  }`;
};

export default function DaftarSiswaFull() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterLevel, setFilterLevel] = useState("Semua");
  const [isKelasOpen, setIsKelasOpen] = useState(false);
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'confirm', id?: string, isLoading?: boolean }>({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState(createInitialStudentForm);

  useEffect(() => {
    checkUserAndFetchStudents();
  }, []);

  const checkUserAndFetchStudents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "guru") {
        router.push("/auth/login");
        return;
      }
      setUser(user);

      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .order("nama_lengkap", { ascending: true });

      setStudents(studentsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Efek loading buatan
      if (!user) return;
      
      const nis = normalizeNis(formData.nis) || getNextAvailableNis(
        students.filter((student) => student.id !== editingId),
      );
      const nik = formData.nik.replace(/\D/g, "");
      if (nik && nik.length !== 16) {
        throw new Error("NIK harus terdiri dari 16 digit.");
      }
      const studentData = {
        nama_lengkap: formData.nama_lengkap.trim(),
        nis,
        jenis_kelamin: optionalText(formData.jenis_kelamin),
        nik: optionalText(nik),
        tempat_tanggal_lahir: formData.tempat_tanggal_lahir.trim(),
        nama_ayah: optionalText(formData.nama_ayah),
        nama_ibu: optionalText(formData.nama_ibu),
        wali_murid:
          formData.wali_murid.trim() ||
          [formData.nama_ayah.trim(), formData.nama_ibu.trim()]
            .filter(Boolean)
            .join(" / "),
        alamat: formData.alamat.trim(),
        no_telp: formData.no_telp.trim(),
        kelas: formData.kelas,
        level: formData.level,
      };

      let savedStudentId = editingId;

      if (editingId) {
        const { data, error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", editingId)
          .select("id")
          .single();
        
        if (error) throw error;
        if (!data) {
          throw new Error("Gagal mengedit: Data tidak ditemukan atau diblokir oleh sistem keamanan (RLS).");
        }
        savedStudentId = data.id;
        setNotification({ show: true, message: "Data siswa berhasil diperbarui!", type: 'success' });
      } else {
        const existingStudent = students.find((student) => normalizeNis(student.nis) === nis);
        const payload = {
          teacher_id: user.id,
          ...studentData,
        };

        const { data, error } = existingStudent
          ? await supabase.from("students").update(payload).eq("id", existingStudent.id).select("id").single()
          : await supabase.from("students").insert([
          {
            ...payload,
          },
        ]).select("id").single();
        if (error) throw error;
        savedStudentId = data?.id || existingStudent?.id || null;
        setNotification({ show: true, message: existingStudent ? "Data siswa dengan NIS yang sama berhasil diperbarui!" : "Siswa baru berhasil ditambahkan!", type: 'success' });
      }

      if (photoFile && savedStudentId) {
        await uploadStudentPhoto({
          file: photoFile,
          studentId: savedStudentId,
          userId: user.id,
        });
      }
      
      setFormData(createInitialStudentForm());
      setPhotoFile(null);
      setPhotoPreview("");
      setEditingId(null);
      setShowForm(false);
      await checkUserAndFetchStudents();
    } catch (err: unknown) {
      setNotification({
        show: true,
        message: getStudentSaveError(err, "Error: "),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (student: any) => {
    setFormData({
      nama_lengkap: student.nama_lengkap,
      nis: student.nis || "",
      jenis_kelamin: student.jenis_kelamin || "",
      nik: student.nik || "",
      tempat_tanggal_lahir: student.tempat_tanggal_lahir || "",
      nama_ayah: student.nama_ayah || "",
      nama_ibu: student.nama_ibu || "",
      wali_murid: student.wali_murid || "",
      alamat: student.alamat || "",
      no_telp: student.no_telp || "",
      kelas: student.kelas || "1",
      level: student.level?.toString() || "1",
    });
    setPhotoFile(null);
    setPhotoPreview(student.foto_url || "");
    setEditingId(student.id);
    setShowForm(true);
    
    // Beri sedikit jeda agar animasi form selesai sebelum scroll
    setTimeout(() => {
      document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotification({ show: true, message: "Gunakan gambar JPG, PNG, atau WebP.", type: "error" });
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotification({ show: true, message: "Ukuran gambar maksimal 2 MB.", type: "error" });
      event.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const confirmDelete = (id: string) => {
    setNotification({ show: true, message: "Apakah Anda yakin ingin menghapus data siswa ini? Semua laporan terkait siswa ini juga akan terhapus.", type: 'confirm', id });
  };

  const handleDelete = async (id: string) => {
    setNotification(prev => ({ ...prev, isLoading: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Efek loading buatan
      const { data, error } = await supabase.from("students").delete().eq("id", id).select();
      if (error) {
        setNotification({ show: true, message: "Gagal menghapus! Pastikan Anda memiliki izin akses ke database.", type: 'error' });
        console.error(error);
        return;
      }
      if (!data || data.length === 0) {
        setNotification({ show: true, message: "Gagal menghapus: Data tidak ditemukan atau diblokir oleh sistem keamanan (RLS).", type: 'error' });
        return;
      }
      setNotification({ show: true, message: "Siswa berhasil dihapus!", type: 'success' });
      await checkUserAndFetchStudents();
    } catch (err: any) {
      setNotification({ show: true, message: "Error menghapus data: " + err.message, type: 'error' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        if (!user) {
          setNotification({ show: true, message: "Sesi login tidak ditemukan. Silakan login ulang.", type: 'error' });
          return;
        }

        const parsedWorksheet = parseStudentWorksheet(worksheet);
        const existingStudents = [...students];
        
        const newStudents = parsedWorksheet.rows.map((row) => {
          const nis =
            normalizeNis(row.nis) || getNextAvailableNis(existingStudents);
          const nik = row.nik.replace(/\D/g, "");
          if (nik && nik.length !== 16) {
            throw new Error(
              `NIK ${row.nama_lengkap} harus terdiri dari 16 digit.`,
            );
          }
          const student = {
            teacher_id: user.id,
            nama_lengkap: row.nama_lengkap,
            nis,
            jenis_kelamin: optionalText(row.jenis_kelamin),
            nik: optionalText(nik),
            kelas: row.kelas,
            level: row.level,
            tempat_tanggal_lahir: row.tempat_tanggal_lahir,
            nama_ayah: optionalText(row.nama_ayah),
            nama_ibu: optionalText(row.nama_ibu),
            wali_murid: row.wali_murid,
            no_telp: row.no_telp,
            alamat: row.alamat,
          };

          existingStudents.push(student);
          return student;
        });

        const studentsToSave = Array.from(
          new Map(newStudents.map((student) => [student.nis, student])).values(),
        );

        if (studentsToSave.length > 0) {
          setIsSubmitting(true);
          await new Promise(resolve => setTimeout(resolve, 800)); // Efek loading buatan
          let createdCount = 0;
          let updatedCount = 0;

          for (const student of studentsToSave) {
            const existingStudent = students.find((item) => normalizeNis(item.nis) === student.nis);
            const { error } = existingStudent
              ? await supabase.from("students").update(student).eq("id", existingStudent.id)
              : await supabase.from("students").insert([student]);
            if (error) throw error;
            if (existingStudent) {
              updatedCount += 1;
            } else {
              createdCount += 1;
            }
          }

          setNotification({
            show: true,
            message:
              `Import selesai dari header baris ${parsedWorksheet.headerRowNumber}: ` +
              `${createdCount} siswa baru, ${updatedCount} siswa diperbarui` +
              `${parsedWorksheet.skippedRows ? `, ${parsedWorksheet.skippedRows} baris dilewati` : ""}.`,
            type: 'success',
          });
          await checkUserAndFetchStudents();
        } else {
          setNotification({ show: true, message: "File Excel kosong atau format tidak sesuai.", type: 'error' });
        }
      } catch (err: unknown) {
        setNotification({
          show: true,
          message: getStudentSaveError(err, "Gagal mengimpor file: "),
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
      
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        No: "1",
        "Nama Peserta Didik": "Ahmad Fulan",
        "L/P": "L",
        NIS: "262701001",
        NIK: "3275011007190004",
        "Tempat/Tanggal Lahir": "Bekasi, 10 Juli 2019",
        Ayah: "Bapak Fulan",
        Ibu: "Ibu Fulan",
        Alamat: "Bekasi",
        "Nomor Telepon": "081234567890",
        Kelas: "1",
        Level: "1",
      },
    ];
    const instructionRows = [
      { Kolom: "Nama Peserta Didik", Petunjuk: "Wajib diisi." },
      { Kolom: "L/P", Petunjuk: "Isi L untuk laki-laki atau P untuk perempuan." },
      { Kolom: "NIS", Petunjuk: "Opsional. Jika kosong, sistem membuat NIS otomatis." },
      { Kolom: "NIK", Petunjuk: "Isi 16 digit tanpa tanda baca." },
      { Kolom: "Tempat/Tanggal Lahir", Petunjuk: "Contoh: Bekasi, 10 Juli 2019." },
      { Kolom: "Ayah", Petunjuk: "Nama ayah siswa." },
      { Kolom: "Ibu", Petunjuk: "Nama ibu siswa." },
      { Kolom: "Alamat", Petunjuk: "Alamat lengkap siswa." },
      { Kolom: "Nomor Telepon", Petunjuk: "Gunakan format teks agar angka 0 di depan tidak hilang." },
      { Kolom: "Kelas", Petunjuk: "Isi angka 1 sampai 6." },
      {
        Kolom: "Level",
        Petunjuk:
          "Isi jenjang tahfidz 1 sampai 9. Jenjang 7–9 adalah Mustawa Muttawasit 1–3.",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const dataSheet = XLSX.utils.json_to_sheet(templateRows);
    const guideSheet = XLSX.utils.json_to_sheet(instructionRows);
    dataSheet["!cols"] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 8 },
      { wch: 14 },
      { wch: 20 },
      { wch: 30 },
      { wch: 24 },
      { wch: 24 },
      { wch: 40 },
      { wch: 24 },
      { wch: 10 },
      { wch: 10 },
    ];
    guideSheet["!cols"] = [{ wch: 26 }, { wch: 64 }];
    XLSX.utils.book_append_sheet(workbook, dataSheet, "DATA SISWA");
    XLSX.utils.book_append_sheet(workbook, guideSheet, "PETUNJUK");
    XLSX.writeFile(workbook, "template-import-data-siswa.xlsx");
  };

  const filteredStudents = students.filter(student => {
    const namaLengkap = student.nama_lengkap || "";
    const matchQuery = namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (student.nis && student.nis.includes(searchQuery));
    const matchKelas = filterKelas === "Semua" || student.kelas === filterKelas;
    const matchLevel = filterLevel === "Semua" || (student.level && student.level.toString() === filterLevel);
    
    return matchQuery && matchKelas && matchLevel;
  });

  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const k = student.kelas || "Tanpa Kelas";
    if (!acc[k]) acc[k] = [];
    acc[k].push(student);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <DashboardLayout userRole="guru">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#1b4332]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="guru">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Daftar Siswa Lengkap
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Kelola dan lihat seluruh daftar siswa yang terintegrasi.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:w-48 shrink-0 z-20">
            <button
              onClick={() => { setIsKelasOpen(!isKelasOpen); setIsLevelOpen(false); }}
              onBlur={() => setTimeout(() => setIsKelasOpen(false), 200)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1b4332] shadow-sm transition-all"
            >
              <span>{filterKelas === "Semua" ? "Semua Kelas" : `Kelas ${filterKelas}`}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isKelasOpen ? "rotate-180" : ""}`} />
            </button>
            {isKelasOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <button onMouseDown={() => { setFilterKelas("Semua"); setIsKelasOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterKelas === "Semua" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  Semua Kelas
                </button>
                {["1", "2", "3", "4", "5", "6"].map(k => (
                  <button key={k} onMouseDown={() => { setFilterKelas(k); setIsKelasOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterKelas === k ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    Kelas {k}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-48 shrink-0 z-10">
            <button
              onClick={() => { setIsLevelOpen(!isLevelOpen); setIsKelasOpen(false); }}
              onBlur={() => setTimeout(() => setIsLevelOpen(false), 200)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1b4332] shadow-sm transition-all"
            >
              <span>{filterLevel === "Semua" ? "Semua Jenjang" : getTahfidzLevelLabel(filterLevel)}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isLevelOpen ? "rotate-180" : ""}`} />
            </button>
            {isLevelOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                <button onMouseDown={() => { setFilterLevel("Semua"); setIsLevelOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterLevel === "Semua" ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  Semua Jenjang
                </button>
                {TAHFIDZ_LEVELS.map((level) => (
                  <button key={level.value} onMouseDown={() => { setFilterLevel(String(level.value)); setIsLevelOpen(false); }} className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${filterLevel === String(level.value) ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    {level.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl w-full sm:w-64 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1b4332] transition-all shadow-sm"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-3 font-bold rounded-xl bg-green-50 hover:bg-green-100 text-green-700 shadow-sm transition-all flex items-center gap-2"
            >
              <FileDown size={18} /> <span className="hidden lg:inline">Template Excel</span>
            </button>
            <label className="cursor-pointer px-4 py-3 font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 shadow-sm transition-all flex items-center gap-2">
              <Upload size={18} /> <span className="hidden lg:inline">Import</span>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>

          <Button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingId(null);
                setFormData(createInitialStudentForm());
                setPhotoFile(null);
                setPhotoPreview("");
              }
            }}
            className="px-6 py-3 font-bold rounded-xl bg-[#1b4332] hover:bg-[#133c27] text-white shadow-lg transition-all flex items-center gap-2"
          >
              {showForm ? (
                <><X size={18} /> Batal</>
              ) : (
                <><Plus size={18} /> <span className="hidden lg:inline">Tambah Siswa</span></>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Tambah Siswa */}
      <div className={`transition-all duration-500 ${showForm ? "max-h-[3200px] overflow-visible opacity-100 mb-8" : "max-h-0 overflow-hidden opacity-0"}`}>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 border-t-4 border-[#1b4332]">
          <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1b4332]/10 text-[#1b4332] rounded-xl flex items-center justify-center">
                <UserPlus size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-900">{editingId ? "Edit Data Siswa" : "Input Data Siswa Baru"}</h2>
            </div>
            <button
              type="submit"
              form="student-data-form"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-8 font-bold text-white shadow-lg shadow-green-900/10 transition hover:bg-[#2d6a4f] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><Save size={18} /> {editingId ? "Simpan Perubahan" : "Simpan Data Siswa"}</>
              )}
            </button>
          </div>
          
          <form id="student-data-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-800 mb-3">Foto Siswa</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-5">
                  <StudentAvatar
                    name={formData.nama_lengkap}
                    photoUrl={photoPreview}
                    className="h-24 w-24 rounded-2xl"
                    textClassName="text-3xl"
                  />
                  <div className="flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#1b4332] shadow-sm ring-1 ring-gray-200 transition hover:bg-green-50">
                      <Camera size={18} />
                      Pilih Gambar
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      Format JPG, PNG, atau WebP. Maksimal 2 MB.
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="Nama Lengkap"
                placeholder="Contoh: Ahmad Fulan"
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Jenis Kelamin (L/P)
                </label>
                <select
                  value={formData.jenis_kelamin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jenis_kelamin: e.target.value,
                    })
                  }
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:border-transparent transition-all font-medium"
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="L">L — Laki-laki</option>
                  <option value="P">P — Perempuan</option>
                </select>
              </div>

              <Input
                label="Nomor Induk Siswa (NIS)"
                placeholder={`Otomatis: ${getNextAvailableNis(students)}`}
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              />

              <Input
                label="NIK"
                placeholder="16 digit NIK siswa"
                inputMode="numeric"
                maxLength={16}
                pattern="[0-9]{16}"
                value={formData.nik}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nik: e.target.value.replace(/\D/g, ""),
                  })
                }
              />

              <Input
                label="Tempat, Tanggal Lahir"
                placeholder="Contoh: Bekasi, 12 Agustus 2012"
                value={formData.tempat_tanggal_lahir}
                onChange={(e) => setFormData({ ...formData, tempat_tanggal_lahir: e.target.value })}
              />

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Kelas</label>
                <select
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:border-transparent transition-all font-medium appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E")', backgroundPosition: 'right .5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="1">Kelas 1</option>
                  <option value="2">Kelas 2</option>
                  <option value="3">Kelas 3</option>
                  <option value="4">Kelas 4</option>
                  <option value="5">Kelas 5</option>
                  <option value="6">Kelas 6</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Jenjang Tahfidz</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:border-transparent transition-all font-medium appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E")', backgroundPosition: 'right .5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  {TAHFIDZ_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Nama Ayah"
                placeholder="Nama lengkap ayah"
                value={formData.nama_ayah}
                onChange={(e) =>
                  setFormData({ ...formData, nama_ayah: e.target.value })
                }
              />

              <Input
                label="Nama Ibu"
                placeholder="Nama lengkap ibu"
                value={formData.nama_ibu}
                onChange={(e) =>
                  setFormData({ ...formData, nama_ibu: e.target.value })
                }
              />

              <Input
                label="Nama Wali Murid / Orang Tua"
                placeholder="Opsional jika nama ayah/ibu sudah diisi"
                value={formData.wali_murid}
                onChange={(e) => setFormData({ ...formData, wali_murid: e.target.value })}
              />

              <Input
                label="No. Telepon / WhatsApp"
                placeholder="Contoh: 081234567890"
                type="tel"
                value={formData.no_telp}
                onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">Alamat Lengkap</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Merdeka No. 10, Bekasi Timur"
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:border-transparent transition-all font-medium min-h-[100px]"
                ></textarea>
              </div>


            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 bg-[#1b4332] hover:bg-[#133c27] text-white disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              ) : (
                <><Save size={20} /> {editingId ? "Simpan Perubahan" : "Simpan Data Siswa"}</>
              )}
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Users className="text-[#1b4332]" size={28} />
            <h2 className="text-xl font-bold text-gray-900">Total {filteredStudents.length} Siswa</h2>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex justify-center mb-6 text-gray-300">
              <Inbox size={80} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Tidak ditemukan</h3>
            <p className="text-lg text-gray-500 font-medium">
              Siswa yang Anda cari tidak ada dalam daftar.
            </p>
          </div>
        ) : (
          <div className="p-8 bg-gray-50/30">
            {Object.keys(groupedStudents).sort().map(kelas => (
              <div key={kelas} className="mb-12 last:mb-0">
                <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-gray-100 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center text-lg font-black shadow-sm">
                    {kelas !== "Tanpa Kelas" ? kelas : "-"}
                  </span>
                  {kelas === "Tanpa Kelas" ? "Belum Masuk Kelas" : `Kelas ${kelas}`}
                  <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-semibold">{groupedStudents[kelas].length} Siswa</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedStudents[kelas].map((student: any) => (
                    <div
                      key={student.id}
                      onClick={() => router.push(`/dashboard/guru/student/${getStudentRouteKey(student)}`)}
                      className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#1b4332] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#1b4332]/5 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                      
                      <div className="flex items-start gap-4">
                        <StudentAvatar
                          name={student.nama_lengkap}
                          photoUrl={student.foto_url}
                          className="h-16 w-16 rounded-2xl"
                          textClassName="text-2xl"
                        />
                        <div className="flex-1 pt-1">
                          <h3 className="text-xl font-bold text-gray-900 transition-colors leading-tight">
                            {student.nama_lengkap || "Tanpa Nama"}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold tracking-wide">
                              <Fingerprint size={12} /> NIS: {student.nis || "-"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-[#1b4332] rounded-md text-xs font-bold tracking-wide">
                              Kelas {student.kelas || "-"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold tracking-wide">
                              {getTahfidzLevelLabel(student.level)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex gap-2 relative z-20">
                          <button 
                            type="button"
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation();
                              handleEdit(student); 
                            }}
                            className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center gap-1 hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation();
                              confirmDelete(student.id); 
                            }}
                            className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-bold text-xs flex items-center gap-1 hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Notifikasi */}
      {notification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-zoom-in">
            <div className="flex flex-col items-center text-center">
              {notification.type === 'success' && (
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
              )}
              {notification.type === 'error' && (
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <X size={40} />
                </div>
              )}
              {notification.type === 'confirm' && (
                <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={40} />
                </div>
              )}
              
              <h3 className="text-2xl font-black text-gray-900 mb-2">
                {notification.type === 'success' ? 'Berhasil!' : notification.type === 'error' ? 'Oops, Gagal!' : 'Konfirmasi Hapus'}
              </h3>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                {notification.message}
              </p>

              {notification.type === 'confirm' ? (
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                    disabled={notification.isLoading}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => notification.id && handleDelete(notification.id)}
                    disabled={notification.isLoading}
                    className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {notification.isLoading ? <><Loader2 size={18} className="animate-spin" /> Menghapus...</> : "Ya, Hapus!"}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                  className="w-full py-4 bg-[#1b4332] hover:bg-[#133c27] text-white rounded-xl font-bold transition-colors shadow-lg"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

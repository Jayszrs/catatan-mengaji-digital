export type UserRole = "guru" | "orang_tua";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface LaporanHarian {
  id: string;
  teacher_id: string;
  student_id: string;
  tanggal: string;
  nama_surah: string;
  hal_ayat: string;
  keterangan: string;
  guru_paraf: boolean;
  orang_tua_paraf: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tadarus {
  id: string;
  teacher_id: string;
  tanggal: string;
  nama_surah: string;
  hal_ayat: string;
  keterangan: string;
  guru_paraf: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  school_id: string;
  level: number;
  created_at: string;
}

export interface NilaiKomposisi {
  id: string;
  student_id: string;
  kategori: string;
  arti: string;
  nilai: number;
  huruf: string;
  created_at: string;
}

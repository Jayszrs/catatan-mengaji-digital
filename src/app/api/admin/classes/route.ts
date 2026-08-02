import { NextRequest, NextResponse } from "next/server";
import {
  authorizeAdmin,
  createAdminClient,
  isAdminServiceConfigured,
} from "@/lib/admin-auth";
import { recordSecurityEvent } from "@/lib/server/account-security";
import { normalizeClassName } from "@/lib/class-names";

type QueryError = { message: string } | null;

function isMissingFeature(error: QueryError) {
  return Boolean(
    error && /schema cache|does not exist|could not find|column/i.test(error.message),
  );
}

function academicYearRange(academicYear: string) {
  const [startText, endText] = academicYear.split("/");
  const start = Number(startText);
  const end = Number(endText);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  return { start: `${start}-07-01`, end: `${end}-06-30` };
}

export async function GET(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: "Konfigurasi layanan Admin belum tersedia di Vercel." },
      { status: 500 },
    );
  }

  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) {
    return NextResponse.json(
      { error: "Sesi Administrator tidak valid atau sudah berakhir." },
      { status: 401 },
    );
  }

  try {
    const admin = createAdminClient();
    const url = new URL(request.url);
    const academicYear = url.searchParams.get("year") || "";
    const className = normalizeClassName(url.searchParams.get("class"));
    const teacherId = url.searchParams.get("teacher") || "all";
    const requestedLevel = url.searchParams.get("level") || "all";

    if (!/^\d{4}\/\d{4}$/.test(academicYear) || !className) {
      return NextResponse.json(
        { error: "Tahun ajaran dan kelas wajib dipilih." },
        { status: 400 },
      );
    }

    const studentResult = await admin
      .from("students")
      .select("id,teacher_id,kelas,level")
      .order("nama_lengkap", { ascending: true });
    if (studentResult.error) throw studentResult.error;

    const matchingStudents = (studentResult.data || []).filter((student) => {
      const sameClass = normalizeClassName(student.kelas) === className;
      const sameTeacher =
        teacherId === "all" || String(student.teacher_id) === teacherId;
      const sameLevel =
        requestedLevel === "all" ||
        Number(student.level || 1) === Number(requestedLevel);
      return sameClass && sameTeacher && sameLevel;
    });
    const studentIds = matchingStudents.map((student) => String(student.id));
    const selectedLevels = Array.from(
      new Set(matchingStudents.map((student) => Number(student.level || 1))),
    ).filter((level) => level >= 1 && level <= 9);

    if (studentIds.length === 0) {
      return NextResponse.json(
        { scores: [], daily_reports: [], curriculum: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const scoreSelection =
      "id,student_id,tanggal,tahun_ajaran,nama_surah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan";
    const currentScores = await admin
      .from("laporan_tahsin_tahfidz")
      .select(scoreSelection)
      .in("student_id", studentIds)
      .eq("tahun_ajaran", academicYear)
      .order("tanggal", { ascending: false })
      .limit(5000);

    let scores = currentScores.data || [];
    if (currentScores.error) {
      if (!isMissingFeature(currentScores.error)) throw currentScores.error;
      const legacyScores = await admin
        .from("laporan_tahsin_tahfidz")
        .select(
          "id,student_id,tanggal,nama_surah,nilai,nilai_kelancaran,nilai_makhraj,nilai_tajwid,nilai_hafalan,nilai_rata_rata,keterangan",
        )
        .in("student_id", studentIds)
        .order("tanggal", { ascending: false })
        .limit(5000);
      if (legacyScores.error) throw legacyScores.error;
      scores = (legacyScores.data || []).map((row) => ({
        ...row,
        tahun_ajaran: null,
      }));
    }

    const range = academicYearRange(academicYear);
    let dailyQuery = admin
      .from("daily_student_reports")
      .select(
        "id,student_id,tanggal,status_presensi,kegiatan,ringkasan_tadarus,ringkasan_hafalan,catatan_guru",
      )
      .in("student_id", studentIds)
      .order("tanggal", { ascending: false })
      .limit(2000);
    if (range) {
      dailyQuery = dailyQuery
        .gte("tanggal", range.start)
        .lte("tanggal", range.end);
    }

    const curriculumQuery = admin
      .from("surah_curriculum")
      .select("id,level,nama_surah,urutan")
      .eq("tahun_ajaran", academicYear)
      .in("level", selectedLevels)
      .order("level", { ascending: true })
      .order("urutan", { ascending: true });

    const [dailyResult, curriculumResult] = await Promise.all([
      dailyQuery,
      curriculumQuery,
    ]);
    if (dailyResult.error && !isMissingFeature(dailyResult.error)) {
      throw dailyResult.error;
    }
    if (curriculumResult.error && !isMissingFeature(curriculumResult.error)) {
      throw curriculumResult.error;
    }

    return NextResponse.json(
      {
        scores,
        daily_reports: dailyResult.data || [],
        curriculum: curriculumResult.data || [],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Data akademik kelas gagal dimuat.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: "Konfigurasi layanan Admin belum tersedia di Vercel." },
      { status: 500 },
    );
  }

  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) {
    return NextResponse.json(
      { error: "Sesi Administrator tidak valid atau sudah berakhir." },
      { status: 401 },
    );
  }

  try {
    const admin = createAdminClient();
    const body = await request.json();
    const className = normalizeClassName(body.class_name);
    const academicYear = String(body.academic_year || "");
    const teacherId = String(body.teacher_id || "");
    if (
      !/^[1-6][A-Z]$/.test(className) ||
      !/^\d{4}\/\d{4}$/.test(academicYear) ||
      !teacherId
    ) {
      return NextResponse.json(
        { error: "Kelas, tahun ajaran, dan wali kelas mengaji wajib dipilih." },
        { status: 400 },
      );
    }

    const { data: roleRow, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", teacherId)
      .maybeSingle();
    if (roleError) throw roleError;
    if (roleRow?.role !== "guru") {
      return NextResponse.json(
        { error: "Wali kelas mengaji harus menggunakan akun Guru." },
        { status: 400 },
      );
    }

    const [{ data: profile }, { data: authUser }] = await Promise.all([
      admin
        .from("teacher_profiles")
        .select("full_name")
        .eq("user_id", teacherId)
        .maybeSingle(),
      admin.auth.admin.getUserById(teacherId),
    ]);
    const teacherName = String(
      profile?.full_name ||
        authUser.user?.user_metadata?.name ||
        authUser.user?.user_metadata?.username ||
        authUser.user?.email ||
        "Guru",
    );

    const { data: existing, error: existingError } = await admin
      .from("classes")
      .select("id,teacher_id,wali_kelas")
      .eq("nama_kelas", className)
      .eq("tahun_ajaran", academicYear)
      .maybeSingle();
    if (existingError) throw existingError;

    const payload = {
      teacher_id: teacherId,
      nama_kelas: className,
      tingkat: Number(className.charAt(0)),
      rombel: className.slice(1),
      wali_kelas: teacherName,
      tahun_ajaran: academicYear,
      aktif: true,
      updated_at: new Date().toISOString(),
    };
    const result = existing
      ? await admin.from("classes").update(payload).eq("id", existing.id)
      : await admin.from("classes").insert(payload);
    if (result.error) throw result.error;

    const { data: classStudents, error: studentLookupError } = await admin
      .from("students")
      .select("id,kelas");
    if (studentLookupError) throw studentLookupError;
    const activeStudentIds = (classStudents || [])
      .filter(
        (student) =>
          !String(student.kelas || "").toUpperCase().startsWith("ARSIP-") &&
          normalizeClassName(student.kelas) === className,
      )
      .map((student) => String(student.id));
    if (activeStudentIds.length > 0) {
      const { error: studentUpdateError } = await admin
        .from("students")
        .update({ teacher_id: teacherId })
        .in("id", activeStudentIds);
      if (studentUpdateError) throw studentUpdateError;
    }

    await recordSecurityEvent(admin, {
      actorUserId: authorization.user?.id || null,
      eventType: "class_quran_teacher_changed",
      status: "success",
      request,
      details: {
        class_name: className,
        academic_year: academicYear,
        previous_teacher_id: existing?.teacher_id || null,
        teacher_id: teacherId,
        teacher_name: teacherName,
        assigned_student_count: activeStudentIds.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Wali kelas mengaji ${className} berhasil diperbarui.`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wali kelas mengaji gagal diperbarui.",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  authorizeAdmin,
  createAdminClient,
  isAdminServiceConfigured,
} from "@/lib/admin-auth";
import { isManagedAccountEmail } from "@/lib/account-identifier";
import { recordSecurityEvent } from "@/lib/server/account-security";
import { getCurrentAcademicYear } from "@/lib/tahfidz-levels";

// Supabase table results are composed dynamically because this endpoint joins
// several legacy schemas that do not share one generated database type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseRow = Record<string, any>;

async function requireAdmin(request: NextRequest) {
  if (!isAdminServiceConfigured()) {
    return {
      authorization: null,
      response: NextResponse.json(
        { error: "Konfigurasi layanan Admin belum tersedia di Vercel." },
        { status: 500 },
      ),
    };
  }
  const authorization = await authorizeAdmin(request);
  if (!authorization.authorized) {
    return {
      authorization: null,
      response: NextResponse.json(
        { error: "Sesi Administrator tidak valid atau sudah berakhir." },
        { status: 401 },
      ),
    };
  }
  return { authorization, response: null };
}

function jakartaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return jakartaDate(date);
}

function userDisplayName(user: User) {
  return String(
    user.user_metadata?.name ||
      user.user_metadata?.parent_profile?.full_name ||
      user.user_metadata?.username ||
      user.email ||
      "Pengguna",
  );
}

function userContact(user: User) {
  const contact = String(user.user_metadata?.contact_email || "").trim();
  return isManagedAccountEmail(user.email)
    ? contact || "-"
    : user.email || "-";
}

function userAuditIdentity(user: User) {
  const username = String(user.user_metadata?.username || "").trim();
  if (username) return `@${username}`;
  const emailUsername = String(user.email || "").split("@")[0]?.trim();
  return emailUsername ? `@${emailUsername}` : userDisplayName(user);
}

function normalizeClassName(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/KELAS/g, "")
    .replace(/\s+/g, "");
}

function studentPlacement(value: unknown) {
  const raw = String(value || "").trim().toUpperCase();
  const archived = raw.match(
    /^ARSIP-(NONAKTIF|PINDAH|LULUS)(?:-([1-6][A-Z]))?$/,
  );
  if (!archived) {
    return {
      className: normalizeClassName(raw),
      status: "active" as const,
    };
  }
  return {
    className: archived[2] || "",
    status:
      archived[1] === "PINDAH"
        ? ("moved" as const)
        : ("inactive" as const),
  };
}

function isArchivedClass(value: unknown) {
  return studentPlacement(value).status !== "active";
}

async function optionalRows(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
) {
  const result = await query;
  if (!result.error) return (result.data || []) as DatabaseRow[];
  if (/schema cache|does not exist|could not find/i.test(result.error.message)) {
    return [];
  }
  throw new Error(result.error.message);
}

function latestDate(values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) || null;
}

function isBanned(user: User) {
  if (!user.banned_until) return false;
  return new Date(user.banned_until).getTime() > Date.now();
}

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  try {
    const admin = createAdminClient();
    const { data: authData, error: authError } =
      await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authError) throw authError;

    const today = jakartaDate();
    const weekStart = daysAgoIso(6);
    const [
      roles,
      teacherProfiles,
      students,
      classes,
      parentLinks,
      dailyReports,
      dailyScores,
      levelExams,
      munaqosyahExams,
      curriculum,
      securityEvents,
    ] = await Promise.all([
      optionalRows(admin.from("user_roles").select("user_id,role")),
      optionalRows(
        admin
          .from("teacher_profiles")
          .select("user_id,full_name,phone,address,updated_at"),
      ),
      optionalRows(
        admin
          .from("students")
          .select(
            "id,teacher_id,nama_lengkap,nis,kelas,level,wali_murid,no_telp,created_at,updated_at",
          )
          .order("nama_lengkap", { ascending: true }),
      ),
      optionalRows(
        admin
          .from("classes")
          .select(
            "id,teacher_id,nama_kelas,tingkat,rombel,wali_kelas,tahun_ajaran,aktif,updated_at",
          )
          .order("tingkat", { ascending: true }),
      ),
      optionalRows(
        admin
          .from("parent_student_links")
          .select("parent_id,student_id,status,updated_at"),
      ),
      optionalRows(
        admin
          .from("daily_student_reports")
          .select(
            "id,teacher_id,student_id,tanggal,status_presensi,kegiatan,ringkasan_tadarus,ringkasan_hafalan,created_at,updated_at",
          )
          .gte("tanggal", weekStart)
          .order("tanggal", { ascending: false }),
      ),
      optionalRows(
        admin
          .from("laporan_tahsin_tahfidz")
          .select(
            "id,teacher_id,student_id,tanggal,nama_surah,nilai,nilai_rata_rata,keterangan",
          )
          .gte("tanggal", daysAgoIso(30))
          .order("tanggal", { ascending: false })
          .limit(250),
      ),
      optionalRows(
        admin
          .from("level_promotion_exams")
          .select(
            "id,teacher_id,student_id,tanggal,level_asal,level_tujuan,nilai_rata_rata,status,tahun_ajaran,created_at,updated_at",
          )
          .order("tanggal", { ascending: false }),
      ),
      optionalRows(
        admin
          .from("munaqosyah_exams")
          .select(
            "id,teacher_id,student_id,tanggal,status,hasil_ujian,created_at,updated_at",
          )
          .order("tanggal", { ascending: false }),
      ),
      optionalRows(
        admin
          .from("surah_curriculum")
          .select("id,tahun_ajaran,level,nama_surah,urutan,updated_at")
          .order("tahun_ajaran", { ascending: false })
          .order("level", { ascending: true })
          .order("urutan", { ascending: true }),
      ),
      optionalRows(
        admin
          .from("account_security_events")
          .select(
            "id,actor_user_id,target_user_id,event_type,status,details,created_at",
          )
          .order("created_at", { ascending: false })
          .limit(250),
      ),
    ]);

    const activeUsers = authData.users.filter((user) => !user.deleted_at);
    const roleByUserId = new Map(
      roles.map((row) => [String(row.user_id), String(row.role)]),
    );
    const profileByTeacherId = new Map(
      teacherProfiles.map((row) => [String(row.user_id), row]),
    );
    const studentById = new Map(
      students.map((student) => [String(student.id), student]),
    );
    const activeLinks = parentLinks.filter((link) => link.status === "active");
    const linkByParentId = new Map(
      activeLinks.map((link) => [String(link.parent_id), link]),
    );
    const linkedStudentIds = new Set(
      activeLinks.map((link) => String(link.student_id)),
    );
    const auditIdentityById = new Map(
      activeUsers.map((user) => [user.id, userAuditIdentity(user)]),
    );

    const teachers = activeUsers
      .filter(
        (user) =>
          user.app_metadata?.role === "guru" ||
          roleByUserId.get(user.id) === "guru",
      )
      .map((user) => {
        const teacherStudents = students.filter(
          (student) =>
            String(student.teacher_id) === user.id &&
            !isArchivedClass(student.kelas),
        );
        const teacherClasses = classes.filter(
          (row) => String(row.teacher_id) === user.id && row.aktif !== false,
        );
        const todayRows = dailyReports.filter(
          (row) => String(row.teacher_id) === user.id && row.tanggal === today,
        );
        const weekRows = dailyReports.filter(
          (row) => String(row.teacher_id) === user.id,
        );
        const teacherLevelExams = levelExams.filter(
          (row) => String(row.teacher_id) === user.id,
        );
        const teacherMunaqosyah = munaqosyahExams.filter(
          (row) => String(row.teacher_id) === user.id,
        );
        const derivedClasses = teacherStudents.map((student) =>
          normalizeClassName(student.kelas),
        );
        const classNames = Array.from(
          new Set([
            ...teacherClasses.map((row) => normalizeClassName(row.nama_kelas)),
            ...derivedClasses,
          ].filter(Boolean)),
        ).sort();
        const expectedToday = teacherStudents.length;
        const expectedWeek = expectedToday * 7;
        return {
          id: user.id,
          name: profileByTeacherId.get(user.id)?.full_name || userDisplayName(user),
          username: String(user.user_metadata?.username || ""),
          email: userContact(user),
          status: isBanned(user) ? "inactive" : "active",
          approval_status:
            user.app_metadata?.approval_status ||
            user.user_metadata?.approval_status ||
            "approved",
          last_login_at: user.last_sign_in_at || null,
          last_report_at: latestDate([
            ...todayRows.map((row) => row.updated_at || row.tanggal),
            ...weekRows.map((row) => row.updated_at || row.tanggal),
            ...teacherLevelExams.map((row) => row.tanggal),
            ...teacherMunaqosyah.map((row) => row.updated_at || row.tanggal),
          ]),
          classes: classNames,
          student_count: teacherStudents.length,
          reports_today: todayRows.length,
          expected_today: expectedToday,
          today_percentage:
            expectedToday > 0
              ? Math.min(100, Math.round((todayRows.length / expectedToday) * 100))
              : 0,
          reports_week: weekRows.length,
          week_percentage:
            expectedWeek > 0
              ? Math.min(100, Math.round((weekRows.length / expectedWeek) * 100))
              : 0,
          level_exam_count: teacherLevelExams.length,
          munaqosyah_count: teacherMunaqosyah.length,
          profile_complete: Boolean(
            profileByTeacherId.get(user.id)?.full_name &&
              profileByTeacherId.get(user.id)?.phone,
          ),
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, "id"));

    const parents = activeUsers
      .filter(
        (user) =>
          user.app_metadata?.role === "orang_tua" ||
          roleByUserId.get(user.id) === "orang_tua",
      )
      .map((user) => {
        const link = linkByParentId.get(user.id);
        const student = link ? studentById.get(String(link.student_id)) : null;
        const profile = user.user_metadata?.parent_profile || {};
        const profileValues = [
          profile.full_name || user.user_metadata?.name,
          profile.phone,
          profile.address,
          profile.relationship,
        ];
        return {
          id: user.id,
          name: userDisplayName(user),
          username: String(user.user_metadata?.username || ""),
          email: userContact(user),
          status: isBanned(user) ? "inactive" : "active",
          last_login_at: user.last_sign_in_at || null,
          profile_percentage: Math.round(
            (profileValues.filter(Boolean).length / profileValues.length) * 100,
          ),
          linked_student: student
            ? {
                id: student.id,
                name: student.nama_lengkap,
                nis: student.nis,
                class_name: student.kelas,
                level: student.level,
              }
            : null,
          link_updated_at: link?.updated_at || null,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, "id"));

    const teacherNameById = new Map(
      teachers.map((teacher) => [teacher.id, teacher.name]),
    );
    const duplicateNis = new Set<string>();
    const nisCounts = new Map<string, number>();
    students.forEach((student) => {
      const nis = String(student.nis || "").trim();
      if (nis) nisCounts.set(nis, (nisCounts.get(nis) || 0) + 1);
    });
    nisCounts.forEach((count, nis) => {
      if (count > 1) duplicateNis.add(nis);
    });

    const safeStudents = students.map((student) => {
      const placement = studentPlacement(student.kelas);
      return {
        id: student.id,
        name: student.nama_lengkap,
        nis: student.nis,
        class_name: placement.className,
        level: Number(student.level || 1),
        teacher_id: student.teacher_id,
        teacher_name:
          teacherNameById.get(String(student.teacher_id)) || "Belum ada Guru",
        parent_linked: linkedStudentIds.has(String(student.id)),
        duplicate_nis: duplicateNis.has(String(student.nis || "").trim()),
        status: placement.status,
        archived: placement.status !== "active",
        updated_at: student.updated_at || student.created_at,
      };
    });

    const safeClasses = classes.map((row) => ({
      id: row.id,
      name: row.nama_kelas,
      academic_year: row.tahun_ajaran,
      active: row.aktif !== false,
      teacher_id: row.teacher_id,
      teacher_name:
        teacherNameById.get(String(row.teacher_id)) || "Guru tidak ditemukan",
      homeroom_teacher: row.wali_kelas,
      student_count: safeStudents.filter(
        (student) =>
          !student.archived &&
          normalizeClassName(student.class_name) ===
            normalizeClassName(row.nama_kelas),
      ).length,
    }));

    const pendingAccounts = activeUsers.filter(
      (user) =>
        (user.app_metadata?.approval_status ||
          user.user_metadata?.approval_status) === "pending",
    ).length;
    const problemStudents = safeStudents.filter(
      (student) =>
        !student.archived &&
        (student.duplicate_nis ||
          !student.parent_linked ||
          !student.teacher_id ||
          !student.class_name),
    );

    const reportCompleteness = teachers.map((teacher) => ({
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      class_names: teacher.classes,
      reports_today: teacher.reports_today,
      expected_today: teacher.expected_today,
      week_percentage: teacher.week_percentage,
      level_exam_count: teacher.level_exam_count,
      munaqosyah_count: teacher.munaqosyah_count,
      status:
        teacher.expected_today > 0 && teacher.today_percentage >= 90
          ? "Lengkap"
          : teacher.today_percentage >= 60
            ? "Hampir Lengkap"
            : "Perlu Dicek",
    }));

    const storedAuditEvents = securityEvents.map((event) => ({
      id: event.id,
      event_type: event.event_type,
      status: event.status,
      actor_id: event.actor_user_id,
      actor_name: event.actor_user_id
        ? auditIdentityById.get(String(event.actor_user_id)) || "Akun terhapus"
        : "@admin",
      target_id: event.target_user_id,
      target_name: event.target_user_id
        ? auditIdentityById.get(String(event.target_user_id)) || "Akun terhapus"
        : "-",
      details: event.details || {},
      created_at: event.created_at,
    }));

    // Password Admin disimpan di metadata Auth. Jadikan metadata ini sumber
    // cadangan agar audit tetap terlihat jika migrasi tabel audit belum aktif.
    const passwordAuditEvents = activeUsers.flatMap((user) => {
      const changedAt = String(user.user_metadata?.password_changed_at || "");
      const changedTimestamp = new Date(changedAt).getTime();
      const alreadyRecorded = securityEvents.some(
        (event) =>
          [
            "admin_password_changed",
            "self_password_reset_completed",
          ].includes(String(event.event_type)) &&
          String(event.target_user_id) === user.id &&
          new Date(event.created_at).getTime() >= changedTimestamp - 5_000,
      );
      if (!changedAt || alreadyRecorded) return [];
      const changedBy = String(
        user.user_metadata?.password_changed_by || "",
      );
      const changeReason = String(
        user.user_metadata?.password_change_reason || "admin_reset",
      );
      return [
        {
          id: `password-${user.id}-${changedAt}`,
          event_type:
            changeReason === "forgot_password" && changedBy === user.id
              ? "self_password_reset_completed"
              : "admin_password_changed",
          status: "success" as const,
          actor_id: changedBy || null,
          actor_name:
            auditIdentityById.get(changedBy) || "@admin",
          target_id: user.id,
          target_name: userAuditIdentity(user),
          details: {
            reason: changeReason,
            source: "auth_metadata",
            password_changed_at: changedAt,
          },
          created_at: changedAt,
        },
      ];
    });

    // Laporan harian sebelumnya ditulis langsung oleh Guru melalui RLS, bukan
    // endpoint Admin. Bentuk event audit dari data laporan yang otoritatif agar
    // setiap simpan/edit tetap terpantau tanpa bergantung pada tabel audit.
    const dailyReportAuditEvents = dailyReports.map((report) => {
      const createdAt = String(report.created_at || "");
      const updatedAt = String(report.updated_at || "");
      const operation =
        createdAt && updatedAt &&
        new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 5_000
          ? "updated"
          : "created";
      return {
        id: `daily-${report.id}-${report.updated_at || report.tanggal}`,
        event_type: "teacher_daily_report_saved",
        status: "success" as const,
        actor_id: String(report.teacher_id || "") || null,
        actor_name:
          auditIdentityById.get(String(report.teacher_id)) ||
          "Guru tidak ditemukan",
        target_id: String(report.student_id || "") || null,
        target_name:
          studentById.get(String(report.student_id))?.nama_lengkap ||
          "Siswa tidak ditemukan",
        details: {
          operation,
          report_date: report.tanggal,
          attendance_status: report.status_presensi,
          activity: report.kegiatan,
          tadarus: report.ringkasan_tadarus,
          memorization: report.ringkasan_hafalan,
          source: "daily_student_reports",
        },
        created_at: report.updated_at || `${report.tanggal}T00:00:00+07:00`,
      };
    });

    const levelExamAuditEvents = levelExams.map((exam) => ({
      id: `level-${exam.id}-${exam.updated_at || exam.tanggal}`,
      event_type: "teacher_level_exam_saved",
      status: "success" as const,
      actor_id: String(exam.teacher_id || "") || null,
      actor_name:
        auditIdentityById.get(String(exam.teacher_id)) ||
        "Guru tidak ditemukan",
      target_id: String(exam.student_id || "") || null,
      target_name:
        studentById.get(String(exam.student_id))?.nama_lengkap ||
        "Siswa tidak ditemukan",
      details: {
        exam_date: exam.tanggal,
        source_level: exam.level_asal,
        target_level: exam.level_tujuan,
        average_score: exam.nilai_rata_rata,
        result: exam.status,
        academic_year: exam.tahun_ajaran,
        source: "level_promotion_exams",
      },
      created_at: exam.updated_at || exam.created_at || `${exam.tanggal}T00:00:00+07:00`,
    }));

    const dailyScoreAuditEvents = dailyScores.map((score) => ({
      id: `score-${score.id}-${score.tanggal}`,
      event_type: "teacher_daily_score_saved",
      status: "success" as const,
      actor_id: String(score.teacher_id || "") || null,
      actor_name:
        auditIdentityById.get(String(score.teacher_id)) ||
        "Guru tidak ditemukan",
      target_id: String(score.student_id || "") || null,
      target_name:
        studentById.get(String(score.student_id))?.nama_lengkap ||
        "Siswa tidak ditemukan",
      details: {
        score_date: score.tanggal,
        surah_name: score.nama_surah,
        average_score: score.nilai_rata_rata ?? score.nilai,
        description: score.keterangan,
        source: "laporan_tahsin_tahfidz",
      },
      created_at: `${score.tanggal}T12:00:00+07:00`,
    }));

    const munaqosyahAuditEvents = munaqosyahExams.map((exam) => {
      const result =
        exam.hasil_ujian && typeof exam.hasil_ujian === "object"
          ? (exam.hasil_ujian as Record<string, unknown>)
          : {};
      return {
        id: `munaqosyah-${exam.id}-${exam.updated_at || exam.tanggal}`,
        event_type: "teacher_munaqosyah_saved",
        status: "success" as const,
        actor_id: String(exam.teacher_id || "") || null,
        actor_name:
          auditIdentityById.get(String(exam.teacher_id)) ||
          "Guru tidak ditemukan",
        target_id: String(exam.student_id || "") || null,
        target_name:
          studentById.get(String(exam.student_id))?.nama_lengkap ||
          "Siswa tidak ditemukan",
        details: {
          exam_date: exam.tanggal,
          exam_status: exam.status,
          juz: result.juz,
          average_score: result.nilaiRataRata,
          predicate:
            result.kategoriMunaqosyah &&
            typeof result.kategoriMunaqosyah === "object"
              ? (result.kategoriMunaqosyah as Record<string, unknown>).indo
              : null,
          source: "munaqosyah_exams",
        },
        created_at:
          exam.updated_at || exam.created_at || `${exam.tanggal}T00:00:00+07:00`,
      };
    });

    const auditEvents = [
      ...storedAuditEvents,
      ...passwordAuditEvents,
      ...dailyReportAuditEvents,
      ...dailyScoreAuditEvents,
      ...levelExamAuditEvents,
      ...munaqosyahAuditEvents,
    ]
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() -
          new Date(left.created_at).getTime(),
      )
      .slice(0, 250);

    const yearLabels = new Set<string>([getCurrentAcademicYear()]);
    classes.forEach((row) => yearLabels.add(String(row.tahun_ajaran)));
    curriculum.forEach((row) => yearLabels.add(String(row.tahun_ajaran)));
    const academicYears = Array.from(yearLabels)
      .filter((year) => /^\d{4}\/\d{4}$/.test(year))
      .sort((left, right) => right.localeCompare(left))
      .map((year) => ({
        year,
        active: classes.some(
          (row) => row.tahun_ajaran === year && row.aktif !== false,
        ),
        class_count: classes.filter((row) => row.tahun_ajaran === year).length,
        surah_count: curriculum.filter((row) => row.tahun_ajaran === year).length,
      }));

    const latestSettingsEvent = securityEvents.find(
      (event) => event.event_type === "academic_settings_updated",
    );
    const academicSettings = latestSettingsEvent?.details?.settings || {
      daily_weight: 30,
      level_exam_weight: 30,
      munaqosyah_weight: 40,
      minimum_level_score: 75,
      minimum_munaqosyah_score: 75,
    };

    const alerts = [
      pendingAccounts > 0
        ? `${pendingAccounts} akun menunggu persetujuan.`
        : null,
      duplicateNis.size > 0
        ? `${duplicateNis.size} NIS terdeteksi ganda.`
        : null,
      safeStudents.filter((student) => !student.archived && !student.parent_linked)
        .length > 0
        ? `${safeStudents.filter((student) => !student.archived && !student.parent_linked).length} siswa belum terhubung ke Orang Tua.`
        : null,
      teachers.filter(
        (teacher) => teacher.expected_today > 0 && teacher.today_percentage < 60,
      ).length > 0
        ? `${teachers.filter((teacher) => teacher.expected_today > 0 && teacher.today_percentage < 60).length} Guru perlu dicek laporan hari ini.`
        : null,
    ].filter(Boolean);

    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        today,
        summary: {
          teacher_count: teachers.length,
          parent_count: parents.length,
          student_count: safeStudents.filter((student) => !student.archived)
            .length,
          active_class_count: safeClasses.filter((row) => row.active).length,
          reports_today: dailyReports.filter((row) => row.tanggal === today)
            .length,
          reports_week: dailyReports.length,
          level_exam_count: levelExams.length,
          munaqosyah_count: munaqosyahExams.length,
          pending_account_count: pendingAccounts,
          problem_count: problemStudents.length,
        },
        teachers,
        parents,
        students: safeStudents,
        classes: safeClasses,
        report_completeness: reportCompleteness,
        audit_events: auditEvents,
        academic_years: academicYears,
        curriculum: curriculum.map((row) => ({
          id: row.id,
          academic_year: row.tahun_ajaran,
          level: row.level,
          surah_name: row.nama_surah,
          order: row.urutan,
        })),
        academic_settings: academicSettings,
        alerts,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Data monitoring Admin gagal dimuat.",
      },
      { status: 500 },
    );
  }
}

async function ensureRole(
  admin: SupabaseClient,
  userId: string,
  role: "guru" | "orang_tua",
) {
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data?.role !== role) {
    throw new Error(
      role === "guru"
        ? "Akun tujuan bukan Guru."
        : "Akun tujuan bukan Orang Tua.",
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;
  const admin = createAdminClient();

  try {
    const body = await request.json();
    const action = String(body.action || "");
    const actorUserId = guard.authorization?.user?.id || null;

    if (action === "set_teacher_status") {
      const teacherId = String(body.teacher_id || "");
      const active = body.active === true;
      if (!teacherId || teacherId === actorUserId) {
        return NextResponse.json(
          { error: "Guru yang akan diubah belum dipilih." },
          { status: 400 },
        );
      }
      await ensureRole(admin, teacherId, "guru");
      const { error } = await admin.auth.admin.updateUserById(teacherId, {
        ban_duration: active ? "none" : "876000h",
      });
      if (error) throw error;
      await recordSecurityEvent(admin, {
        actorUserId,
        targetUserId: teacherId,
        eventType: active ? "teacher_activated" : "teacher_deactivated",
        status: "success",
        request,
      });
      return NextResponse.json({
        success: true,
        message: active ? "Akun Guru diaktifkan." : "Akun Guru dinonaktifkan.",
      });
    }

    if (action === "manage_parent_link") {
      const parentId = String(body.parent_id || "");
      const operation = String(body.operation || "");
      const nis = String(body.nis || "").trim();
      if (!parentId || !["connect", "disconnect"].includes(operation)) {
        return NextResponse.json(
          { error: "Permintaan hubungan Orang Tua tidak valid." },
          { status: 400 },
        );
      }
      await ensureRole(admin, parentId, "orang_tua");

      if (operation === "disconnect") {
        const { error } = await admin
          .from("parent_student_links")
          .update({ status: "inactive", updated_at: new Date().toISOString() })
          .eq("parent_id", parentId)
          .eq("status", "active");
        if (error) throw error;
        await recordSecurityEvent(admin, {
          actorUserId,
          targetUserId: parentId,
          eventType: "admin_parent_link_disconnect",
          status: "success",
          request,
        });
        return NextResponse.json({
          success: true,
          message: "Hubungan Orang Tua dan siswa diputuskan.",
        });
      }

      if (!nis || nis.length > 50) {
        return NextResponse.json(
          { error: "NIS siswa wajib diisi." },
          { status: 400 },
        );
      }
      const { data: student, error: studentError } = await admin
        .from("students")
        .select("id,nama_lengkap")
        .eq("nis", nis)
        .maybeSingle();
      if (studentError) throw studentError;
      if (!student) {
        return NextResponse.json(
          { error: "Siswa dengan NIS tersebut tidak ditemukan." },
          { status: 404 },
        );
      }
      const { data: occupied, error: occupiedError } = await admin
        .from("parent_student_links")
        .select("parent_id")
        .eq("student_id", student.id)
        .eq("status", "active")
        .neq("parent_id", parentId)
        .maybeSingle();
      if (occupiedError) throw occupiedError;
      if (occupied) {
        return NextResponse.json(
          { error: "Siswa masih terhubung dengan akun Orang Tua lain." },
          { status: 409 },
        );
      }
      const { error } = await admin.from("parent_student_links").upsert(
        {
          parent_id: parentId,
          student_id: student.id,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "parent_id" },
      );
      if (error) throw error;
      await recordSecurityEvent(admin, {
        actorUserId,
        targetUserId: parentId,
        eventType: "admin_parent_link_connect",
        status: "success",
        request,
        details: { student_id: student.id },
      });
      return NextResponse.json({
        success: true,
        message: `Orang Tua dihubungkan dengan ${student.nama_lengkap}.`,
      });
    }

    if (action === "move_student") {
      const studentId = String(body.student_id || "");
      const teacherId = String(body.teacher_id || "");
      const className = normalizeClassName(body.class_name);
      const level = Number(body.level);
      if (
        !studentId ||
        !teacherId ||
        !/^[1-6][A-Z]$/.test(className) ||
        !Number.isInteger(level) ||
        level < 1 ||
        level > 9
      ) {
        return NextResponse.json(
          { error: "Guru, kelas 1A–6B, dan level 1–9 wajib dipilih." },
          { status: 400 },
        );
      }
      await ensureRole(admin, teacherId, "guru");
      const { data: previous, error: previousError } = await admin
        .from("students")
        .select("teacher_id,kelas,level,nama_lengkap")
        .eq("id", studentId)
        .maybeSingle();
      if (previousError) throw previousError;
      if (!previous) {
        return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
      }
      const { error } = await admin
        .from("students")
        .update({ teacher_id: teacherId, kelas: className, level })
        .eq("id", studentId);
      if (error) throw error;
      await recordSecurityEvent(admin, {
        actorUserId,
        eventType: "student_assignment_updated",
        status: "success",
        request,
        details: {
          student_id: studentId,
          student_name: previous.nama_lengkap,
          from_teacher_id: previous.teacher_id,
          from_class: previous.kelas,
          from_level: previous.level,
          to_teacher_id: teacherId,
          to_class: className,
          to_level: level,
        },
      });
      return NextResponse.json({ success: true, message: "Penempatan siswa diperbarui." });
    }

    if (action === "set_student_status") {
      const studentId = String(body.student_id || "");
      const className = normalizeClassName(body.class_name);
      const status = String(body.status || "");
      if (
        !studentId ||
        !/^[1-6][A-Z]$/.test(className) ||
        !["active", "inactive", "moved"].includes(status)
      ) {
        return NextResponse.json(
          { error: "Siswa, kelas, dan status wajib dipilih." },
          { status: 400 },
        );
      }
      const { data: previous, error: previousError } = await admin
        .from("students")
        .select("nama_lengkap,kelas")
        .eq("id", studentId)
        .maybeSingle();
      if (previousError) throw previousError;
      if (!previous) {
        return NextResponse.json(
          { error: "Siswa tidak ditemukan." },
          { status: 404 },
        );
      }

      const storedClass =
        status === "active"
          ? className
          : `ARSIP-${status === "moved" ? "PINDAH" : "NONAKTIF"}-${className}`;
      const { error } = await admin
        .from("students")
        .update({ kelas: storedClass })
        .eq("id", studentId);
      if (error) throw error;

      await recordSecurityEvent(admin, {
        actorUserId,
        eventType: "student_status_changed",
        status: "success",
        request,
        details: {
          student_id: studentId,
          student_name: previous.nama_lengkap,
          previous_class: previous.kelas,
          class_name: className,
          student_status: status,
        },
      });
      return NextResponse.json({
        success: true,
        message:
          status === "active"
            ? "Status siswa diaktifkan kembali."
            : status === "moved"
              ? "Status siswa diubah menjadi pindah."
              : "Status siswa diubah menjadi nonaktif.",
      });
    }

    if (action === "mass_promote") {
      const sourceClass = normalizeClassName(body.source_class);
      const targetClass = normalizeClassName(body.target_class);
      const incrementLevel = body.increment_level === true;
      if (!/^[1-6][A-Z]$/.test(sourceClass) || !/^[1-6][A-Z]$/.test(targetClass)) {
        return NextResponse.json(
          { error: "Kelas asal dan kelas tujuan wajib diisi." },
          { status: 400 },
        );
      }
      if (sourceClass === targetClass) {
        return NextResponse.json(
          { error: "Kelas tujuan harus berbeda dari kelas asal." },
          { status: 400 },
        );
      }
      const { data: sourceStudents, error: sourceError } = await admin
        .from("students")
        .select("id,kelas,level")
        .eq("kelas", sourceClass);
      if (sourceError) throw sourceError;
      if (!sourceStudents?.length) {
        return NextResponse.json(
          { error: `Tidak ada siswa di kelas ${sourceClass}.` },
          { status: 404 },
        );
      }
      for (const student of sourceStudents) {
        const nextLevel = incrementLevel
          ? Math.min(9, Number(student.level || 1) + 1)
          : Number(student.level || 1);
        const { error } = await admin
          .from("students")
          .update({ kelas: targetClass, level: nextLevel })
          .eq("id", student.id);
        if (error) throw error;
      }
      await recordSecurityEvent(admin, {
        actorUserId,
        eventType: "students_mass_promoted",
        status: "success",
        request,
        details: {
          source_class: sourceClass,
          target_class: targetClass,
          increment_level: incrementLevel,
          student_count: sourceStudents.length,
        },
      });
      return NextResponse.json({
        success: true,
        message: `${sourceStudents.length} siswa dipindahkan dari ${sourceClass} ke ${targetClass}.`,
      });
    }

    if (action === "archive_student") {
      const studentId = String(body.student_id || "");
      const reason = body.reason === "PINDAH" ? "PINDAH" : "LULUS";
      const { data: previous, error: previousError } = await admin
        .from("students")
        .select("nama_lengkap,kelas,level")
        .eq("id", studentId)
        .maybeSingle();
      if (previousError) throw previousError;
      if (!previous) {
        return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
      }
      const { error } = await admin
        .from("students")
        .update({ kelas: `ARSIP-${reason}` })
        .eq("id", studentId);
      if (error) throw error;
      await recordSecurityEvent(admin, {
        actorUserId,
        eventType: "student_archived",
        status: "success",
        request,
        details: {
          student_id: studentId,
          student_name: previous.nama_lengkap,
          previous_class: previous.kelas,
          previous_level: previous.level,
          reason,
        },
      });
      return NextResponse.json({ success: true, message: "Siswa berhasil diarsipkan." });
    }

    if (action === "set_academic_year_status") {
      const year = String(body.academic_year || "");
      const active = body.active === true;
      if (!/^\d{4}\/\d{4}$/.test(year)) {
        return NextResponse.json({ error: "Format tahun ajaran tidak valid." }, { status: 400 });
      }
      const { error } = await admin
        .from("classes")
        .update({ aktif: active, updated_at: new Date().toISOString() })
        .eq("tahun_ajaran", year);
      if (error) throw error;
      await recordSecurityEvent(admin, {
        actorUserId,
        eventType: active ? "academic_year_opened" : "academic_year_closed",
        status: "success",
        request,
        details: { academic_year: year },
      });
      return NextResponse.json({
        success: true,
        message: `Tahun ajaran ${year} ${active ? "dibuka" : "ditutup"}.`,
      });
    }

    if (action === "copy_curriculum") {
      const sourceYear = String(body.source_year || "");
      const targetYear = String(body.target_year || "");
      if (
        !/^\d{4}\/\d{4}$/.test(sourceYear) ||
        !/^\d{4}\/\d{4}$/.test(targetYear) ||
        sourceYear === targetYear
      ) {
        return NextResponse.json(
          { error: "Tahun asal dan tujuan kurikulum tidak valid." },
          { status: 400 },
        );
      }
      const { data: sourceRows, error: sourceError } = await admin
        .from("surah_curriculum")
        .select("level,nama_surah,urutan")
        .eq("tahun_ajaran", sourceYear)
        .order("level")
        .order("urutan");
      if (sourceError) throw sourceError;
      if (!sourceRows?.length) {
        return NextResponse.json(
          { error: `Data surat ${sourceYear} masih kosong.` },
          { status: 404 },
        );
      }
      const payload = sourceRows.map((row) => ({
        tahun_ajaran: targetYear,
        level: row.level,
        nama_surah: row.nama_surah,
        urutan: row.urutan,
        created_by: actorUserId,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await admin.from("surah_curriculum").upsert(payload, {
        onConflict: "tahun_ajaran,level,nama_surah",
      });
      if (error) throw error;
      await recordSecurityEvent(admin, {
        actorUserId,
        eventType: "curriculum_copied",
        status: "success",
        request,
        details: {
          source_year: sourceYear,
          target_year: targetYear,
          surah_count: payload.length,
        },
      });
      return NextResponse.json({
        success: true,
        message: `${payload.length} data surat disalin ke ${targetYear}.`,
      });
    }

    if (action === "save_academic_settings") {
      const settings = {
        daily_weight: Number(body.settings?.daily_weight),
        level_exam_weight: Number(body.settings?.level_exam_weight),
        munaqosyah_weight: Number(body.settings?.munaqosyah_weight),
        minimum_level_score: Number(body.settings?.minimum_level_score),
        minimum_munaqosyah_score: Number(body.settings?.minimum_munaqosyah_score),
      };
      const weights =
        settings.daily_weight +
        settings.level_exam_weight +
        settings.munaqosyah_weight;
      if (
        Object.values(settings).some(
          (value) => !Number.isFinite(value) || value < 0 || value > 100,
        ) ||
        weights !== 100
      ) {
        return NextResponse.json(
          { error: "Bobot harus berjumlah 100% dan seluruh nilai berada pada rentang 0–100." },
          { status: 400 },
        );
      }
      await recordSecurityEvent(admin, {
        actorUserId,
        eventType: "academic_settings_updated",
        status: "success",
        request,
        details: { settings },
      });
      return NextResponse.json({
        success: true,
        message: "Komposisi nilai dan syarat kelulusan disimpan.",
      });
    }

    return NextResponse.json({ error: "Aksi Admin tidak dikenali." }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Operasi Admin gagal diproses.",
      },
      { status: 500 },
    );
  }
}

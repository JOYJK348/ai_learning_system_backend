import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "./auth-helpers";
import { getSupabaseAdmin } from "./supabase-server";

type SchoolPayload = Record<string, unknown>;

type SchoolAdminPayload = Record<string, unknown>;

type SchoolStudentPayload = Record<string, unknown>;

async function lookupId(table: string, code: string) {
  const { data, error } = await getSupabaseAdmin()
    .from(table)
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) throw new Error(`${table}.${code} lookup failed: ${error?.message || "not found"}`);
  return data.id as number;
}

async function getActiveStatusId() {
  return lookupId("lookup_entity_status", "active");
}

function cleanPayload(body: Record<string, unknown>, allowed: string[]) {
  const payload: Record<string, unknown> = {};
  allowed.forEach((key) => {
    if (body[key] !== undefined) payload[key] = body[key];
  });
  return payload;
}

async function requireSuperAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return null;
  return user;
}

async function requireSchoolAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "school_admin" || !user.schoolId) return null;
  return user;
}

export async function listAdminSchools(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const url = new URL(req.url);
  const includeDeleted = url.searchParams.get("include_deleted") === "true";
  let query = getSupabaseAdmin()
    .from("schools")
    .select(
      "id,name,code,address,city,state,pincode,phone,email,logo_url,principal_name,principal_phone,plan_type_id,plan_status_id,max_students,max_teachers,status_id,created_at,updated_at"
    )
    .order("created_at", { ascending: false });

  if (!includeDeleted) query = query.is("deleted_at", null);
  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ data });
}

export async function createAdminSchool(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const allowed = [
    "name",
    "code",
    "address",
    "city",
    "state",
    "pincode",
    "phone",
    "email",
    "logo_url",
    "principal_name",
    "principal_phone",
    "plan_type_id",
    "plan_status_id",
    "plan_started_at",
    "plan_expires_at",
    "max_students",
    "max_teachers",
    "status_id"
  ];
  const payload = cleanPayload(body as SchoolPayload, allowed);
  const missing = ["name", "code"].filter((key) => !payload[key]);
  if (missing.length) return json({ error: `Missing required fields: ${missing.join(", ")}` }, 400);

  if (payload.status_id === undefined) payload.status_id = await getActiveStatusId();

  const { data, error } = await getSupabaseAdmin()
    .from("schools")
    .insert(payload)
    .select(
      "id,name,code,address,city,state,pincode,phone,email,logo_url,principal_name,principal_phone,plan_type_id,plan_status_id,max_students,max_teachers,status_id,created_at,updated_at"
    )
    .single();

  if (error) return json({ error: error.message }, 400);
  return json({ data }, 201);
}

export async function getAdminSchoolById(id: string, req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const { data, error } = await getSupabaseAdmin()
    .from("schools")
    .select(
      "id,name,code,address,city,state,pincode,phone,email,logo_url,principal_name,principal_phone,plan_type_id,plan_status_id,max_students,max_teachers,status_id,created_at,updated_at"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ data });
}

export async function updateAdminSchool(id: string, req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const allowed = [
    "name",
    "code",
    "address",
    "city",
    "state",
    "pincode",
    "phone",
    "email",
    "logo_url",
    "principal_name",
    "principal_phone",
    "plan_type_id",
    "plan_status_id",
    "plan_started_at",
    "plan_expires_at",
    "max_students",
    "max_teachers",
    "status_id"
  ];
  const payload = cleanPayload(body as SchoolPayload, allowed);
  if (Object.keys(payload).length === 0) return json({ error: "No valid fields to update" }, 400);

  const { data, error } = await getSupabaseAdmin()
    .from("schools")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select(
      "id,name,code,address,city,state,pincode,phone,email,logo_url,principal_name,principal_phone,plan_type_id,plan_status_id,max_students,max_teachers,status_id,created_at,updated_at"
    )
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ data });
}

export async function deleteAdminSchool(id: string, req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const { data, error } = await getSupabaseAdmin()
    .from("schools")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ ok: true });
}

export async function listAdminSchoolAdmins(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const { data, error } = await getSupabaseAdmin()
    .from("school_admins")
    .select(
      "id,auth_user_id,school_id,email,name,phone,avatar_url,status_id,last_login_at,created_at,updated_at"
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);
  return json({ data });
}

export async function createAdminSchoolAdmin(req: NextRequest) {
  const user = await requireSuperAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const payload = cleanPayload(body as SchoolAdminPayload, [
    "school_id",
    "email",
    "name",
    "phone",
    "avatar_url",
    "status_id"
  ]);
  const password = String(body.password || "").trim();
  const schoolId = String(body.school_id || "").trim();
  if (!schoolId || !payload.email || !payload.name || !password) {
    return json({ error: "school_id, email, name, and password are required" }, 400);
  }

  if (payload.status_id === undefined) payload.status_id = await getActiveStatusId();
  const roleId = await lookupId("lookup_user_roles", "school_admin");

  const supabaseAdmin = getSupabaseAdmin();
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: String(payload.email),
    password,
    email_confirm: true,
    user_metadata: { role: "school_admin", name: String(payload.name) }
  });

  if (createError || !created.user) {
    return json({ error: createError?.message || "Failed to create auth user" }, 400);
  }

  const authUserId = created.user.id;
  try {
    const { data, error } = await supabaseAdmin
      .from("school_admins")
      .insert({
        auth_user_id: authUserId,
        school_id: schoolId,
        email: String(payload.email).toLowerCase(),
        name: String(payload.name),
        phone: payload.phone || null,
        avatar_url: payload.avatar_url || null,
        role_id: roleId,
        status_id: payload.status_id
      })
      .select(
        "id,auth_user_id,school_id,email,name,phone,avatar_url,status_id,last_login_at,created_at,updated_at"
      )
      .single();

    if (error || !data) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return json({ error: error?.message || "Failed to create school admin" }, 400);
    }

    return json({ data }, 201);
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    return json({ error: error instanceof Error ? error.message : "Failed to create school admin" }, 400);
  }
}

export async function getSchoolAdminMe(req: NextRequest) {
  const user = await requireSchoolAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const { data, error } = await getSupabaseAdmin()
    .from("schools")
    .select("id,name,code,city,state,email,phone,plan_status_id,max_students,status_id")
    .eq("id", user.schoolId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "School not found" }, 404);
  return json({ user, school: data });
}

export async function getSchoolAdminDashboard(req: NextRequest) {
  const user = await requireSchoolAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const supabaseAdmin = getSupabaseAdmin();
  const { data: school, error: schoolError } = await supabaseAdmin
    .from("schools")
    .select("id,name,code,city,max_students,plan_status_id,status_id")
    .eq("id", user.schoolId)
    .is("deleted_at", null)
    .maybeSingle();

  if (schoolError) return json({ error: schoolError.message }, 500);
  if (!school) return json({ error: "School not found" }, 404);

  const { data: planStatus } = await supabaseAdmin
    .from("lookup_plan_status")
    .select("code,name")
    .eq("id", school.plan_status_id)
    .maybeSingle();

  const { data: schoolStudents, error: studentsError } = await supabaseAdmin
    .from("school_students")
    .select("student_id,section")
    .eq("school_id", user.schoolId)
    .is("deleted_at", null);

  if (studentsError) return json({ error: studentsError.message }, 500);

  const studentIds = (schoolStudents || [])
    .map((row) => row.student_id)
    .filter(Boolean) as string[];

  const { data: studentRows, error: studentRowsError } =
    studentIds.length > 0
      ? await supabaseAdmin
          .from("students")
          .select("id,grade_id")
          .in("id", studentIds)
          .is("deleted_at", null)
      : { data: [], error: null };

  if (studentRowsError) return json({ error: studentRowsError.message }, 500);

  const studentById = (studentRows || []).reduce<Record<string, string>>((acc, student) => {
    if (student?.id) acc[student.id] = String(student.grade_id || "unknown");
    return acc;
  }, {});

  const studentCount = schoolStudents?.length || 0;
  const studentsByGrade: Record<string, number> = {};
  const studentsBySection: Record<string, number> = {};

  (schoolStudents || []).forEach((row) => {
    const gradeId = studentById[row.student_id] || "unknown";
    const section = String(row.section || "Unknown");
    studentsByGrade[gradeId] = (studentsByGrade[gradeId] || 0) + 1;
    studentsBySection[section] = (studentsBySection[section] || 0) + 1;
  });
  const today = new Date().toISOString().slice(0, 10);
  const { data: termRows, error: termError } = await supabaseAdmin
    .from("term_unlocks")
    .select("id,completed_at,unlocked_at,completion_percentage")
    .in("student_id", studentIds)
    .is("deleted_at", null);

  if (termError) return json({ error: termError.message }, 500);

  const activeTerms = (termRows || []).filter((row) => row.completed_at === null).length;
  const completedTerms = (termRows || []).filter((row) => row.completed_at !== null).length;
  const pendingUnlocks = (termRows || []).filter(
    (row) => row.completion_percentage !== null && row.completion_percentage < 100
  ).length;
  const lessonsCompletedToday = (termRows || []).filter(
    (row) => row.completed_at && String(row.completed_at).startsWith(today)
  ).length;

  return json({
    my_school: {
      id: school.id,
      name: school.name,
      code: school.code,
      city: school.city,
      total_students: studentCount,
      max_students: school.max_students,
      plan_status: planStatus?.code || null
    },
    students_by_grade: studentsByGrade,
    students_by_section: studentsBySection,
    term_stats: {
      active_terms: activeTerms,
      completed_terms: completedTerms,
      pending_unlocks: pendingUnlocks
    },
    recent_activity: {
      lessons_completed_today: lessonsCompletedToday,
      quizzes_attempted_today: 0,
      new_badges_today: 0
    }
  });
}

export async function listSchoolStudents(req: NextRequest) {
  const user = await requireSchoolAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const { data, error } = await getSupabaseAdmin()
    .from("school_students")
    .select(
      "id,student_id,roll_number,section,admission_date,status_id,created_at,updated_at"
    )
    .eq("school_id", user.schoolId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);
  return json({ data });
}

export async function createSchoolStudent(req: NextRequest) {
  const user = await requireSchoolAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const existingStudentId = String(body.student_id || "").trim();
  const studentPayload = cleanPayload(body as SchoolStudentPayload, [
    "full_name",
    "date_of_birth",
    "grade_id",
    "profile_photo_url",
    "status_id"
  ]);
  const schoolStudentPayload = cleanPayload(body as SchoolStudentPayload, [
    "roll_number",
    "section",
    "admission_date",
    "status_id"
  ]);

  if (!existingStudentId && !studentPayload.full_name) {
    return json({ error: "student_id or full_name is required" }, 400);
  }

  if (!studentPayload.status_id) studentPayload.status_id = await getActiveStatusId();
  if (!schoolStudentPayload.status_id) schoolStudentPayload.status_id = await getActiveStatusId();

  const supabaseAdmin = getSupabaseAdmin();
  let studentId = existingStudentId;

  if (existingStudentId) {
    const { data: existingStudent, error: existingError } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("id", existingStudentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingError) return json({ error: existingError.message }, 400);
    if (!existingStudent) return json({ error: "Student not found" }, 404);
  } else {
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .insert(studentPayload)
      .select("id")
      .single();

    if (studentError) return json({ error: studentError.message }, 400);
    studentId = student.id;
  }

  const { data, error } = await supabaseAdmin
    .from("school_students")
    .insert({
      school_id: user.schoolId,
      student_id: studentId,
      roll_number: schoolStudentPayload.roll_number || null,
      section: schoolStudentPayload.section || null,
      admission_date: schoolStudentPayload.admission_date || null,
      status_id: schoolStudentPayload.status_id,
      created_by: user.profileId
    })
    .select(
      "id,school_id,student_id,roll_number,section,admission_date,status_id,created_at,updated_at"
    )
    .single();

  if (error) return json({ error: error.message }, 400);
  return json({ data }, 201);
}

export async function getSchoolStudentById(id: string, req: NextRequest) {
  const user = await requireSchoolAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const { data, error } = await getSupabaseAdmin()
    .from("school_students")
    .select(
      "id,student_id,roll_number,section,admission_date,status_id,created_at,updated_at"
    )
    .eq("id", id)
    .eq("school_id", user.schoolId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ data });
}

export async function updateSchoolStudent(id: string, req: NextRequest) {
  const user = await requireSchoolAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const studentFields = cleanPayload(body as SchoolStudentPayload, ["grade_id"]);
  const schoolFields = cleanPayload(body as SchoolStudentPayload, ["roll_number", "section", "admission_date", "status_id"]);
  if (Object.keys(studentFields).length === 0 && Object.keys(schoolFields).length === 0) {
    return json({ error: "No valid fields to update" }, 400);
  }

  const supabaseAdmin = getSupabaseAdmin();
  const existing = await supabaseAdmin
    .from("school_students")
    .select("student_id")
    .eq("id", id)
    .eq("school_id", user.schoolId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing.error) return json({ error: existing.error.message }, 500);
  if (!existing.data) return json({ error: "Not found" }, 404);

  if (Object.keys(studentFields).length > 0) {
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .update({ ...studentFields, updated_at: new Date().toISOString() })
      .eq("id", existing.data.student_id)
      .is("deleted_at", null);
    if (studentError) return json({ error: studentError.message }, 400);
  }

  if (Object.keys(schoolFields).length > 0) {
    const { data, error } = await supabaseAdmin
      .from("school_students")
      .update({ ...schoolFields, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("school_id", user.schoolId)
      .is("deleted_at", null)
      .select(
        "id,student_id,roll_number,section,admission_date,status_id,created_at,updated_at"
      )
      .maybeSingle();

    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Not found" }, 404);
    return json({ data });
  }

  return json({ ok: true });
}

export async function deleteSchoolStudent(id: string, req: NextRequest) {
  const user = await requireSchoolAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const { data, error } = await getSupabaseAdmin()
    .from("school_students")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("school_id", user.schoolId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ ok: true });
}

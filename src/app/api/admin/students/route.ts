import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);

    // Build students query
    let studentsQuery = supabaseAdmin
      .from("students")
      .select(
        "id,auth_user_id,full_name,date_of_birth,grade_id,profile_photo_url,overall_progress,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,total_badges_earned,current_streak_days,last_activity_at,status_id,created_at"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const { data: students, error: studentsError } = await studentsQuery;
    if (studentsError) return json({ error: studentsError.message }, 500);
    if (!students || students.length === 0) return json({ data: [] });

    const studentIds = students.map((s) => s.id).filter(Boolean) as string[];
    const gradeIds = Array.from(
      new Set(students.map((s) => s.grade_id).filter(Boolean) as string[])
    );

    // Fetch grades, school links, parent links, and auth users in parallel
    const [gradesRes, schoolStudentsRes, parentLinksRes, authUsersRes] = await Promise.all([
      gradeIds.length > 0
        ? supabaseAdmin
            .from("grades")
            .select("id,name")
            .in("id", gradeIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] as any[], error: null }),
      supabaseAdmin
        .from("school_students")
        .select("student_id,school_id,roll_number,section")
        .in("student_id", studentIds)
        .is("deleted_at", null),
      supabaseAdmin
        .from("parent_student_links")
        .select("student_id,parent_id")
        .in("student_id", studentIds)
        .is("deleted_at", null),
      Promise.all(
        Array.from(new Set(students.map((s) => s.auth_user_id).filter(Boolean) as string[])).map((uid) =>
          supabaseAdmin.auth.admin.getUserById(uid)
        )
      ),
    ]);

    if (gradesRes.error) return json({ error: gradesRes.error.message }, 500);

    // Build auth user map
    const authUserMap: Record<string, string> = {};
    (authUsersRes || []).forEach((res) => {
      if (res.data?.user?.email) {
        authUserMap[res.data.user.id] = res.data.user.email;
      }
    });

    // Build grade map
    const gradeMap: Record<string, string> = {};
    (gradesRes.data || []).forEach((g) => {
      gradeMap[g.id] = g.name;
    });

    // Build school map from school IDs found
    const schoolIds = Array.from(
      new Set(
        (schoolStudentsRes.data || []).map((ss) => ss.school_id).filter(Boolean) as string[]
      )
    );
    let schoolMap: Record<string, string> = {};
    if (schoolIds.length > 0) {
      const { data: schools } = await supabaseAdmin
        .from("schools")
        .select("id,name")
        .in("id", schoolIds)
        .is("deleted_at", null);
      (schools || []).forEach((s) => {
        schoolMap[s.id] = s.name;
      });
    }

    // Build parent map from parent IDs found
    const parentIds = Array.from(
      new Set(
        (parentLinksRes.data || []).map((pl) => pl.parent_id).filter(Boolean) as string[]
      )
    );
    let parentMap: Record<string, { name: string; email: string }> = {};
    if (parentIds.length > 0) {
      const { data: parents } = await supabaseAdmin
        .from("parents")
        .select("id,name,email")
        .in("id", parentIds)
        .is("deleted_at", null);
      (parents || []).forEach((p) => {
        parentMap[p.id] = { name: p.name, email: p.email };
      });
    }

    // Build lookup maps for student → school/parent
    const schoolStudentMap: Record<string, { school_id: string; roll_number: string | null; section: string | null }> = {};
    (schoolStudentsRes.data || []).forEach((ss) => {
      if (!schoolStudentMap[ss.student_id]) {
        schoolStudentMap[ss.student_id] = {
          school_id: ss.school_id,
          roll_number: ss.roll_number,
          section: ss.section,
        };
      }
    });

    const parentLinkMap: Record<string, string> = {};
    (parentLinksRes.data || []).forEach((pl) => {
      if (!parentLinkMap[pl.student_id]) {
        parentLinkMap[pl.student_id] = pl.parent_id;
      }
    });

    // Enrich students
    const data = students.map((student) => {
      const schoolInfo = schoolStudentMap[student.id];
      const parentId = parentLinkMap[student.id];
      const parentInfo = parentId ? parentMap[parentId] : undefined;

      // Calculate avg score
      const avgScore =
        student.total_quizzes_attempted > 0
          ? Math.round((student.total_quizzes_passed / student.total_quizzes_attempted) * 100)
          : 0;

      return {
        id: student.id,
        name: student.full_name,
        email: student.auth_user_id ? authUserMap[student.auth_user_id] || null : null,
        date_of_birth: student.date_of_birth,
        grade_id: student.grade_id,
        grade_name: student.grade_id ? gradeMap[student.grade_id] || null : null,
        school_id: schoolInfo?.school_id || null,
        school_name: schoolInfo?.school_id ? schoolMap[schoolInfo.school_id] || null : null,
        parent_id: parentId || null,
        parent_name: parentInfo?.name || null,
        photo_url: student.profile_photo_url,
        status_id: student.status_id,
        total_stars: student.total_stars_earned || 0,
        badges_count: student.total_badges_earned || 0,
        lessons_completed: student.total_lessons_completed || 0,
        quizzes_taken: student.total_quizzes_attempted || 0,
        avg_score: avgScore,
        last_active: student.last_activity_at,
        created_at: student.created_at,
      };
    });

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load students" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const supabaseAdmin = getSupabaseAdmin();

    const fullName = String(body.name || body.full_name || "").trim();
    const gradeId = String(body.grade_id || "").trim() || null;

    if (!fullName) {
      return json({ error: "name is required" }, 400);
    }

    // Get active status id
    const { data: activeStatus, error: statusErr } = await supabaseAdmin
      .from("lookup_entity_status")
      .select("id")
      .eq("code", "active")
      .maybeSingle();
    if (statusErr || !activeStatus) return json({ error: "Could not find active status" }, 500);

    const statusId = body.status_id || activeStatus.id;

    let authUserId: string | null = null;

    // Optionally create auth user if email is provided
    if (body.email) {
      const email = String(body.email).trim().toLowerCase();
      const password = body.password || "Student123!";
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "student", name: fullName },
      });
      if (createError || !created.user) {
        return json({ error: createError?.message || "Failed to create auth user" }, 400);
      }
      authUserId = created.user.id;
    }

    // Insert student record
    const studentInsert: Record<string, unknown> = {
      full_name: fullName,
      grade_id: gradeId,
      date_of_birth: body.date_of_birth || null,
      profile_photo_url: body.photo_url || null,
      status_id: statusId,
    };
    if (authUserId) studentInsert.auth_user_id = authUserId;

    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .insert(studentInsert)
      .select("id,full_name,grade_id,date_of_birth,profile_photo_url,status_id,created_at")
      .single();

    if (studentError || !student) {
      // Rollback auth user if created
      if (authUserId) await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return json({ error: studentError?.message || "Failed to create student" }, 400);
    }

    const studentId = student.id;

    // Link to school if school_id provided
    if (body.school_id) {
      const schoolId = String(body.school_id).trim();
      await supabaseAdmin.from("school_students").insert({
        school_id: schoolId,
        student_id: studentId,
        roll_number: body.roll_number || null,
        section: body.section || null,
        admission_date: body.admission_date || null,
        status_id: statusId,
        created_by: user.role === "school_admin" ? user.profileId : null,
      });
    }

    // Link to parent if parent_id provided
    if (body.parent_id) {
      const parentId = String(body.parent_id).trim();
      await supabaseAdmin.from("parent_student_links").insert({
        parent_id: parentId,
        student_id: studentId,
        is_primary: true,
      });
    }

    return json(
      {
        data: {
          id: studentId,
          name: student.full_name,
          grade_id: student.grade_id,
          date_of_birth: student.date_of_birth,
          photo_url: student.profile_photo_url,
          status_id: student.status_id,
          created_at: student.created_at,
        },
      },
      201
    );
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to create student" }, 500);
  }
}

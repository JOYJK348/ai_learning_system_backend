import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return null;
  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const parentId = params.id;
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Find links for this parent
    const { data: links, error: linksError } = await supabaseAdmin
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", parentId)
      .is("deleted_at", null);

    if (linksError) return json({ error: linksError.message }, 500);

    const studentIds = (links || []).map((l) => l.student_id).filter(Boolean);
    if (studentIds.length === 0) return json({ data: [] });

    // Fetch students
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("students")
      .select(
        "id,auth_user_id,full_name,grade_id,profile_photo_url,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,last_activity_at,status_id"
      )
      .in("id", studentIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (studentsError) return json({ error: studentsError.message }, 500);

    const gradeIds = Array.from(
      new Set((students || []).map((s) => s.grade_id).filter(Boolean) as string[])
    );

    // Fetch grades
    const [gradesRes, authUsersRes] = await Promise.all([
      gradeIds.length > 0
        ? supabaseAdmin
            .from("grades")
            .select("id,name")
            .in("id", gradeIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] as any[], error: null }),
      Promise.all(
        Array.from(new Set((students || []).map((s) => s.auth_user_id).filter(Boolean) as string[])).map((uid) =>
          supabaseAdmin.auth.admin.getUserById(uid)
        )
      ),
    ]);

    // Build grade map
    const gradeMap: Record<string, string> = {};
    (gradesRes.data || []).forEach((g) => {
      gradeMap[g.id] = g.name;
    });

    // Build auth user map
    const authUserMap: Record<string, string> = {};
    (authUsersRes || []).forEach((res) => {
      if (res.data?.user?.email) {
        authUserMap[res.data.user.id] = res.data.user.email;
      }
    });

    // Map response
    const data = (students || []).map((student) => {
      const avgScore =
        student.total_quizzes_attempted > 0
          ? Math.round((student.total_quizzes_passed / student.total_quizzes_attempted) * 100)
          : 0;

      return {
        id: student.id,
        name: student.full_name,
        email: student.auth_user_id ? authUserMap[student.auth_user_id] || null : null,
        grade_name: student.grade_id ? gradeMap[student.grade_id] || null : null,
        photo_url: student.profile_photo_url,
        status_id: student.status_id,
        total_stars: student.total_stars_earned || 0,
        lessons_completed: student.total_lessons_completed || 0,
        avg_score: avgScore,
        last_active: student.last_activity_at,
      };
    });

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load children" }, 500);
  }
}

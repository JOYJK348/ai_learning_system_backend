import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * GET /api/school-admin/curriculum/progress?grade_id=<id>
 *
 * Returns student-level progress tracking for the school's curriculum.
 * If grade_id is provided → per-student breakdown for that grade.
 * If not provided → grade-level summary across all grades.
 */
export async function GET(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your plan has expired." }, 403);
  if (!user?.schoolId) return json({ error: "Forbidden" }, 403);
  const schoolId = user.schoolId;

  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const gradeId = url.searchParams.get("grade_id");

  try {
    // Get all students in this school
    const { data: schoolStudents } = await supabase
      .from("school_students")
      .select("student_id, section")
      .eq("school_id", schoolId)
      .is("deleted_at", null);

    if (!schoolStudents?.length) {
      return json({ data: gradeId ? [] : { grades: [] } });
    }

    const studentIds = schoolStudents.map((ss) => ss.student_id);
    const sectionMap: Record<string, string | null> = {};
    schoolStudents.forEach((ss) => { sectionMap[ss.student_id] = ss.section; });

    // Fetch student rows (includes grade + progress counters)
    const { data: students } = await supabase
      .from("students")
      .select(
        "id,full_name,grade_id,overall_progress,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,last_activity_at"
      )
      .in("id", studentIds)
      .is("deleted_at", null);

    if (!students?.length) {
      return json({ data: gradeId ? [] : { grades: [] } });
    }

    // Fetch grade names for all grades present
    const gradeIds = [...new Set(students.map((s) => s.grade_id).filter(Boolean))] as string[];
    const { data: grades } = await supabase
      .from("grades")
      .select("id,name")
      .in("id", gradeIds);

    const gradeNameMap: Record<string, string> = {};
    (grades || []).forEach((g) => { gradeNameMap[g.id] = g.name; });

    // ── PER-GRADE SUMMARY (no grade_id param) ──────────────────────────────
    if (!gradeId) {
      // Group students by grade
      const byGrade: Record<string, typeof students> = {};
      students.forEach((s) => {
        const gid = s.grade_id || "unknown";
        if (!byGrade[gid]) byGrade[gid] = [];
        byGrade[gid].push(s);
      });

      const gradeSummaries = Object.entries(byGrade).map(([gid, gs]) => {
        const total = gs.length;
        const activeToday = gs.filter((s) => {
          if (!s.last_activity_at) return false;
          return Date.now() - new Date(s.last_activity_at).getTime() < 86400000;
        }).length;
        const avgProgress = total > 0
          ? Math.round(gs.reduce((a, s) => a + (s.overall_progress || 0), 0) / total)
          : 0;
        const totalLessons = gs.reduce((a, s) => a + (s.total_lessons_completed || 0), 0);
        const totalQuizzes = gs.reduce((a, s) => a + (s.total_quizzes_attempted || 0), 0);
        const totalPassed = gs.reduce((a, s) => a + (s.total_quizzes_passed || 0), 0);

        return {
          grade_id: gid,
          grade_name: gradeNameMap[gid] || gid,
          total_students: total,
          active_today: activeToday,
          avg_progress: avgProgress,
          total_lessons_completed: totalLessons,
          total_quizzes_attempted: totalQuizzes,
          total_quizzes_passed: totalPassed,
        };
      });

      // Sort by grade name
      gradeSummaries.sort((a, b) => a.grade_name.localeCompare(b.grade_name));

      return json({ data: { grades: gradeSummaries } });
    }

    // ── STUDENT LIST FOR A SPECIFIC GRADE ─────────────────────────────────
    const gradeStudents = students.filter((s) => s.grade_id === gradeId);

    const result = gradeStudents.map((s) => ({
      id: s.id,
      name: s.full_name,
      section: sectionMap[s.id] ?? null,
      overall_progress: s.overall_progress || 0,
      lessons_completed: s.total_lessons_completed || 0,
      quizzes_attempted: s.total_quizzes_attempted || 0,
      quizzes_passed: s.total_quizzes_passed || 0,
      stars_earned: s.total_stars_earned || 0,
      last_active: s.last_activity_at,
      is_active_today:
        s.last_activity_at
          ? Date.now() - new Date(s.last_activity_at).getTime() < 86400000
          : false,
    }));

    // Sort by progress desc
    result.sort((a, b) => b.overall_progress - a.overall_progress);

    return json({ data: result });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to load progress" }, 500);
  }
}

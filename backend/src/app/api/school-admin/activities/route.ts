import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const schoolId = user.schoolId;

    // Get all student IDs for this school
    const { data: schoolStudents, error: ssError } = await supabase
      .from("school_students")
      .select("student_id,section")
      .eq("school_id", schoolId)
      .is("deleted_at", null);
    if (ssError) return json({ error: ssError.message }, 500);

    const studentIds = (schoolStudents || []).map((s) => s.student_id).filter(Boolean) as string[];
    if (studentIds.length === 0) {
      return json({
        data: {
          stats: { total_students: 0, active_today: 0, total_lessons_completed: 0, total_quizzes_taken: 0, avg_completion_rate: 0 },
          recent_activity: [],
          grade_progress: [],
        },
      });
    }

    // Fetch student records with progress
    const { data: students } = await supabase
      .from("students")
      .select("id,full_name,grade_id,overall_progress,total_lessons_completed,total_quizzes_attempted,total_badges_earned,last_activity_at")
      .in("id", studentIds)
      .is("deleted_at", null);

    const studentMap = new Map((students || []).map((s) => [s.id, s]));

    // Build section lookup from school_students
    const sectionMap = new Map((schoolStudents || []).map((s) => [s.student_id, s.section || ""]));

    // Grade name lookup
    const { data: grades } = await supabase.from("grades").select("id,name");
    const gradeNameMap = new Map((grades || []).map((g) => [g.id, g.name]));

    // Stats
    const totalStudents = students?.length || 0;
    const activeToday = (students || []).filter((s) => {
      if (!s.last_activity_at) return false;
      return Date.now() - new Date(s.last_activity_at).getTime() < 24 * 60 * 60 * 1000;
    }).length;

    const totalLessonsCompleted = (students || []).reduce((sum, s) => sum + (s.total_lessons_completed || 0), 0);
    const totalQuizzesTaken = (students || []).reduce((sum, s) => sum + (s.total_quizzes_attempted || 0), 0);
    const avgCompletion = totalStudents > 0
      ? Math.round((students || []).reduce((sum, s) => sum + (s.overall_progress || 0), 0) / totalStudents)
      : 0;

    // Recent activity: lesson_progress + quiz_attempts
    const [lessonProgressRes, quizAttemptsRes] = await Promise.all([
      supabase
        .from("lesson_progress")
        .select("id,student_id,lesson_id,status,completion_percentage,completed_at,last_accessed_at,lessons(title,chapters(name,subjects(name)))")
        .in("student_id", studentIds)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(50),
      supabase
        .from("quiz_attempts")
        .select("id,student_id,quiz_id,score,max_score,percentage,passed,completed_at,quizzes(title,lessons(title))")
        .in("student_id", studentIds)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(50),
    ]);

    // Merge & sort recent activity
    const recentActivity: {
      id: string;
      student_name: string;
      grade_name: string;
      section: string;
      type: "lesson_complete" | "quiz_pass" | "quiz_fail";
      title: string;
      subject: string;
      score: number | null;
      max_score: number | null;
      created_at: string;
    }[] = [];

    (lessonProgressRes.data || []).forEach((lp: any) => {
      const s = studentMap.get(lp.student_id);
      const lesson = lp.lessons;
      recentActivity.push({
        id: lp.id,
        student_name: s?.full_name || "Unknown",
        grade_name: gradeNameMap.get(s?.grade_id) || "",
        section: sectionMap.get(lp.student_id) || "",
        type: "lesson_complete",
        title: lesson?.title || "Lesson",
        subject: lesson?.chapters?.subjects?.name || "",
        score: lp.completion_percentage,
        max_score: 100,
        created_at: lp.completed_at || lp.last_accessed_at,
      });
    });

    (quizAttemptsRes.data || []).forEach((qa: any) => {
      const s = studentMap.get(qa.student_id);
      const quiz = qa.quizzes;
      recentActivity.push({
        id: qa.id,
        student_name: s?.full_name || "Unknown",
        grade_name: gradeNameMap.get(s?.grade_id) || "",
        section: sectionMap.get(qa.student_id) || "",
        type: qa.passed ? "quiz_pass" : "quiz_fail",
        title: quiz?.title || "Quiz",
        subject: quiz?.lessons?.title || "",
        score: qa.score,
        max_score: qa.max_score,
        created_at: qa.completed_at,
      });
    });

    recentActivity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const topActivity = recentActivity.slice(0, 30);

    const gradeMap = new Map<string, { name: string; students: number; total_completion: number; total_lessons: number; total_lessons_completed: number }>();

    (students || []).forEach((s) => {
      const gId = s.grade_id || "unknown";
      if (!gradeMap.has(gId)) {
        gradeMap.set(gId, { name: gradeNameMap.get(gId) || "Unknown", students: 0, total_completion: 0, total_lessons: 0, total_lessons_completed: 0 });
      }
      const g = gradeMap.get(gId)!;
      g.students++;
      g.total_completion += s.overall_progress || 0;
      g.total_lessons_completed += s.total_lessons_completed || 0;
    });

    // Get total lessons per grade for denominator
    const gradeIds = Array.from(gradeMap.keys()).filter((id) => id !== "unknown");
    if (gradeIds.length > 0) {
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("grade_id,id")
        .in("grade_id", gradeIds);

      const subjectIds = (subjectData || []).map((s) => s.id).filter(Boolean);
      if (subjectIds.length > 0) {
        const { data: chapterData } = await supabase
          .from("chapters")
          .select("id,subject_id,subjects!inner(grade_id)")
          .in("subject_id", subjectIds);

        const chapterIds = (chapterData || []).map((c) => c.id).filter(Boolean);
        if (chapterIds.length > 0) {
          const { count: lessonCount } = await supabase
            .from("lessons")
            .select("id", { count: "exact", head: true })
            .in("chapter_id", chapterIds);

          const totalLessonsInCurriculum = lessonCount || 0;
          gradeMap.forEach((g) => {
            g.total_lessons = totalLessonsInCurriculum;
          });
        }
      }
    }

    const gradeProgress = Array.from(gradeMap.entries())
      .filter(([id]) => id !== "unknown")
      .map(([id, g]) => ({
        grade_name: g.name,
        total_students: g.students,
        avg_completion: Math.round(g.total_completion / g.students),
        completed_lessons: g.total_lessons_completed,
      }))
      .sort((a, b) => a.grade_name.localeCompare(b.grade_name));

    return json({
      data: {
        server_time: new Date().toISOString(),
        stats: {
          total_students: totalStudents,
          active_today: activeToday,
          total_lessons_completed: totalLessonsCompleted,
          total_quizzes_taken: totalQuizzesTaken,
          avg_completion_rate: avgCompletion,
        },
        recent_activity: topActivity,
        grade_progress: gradeProgress,
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load activities" }, 500);
  }
}

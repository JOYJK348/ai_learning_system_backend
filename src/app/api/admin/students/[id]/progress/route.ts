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

  const studentId = params.id;
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch core student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select(
        "id,full_name,grade_id,overall_progress,total_time_spent_seconds,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,total_badges_earned,current_streak_days,last_activity_at,status_id"
      )
      .eq("id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (studentError) return json({ error: studentError.message }, 500);
    if (!student) return json({ error: "Student not found" }, 404);

    // Fetch badges
    const { data: badgeLinks } = await supabaseAdmin
      .from("student_badges")
      .select("badge_id,earned_at,badges(name,description,image_url)")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("earned_at", { ascending: false });

    const badges = (badgeLinks || []).map((b: any) => ({
      name: b.badges?.name || "Unknown",
      description: b.badges?.description || null,
      image_url: b.badges?.image_url || null,
      earned_at: b.earned_at,
    }));

    // Fetch lesson progress
    const { data: lessonProgress } = await supabaseAdmin
      .from("lesson_progress")
      .select("lesson_id,status,completion_percentage,completed_at,time_spent_seconds")
      .eq("student_id", studentId)
      .is("deleted_at", null);

    const totalLessons = (lessonProgress || []).length;
    const completedLessons = (lessonProgress || []).filter(
      (lp) => lp.status === "completed"
    ).length;
    const inProgressLessons = (lessonProgress || []).filter(
      (lp) => lp.status === "in_progress"
    ).length;

    // Fetch quiz attempts
    const { data: quizAttempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select("score,max_score,percentage,passed,completed_at,created_at")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const totalAttempts = (quizAttempts || []).length;
    const passedAttempts = (quizAttempts || []).filter((qa) => qa.passed).length;
    const avgQuizScore =
      totalAttempts > 0
        ? Math.round(
            (quizAttempts || []).reduce((sum, qa) => sum + (qa.percentage || 0), 0) /
              totalAttempts
          )
        : 0;

    // Subject progress (via grade → subjects → chapters → lessons)
    let subjectProgress: {
      subject_name: string;
      completed: number;
      total: number;
      percentage: number;
    }[] = [];

    if (student.grade_id) {
      const { data: subjects } = await supabaseAdmin
        .from("subjects")
        .select("id,name")
        .eq("grade_id", student.grade_id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true });

      if (subjects && subjects.length > 0) {
        const subjectIds = subjects.map((s) => s.id);

        const { data: chapters } = await supabaseAdmin
          .from("chapters")
          .select("id,subject_id")
          .in("subject_id", subjectIds)
          .is("deleted_at", null);

        const chapterIds = (chapters || []).map((c) => c.id);
        let allLessons: { id: string; chapter_id: string }[] = [];

        if (chapterIds.length > 0) {
          const { data: lessons } = await supabaseAdmin
            .from("lessons")
            .select("id,chapter_id")
            .in("chapter_id", chapterIds)
            .is("deleted_at", null);
          allLessons = lessons || [];
        }

        // Build chapter → subject map
        const chapterSubjectMap: Record<string, string> = {};
        (chapters || []).forEach((c) => {
          chapterSubjectMap[c.id] = c.subject_id;
        });

        // Build lesson → subject map
        const lessonSubjectMap: Record<string, string> = {};
        allLessons.forEach((l) => {
          lessonSubjectMap[l.id] = chapterSubjectMap[l.chapter_id];
        });

        // Completed lessons set
        const completedLessonIds = new Set(
          (lessonProgress || [])
            .filter((lp) => lp.status === "completed")
            .map((lp) => lp.lesson_id)
        );

        // Count per subject
        const subjectCounts: Record<string, { total: number; completed: number }> = {};
        subjects.forEach((s) => {
          subjectCounts[s.id] = { total: 0, completed: 0 };
        });

        allLessons.forEach((lesson) => {
          const sid = lessonSubjectMap[lesson.id];
          if (sid && subjectCounts[sid]) {
            subjectCounts[sid].total++;
            if (completedLessonIds.has(lesson.id)) {
              subjectCounts[sid].completed++;
            }
          }
        });

        subjectProgress = subjects.map((s) => {
          const counts = subjectCounts[s.id] || { total: 0, completed: 0 };
          return {
            subject_name: s.name,
            completed: counts.completed,
            total: counts.total,
            percentage:
              counts.total > 0
                ? Math.round((counts.completed / counts.total) * 100)
                : 0,
          };
        });
      }
    }

    // Recent activity — last 5 completed lessons
    const recentActivity: {
      type: "lesson" | "quiz" | "badge";
      title: string;
      score?: number;
      earned_at: string;
    }[] = [];

    const recentCompletedLessons = (lessonProgress || [])
      .filter((lp) => lp.status === "completed" && lp.completed_at)
      .sort((a, b) =>
        String(b.completed_at).localeCompare(String(a.completed_at))
      )
      .slice(0, 3);

    for (const lp of recentCompletedLessons) {
      const { data: lesson } = await supabaseAdmin
        .from("lessons")
        .select("title")
        .eq("id", lp.lesson_id)
        .maybeSingle();
      if (lesson) {
        recentActivity.push({
          type: "lesson",
          title: lesson.title,
          earned_at: lp.completed_at as string,
        });
      }
    }

    // Recent quiz attempts
    const recentQuizzes = (quizAttempts || []).slice(0, 2);
    for (const qa of recentQuizzes) {
      recentActivity.push({
        type: "quiz",
        title: "Quiz attempt",
        score: qa.percentage ?? undefined,
        earned_at: qa.completed_at || qa.created_at,
      });
    }

    // Recent badges
    badges.slice(0, 2).forEach((b) => {
      recentActivity.push({
        type: "badge",
        title: b.name,
        earned_at: b.earned_at,
      });
    });

    // Sort all activity by date descending
    recentActivity.sort((a, b) =>
      String(b.earned_at).localeCompare(String(a.earned_at))
    );

    return json({
      data: {
        total_stars: student.total_stars_earned || 0,
        badges_count: student.total_badges_earned || 0,
        lessons_completed: completedLessons,
        lessons_in_progress: inProgressLessons,
        total_lessons: totalLessons,
        quizzes_taken: totalAttempts,
        quizzes_passed: passedAttempts,
        avg_score: avgQuizScore,
        total_time_spent_minutes: Math.round(
          (student.total_time_spent_seconds || 0) / 60
        ),
        streak_days: student.current_streak_days || 0,
        overall_progress: student.overall_progress || 0,
        subject_progress: subjectProgress,
        recent_activity: recentActivity.slice(0, 8),
        badges,
      },
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load student progress",
      },
      500
    );
  }
}

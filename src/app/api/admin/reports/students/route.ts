import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !requireRole(user, ["super_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Real column names from final.sql:
    // total_stars_earned, total_badges_earned, current_streak_days
    const { data: topStudents, error: studentError } = await supabase
      .from("students")
      .select(`
        id,
        full_name,
        total_stars_earned,
        total_badges_earned,
        current_streak_days,
        grade:grades(name),
        school_link:school_students(school:schools(name))
      `)
      .is("deleted_at", null)
      .order("total_stars_earned", { ascending: false })
      .limit(20);

    if (studentError) return json({ error: studentError.message }, 500);

    const students = (topStudents || []).map((s: any) => ({
      id: s.id,
      name: s.full_name || "Unknown",
      school: s.school_link?.[0]?.school?.name || "No School",
      grade: s.grade?.name || "Unknown",
      stars: s.total_stars_earned || 0,
      badges: s.total_badges_earned || 0,
      streak: s.current_streak_days || 0,
      score:
        (s.total_stars_earned || 0) +
        (s.total_badges_earned || 0) * 10 +
        (s.current_streak_days || 0) * 5,
    }));

    // Subject-wise performance using lesson_progress (real table name)
    const { data: subjectProgress } = await supabase
      .from("lesson_progress")
      .select(`
        status,
        quiz_score,
        lesson:lessons(
          chapter:chapters(
            subject:subjects(name)
          )
        )
      `)
      .not("status", "is", null);

    const subjectMap: Record<
      string,
      { completed: number; total: number; total_score: number }
    > = {};

    (subjectProgress || []).forEach((p: any) => {
      const subject =
        p.lesson?.chapter?.subject?.name || "Unknown";
      if (!subjectMap[subject]) {
        subjectMap[subject] = { completed: 0, total: 0, total_score: 0 };
      }
      subjectMap[subject].total += 1;
      if (p.status === "completed") subjectMap[subject].completed += 1;
      subjectMap[subject].total_score += p.quiz_score || 0;
    });

    const subjects = Object.entries(subjectMap).map(([name, data]) => ({
      name,
      completion_rate:
        data.total > 0
          ? Math.round((data.completed / data.total) * 100)
          : 0,
      avg_score:
        data.total > 0 ? Math.round(data.total_score / data.total) : 0,
    }));

    return json({
      data: {
        top_students: students,
        subject_performance: subjects,
        total_students: students.length,
        avg_stars:
          students.length > 0
            ? Math.round(
                students.reduce((sum, s) => sum + s.stars, 0) /
                  students.length
              )
            : 0,
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
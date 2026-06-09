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

    // subjects join through chapters → lessons → lesson_progress
    const { data: subjects, error: subjectsError } = await supabase
      .from("subjects")
      .select(`
        id,
        name,
        grade:grades(name),
        chapters(
          id,
          lessons(id)
        )
      `)
      .is("deleted_at", null);

    if (subjectsError) return json({ error: subjectsError.message }, 500);

    const subjectStats = await Promise.all(
      (subjects || []).map(async (subject: any) => {
        // Collect all lesson IDs for this subject
        const lessonIds: string[] = (subject.chapters || []).flatMap(
          (ch: any) => (ch.lessons || []).map((l: any) => l.id)
        );

        const totalLessons = lessonIds.length;

        let completedLessons = 0;
        let avgScore = 0;

        if (lessonIds.length > 0) {
          // Count completed lessons from lesson_progress (status='completed')
          const { count: completedCount } = await supabase
            .from("lesson_progress")
            .select("*", { count: "exact", head: true })
            .in("lesson_id", lessonIds)
            .eq("status", "completed")
            .is("deleted_at", null);

          completedLessons = completedCount || 0;

          // Quiz scores: quiz_attempts for quizzes linked to these lessons
          const { data: quizIds } = await supabase
            .from("quizzes")
            .select("id")
            .in("lesson_id", lessonIds)
            .is("deleted_at", null);

          const quizIdList = (quizIds || []).map((q: any) => q.id);

          if (quizIdList.length > 0) {
            const { data: attempts } = await supabase
              .from("quiz_attempts")
              .select("percentage")
              .in("quiz_id", quizIdList)
              .not("percentage", "is", null)
              .is("deleted_at", null);

            const safeAttempts = attempts || [];
            avgScore =
              safeAttempts.length > 0
                ? Math.round(
                    safeAttempts.reduce(
                      (sum: number, q: any) => sum + (q.percentage || 0),
                      0
                    ) / safeAttempts.length
                  )
                : 0;
          }
        }

        const completionRate =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          id: subject.id,
          name: subject.name,
          grade: (subject.grade as any)?.name || "Unknown",
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          completion_rate: completionRate,
          avg_quiz_score: avgScore,
          status: completionRate > 70 ? "on_track" : "needs_attention",
        };
      })
    );

    subjectStats.sort((a, b) => b.completion_rate - a.completion_rate);

    return json({
      data: {
        subjects: subjectStats,
        avg_completion:
          subjectStats.length > 0
            ? Math.round(
                subjectStats.reduce((s, sub) => s + sub.completion_rate, 0) /
                  subjectStats.length
              )
            : 0,
        total_subjects: subjectStats.length,
        on_track: subjectStats.filter((s) => s.status === "on_track").length,
        needs_attention: subjectStats.filter(
          (s) => s.status === "needs_attention"
        ).length,
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
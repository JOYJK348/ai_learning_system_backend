import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const url = new URL(req.url);
    const gradeId = url.searchParams.get("grade_id");
    const supabase = getSupabaseAdmin();

    if (!gradeId) {
      const { data: grades } = await supabase
        .from("grades")
        .select("id,name")
        .in("name", ["LKG", "UKG", "Grade 1"])
        .order("name");

      const gradeSummaries: {
        id: string;
        name: string;
        subjects_count: number;
        lessons_count: number;
        quizzes_count: number;
        fun_score: number;
      }[] = [];

      let totalSubjects = 0;
      let totalLessons = 0;
      let totalQuizzes = 0;

      for (const g of grades || []) {
        const { data: subjects } = await supabase
          .from("subjects")
          .select("id")
          .eq("grade_id", g.id)
          .is("deleted_at", null);

        const subIds = subjects?.map((s) => s.id) || [];
        const subjectCount = subIds.length;
        totalSubjects += subjectCount;

        let lessonsInGrade = 0;
        let quizzesInGrade = 0;

        for (const sid of subIds) {
          const { data: chapters } = await supabase
            .from("chapters")
            .select("id")
            .eq("subject_id", sid)
            .is("deleted_at", null);

          const chapIds = chapters?.map((c) => c.id) || [];

          if (chapIds.length > 0) {
            const { count: lCount } = await supabase
              .from("lessons")
              .select("id", { count: "exact", head: true })
              .in("chapter_id", chapIds)
              .is("deleted_at", null);

            lessonsInGrade += lCount || 0;

            if (lCount && lCount > 0) {
              const { data: lessonIds } = await supabase
                .from("lessons")
                .select("id")
                .in("chapter_id", chapIds)
                .is("deleted_at", null);

              const lids = lessonIds?.map((l) => l.id) || [];
              if (lids.length > 0) {
                const { count: qCount } = await supabase
                  .from("quizzes")
                  .select("id", { count: "exact", head: true })
                  .in("lesson_id", lids)
                  .is("deleted_at", null);

                quizzesInGrade += qCount || 0;
              }
            }
          }
        }

        totalLessons += lessonsInGrade;
        totalQuizzes += quizzesInGrade;

        gradeSummaries.push({
          id: g.id,
          name: g.name,
          subjects_count: subjectCount,
          lessons_count: lessonsInGrade,
          quizzes_count: quizzesInGrade,
          fun_score:
            lessonsInGrade > 0
              ? Math.round((quizzesInGrade / lessonsInGrade) * 100)
              : 0,
        });
      }

      return json({
        data: {
          grades: gradeSummaries,
          overview: {
            total_subjects: totalSubjects,
            total_lessons: totalLessons,
            total_quizzes: totalQuizzes,
            avg_fun_score:
              totalLessons > 0
                ? Math.round((totalQuizzes / totalLessons) * 100)
                : 0,
          },
        },
      });
    }

    const { data: grade } = await supabase
      .from("grades")
      .select("id,name")
      .eq("id", gradeId)
      .maybeSingle();
    if (!grade) return json({ error: "Grade not found" }, 404);

    const { data: subjects } = await supabase
      .from("subjects")
      .select("id,name")
      .eq("grade_id", gradeId)
      .is("deleted_at", null)
      .order("sort_order");

    const result: {
      id: string;
      name: string;
      chapters_count: number;
      lessons_count: number;
      fun_score: number;
      chapters: {
        name: string;
        lessons: {
          title: string;
          has_quiz: boolean;
          has_activity: boolean;
        }[];
      }[];
    }[] = [];

    for (const sub of subjects || []) {
      const { data: chapters } = await supabase
        .from("chapters")
        .select("id,name")
        .eq("subject_id", sub.id)
        .is("deleted_at", null)
        .order("sort_order");

      const chaptersData: {
        name: string;
        lessons: {
          title: string;
          has_quiz: boolean;
          has_activity: boolean;
        }[];
      }[] = [];

      let totalLessons = 0;
      let lessonsWithQuiz = 0;

      for (const ch of chapters || []) {
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id,title")
          .eq("chapter_id", ch.id)
          .is("deleted_at", null)
          .order("sort_order");

        const lessonRows: {
          title: string;
          has_quiz: boolean;
          has_activity: boolean;
        }[] = [];

        for (const lesson of lessons || []) {
          totalLessons++;
          const { count: quizCount } = await supabase
            .from("quizzes")
            .select("id", { count: "exact", head: true })
            .eq("lesson_id", lesson.id)
            .is("deleted_at", null);

          const hasQuiz = (quizCount || 0) > 0;
          if (hasQuiz) lessonsWithQuiz++;

          lessonRows.push({
            title: lesson.title,
            has_quiz: hasQuiz,
            has_activity: hasQuiz,
          });
        }

        chaptersData.push({
          name: ch.name,
          lessons: lessonRows,
        });
      }

      result.push({
        id: sub.id,
        name: sub.name,
        chapters_count: chapters?.length || 0,
        lessons_count: totalLessons,
        fun_score:
          totalLessons > 0
            ? Math.round((lessonsWithQuiz / totalLessons) * 100)
            : 0,
        chapters: chaptersData,
      });
    }

    return json({
      data: {
        grade: grade.name,
        grade_id: grade.id,
        subjects: result,
      },
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "Failed to load curriculum",
    }, 500);
  }
}

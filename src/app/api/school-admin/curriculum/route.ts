import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type GradeRow = { id: string; name: string };
type SubjectRow = { id: string; name: string; grade_id: string; sort_order: number | null };
type ChapterRow = { id: string; name: string; subject_id: string; sort_order: number | null };
type LessonRow = { id: string; title: string; chapter_id: string; sort_order: number | null };
type QuizRow = { lesson_id: string };

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

      if (!grades?.length) {
        return json({
          data: { grades: [], overview: { total_subjects: 0, total_lessons: 0, total_quizzes: 0, avg_fun_score: 0 } },
        });
      }

      const gradeIds = grades.map((g) => g.id);

      const { data: allSubjects } = await supabase
        .from("subjects")
        .select("id,name,grade_id,sort_order")
        .in("grade_id", gradeIds)
        .is("deleted_at", null)
        .order("sort_order");

      const { data: allChapters } = await supabase
        .from("chapters")
        .select("id,name,subject_id,sort_order")
        .in("subject_id", allSubjects?.map((s) => s.id) || [])
        .is("deleted_at", null)
        .order("sort_order");

      const { data: allLessons } = await supabase
        .from("lessons")
        .select("id,title,chapter_id,sort_order")
        .in("chapter_id", allChapters?.map((c) => c.id) || [])
        .is("deleted_at", null)
        .order("sort_order");

      const { data: allQuizzes } = await supabase
        .from("quizzes")
        .select("lesson_id")
        .in("lesson_id", allLessons?.map((l) => l.id) || [])
        .is("deleted_at", null);

      const subjectsByGrade = new Map<string, SubjectRow[]>();
      for (const s of allSubjects || []) {
        if (!subjectsByGrade.has(s.grade_id)) subjectsByGrade.set(s.grade_id, []);
        subjectsByGrade.get(s.grade_id)!.push(s);
      }

      const chaptersBySubject = new Map<string, ChapterRow[]>();
      for (const c of allChapters || []) {
        if (!chaptersBySubject.has(c.subject_id)) chaptersBySubject.set(c.subject_id, []);
        chaptersBySubject.get(c.subject_id)!.push(c);
      }

      const lessonsByChapter = new Map<string, LessonRow[]>();
      for (const l of allLessons || []) {
        if (!lessonsByChapter.has(l.chapter_id)) lessonsByChapter.set(l.chapter_id, []);
        lessonsByChapter.get(l.chapter_id)!.push(l);
      }

      const quizLessonIds = new Set<string>((allQuizzes || []).map((q) => q.lesson_id));

      // Get all student IDs associated with this school to fetch real quiz performance
      const { data: schoolStudents } = await supabase
        .from("school_students")
        .select("student_id")
        .eq("school_id", user.schoolId)
        .is("deleted_at", null);

      const studentIds = schoolStudents?.map(s => s.student_id) || [];

      // Fetch all quiz attempts for these students
      const { data: quizAttempts } = studentIds.length > 0
        ? await supabase
            .from("quiz_attempts")
            .select("student_id, quiz_id, percentage")
            .in("student_id", studentIds)
            .is("deleted_at", null)
        : { data: [] };

      // Map quiz_id to subject/grade to associate attempt percentages with grades
      const quizToGradeMap = new Map<string, string>(); // quiz_id -> grade_id
      const lessonToGradeMap = new Map<string, string>(); // lesson_id -> grade_id

      const { data: quizzesWithLessons } = await supabase
        .from("quizzes")
        .select("id, lesson_id")
        .is("deleted_at", null);

      const quizLessonMap = new Map<string, string>();
      (quizzesWithLessons || []).forEach(q => quizLessonMap.set(q.id, q.lesson_id));

      // Map lessons to grades
      for (const [gradeId, gradeSubjects] of subjectsByGrade.entries()) {
        for (const sub of gradeSubjects) {
          const subChapters = chaptersBySubject.get(sub.id) || [];
          for (const ch of subChapters) {
            const chLessons = lessonsByChapter.get(ch.id) || [];
            for (const l of chLessons) {
              lessonToGradeMap.set(l.id, gradeId);
            }
          }
        }
      }

      // Map quizzes to grades
      for (const q of quizzesWithLessons || []) {
        const gradeId = lessonToGradeMap.get(q.lesson_id);
        if (gradeId) {
          quizToGradeMap.set(q.id, gradeId);
        }
      }

      // Group attempt percentages by grade
      const attemptsByGrade = new Map<string, number[]>();
      let allAttemptPercentages: number[] = [];

      (quizAttempts || []).forEach((att) => {
        const gradeId = quizToGradeMap.get(att.quiz_id);
        if (gradeId) {
          if (!attemptsByGrade.has(gradeId)) attemptsByGrade.set(gradeId, []);
          attemptsByGrade.get(gradeId)!.push(att.percentage || 0);
          allAttemptPercentages.push(att.percentage || 0);
        }
      });

      let totalSubjects = 0;
      let totalLessons = 0;
      let totalQuizzes = 0;

      const gradeSummaries = grades.map((g) => {
        const gradeSubjects = subjectsByGrade.get(g.id) || [];
        const subjectCount = gradeSubjects.length;
        totalSubjects += subjectCount;

        let lessonsInGrade = 0;
        let quizzesInGrade = 0;

        for (const sub of gradeSubjects) {
          const subChapters = chaptersBySubject.get(sub.id) || [];
          for (const ch of subChapters) {
            const chLessons = lessonsByChapter.get(ch.id) || [];
            lessonsInGrade += chLessons.length;
            quizzesInGrade += chLessons.filter((l) => quizLessonIds.has(l.id)).length;
          }
        }

        totalLessons += lessonsInGrade;
        totalQuizzes += quizzesInGrade;

        // Calculate dynamic Fun Score (average of student quiz attempts in this grade)
        const gradePercentages = attemptsByGrade.get(g.id) || [];
        const funScore = gradePercentages.length > 0
          ? Math.round(gradePercentages.reduce((a, b) => a + b, 0) / gradePercentages.length)
          : 0;

        return {
          id: g.id,
          name: g.name,
          subjects_count: subjectCount,
          lessons_count: lessonsInGrade,
          quizzes_count: quizzesInGrade,
          fun_score: funScore,
        };
      });

      // Overall average Fun Score based on all student attempts in the school
      const avgFunScore = allAttemptPercentages.length > 0
        ? Math.round(allAttemptPercentages.reduce((a, b) => a + b, 0) / allAttemptPercentages.length)
        : 0;

      return json({
        data: {
          grades: gradeSummaries,
          overview: {
            total_subjects: totalSubjects,
            total_lessons: totalLessons,
            total_quizzes: totalQuizzes,
            avg_fun_score: avgFunScore,
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

    const subjectIds = subjects?.map((s) => s.id) || [];

    const { data: allChapters } = await supabase
      .from("chapters")
      .select("id,name,subject_id")
      .in("subject_id", subjectIds)
      .is("deleted_at", null)
      .order("sort_order");

    const chapterIds = allChapters?.map((c) => c.id) || [];

    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id,title,chapter_id")
      .in("chapter_id", chapterIds)
      .is("deleted_at", null)
      .order("sort_order");

    const lessonIds = allLessons?.map((l) => l.id) || [];

    const { data: allQuizzes } = await supabase
      .from("quizzes")
      .select("lesson_id")
      .in("lesson_id", lessonIds)
      .is("deleted_at", null);

    const { data: allActivities } = await supabase
      .from("activities")
      .select("lesson_id")
      .in("lesson_id", lessonIds)
      .is("deleted_at", null);

    const quizLessonIds = new Set<string>((allQuizzes || []).map((q) => q.lesson_id));
    const activityLessonIds = new Set<string>((allActivities || []).map((a) => a.lesson_id));

    const chaptersBySubject = new Map<string, typeof allChapters>();
    for (const c of allChapters || []) {
      if (!chaptersBySubject.has(c.subject_id)) chaptersBySubject.set(c.subject_id, []);
      chaptersBySubject.get(c.subject_id)!.push(c);
    }

    const lessonsByChapter = new Map<string, typeof allLessons>();
    for (const l of allLessons || []) {
      if (!lessonsByChapter.has(l.chapter_id)) lessonsByChapter.set(l.chapter_id, []);
      lessonsByChapter.get(l.chapter_id)!.push(l);
    }

    const result = (subjects || []).map((sub) => {
      const chapters = chaptersBySubject.get(sub.id) || [];
      let totalLessonsInSub = 0;
      let lessonsWithQuiz = 0;

      const chaptersData = chapters.map((ch) => {
        const lessons = lessonsByChapter.get(ch.id) || [];
        totalLessonsInSub += lessons.length;

        const lessonRows = lessons.map((lesson) => {
          const hasQuiz = quizLessonIds.has(lesson.id);
          if (hasQuiz) lessonsWithQuiz++;
          return {
            title: lesson.title,
            has_quiz: hasQuiz,
            has_activity: activityLessonIds.has(lesson.id),
          };
        });

        return { name: ch.name, lessons: lessonRows };
      });

      return {
        id: sub.id,
        name: sub.name,
        chapters_count: chapters.length,
        lessons_count: totalLessonsInSub,
        fun_score: totalLessonsInSub > 0 ? Math.round((lessonsWithQuiz / totalLessonsInSub) * 100) : 0,
        chapters: chaptersData,
      };
    });

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

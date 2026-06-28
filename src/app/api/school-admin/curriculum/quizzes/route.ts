import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * GET /api/school-admin/curriculum/quizzes?grade_id=<id>&subject_id=<id>
 *
 * Returns quiz attempt data for all students in the school.
 * Grouped by: subject → chapter → quiz title, with per-attempt details.
 *
 * Supports filters:
 *   grade_id   (required — scope to a grade)
 *   subject_id (optional — scope to one subject)
 */
export async function GET(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired" }, 403);
  if (!user?.schoolId) return json({ error: "Forbidden" }, 403);

  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const gradeId   = url.searchParams.get("grade_id");
  const subjectId = url.searchParams.get("subject_id");

  if (!gradeId) return json({ error: "grade_id is required" }, 400);

  try {
    // 1. Get all students in this school for the given grade
    const { data: schoolStudents } = await supabase
      .from("school_students")
      .select("student_id, section")
      .eq("school_id", user.schoolId)
      .is("deleted_at", null);

    if (!schoolStudents?.length) return json({ data: [] });

    const allStudentIds = schoolStudents.map(s => s.student_id);
    const sectionMap: Record<string, string | null> = {};
    schoolStudents.forEach(s => { sectionMap[s.student_id] = s.section; });

    // Filter by grade
    const { data: gradeStudents } = await supabase
      .from("students")
      .select("id,full_name,grade_id")
      .in("id", allStudentIds)
      .eq("grade_id", gradeId)
      .is("deleted_at", null);

    if (!gradeStudents?.length) return json({ data: [] });

    const studentIds = gradeStudents.map(s => s.id);
    const studentNameMap: Record<string, string> = {};
    gradeStudents.forEach(s => { studentNameMap[s.id] = s.full_name; });

    // 2. Get subjects for this grade (optionally filtered)
    const subjectsQuery = supabase
      .from("subjects")
      .select("id,name")
      .eq("grade_id", gradeId)
      .is("deleted_at", null)
      .order("sort_order");
    if (subjectId) subjectsQuery.eq("id", subjectId);
    const { data: subjects } = await subjectsQuery;
    if (!subjects?.length) return json({ data: [] });

    const subjectIds = subjects.map(s => s.id);
    const subjectMap: Record<string, string> = {};
    subjects.forEach(s => { subjectMap[s.id] = s.name; });

    // 3. Chapters
    const { data: chapters } = await supabase
      .from("chapters")
      .select("id,name,subject_id")
      .in("subject_id", subjectIds)
      .is("deleted_at", null)
      .order("sort_order");
    if (!chapters?.length) return json({ data: [] });

    const chapterMap: Record<string, { name: string; subject_id: string }> = {};
    chapters.forEach(c => { chapterMap[c.id] = { name: c.name, subject_id: c.subject_id }; });
    const chapterIds = chapters.map(c => c.id);

    // 4. Lessons
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id,title,chapter_id")
      .in("chapter_id", chapterIds)
      .is("deleted_at", null);
    if (!lessons?.length) return json({ data: [] });

    const lessonMap: Record<string, { title: string; chapter_id: string }> = {};
    lessons.forEach(l => { lessonMap[l.id] = { title: l.title, chapter_id: l.chapter_id }; });
    const lessonIds = lessons.map(l => l.id);

    // 5. Quizzes for these lessons
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id,title,lesson_id")
      .in("lesson_id", lessonIds)
      .is("deleted_at", null);
    if (!quizzes?.length) return json({ data: [] });

    const quizMap: Record<string, { title: string; lesson_id: string }> = {};
    quizzes.forEach(q => { quizMap[q.id] = { title: q.title, lesson_id: q.lesson_id }; });
    const quizIds = quizzes.map(q => q.id);

    // 6. All quiz attempts for these students + quizzes
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("id,student_id,quiz_id,score,max_score,percentage,passed,time_taken_seconds,completed_at,created_at")
      .in("student_id", studentIds)
      .in("quiz_id", quizIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // 7. Group: subject → chapter → quiz → attempts[]
    type AttemptRow = {
      student_id: string;
      student_name: string;
      section: string | null;
      score: number;
      max_score: number;
      percentage: number;
      passed: boolean;
      time_taken_seconds: number | null;
      completed_at: string | null;
    };
    type QuizGroup = {
      quiz_id: string;
      quiz_title: string;
      lesson_title: string;
      total_attempts: number;
      pass_count: number;
      fail_count: number;
      avg_score: number;
      attempts: AttemptRow[];
    };
    type ChapterGroup = {
      chapter_id: string;
      chapter_name: string;
      quizzes: QuizGroup[];
    };
    type SubjectGroup = {
      subject_id: string;
      subject_name: string;
      chapters: ChapterGroup[];
    };

    // Build nested structure
    const subjectGroups: Record<string, SubjectGroup> = {};
    subjects.forEach(s => {
      subjectGroups[s.id] = { subject_id: s.id, subject_name: s.name, chapters: [] };
    });

    const chapterGroups: Record<string, ChapterGroup> = {};
    chapters.forEach(c => {
      chapterGroups[c.id] = { chapter_id: c.id, chapter_name: c.name, quizzes: [] };
      const sg = subjectGroups[c.subject_id];
      if (sg) sg.chapters.push(chapterGroups[c.id]);
    });

    const quizGroups: Record<string, QuizGroup> = {};
    quizzes.forEach(q => {
      const lesson = lessonMap[q.lesson_id];
      if (!lesson) return;
      quizGroups[q.id] = {
        quiz_id: q.id,
        quiz_title: q.title || "Quiz",
        lesson_title: lesson.title,
        total_attempts: 0, pass_count: 0, fail_count: 0, avg_score: 0,
        attempts: [],
      };
      const chapter = chapterMap[lesson.chapter_id];
      if (chapter) chapterGroups[lesson.chapter_id]?.quizzes.push(quizGroups[q.id]);
    });

    // Fill attempts into quizGroups
    (attempts || []).forEach(a => {
      const qg = quizGroups[a.quiz_id];
      if (!qg) return;
      qg.attempts.push({
        student_id: a.student_id,
        student_name: studentNameMap[a.student_id] || "Student",
        section: sectionMap[a.student_id] ?? null,
        score: a.score ?? 0,
        max_score: a.max_score ?? 0,
        percentage: a.percentage ?? 0,
        passed: !!a.passed,
        time_taken_seconds: a.time_taken_seconds,
        completed_at: a.completed_at,
      });
    });

    // Compute aggregates
    Object.values(quizGroups).forEach(qg => {
      qg.total_attempts = qg.attempts.length;
      qg.pass_count = qg.attempts.filter(a => a.passed).length;
      qg.fail_count = qg.total_attempts - qg.pass_count;
      qg.avg_score = qg.total_attempts > 0
        ? Math.round(qg.attempts.reduce((s, a) => s + a.percentage, 0) / qg.total_attempts)
        : 0;
    });

    // Remove empty chapters/subjects
    const result = Object.values(subjectGroups)
      .map(sg => ({
        ...sg,
        chapters: sg.chapters
          .map(cg => ({ ...cg, quizzes: cg.quizzes.filter(qg => qg.total_attempts > 0) }))
          .filter(cg => cg.quizzes.length > 0),
      }))
      .filter(sg => sg.chapters.length > 0);

    return json({ data: result });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed" }, 500);
  }
}

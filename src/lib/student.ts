import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "./auth-helpers";
import { getSupabaseAdmin } from "./supabase-server";

async function requireStudent(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["student"])) return null;
  return user;
}

async function getStudentRecord(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("students")
    .select(
      "id,full_name,grade_id,overall_progress,total_lessons_completed,total_quizzes_passed,total_badges_earned,total_stars_earned,current_streak_days,profile_photo_url,status_id"
    )
    .eq("id", studentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function mapById<T extends { id: string }>(items: Array<T> | null): Record<string, T> {
  return (items || []).reduce((acc, item) => {
    if (item?.id) acc[item.id] = item;
    return acc;
  }, {} as Record<string, T>);
}

async function getChapterIdsForGrade(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, gradeId: string) {
  const { data: subjects, error: subjectsError } = await supabaseAdmin
    .from("subjects")
    .select("id")
    .eq("grade_id", gradeId)
    .is("deleted_at", null);

  if (subjectsError) throw subjectsError;
  const subjectIds = (subjects || []).map((subject) => subject.id).filter(Boolean) as string[];
  if (subjectIds.length === 0) return [];

  const { data: chapters, error: chaptersError } = await supabaseAdmin
    .from("chapters")
    .select("id")
    .in("subject_id", subjectIds)
    .is("deleted_at", null);

  if (chaptersError) throw chaptersError;
  return (chapters || []).map((chapter) => chapter.id).filter(Boolean) as string[];
}

async function verifyLessonAccess(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  lessonId: string,
  studentGradeId: string | null
) {
  if (!studentGradeId) return null;

  const { data: lesson, error: lessonError } = await supabaseAdmin
    .from("lessons")
    .select("id,chapter_id,duration_seconds")
    .eq("id", lessonId)
    .is("deleted_at", null)
    .maybeSingle();

  if (lessonError || !lesson) return null;

  const { data: chapter, error: chapterError } = await supabaseAdmin
    .from("chapters")
    .select("subject_id")
    .eq("id", lesson.chapter_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (chapterError || !chapter) return null;

  const { data: subject, error: subjectError } = await supabaseAdmin
    .from("subjects")
    .select("grade_id")
    .eq("id", chapter.subject_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (subjectError || !subject || subject.grade_id !== studentGradeId) return null;
  return lesson;
}

async function verifyActivityAccess(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  activityId: string,
  studentGradeId: string | null
) {
  const { data: activity, error: activityError } = await supabaseAdmin
    .from("activities")
    .select("id,lesson_id")
    .eq("id", activityId)
    .is("deleted_at", null)
    .maybeSingle();

  if (activityError || !activity) return null;
  const lesson = await verifyLessonAccess(supabaseAdmin, activity.lesson_id, studentGradeId);
  return lesson ? activity : null;
}

async function verifyQuizAccess(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  quizId: string,
  studentGradeId: string | null
) {
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from("quizzes")
    .select("id,lesson_id,passing_percentage,max_score")
    .eq("id", quizId)
    .is("deleted_at", null)
    .maybeSingle();

  if (quizError || !quiz) return null;
  const lesson = await verifyLessonAccess(supabaseAdmin, quiz.lesson_id, studentGradeId);
  return lesson ? quiz : null;
}

export async function getStudentMe(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const { data: grade } = await supabaseAdmin
      .from("grades")
      .select("id,name")
      .eq("id", student.grade_id)
      .maybeSingle();

    return json({
      student: {
        id: student.id,
        name: student.full_name,
        grade: grade?.name || null,
        overall_progress: student.overall_progress || 0,
        total_stars: student.total_stars_earned || 0,
        total_badges: student.total_badges_earned || 0,
        current_streak: student.current_streak_days || 0,
        profile_photo_url: student.profile_photo_url
      }
    });
  } catch (error) {
    // Log raw error for debugging (not an Error instance sometimes)
    // TODO: remove this debug log after root cause is found
    // eslint-disable-next-line no-console
    console.error('getStudentMe error:', error);
    return json({ error: String(error) || (error instanceof Error ? error.message : "Unable to load student profile") }, 500);
  }
}

export async function getStudentDashboard(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const { data: grade } = await supabaseAdmin
      .from("grades")
      .select("id,name")
      .eq("id", student.grade_id)
      .maybeSingle();

    const chapterIds = student.grade_id
      ? await getChapterIdsForGrade(supabaseAdmin, student.grade_id)
      : [];

    // Get today's unlocked lessons
    const today = new Date().toISOString().split("T")[0];
    const todaysLessons = chapterIds.length
      ? await supabaseAdmin
          .from("lessons")
          .select("id,title,thumbnail_url,duration_seconds")
          .in("chapter_id", chapterIds)
          .lte("created_at", today)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [], error: null };

    const lessonIds = (todaysLessons.data || []).map((l) => l.id).filter(Boolean) as string[];
    let lessonProgressMap: Record<string, any> = {};
    if (lessonIds.length > 0) {
      const { data: progressData } = await supabaseAdmin
        .from("lesson_progress")
        .select("lesson_id,status,progress_percentage")
        .eq("student_id", user.profileId)
        .in("lesson_id", lessonIds)
        .is("deleted_at", null);

      lessonProgressMap = (progressData || []).reduce(
        (acc, p) => {
          acc[p.lesson_id] = p;
          return acc;
        },
        {} as Record<string, any>
      );
    }

    const todays_lessons = (todaysLessons.data || []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      thumbnail: lesson.thumbnail_url,
      progress: lessonProgressMap[lesson.id]?.progress_percentage || 0,
      status: lessonProgressMap[lesson.id]?.status || "locked"
    }));

    // Get recent activity
    const { data: recentLessons } = await supabaseAdmin
      .from("lesson_progress")
      .select("lessons(title), completed_at")
      .eq("student_id", user.profileId)
      .is("deleted_at", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: recentQuizzes } = await supabaseAdmin
      .from("quiz_attempts")
      .select("score,max_score")
      .eq("student_id", user.profileId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: recentBadges } = await supabaseAdmin
      .from("student_badges")
      .select("badges(name)")
      .eq("student_id", user.profileId)
      .is("deleted_at", null)
      .order("earned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get next unlock (first incomplete lesson in sequence)
    const nextLessonData = chapterIds.length
      ? await supabaseAdmin
          .from("lessons")
          .select("id,title")
          .in("chapter_id", chapterIds)
          .is("deleted_at", null)
          .order("sort_order", { ascending: true })
          .limit(1)
      : { data: [] };

    const nextLesson = (nextLessonData.data || [])[0];

    return json({
      student: {
        name: student.full_name,
        grade: grade?.name || null,
        overall_progress: student.overall_progress || 0,
        total_stars: student.total_stars_earned || 0,
        total_badges: student.total_badges_earned || 0,
        current_streak: student.current_streak_days || 0
      },
      todays_lessons,
      recent_activity: {
        last_lesson: (recentLessons as any)?.lessons?.title || null,
        last_quiz_score: recentQuizzes ? `${recentQuizzes.score}/${recentQuizzes.max_score}` : null,
        last_badge: (recentBadges as any)?.badges?.name || null
      },
      next_unlock: nextLesson
        ? {
            lesson: nextLesson.title,
            requires: "Complete previous lessons"
          }
        : null
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load dashboard" }, 500);
  }
}

export async function listStudentLessons(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const chapterIds = student.grade_id
      ? await getChapterIdsForGrade(supabaseAdmin, student.grade_id)
      : [];

    const lessonsQuery = chapterIds.length
      ? await supabaseAdmin
          .from("lessons")
          .select("id,title,description,thumbnail_url,duration_seconds")
          .in("chapter_id", chapterIds)
          .is("deleted_at", null)
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

    if (lessonsQuery.error) return json({ error: lessonsQuery.error.message }, 500);
    const lessons = lessonsQuery.data || [];

    // Get progress for all lessons
    const lessonIds = (lessons || []).map((l) => l.id).filter(Boolean) as string[];
    let progressMap: Record<string, any> = {};
    if (lessonIds.length > 0) {
      const { data: progressData } = await supabaseAdmin
        .from("lesson_progress")
        .select("lesson_id,status,progress_percentage")
        .eq("student_id", user.profileId)
        .in("lesson_id", lessonIds)
        .is("deleted_at", null);

      progressMap = (progressData || []).reduce(
        (acc, p) => {
          acc[p.lesson_id] = p;
          return acc;
        },
        {} as Record<string, any>
      );
    }

    const lessons_list = (lessons || []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      thumbnail: lesson.thumbnail_url,
      duration_minutes: Math.ceil((lesson.duration_seconds || 0) / 60),
      progress: progressMap[lesson.id]?.progress_percentage || 0,
      status: progressMap[lesson.id]?.status || "locked"
    }));

    return json({ lessons: lessons_list });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load lessons" }, 500);
  }
}

export async function getStudentLesson(req: NextRequest, lessonId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const lessonAllowed = await verifyLessonAccess(supabaseAdmin, lessonId, student.grade_id);
    if (!lessonAllowed) return json({ error: "Lesson not found" }, 404);

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from("lessons")
      .select("id,title,description,content,video_url,duration_seconds")
      .eq("id", lessonId)
      .is("deleted_at", null)
      .maybeSingle();

    if (lessonError || !lesson) return json({ error: "Lesson not found" }, 404);

    const { data: progress } = await supabaseAdmin
      .from("lesson_progress")
      .select("status,progress_percentage,watched_seconds,total_seconds")
      .eq("student_id", user.profileId)
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .maybeSingle();

    return json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.video_url,
        duration_minutes: Math.ceil((lesson.duration_seconds || 0) / 60),
        progress: progress?.progress_percentage || 0,
        watched_seconds: progress?.watched_seconds || 0,
        total_seconds: progress?.total_seconds || (lesson.duration_seconds || 0),
        status: progress?.status || "not_started"
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load lesson" }, 500);
  }
}

export async function updateLessonProgress(req: NextRequest, lessonId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const watchedSeconds = Number(body.watched_seconds) || 0;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const lesson = await verifyLessonAccess(supabaseAdmin, lessonId, student.grade_id);
    if (!lesson) return json({ error: "Lesson not found" }, 404);

    const totalSeconds = lesson.duration_seconds || 0;
    const progressPercentage = Math.round((watchedSeconds / totalSeconds) * 100);
    const status = progressPercentage >= 90 ? "completed" : "in_progress";

    const { data: existing } = await supabaseAdmin
      .from("lesson_progress")
      .select("id")
      .eq("student_id", user.profileId)
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from("lesson_progress")
        .update({
          watched_seconds: watchedSeconds,
          progress_percentage: progressPercentage,
          status,
          updated_at: new Date().toISOString(),
          completed_at: status === "completed" ? new Date().toISOString() : null
        })
        .eq("id", existing.id)
        .select();
    } else {
      result = await supabaseAdmin.from("lesson_progress").insert({
        student_id: user.profileId,
        lesson_id: lessonId,
        watched_seconds: watchedSeconds,
        progress_percentage: progressPercentage,
        total_seconds: totalSeconds,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null
      });
    }

    if (result.error) return json({ error: result.error.message }, 500);

    return json({
      progress: {
        lesson_id: lessonId,
        watched_seconds: watchedSeconds,
        total_seconds: totalSeconds,
        progress_percentage: progressPercentage,
        status
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to update progress" }, 500);
  }
}

export async function listStudentActivities(req: NextRequest, lessonId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const lesson = await verifyLessonAccess(supabaseAdmin, lessonId, student.grade_id);
    if (!lesson) return json({ error: "Lesson not found" }, 404);

    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from("activities")
      .select("id,title,description,activity_type,content")
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (activitiesError) return json({ error: activitiesError.message }, 500);

    return json({ activities: activities || [] });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load activities" }, 500);
  }
}

export async function submitActivity(req: NextRequest, activityId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const answer = body.answer;
  if (!answer) return json({ error: "Answer is required" }, 400);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const activity = await verifyActivityAccess(supabaseAdmin, activityId, student.grade_id);
    if (!activity) return json({ error: "Activity not found" }, 404);

    // Create activity attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("activity_attempts")
      .insert({
        student_id: user.profileId,
        activity_id: activityId,
        answer,
        submitted_at: new Date().toISOString()
      })
      .select();

    if (attemptError) return json({ error: attemptError.message }, 500);

    return json({
      attempt: {
        id: (attempt?.[0] as any)?.id,
        activity_id: activityId,
        answer,
        submitted_at: new Date().toISOString()
      }
    }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to submit activity" }, 500);
  }
}

export async function listStudentQuizzes(req: NextRequest, lessonId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const lesson = await verifyLessonAccess(supabaseAdmin, lessonId, student.grade_id);
    if (!lesson) return json({ error: "Lesson not found" }, 404);

    const { data: quizzes, error: quizzesError } = await supabaseAdmin
      .from("quizzes")
      .select("id,title,description,total_questions,passing_percentage")
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (quizzesError) return json({ error: quizzesError.message }, 500);

    // Get best attempt for each quiz
    let attemptMap: Record<string, any> = {};
    const quizIds = (quizzes || []).map((q) => q.id).filter(Boolean) as string[];
    if (quizIds.length > 0) {
      const { data: attempts } = await supabaseAdmin
        .from("quiz_attempts")
        .select("quiz_id,score,max_score,percentage,passed")
        .eq("student_id", user.profileId)
        .in("quiz_id", quizIds)
        .is("deleted_at", null)
        .order("percentage", { ascending: false });

      attemptMap = (attempts || []).reduce(
        (acc, a) => {
          if (!acc[a.quiz_id]) acc[a.quiz_id] = a;
          return acc;
        },
        {} as Record<string, any>
      );
    }

    const quizzes_list = (quizzes || []).map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      total_questions: quiz.total_questions,
      passing_percentage: quiz.passing_percentage,
      best_score: attemptMap[quiz.id]?.percentage || null,
      passed: attemptMap[quiz.id]?.passed || false
    }));

    return json({ quizzes: quizzes_list });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load quizzes" }, 500);
  }
}

export async function submitQuiz(req: NextRequest, quizId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const answers = body.answers; // Map of question_id -> answer
  if (!answers || typeof answers !== "object") return json({ error: "Valid answers object is required" }, 400);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const quiz = await verifyQuizAccess(supabaseAdmin, quizId, student.grade_id);
    if (!quiz) return json({ error: "Quiz not found" }, 404);

    // Get quiz questions and calculate score
    const { data: questions } = await supabaseAdmin
      .from("quiz_questions")
      .select("id,correct_answer")
      .eq("quiz_id", quizId)
      .is("deleted_at", null);

    let score = 0;
    (questions || []).forEach((q) => {
      if (answers[q.id] === q.correct_answer) score++;
    });

    const totalQuestions = questions?.length || 1;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= (quiz as any).passing_percentage;

    // Count previous attempts
    const { data: previousAttempts, error: countError } = await supabaseAdmin
      .from("quiz_attempts")
      .select("id")
      .eq("student_id", user.profileId)
      .eq("quiz_id", quizId)
      .is("deleted_at", null);

    const attemptNumber = (previousAttempts?.length || 0) + 1;

    // Create attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({
        student_id: user.profileId,
        quiz_id: quizId,
        attempt_number: attemptNumber,
        score,
        max_score: totalQuestions,
        percentage,
        passed,
        answers_json: JSON.stringify(answers),
        completed_at: new Date().toISOString()
      })
      .select();

    if (attemptError) return json({ error: attemptError.message }, 500);

    // If passed, award stars/badges (optional bonus)
    if (passed) {
      // Could update student total_stars_earned here if needed
    }

    return json({
      attempt: {
        score,
        max_score: totalQuestions,
        percentage,
        passed,
        attempt_number: attemptNumber
      }
    }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to submit quiz" }, 500);
  }
}

export async function listStudentBadges(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const { data: badges, error: badgesError } = await supabaseAdmin
      .from("student_badges")
      .select("badge_id,earned_at,badges(id,name,description,image_url)")
      .eq("student_id", user.profileId)
      .is("deleted_at", null)
      .order("earned_at", { ascending: false });

    if (badgesError) return json({ error: badgesError.message }, 500);

    const badges_list = (badges || []).map((b: any) => ({
      id: b.badge_id,
      name: b.badges?.name,
      description: b.badges?.description,
      icon: b.badges?.image_url,
      earned_at: b.earned_at
    }));

    return json({ badges: badges_list });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load badges" }, 500);
  }
}

export async function listStudentTerms(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await getStudentRecord(supabaseAdmin, user.profileId);
    if (!student) return json({ error: "Student not found" }, 404);

    const { data: termUnlocks, error: termsError } = await supabaseAdmin
      .from("term_unlocks")
      .select(
        "id,term_type_id,unlocked_at,completed_at,lookup_term_types(code,name),grades(name),boards(name)"
      )
      .eq("student_id", user.profileId)
      .is("deleted_at", null)
      .order("unlocked_at", { ascending: false });

    if (termsError) return json({ error: termsError.message }, 500);

    const terms_list = (termUnlocks || []).map((t: any) => ({
      id: t.term_type_id,
      name: t.lookup_term_types?.name,
      code: t.lookup_term_types?.code,
      grade: t.grades?.name,
      board: t.boards?.name,
      unlocked_at: t.unlocked_at,
      completed_at: t.completed_at,
      status: t.completed_at ? "completed" : "unlocked"
    }));

    return json({ terms: terms_list });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load terms" }, 500);
  }
}

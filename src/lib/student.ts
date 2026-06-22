import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "./auth-helpers";
import { getSupabaseAdmin } from "./supabase-server";

async function requireStudent(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["student"])) return null;
  try {
    await getSupabaseAdmin()
      .from("students")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", user!.profileId);
  } catch {
    // silent — non-critical
  }
  return user;
}

type JsonRecord = Record<string, unknown>;

// ───── getStudentMe ─────
export async function getStudentMe(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: student, error } = await supabaseAdmin
      .from("students")
      .select(
        "id,full_name,email,mobile,date_of_birth,grade_id,profile_photo_url,overall_progress,total_time_spent_seconds,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,total_badges_earned,current_streak_days,last_activity_at,status_id,created_at"
      )
      .eq("id", user.profileId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!student) return json({ error: "Student not found" }, 404);

    let gradeName: string | null = null;
    if (student.grade_id) {
      const { data: grade } = await supabaseAdmin
        .from("grades")
        .select("name")
        .eq("id", student.grade_id)
        .is("deleted_at", null)
        .maybeSingle();
      gradeName = grade?.name || null;
    }

    const { data: schoolLink } = await supabaseAdmin
      .from("school_students")
      .select("school_id,roll_number,section")
      .eq("student_id", student.id)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    let schoolName: string | null = null;
    if (schoolLink?.school_id) {
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("name")
        .eq("id", schoolLink.school_id)
        .is("deleted_at", null)
        .maybeSingle();
      schoolName = school?.name || null;
    }

    return json({
      user,
      student: {
        id: student.id,
        name: student.full_name,
        email: student.email,
        mobile: student.mobile,
        date_of_birth: student.date_of_birth,
        grade_id: student.grade_id,
        grade_name: gradeName,
        school_name: schoolName,
        roll_number: schoolLink?.roll_number || null,
        section: schoolLink?.section || null,
        photo_url: student.profile_photo_url,
        overall_progress: student.overall_progress || 0,
        total_time_spent_seconds: student.total_time_spent_seconds || 0,
        total_lessons_completed: student.total_lessons_completed || 0,
        total_quizzes_attempted: student.total_quizzes_attempted || 0,
        total_quizzes_passed: student.total_quizzes_passed || 0,
        total_stars_earned: student.total_stars_earned || 0,
        total_badges_earned: student.total_badges_earned || 0,
        current_streak_days: student.current_streak_days || 0,
        last_activity_at: student.last_activity_at,
        status_id: student.status_id,
        created_at: student.created_at,
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load profile" }, 500);
  }
}

// ───── getStudentDashboard ─────
export async function getStudentDashboard(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;

    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select(
        "id,full_name,grade_id,overall_progress,total_time_spent_seconds,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,total_badges_earned,current_streak_days,last_activity_at"
      )
      .eq("id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (studentError) return json({ error: studentError.message }, 500);
    if (!student) return json({ error: "Student not found" }, 404);

    await supabaseAdmin
      .from("students")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", studentId);

    const { data: lessonProgressRows, error: progressError } = await supabaseAdmin
      .from("lesson_progress")
      .select("lesson_id,status,completion_percentage,completed_at,time_spent_seconds,last_accessed_at")
      .eq("student_id", studentId)
      .is("deleted_at", null);

    if (progressError) return json({ error: progressError.message }, 500);

    const totalLessons = lessonProgressRows?.length || 0;
    const completedLessons = (lessonProgressRows || []).filter((lp) => lp.status === "completed").length;
    const inProgressLessons = (lessonProgressRows || []).filter((lp) => lp.status === "in_progress").length;
    const totalTimeSpent = (lessonProgressRows || []).reduce((sum, lp) => sum + (lp.time_spent_seconds || 0), 0);

    const today = new Date().toISOString().slice(0, 10);
    const todayCompleted = (lessonProgressRows || []).filter(
      (lp) => lp.completed_at && String(lp.completed_at).startsWith(today)
    ).length;
    const todayAccessed = (lessonProgressRows || []).filter(
      (lp) => lp.last_accessed_at && String(lp.last_accessed_at).startsWith(today)
    ).length;

    const { data: recentQuizzes } = await supabaseAdmin
      .from("quiz_attempts")
      .select("id,quiz_id,score,max_score,percentage,passed,completed_at,created_at")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentBadgeLinks } = await supabaseAdmin
      .from("student_badges")
      .select("badge_id,earned_at,badges(name,image_url)")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("earned_at", { ascending: false })
      .limit(5);

    const recentBadges = (recentBadgeLinks || []).map((b: JsonRecord) => ({
      name: (b.badges as JsonRecord)?.name || "Unknown",
      image_url: (b.badges as JsonRecord)?.image_url || null,
      earned_at: b.earned_at,
    }));

    const { data: termUnlocks } = await supabaseAdmin
      .from("term_unlocks")
      .select("id,term_type_id,completed_at,completion_percentage")
      .eq("student_id", studentId)
      .is("deleted_at", null);

    const activeTerms = (termUnlocks || []).filter((t) => !t.completed_at).length;
    const completedTerms = (termUnlocks || []).filter((t) => t.completed_at).length;

    let subjectProgress: { subject_name: string; completed: number; total: number; percentage: number }[] = [];

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

        const chapterSubjectMap: Record<string, string> = {};
        (chapters || []).forEach((c) => { chapterSubjectMap[c.id] = c.subject_id; });

        const lessonSubjectMap: Record<string, string> = {};
        allLessons.forEach((l) => { lessonSubjectMap[l.id] = chapterSubjectMap[l.chapter_id]; });

        const completedLessonIds = new Set(
          (lessonProgressRows || []).filter((lp) => lp.status === "completed").map((lp) => lp.lesson_id)
        );

        const subjectCounts: Record<string, { total: number; completed: number }> = {};
        subjects.forEach((s) => { subjectCounts[s.id] = { total: 0, completed: 0 }; });

        allLessons.forEach((lesson) => {
          const sid = lessonSubjectMap[lesson.id];
          if (sid && subjectCounts[sid]) {
            subjectCounts[sid].total++;
            if (completedLessonIds.has(lesson.id)) subjectCounts[sid].completed++;
          }
        });

        subjectProgress = subjects.map((s) => {
          const counts = subjectCounts[s.id] || { total: 0, completed: 0 };
          return {
            subject_name: s.name,
            completed: counts.completed,
            total: counts.total,
            percentage: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
          };
        });
      }
    }

    return json({
      student: {
        id: student.id,
        name: student.full_name,
        overall_progress: student.overall_progress || 0,
        total_stars: student.total_stars_earned || 0,
        total_badges: student.total_badges_earned || 0,
        current_streak_days: student.current_streak_days || 0,
        last_activity_at: student.last_activity_at,
      },
      lesson_stats: {
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        in_progress_lessons: inProgressLessons,
        total_time_spent_seconds: totalTimeSpent,
      },
      today_activity: {
        lessons_completed: todayCompleted,
        lessons_accessed: todayAccessed,
      },
      quiz_stats: {
        total_attempts: student.total_quizzes_attempted || 0,
        total_passed: student.total_quizzes_passed || 0,
        recent_attempts: recentQuizzes || [],
      },
      recent_badges: recentBadges,
      term_stats: {
        active_terms: activeTerms,
        completed_terms: completedTerms,
      },
      subject_progress: subjectProgress,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load dashboard" }, 500);
  }
}

// ───── listStudentLessons ─────
export async function listStudentLessons(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;

    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id,grade_id")
      .eq("id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (studentError) return json({ error: studentError.message }, 500);
    if (!student) return json({ error: "Student not found" }, 404);
    if (!student.grade_id) return json({ data: [] });

    const { data: subjects } = await supabaseAdmin
      .from("subjects")
      .select("id,name")
      .eq("grade_id", student.grade_id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (!subjects || subjects.length === 0) return json({ data: [] });

    const subjectIds = subjects.map((s) => s.id);
    const { data: chapters } = await supabaseAdmin
      .from("chapters")
      .select("id,subject_id,name,sort_order")
      .in("subject_id", subjectIds)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    const chapterIds = (chapters || []).map((c) => c.id);
    if (chapterIds.length === 0) return json({ data: [] });

    const { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select("id,chapter_id,title,description,youtube_video_id,thumbnail_url,duration_seconds,sort_order")
      .in("chapter_id", chapterIds)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (!lessons || lessons.length === 0) return json({ data: [] });

    const lessonIds = lessons.map((l) => l.id);
    const { data: progressRows } = await supabaseAdmin
      .from("lesson_progress")
      .select("lesson_id,status,completion_percentage,time_spent_seconds,last_accessed_at,quiz_completed,quiz_score,quiz_max_score")
      .eq("student_id", studentId)
      .in("lesson_id", lessonIds)
      .is("deleted_at", null);

    const progressMap: Record<string, JsonRecord> = {};
    (progressRows || []).forEach((p) => { progressMap[p.lesson_id] = p; });

    // ── Sequential chapter lock/unlock ──
    const chaptersBySubject: Record<string, NonNullable<typeof chapters>> = {};
    (chapters || []).forEach((c) => {
      if (!chaptersBySubject[c.subject_id]) chaptersBySubject[c.subject_id] = [];
      chaptersBySubject[c.subject_id]!.push(c);
    });

    const lessonCountPerChapter: Record<string, number> = {};
    const completedLessonCountPerChapter: Record<string, number> = {};
    lessons.forEach((l) => {
      lessonCountPerChapter[l.chapter_id] = (lessonCountPerChapter[l.chapter_id] || 0) + 1;
      const p = progressMap[l.id];
      if (p && p.status === "completed") {
        completedLessonCountPerChapter[l.chapter_id] = (completedLessonCountPerChapter[l.chapter_id] || 0) + 1;
      }
    });

    const unlockedChapters = new Set<string>();
    (chapters || []).forEach((c) => {
      const subjectChapters = chaptersBySubject[c.subject_id] || [];
      const idx = subjectChapters.findIndex((sc) => sc.id === c.id);
      if (idx === 0) {
        unlockedChapters.add(c.id);
      } else if (idx > 0) {
        const prevChapter = subjectChapters[idx - 1];
        if (prevChapter) {
          const total = lessonCountPerChapter[prevChapter.id] || 0;
          const completed = completedLessonCountPerChapter[prevChapter.id] || 0;
          if (total > 0 && completed >= total) unlockedChapters.add(c.id);
        }
      }
    });

    const grouped: JsonRecord[] = subjects.map((subject) => {
      const subjectChapters = (chapters || []).filter((c) => c.subject_id === subject.id);
      const chapterData = subjectChapters.map((chapter) => {
        const totalLessonsInChapter = lessonCountPerChapter[chapter.id] || 0;
        const completedLessonsInChapter = completedLessonCountPerChapter[chapter.id] || 0;
        const chapterCompletion = totalLessonsInChapter > 0
          ? Math.round((completedLessonsInChapter / totalLessonsInChapter) * 100)
          : 0;

        const chapterLessons = (lessons || [])
          .filter((l) => l.chapter_id === chapter.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            youtube_video_id: l.youtube_video_id,
            thumbnail_url: l.thumbnail_url,
            duration_seconds: l.duration_seconds,
            sort_order: l.sort_order,
            is_unlocked: unlockedChapters.has(chapter.id),
            progress: progressMap[l.id] || { status: "not_started", completion_percentage: 0 },
          }));
        return {
          id: chapter.id,
          name: chapter.name,
          sort_order: chapter.sort_order,
          is_unlocked: unlockedChapters.has(chapter.id),
          completion_percentage: chapterCompletion,
          total_lessons: totalLessonsInChapter,
          completed_lessons: completedLessonsInChapter,
          lessons: chapterLessons,
        };
      });
      return { id: subject.id, name: subject.name, chapters: chapterData };
    });

    return json({ data: grouped });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load lessons" }, 500);
  }
}

// ───── getStudentLesson ─────
export async function getStudentLesson(req: NextRequest, lessonId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from("lessons")
      .select("id,chapter_id,title,description,youtube_video_id,thumbnail_url,duration_seconds,sort_order,status_id,created_at")
      .eq("id", lessonId)
      .is("deleted_at", null)
      .maybeSingle();

    if (lessonError) return json({ error: lessonError.message }, 500);
    if (!lesson) return json({ error: "Lesson not found" }, 404);

    const { data: chapter } = await supabaseAdmin
      .from("chapters")
      .select("id,name,subject_id")
      .eq("id", lesson.chapter_id)
      .is("deleted_at", null)
      .maybeSingle();

    let subjectName: string | null = null;
    if (chapter?.subject_id) {
      const { data: subject } = await supabaseAdmin
        .from("subjects")
        .select("name")
        .eq("id", chapter.subject_id)
        .is("deleted_at", null)
        .maybeSingle();
      subjectName = subject?.name || null;
    }

    const { data: progress } = await supabaseAdmin
      .from("lesson_progress")
      .select("id,status,completion_percentage,time_spent_seconds,video_watched_seconds,activity_completed,quiz_completed,quiz_score,quiz_max_score,completed_at,last_accessed_at")
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .maybeSingle();

    let progressRecord = progress;
    if (!progressRecord) {
      const { data: newProgress } = await supabaseAdmin
        .from("lesson_progress")
        .insert({
          student_id: studentId,
          lesson_id: lessonId,
          status: "not_started",
          completion_percentage: 0,
          last_accessed_at: new Date().toISOString(),
        })
        .select("id,status,completion_percentage,time_spent_seconds,video_watched_seconds,activity_completed,quiz_completed,quiz_score,quiz_max_score,completed_at,last_accessed_at")
        .single();

      if (newProgress) progressRecord = newProgress;
    } else {
      await supabaseAdmin
        .from("lesson_progress")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", progressRecord.id);
    }

    const { data: activities } = await supabaseAdmin
      .from("activities")
      .select("id,lesson_id,name,activity_type_id,config,sort_order")
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    const { data: quizzes } = await supabaseAdmin
      .from("quizzes")
      .select("id,lesson_id,title,description,time_limit_seconds,difficulty_id,sort_order")
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    return json({
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          youtube_video_id: lesson.youtube_video_id,
          thumbnail_url: lesson.thumbnail_url,
          duration_seconds: lesson.duration_seconds,
          sort_order: lesson.sort_order,
          chapter_name: chapter?.name || null,
          subject_name: subjectName,
        },
        progress: progressRecord || { status: "not_started", completion_percentage: 0 },
        activities: activities || [],
        quizzes: quizzes || [],
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load lesson" }, 500);
  }
}

// ───── updateLessonProgress ─────
export async function updateLessonProgress(req: NextRequest, lessonId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;
    const body = await req.json().catch(() => ({})) as JsonRecord;

    const { data: existing } = await supabaseAdmin
      .from("lesson_progress")
      .select("id")
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .maybeSingle();

    const now = new Date().toISOString();
    const updateFields: JsonRecord = { updated_at: now, last_accessed_at: now };

    if (body.status !== undefined) updateFields.status = body.status;
    if (body.completion_percentage !== undefined) updateFields.completion_percentage = body.completion_percentage;
    if (body.time_spent_seconds !== undefined) updateFields.time_spent_seconds = body.time_spent_seconds;
    if (body.video_watched_seconds !== undefined) updateFields.video_watched_seconds = body.video_watched_seconds;
    if (body.activity_completed !== undefined) updateFields.activity_completed = body.activity_completed;
    if (body.quiz_completed !== undefined) updateFields.quiz_completed = body.quiz_completed;
    if (body.quiz_score !== undefined) updateFields.quiz_score = body.quiz_score;
    if (body.quiz_max_score !== undefined) updateFields.quiz_max_score = body.quiz_max_score;

    if (body.status === "completed") {
      updateFields.completed_at = now;
      updateFields.completion_percentage = 100;
    }

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("lesson_progress")
        .update(updateFields)
        .eq("id", existing.id)
        .select("id,student_id,lesson_id,status,completion_percentage,time_spent_seconds,video_watched_seconds,activity_completed,quiz_completed,completed_at,last_accessed_at")
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ data });
    } else {
      const insertFields: JsonRecord = {
        student_id: studentId,
        lesson_id: lessonId,
        status: body.status || "in_progress",
        completion_percentage: body.completion_percentage || 0,
        time_spent_seconds: body.time_spent_seconds || 0,
        video_watched_seconds: body.video_watched_seconds || 0,
        activity_completed: body.activity_completed || false,
        quiz_completed: body.quiz_completed || false,
        quiz_score: body.quiz_score !== undefined ? body.quiz_score : null,
        quiz_max_score: body.quiz_max_score !== undefined ? body.quiz_max_score : null,
        last_accessed_at: now,
      };
      if (body.status === "completed") {
        insertFields.completed_at = now;
        insertFields.completion_percentage = 100;
      }

      const { data, error } = await supabaseAdmin
        .from("lesson_progress")
        .insert(insertFields)
        .select("id,student_id,lesson_id,status,completion_percentage,time_spent_seconds,video_watched_seconds,activity_completed,quiz_completed,completed_at,last_accessed_at")
        .single();

      if (error) return json({ error: error.message }, 400);

      if (body.status === "completed") {
        const { data: studentRow } = await supabaseAdmin
          .from("students")
          .select("total_lessons_completed,overall_progress,total_time_spent_seconds")
          .eq("id", studentId)
          .single();

        if (studentRow) {
          const newTotalLessons = (studentRow.total_lessons_completed || 0) + 1;
          const { data: allProgress } = await supabaseAdmin
            .from("lesson_progress")
            .select("status")
            .eq("student_id", studentId)
            .is("deleted_at", null);

          const totalTracked = allProgress?.length || 0;
          const completedTracked = (allProgress || []).filter((p) => p.status === "completed").length;
          const newOverallProgress = totalTracked > 0 ? Math.round((completedTracked / totalTracked) * 100) : 0;

          await supabaseAdmin
            .from("students")
            .update({
              total_lessons_completed: newTotalLessons,
              total_stars_earned: newTotalLessons * 5,
              overall_progress: newOverallProgress,
              last_activity_at: now,
              updated_at: now,
            })
            .eq("id", studentId);
        }

        // Auto-unlock next chapter if all lessons in this chapter are complete
        checkAndAutoUnlockNextChapter(studentId, lessonId).catch(() => {});
      }

      return json({ data }, 201);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to update progress" }, 500);
  }
}

// ───── listStudentActivities ─────
export async function listStudentActivities(req: NextRequest, lessonId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;

    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from("activities")
      .select("id,lesson_id,name,activity_type_id,config,sort_order,status_id")
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (activitiesError) return json({ error: activitiesError.message }, 500);

    const activityIds = (activities || []).map((a) => a.id);
    let attempts: JsonRecord[] = [];
    if (activityIds.length > 0) {
      const { data: attemptData } = await supabaseAdmin
        .from("activity_attempts")
        .select("id,activity_id,score,max_score,completion_data,time_taken_seconds,completed_at,created_at")
        .eq("student_id", studentId)
        .in("activity_id", activityIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      attempts = (attemptData || []) as JsonRecord[];
    }

    const attemptMap: Record<string, JsonRecord> = {};
    attempts.forEach((a) => {
      const actId = a.activity_id as string;
      if (!attemptMap[actId]) attemptMap[actId] = a;
    });

    const data = (activities || []).map((activity) => ({
      id: activity.id,
      name: activity.name,
      activity_type_id: activity.activity_type_id,
      config: activity.config,
      sort_order: activity.sort_order,
      status_id: activity.status_id,
      attempt: attemptMap[activity.id] || null,
    }));

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load activities" }, 500);
  }
}

// ───── submitActivity ─────
export async function submitActivity(req: NextRequest, activityId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;
    const body = await req.json().catch(() => ({})) as JsonRecord;

    const { data: activity, error: activityError } = await supabaseAdmin
      .from("activities")
      .select("id,lesson_id")
      .eq("id", activityId)
      .is("deleted_at", null)
      .maybeSingle();

    if (activityError) return json({ error: activityError.message }, 500);
    if (!activity) return json({ error: "Activity not found" }, 404);

    const now = new Date().toISOString();
    const score = Number(body.score || 0);
    const maxScore = Number(body.max_score || 0);
    const timeTaken = Number(body.time_taken_seconds || 0);

    const { data, error } = await supabaseAdmin
      .from("activity_attempts")
      .insert({
        student_id: studentId,
        activity_id: activityId,
        lesson_id: activity.lesson_id,
        score,
        max_score: maxScore,
        completion_data: body.completion_data || {},
        time_taken_seconds: timeTaken,
        completed_at: now,
      })
      .select("id,activity_id,score,max_score,completion_data,time_taken_seconds,completed_at,created_at")
      .single();

    if (error) return json({ error: error.message }, 400);

    const { data: existingProgress } = await supabaseAdmin
      .from("lesson_progress")
      .select("id,activity_completed")
      .eq("student_id", studentId)
      .eq("lesson_id", activity.lesson_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingProgress) {
      await supabaseAdmin
        .from("lesson_progress")
        .update({ activity_completed: true, updated_at: now })
        .eq("id", existingProgress.id);
    }

    return json({ data }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to submit activity" }, 500);
  }
}

// ───── listStudentQuizzes ─────
export async function listStudentQuizzes(req: NextRequest, lessonId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;

    const { data: quizzes, error: quizzesError } = await supabaseAdmin
      .from("quizzes")
      .select("id,lesson_id,title,description,time_limit_seconds,difficulty_id,sort_order,status_id")
      .eq("lesson_id", lessonId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (quizzesError) return json({ error: quizzesError.message }, 500);

    const quizIds = (quizzes || []).map((q) => q.id);
    let attempts: JsonRecord[] = [];
    if (quizIds.length > 0) {
      const { data: attemptData } = await supabaseAdmin
        .from("quiz_attempts")
        .select("id,quiz_id,attempt_number,score,max_score,percentage,passed,time_taken_seconds,completed_at,created_at")
        .eq("student_id", studentId)
        .in("quiz_id", quizIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      attempts = (attemptData || []) as JsonRecord[];
    }

    const attemptMap: Record<string, JsonRecord[]> = {};
    attempts.forEach((a) => {
      const qId = a.quiz_id as string;
      if (!attemptMap[qId]) attemptMap[qId] = [];
      attemptMap[qId].push(a);
    });

    const data = (quizzes || []).map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      time_limit_seconds: quiz.time_limit_seconds,
      difficulty_id: quiz.difficulty_id,
      sort_order: quiz.sort_order,
      status_id: quiz.status_id,
      attempts: attemptMap[quiz.id] || [],
    }));

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load quizzes" }, 500);
  }
}

// ───── submitQuiz ─────
export async function submitQuiz(req: NextRequest, quizId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;
    const body = await req.json().catch(() => ({})) as JsonRecord;
    const answers = body.answers as unknown[];

    if (!Array.isArray(answers) || answers.length === 0) {
      return json({ error: "answers array is required" }, 400);
    }

    const { data: quiz, error: quizError } = await supabaseAdmin
      .from("quizzes")
      .select("id,lesson_id")
      .eq("id", quizId)
      .is("deleted_at", null)
      .maybeSingle();

    if (quizError) return json({ error: quizError.message }, 500);
    if (!quiz) return json({ error: "Quiz not found" }, 404);

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("quiz_questions")
      .select("id,points")
      .eq("quiz_id", quizId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (questionsError) return json({ error: questionsError.message }, 500);
    if (!questions || questions.length === 0) return json({ error: "Quiz has no questions" }, 400);

    const questionIds = questions.map((q) => q.id);

    const { data: options } = await supabaseAdmin
      .from("quiz_options")
      .select("id,question_id,is_correct")
      .in("question_id", questionIds);

    const correctMap: Record<string, string[]> = {};
    (options || []).forEach((opt) => {
      if (opt.is_correct) {
        if (!correctMap[opt.question_id]) correctMap[opt.question_id] = [];
        correctMap[opt.question_id].push(opt.id);
      }
    });

    let score = 0;
    let maxScore = 0;
    const scoredAnswers: { question_id: string; selected_option_id?: string; correct: boolean }[] = [];

    questions.forEach((q) => {
      maxScore += q.points || 10;
      const answer = answers.find((a: unknown) => (a as JsonRecord).question_id === q.id) as JsonRecord | undefined;
      const selectedId = answer?.selected_option_id as string | undefined;
      const correctIds = correctMap[q.id] || [];
      const isCorrect = selectedId ? correctIds.includes(selectedId) : false;

      if (isCorrect) score += q.points || 10;

      scoredAnswers.push({ question_id: q.id, selected_option_id: selectedId, correct: isCorrect });
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= 60;

    const { data: prevAttempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select("attempt_number")
      .eq("student_id", studentId)
      .eq("quiz_id", quizId)
      .is("deleted_at", null)
      .order("attempt_number", { ascending: false })
      .limit(1);

    const attemptNumber = (prevAttempts?.[0]?.attempt_number || 0) + 1;
    const now = new Date().toISOString();
    const timeTaken = Number(body.time_taken_seconds || 0);

    const { data, error } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({
        student_id: studentId,
        quiz_id: quizId,
        lesson_id: quiz.lesson_id,
        attempt_number: attemptNumber,
        score,
        max_score: maxScore,
        percentage,
        passed,
        time_taken_seconds: timeTaken,
        answers: scoredAnswers,
        completed_at: now,
      })
      .select("id,quiz_id,attempt_number,score,max_score,percentage,passed,time_taken_seconds,completed_at,created_at")
      .single();

    if (error) return json({ error: error.message }, 400);

    const { data: existingProgress } = await supabaseAdmin
      .from("lesson_progress")
      .select("id,quiz_completed")
      .eq("student_id", studentId)
      .eq("lesson_id", quiz.lesson_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingProgress) {
      await supabaseAdmin
        .from("lesson_progress")
        .update({
          quiz_completed: true,
          quiz_score: score,
          quiz_max_score: maxScore,
          updated_at: now,
        })
        .eq("id", existingProgress.id);
    }

    const { data: studentRow } = await supabaseAdmin
      .from("students")
      .select("total_quizzes_attempted,total_quizzes_passed")
      .eq("id", studentId)
      .single();

    if (studentRow) {
      await supabaseAdmin
        .from("students")
        .update({
          total_quizzes_attempted: (studentRow.total_quizzes_attempted || 0) + 1,
          total_quizzes_passed: passed ? (studentRow.total_quizzes_passed || 0) + 1 : studentRow.total_quizzes_passed,
          last_activity_at: now,
          updated_at: now,
        })
        .eq("id", studentId);
    }

    return json({ data }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to submit quiz" }, 500);
  }
}

// ───── checkAndAutoUnlockNextChapter ─────
export async function checkAndAutoUnlockNextChapter(studentId: string, lessonId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select("chapter_id")
      .eq("id", lessonId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!lesson) return;
    const { data: chapter } = await supabaseAdmin
      .from("chapters")
      .select("subject_id,sort_order")
      .eq("id", lesson.chapter_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!chapter) return;
    const { data: chapterLessons } = await supabaseAdmin
      .from("lessons")
      .select("id")
      .eq("chapter_id", lesson.chapter_id)
      .is("deleted_at", null);
    const chapterLessonIds = (chapterLessons || []).map((l: { id: string }) => l.id);
    if (chapterLessonIds.length === 0) return;
    const { data: completedRows } = await supabaseAdmin
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", studentId)
      .in("lesson_id", chapterLessonIds)
      .eq("status", "completed")
      .is("deleted_at", null);
    const completedCount = completedRows?.length || 0;
    if (completedCount < chapterLessonIds.length) return;
    const { data: nextChapter } = await supabaseAdmin
      .from("chapters")
      .select("id,name")
      .eq("subject_id", chapter.subject_id)
      .eq("sort_order", chapter.sort_order + 1)
      .is("deleted_at", null)
      .maybeSingle();
    if (!nextChapter) return;
    const { data: nextChapterLessons } = await supabaseAdmin
      .from("lessons")
      .select("id,title")
      .eq("chapter_id", nextChapter.id)
      .is("deleted_at", null);
    if (!nextChapterLessons || nextChapterLessons.length === 0) return;
    const nextLessonIds = nextChapterLessons.map((l: { id: string }) => l.id);
    const { data: existingProgress } = await supabaseAdmin
      .from("lesson_progress")
      .select("lesson_id")
      .eq("student_id", studentId)
      .in("lesson_id", nextLessonIds)
      .is("deleted_at", null);
    const existingLessonIds = new Set((existingProgress || []).map((p: { lesson_id: string }) => p.lesson_id));
    const inserts = nextChapterLessons
      .filter((l: { id: string }) => !existingLessonIds.has(l.id))
      .map((l: { id: string }) => ({
        student_id: studentId,
        lesson_id: l.id,
        status: "not_started" as const,
        completion_percentage: 0,
        last_accessed_at: new Date().toISOString(),
      }));
    if (inserts.length > 0) {
      await supabaseAdmin.from("lesson_progress").insert(inserts);
    }
  } catch {
    // silent
  }
}

// ───── listStudentBadges ─────
export async function listStudentBadges(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;

    const { data: badgeLinks, error: badgeError } = await supabaseAdmin
      .from("student_badges")
      .select("badge_id,earned_at")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("earned_at", { ascending: false });

    if (badgeError) return json({ error: badgeError.message }, 500);

    const badgeIds = (badgeLinks || []).map((b) => b.badge_id).filter(Boolean) as string[];
    if (badgeIds.length === 0) return json({ data: [] });

    const { data: badgeData, error: badgeDataError } = await supabaseAdmin
      .from("badges")
      .select("id,name,description,image_url")
      .in("id", badgeIds)
      .is("deleted_at", null);

    if (badgeDataError) return json({ error: badgeDataError.message }, 500);

    const badgeMap: Record<string, JsonRecord> = {};
    (badgeData || []).forEach((b) => { badgeMap[b.id] = b; });

    const data = (badgeLinks || []).map((link) => ({
      badge_id: link.badge_id,
      earned_at: link.earned_at,
      name: (badgeMap[link.badge_id] as JsonRecord)?.name || null,
      description: (badgeMap[link.badge_id] as JsonRecord)?.description || null,
      image_url: (badgeMap[link.badge_id] as JsonRecord)?.image_url || null,
    }));

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load badges" }, 500);
  }
}

// ───── listStudentTerms ─────
export async function listStudentTerms(req: NextRequest) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;

    const { data: terms, error: termsError } = await supabaseAdmin
      .from("term_unlocks")
      .select("id,term_type_id,grade_id,board_id,unlocked_at,completed_at,completion_percentage,status_id")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (termsError) return json({ error: termsError.message }, 500);

    const termTypeIds = Array.from(new Set((terms || []).map((t) => t.term_type_id).filter(Boolean))) as number[];
    const gradeIds = Array.from(new Set((terms || []).map((t) => t.grade_id).filter(Boolean))) as string[];
    const boardIds = Array.from(new Set((terms || []).map((t) => t.board_id).filter(Boolean))) as string[];

    const [{ data: termTypes }, { data: grades }, { data: boards }] = await Promise.all([
      termTypeIds.length > 0
        ? supabaseAdmin.from("lookup_term_types").select("id,code,name").in("id", termTypeIds)
        : Promise.resolve({ data: [] as { id: number; code: string; name: string }[], error: null }),
      gradeIds.length > 0
        ? supabaseAdmin.from("grades").select("id,name").in("id", gradeIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
      boardIds.length > 0
        ? supabaseAdmin.from("boards").select("id,name").in("id", boardIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as { id: string; name: string }[], error: null })
    ]);

    const termTypeMap: Record<number, { code: string; name: string }> = {};
    (termTypes || []).forEach((tt) => { if (tt?.id) termTypeMap[tt.id] = { code: tt.code, name: tt.name }; });

    const gradeMap: Record<string, string> = {};
    (grades || []).forEach((g) => { if (g?.id) gradeMap[g.id] = g.name; });

    const boardMap: Record<string, string> = {};
    (boards || []).forEach((b) => { if (b?.id) boardMap[b.id] = b.name; });

    const data = (terms || []).map((t) => ({
      id: t.id,
      term_type: t.term_type_id ? termTypeMap[t.term_type_id] || null : null,
      grade: t.grade_id ? gradeMap[t.grade_id] || null : null,
      board: t.board_id ? boardMap[t.board_id] || null : null,
      unlocked_at: t.unlocked_at,
      completed_at: t.completed_at,
      completion_percentage: t.completion_percentage,
      status_id: t.status_id,
    }));

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load terms" }, 500);
  }
}

// ───── submitQuizScore ─────
// For the custom Quiz page which uses local hardcoded questions (no DB question IDs).
// Accepts pre-computed score fields and inserts a quiz_attempts row directly.
export async function submitQuizScore(req: NextRequest, quizId: string) {
  const user = await requireStudent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = user.profileId;
    const body = await req.json().catch(() => ({})) as JsonRecord;

    const score = Number(body.score ?? 0);
    const maxScore = Number(body.max_score ?? 5);
    const timeTaken = Number(body.time_taken_seconds ?? 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= 60;

    // Verify quiz exists
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from("quizzes")
      .select("id,lesson_id")
      .eq("id", quizId)
      .is("deleted_at", null)
      .maybeSingle();

    if (quizError) return json({ error: quizError.message }, 500);
    if (!quiz) return json({ error: "Quiz not found" }, 404);

    // Get next attempt number
    const { data: prevAttempts } = await supabaseAdmin
      .from("quiz_attempts")
      .select("attempt_number")
      .eq("student_id", studentId)
      .eq("quiz_id", quizId)
      .is("deleted_at", null)
      .order("attempt_number", { ascending: false })
      .limit(1);

    const attemptNumber = (prevAttempts?.[0]?.attempt_number || 0) + 1;
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({
        student_id: studentId,
        quiz_id: quizId,
        lesson_id: quiz.lesson_id,
        attempt_number: attemptNumber,
        score,
        max_score: maxScore,
        percentage,
        passed,
        time_taken_seconds: timeTaken,
        answers: [],
        completed_at: now,
      })
      .select("id,quiz_id,attempt_number,score,max_score,percentage,passed,time_taken_seconds,completed_at,created_at")
      .single();

    if (error) return json({ error: error.message }, 400);

    // Update student stats
    const { data: studentRow } = await supabaseAdmin
      .from("students")
      .select("total_quizzes_attempted,total_quizzes_passed")
      .eq("id", studentId)
      .single();

    if (studentRow) {
      await supabaseAdmin
        .from("students")
        .update({
          total_quizzes_attempted: (studentRow.total_quizzes_attempted || 0) + 1,
          total_quizzes_passed: passed ? (studentRow.total_quizzes_passed || 0) + 1 : studentRow.total_quizzes_passed,
          last_activity_at: now,
          updated_at: now,
        })
        .eq("id", studentId);
    }

    return json({ data }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to submit quiz score" }, 500);
  }
}

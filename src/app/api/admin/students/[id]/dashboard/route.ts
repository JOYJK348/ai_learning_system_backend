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

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const studentId = params.id;

    // 1. Fetch Student Details & Grade
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select(`
        *,
        grades (id, name, board_id, boards (id, name))
      `)
      .eq("id", studentId)
      .maybeSingle();

    if (studentError) return json({ error: studentError.message }, 500);
    if (!student) return json({ error: "Student not found" }, 404);

    const gradeId = student.grade_id;
    const boardName = (student.grades as any)?.boards?.name || "Unknown Board";
    const gradeName = (student.grades as any)?.name || "Unknown Grade";

    // 2. Fetch required data for Subject Progress & Timeline
    // Because deep joins are expensive, we fetch parallel lists
    const [
      lessonProgressRes,
      quizAttemptsRes,
      badgesRes,
      subjectsRes,
      chaptersRes,
      lessonsRes
    ] = await Promise.all([
      // Student's completed lessons
      supabaseAdmin
        .from("lesson_progress")
        .select("lesson_id, completed_at")
        .eq("student_id", studentId)
        .eq("is_completed", true),
        
      // Recent Quizzes
      supabaseAdmin
        .from("quiz_attempts")
        .select("id, score, total_questions, created_at, quizzes(title)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(10),

      // Badges
      supabaseAdmin
        .from("student_badges")
        .select("id, earned_at, badges(name, image_url)")
        .eq("student_id", studentId)
        .order("earned_at", { ascending: false })
        .limit(10),

      // Grade subjects
      gradeId ? supabaseAdmin.from("subjects").select("id, name").eq("grade_id", gradeId) : Promise.resolve({ data: [] }),
      
      // All chapters for subjects
      gradeId ? supabaseAdmin.from("chapters").select("id, subject_id, name").eq("grade_id", gradeId) : Promise.resolve({ data: [] }),
      
      // All lessons for chapters
      gradeId ? supabaseAdmin.from("lessons").select("id, chapter_id, title") : Promise.resolve({ data: [] })
    ]);

    // 3. Calculate Subject Progress
    const completedLessonIds = new Set((lessonProgressRes.data || []).map((lp: any) => lp.lesson_id));
    
    // Map chapters to subjects
    const chapterToSubject: Record<string, string> = {}; // chapter_id -> subject_name
    const subjectMap: Record<string, { total: number, completed: number, name: string }> = {};
    
    (subjectsRes.data || []).forEach((s: any) => {
      subjectMap[s.id] = { total: 0, completed: 0, name: s.name };
    });

    (chaptersRes.data || []).forEach((c: any) => {
      chapterToSubject[c.id] = c.subject_id;
    });

    // Count lessons per subject
    (lessonsRes.data || []).forEach((l: any) => {
      const subId = chapterToSubject[l.chapter_id];
      if (subId && subjectMap[subId]) {
        subjectMap[subId].total += 1;
        if (completedLessonIds.has(l.id)) {
          subjectMap[subId].completed += 1;
        }
      }
    });

    const subjectProgress = Object.values(subjectMap)
      .filter(sub => sub.total > 0)
      .map(sub => ({
        name: sub.name,
        completed: sub.completed,
        total: sub.total,
        percentage: Math.round((sub.completed / sub.total) * 100)
      }));

    // 4. Build Recent Activity Timeline
    const activities: Array<{ id: string, type: string, description: string, date: string }> = [];

    // Add lessons
    (lessonProgressRes.data || []).slice(0, 5).forEach((lp: any) => {
      const lesson = (lessonsRes.data || []).find((l: any) => l.id === lp.lesson_id);
      activities.push({
        id: `lp_${lp.lesson_id}`,
        type: 'lesson',
        description: `Completed lesson "${lesson?.title || 'Unknown'}"`,
        date: lp.completed_at
      });
    });

    // Add quizzes
    (quizAttemptsRes.data || []).forEach((qa: any) => {
      const perc = Math.round((qa.score / (qa.total_questions || 1)) * 100);
      activities.push({
        id: `qa_${qa.id}`,
        type: 'quiz',
        description: `Scored ${perc}% in quiz "${qa.quizzes?.title || 'Unknown'}"`,
        date: qa.created_at
      });
    });

    // Add badges
    (badgesRes.data || []).forEach((b: any) => {
      activities.push({
        id: `bdg_${b.id}`,
        type: 'badge',
        description: `Earned "${b.badges?.name || 'Badge'}"`,
        date: b.earned_at
      });
    });

    // Sort timeline descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const timeline = activities.slice(0, 10); // keep top 10

    // 5. Calculate Health Score
    // Factors: Login regularity (25%), Lesson completion (25%), Quiz performance (25%), Engagement/Progress (25%)
    let loginScore = 0;
    if (student.last_activity_at) {
      const daysSinceLogin = (Date.now() - new Date(student.last_activity_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLogin <= 2) loginScore = 100;
      else if (daysSinceLogin <= 7) loginScore = 70;
      else if (daysSinceLogin <= 14) loginScore = 40;
      else loginScore = 10;
    }

    let lessonScore = student.overall_progress || 0; // overall progress acts as lesson score roughly
    
    let quizScore = 0;
    if (student.total_quizzes_attempted > 0) {
      quizScore = Math.round((student.total_quizzes_passed / student.total_quizzes_attempted) * 100);
    }

    let engagementScore = Math.min(100, (student.total_stars_earned || 0) * 2 + (student.current_streak_days || 0) * 10);

    // If perfectly healthy, these average to high numbers.
    const healthScore = Math.round((loginScore + lessonScore + quizScore + engagementScore) / 4);

    return json({
      data: {
        student: {
          id: student.id,
          name: student.full_name,
          grade: gradeName,
          board: boardName,
          photo: student.profile_photo_url,
          progress: student.overall_progress || 0,
          lessons_completed: student.total_lessons_completed || 0,
          quizzes_taken: student.total_quizzes_attempted || 0,
          quizzes_passed: student.total_quizzes_passed || 0,
          time_spent: student.total_time_spent_seconds || 0,
          streak: student.current_streak_days || 0,
          stars: student.total_stars_earned || 0,
          badges: student.total_badges_earned || 0,
          status: student.status_id,
        },
        health: {
          score: healthScore,
          metrics: {
            login: loginScore,
            lessons: lessonScore,
            quizzes: quizScore,
            engagement: engagementScore
          }
        },
        subjects: subjectProgress,
        timeline
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load dashboard" }, 500);
  }
}

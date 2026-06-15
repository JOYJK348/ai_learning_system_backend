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

    // Fetch core student
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select(
        "id,full_name,date_of_birth,grade_id,profile_photo_url,overall_progress,total_time_spent_seconds,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,total_badges_earned,current_streak_days,last_activity_at,status_id,created_at"
      )
      .eq("id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (studentError) return json({ error: studentError.message }, 500);
    if (!student) return json({ error: "Student not found" }, 404);

    // Parallel fetches
    const [gradeRes, schoolStudentRes, parentLinkRes, badgesRes, lessonProgressRes] =
      await Promise.all([
        student.grade_id
          ? supabaseAdmin
              .from("grades")
              .select("id,name")
              .eq("id", student.grade_id)
              .is("deleted_at", null)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabaseAdmin
          .from("school_students")
          .select("school_id,roll_number,section,admission_date")
          .eq("student_id", studentId)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from("parent_student_links")
          .select("parent_id")
          .eq("student_id", studentId)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from("student_badges")
          .select("badge_id,earned_at,badges(name,image_url)")
          .eq("student_id", studentId)
          .is("deleted_at", null)
          .order("earned_at", { ascending: false })
          .limit(10),
        supabaseAdmin
          .from("lesson_progress")
          .select("lesson_id,status,completion_percentage,completed_at")
          .eq("student_id", studentId)
          .is("deleted_at", null),
      ]);

    // School name
    let schoolName: string | null = null;
    if (schoolStudentRes.data?.school_id) {
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("name")
        .eq("id", schoolStudentRes.data.school_id)
        .maybeSingle();
      schoolName = school?.name || null;
    }

    // Parent name
    let parentName: string | null = null;
    let parentId: string | null = null;
    if (parentLinkRes.data?.parent_id) {
      parentId = parentLinkRes.data.parent_id;
      const { data: parent } = await supabaseAdmin
        .from("parents")
        .select("name")
        .eq("id", parentId)
        .maybeSingle();
      parentName = parent?.name || null;
    }

    // Subject progress via grade → subjects → chapters → lessons
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
        .is("deleted_at", null);

      if (subjects && subjects.length > 0) {
        const subjectIds = subjects.map((s) => s.id);
        const { data: chapters } = await supabaseAdmin
          .from("chapters")
          .select("id,subject_id")
          .in("subject_id", subjectIds)
          .is("deleted_at", null);

        const chapterIds = (chapters || []).map((c) => c.id);

        if (chapterIds.length > 0) {
          const { data: lessons } = await supabaseAdmin
            .from("lessons")
            .select("id,chapter_id")
            .in("chapter_id", chapterIds)
            .is("deleted_at", null);

          // Build chapter→subject map
          const chapterSubjectMap: Record<string, string> = {};
          (chapters || []).forEach((c) => {
            chapterSubjectMap[c.id] = c.subject_id;
          });

          // Build lesson→subject map
          const lessonSubjectMap: Record<string, string> = {};
          (lessons || []).forEach((l) => {
            lessonSubjectMap[l.id] = chapterSubjectMap[l.chapter_id];
          });

          // Build completed lessons set
          const completedLessonIds = new Set(
            (lessonProgressRes.data || [])
              .filter((lp) => lp.status === "completed")
              .map((lp) => lp.lesson_id)
          );

          // Group by subject
          const subjectLessonMap: Record<string, { total: number; completed: number }> = {};
          subjects.forEach((s) => {
            subjectLessonMap[s.id] = { total: 0, completed: 0 };
          });

          (lessons || []).forEach((lesson) => {
            const sid = lessonSubjectMap[lesson.id];
            if (sid && subjectLessonMap[sid]) {
              subjectLessonMap[sid].total++;
              if (completedLessonIds.has(lesson.id)) {
                subjectLessonMap[sid].completed++;
              }
            }
          });

          subjectProgress = subjects.map((s) => {
            const counts = subjectLessonMap[s.id] || { total: 0, completed: 0 };
            return {
              subject_name: s.name,
              completed: counts.completed,
              total: counts.total,
              percentage: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
            };
          });
        }
      }
    }

    // Recent activity from lesson_progress
    const recentActivity: { type: "lesson" | "quiz" | "badge"; title: string; score?: number; earned_at: string }[] = [];
    const recentCompletedLessons = (lessonProgressRes.data || [])
      .filter((lp) => lp.status === "completed" && lp.completed_at)
      .sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)))
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

    // Badges
    const badges = (badgesRes.data || []).map((b: any) => ({
      name: b.badges?.name || "Unknown",
      image_url: b.badges?.image_url || null,
      earned_at: b.earned_at,
    }));

    // Avg score
    const avgScore =
      student.total_quizzes_attempted > 0
        ? Math.round((student.total_quizzes_passed / student.total_quizzes_attempted) * 100)
        : 0;

    const totalTimeMinutes = Math.round((student.total_time_spent_seconds || 0) / 60);

    // Total lessons in grade (for completion rate)
    const totalLessonsInGrade = subjectProgress.reduce((sum, sp) => sum + sp.total, 0);

    return json({
      data: {
        id: student.id,
        name: student.full_name,
        email: null, // email is in auth.users, not students table
        date_of_birth: student.date_of_birth,
        grade_name: gradeRes.data?.name || null,
        school_name: schoolName,
        parent_name: parentName,
        parent_id: parentId,
        photo_url: student.profile_photo_url,
        status_id: student.status_id,
        total_stars: student.total_stars_earned || 0,
        badges_count: student.total_badges_earned || 0,
        lessons_completed: student.total_lessons_completed || 0,
        total_lessons: totalLessonsInGrade,
        quizzes_taken: student.total_quizzes_attempted || 0,
        quizzes_passed: student.total_quizzes_passed || 0,
        avg_score: avgScore,
        total_time_spent_minutes: totalTimeMinutes,
        streak_days: student.current_streak_days || 0,
        last_active: student.last_activity_at,
        joined_at: student.created_at,
        subject_progress: subjectProgress,
        recent_activity: recentActivity,
        badges,
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load student" }, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const studentId = params.id;
  try {
    const body = await req.json().catch(() => ({}));
    const supabaseAdmin = getSupabaseAdmin();

    // Verify student exists
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("students")
      .select("id,grade_id")
      .eq("id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingError) return json({ error: existingError.message }, 500);
    if (!existing) return json({ error: "Student not found" }, 404);

    // Build update payload for students table
    const studentFields: Record<string, unknown> = {};
    if (body.name !== undefined) studentFields.full_name = body.name;
    if (body.full_name !== undefined) studentFields.full_name = body.full_name;
    if (body.date_of_birth !== undefined) studentFields.date_of_birth = body.date_of_birth;
    if (body.grade_id !== undefined) studentFields.grade_id = body.grade_id || null;
    if (body.status_id !== undefined) studentFields.status_id = body.status_id;
    if (body.photo_url !== undefined) studentFields.profile_photo_url = body.photo_url;

    if (Object.keys(studentFields).length > 0) {
      studentFields.updated_at = new Date().toISOString();
      const { error: updateError } = await supabaseAdmin
        .from("students")
        .update(studentFields)
        .eq("id", studentId)
        .is("deleted_at", null);
      if (updateError) return json({ error: updateError.message }, 400);
    }

    // Update school link if school_id provided
    if (body.school_id !== undefined) {
      if (body.school_id) {
        // Get active status
        const { data: activeStatus } = await supabaseAdmin
          .from("lookup_entity_status")
          .select("id")
          .eq("code", "active")
          .maybeSingle();

        // Upsert school link
        const { data: existingLink } = await supabaseAdmin
          .from("school_students")
          .select("id")
          .eq("student_id", studentId)
          .is("deleted_at", null)
          .maybeSingle();

        if (existingLink) {
          await supabaseAdmin
            .from("school_students")
            .update({ school_id: body.school_id, updated_at: new Date().toISOString() })
            .eq("id", existingLink.id);
        } else {
          await supabaseAdmin.from("school_students").insert({
            school_id: body.school_id,
            student_id: studentId,
            status_id: activeStatus?.id || null,
          });
        }
      }
    }

    // Update parent link if parent_id provided
    if (body.parent_id !== undefined) {
      // Remove old links
      await supabaseAdmin
        .from("parent_student_links")
        .update({ deleted_at: new Date().toISOString() })
        .eq("student_id", studentId);

      if (body.parent_id) {
        await supabaseAdmin.from("parent_student_links").insert({
          parent_id: body.parent_id,
          student_id: studentId,
          is_primary: true,
        });
      }
    }

    return json({ ok: true, message: "Student updated successfully" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to update student" }, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const studentId = params.id;
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("students")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", studentId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Student not found" }, 404);

    return json({ ok: true, message: "Student deleted" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to delete student" }, 500);
  }
}

import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { json } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const activeId = (await supabaseAdmin.from("lookup_entity_status").select("id").eq("code", "active").single()).data?.id;
    const freePlanId = (await supabaseAdmin.from("lookup_plan_types").select("id").eq("code", "free").single()).data?.id;
    const activePlanId = (await supabaseAdmin.from("lookup_plan_status").select("id").eq("code", "active").single()).data?.id;
    const pendingApprovalId = (await supabaseAdmin.from("lookup_approval_status").select("id").eq("code", "pending").single()).data?.id;

    if (!activeId) return json({ error: "lookup_entity_status.active not found" }, 400);

    const lkgGrade = (await supabaseAdmin.from("grades").select("id").eq("code", "lkg").is("deleted_at", null).single()).data;
    if (!lkgGrade) return json({ error: "LKG grade not found" }, 400);

    const engSubject = (await supabaseAdmin.from("subjects").select("id").eq("grade_id", lkgGrade.id).eq("code", "english").is("deleted_at", null).single()).data;
    if (!engSubject) return json({ error: "LKG English not found — run lkg_english_seed.sql" }, 400);

    const { data: chapters } = await supabaseAdmin
      .from("chapters").select("id,sort_order")
      .eq("subject_id", engSubject.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    // Get chapter 1 lesson count for progress calculation
    let ch1TotalLessons = 0;
    if (chapters && chapters.length > 0) {
      const { data: ch1L } = await supabaseAdmin.from("lessons").select("id").eq("chapter_id", chapters[0].id).is("deleted_at", null);
      ch1TotalLessons = (ch1L || []).length;
    }

    const families = [
      { parent: { email: "parent1@test.com", password: "Parent123", name: "Suresh Kumar" }, child: { name: "Arun Kumar", streak: 5, stars: 42, completed: 3 } },
      { parent: { email: "parent2@test.com", password: "Parent123", name: "Priya Devi" }, child: { name: "Kavya Devi", streak: 12, stars: 98, completed: 5 } },
      { parent: { email: "parent3@test.com", password: "Parent123", name: "Rajesh Menon" }, child: { name: "Aadhya Menon", streak: 2, stars: 18, completed: 1 } },
    ];

    const results: Array<{ parent: { email: string; password: string; name: string }; child: { name: string; email: string; password: string } }> = [];

    for (const fam of families) {
      const pa = await supabaseAdmin.auth.admin.createUser({
        email: fam.parent.email, password: fam.parent.password, email_confirm: true,
        user_metadata: { role: "parent", name: fam.parent.name }
      });
      if (pa.error || !pa.data?.user) throw new Error("Parent auth failed: " + fam.parent.email);

      const childEmail = `child${families.indexOf(fam)}@test.com`;
      const sa = await supabaseAdmin.auth.admin.createUser({
        email: childEmail, password: "Student123", email_confirm: true,
        user_metadata: { role: "student", name: fam.child.name }
      });
      if (sa.error || !sa.data?.user) {
        await supabaseAdmin.auth.admin.deleteUser(pa.data.user.id);
        throw new Error("Student auth failed: " + fam.child.name);
      }

      const { data: pr } = await supabaseAdmin.from("parents").insert({
        auth_user_id: pa.data.user.id, email: fam.parent.email, name: fam.parent.name,
        registration_type: "individual", plan_type_id: freePlanId,
        plan_status_id: activePlanId, approval_status_id: pendingApprovalId, status_id: activeId,
      }).select("id").single();

      const { data: sr } = await supabaseAdmin.from("students").insert({
        auth_user_id: sa.data.user.id, full_name: fam.child.name, grade_id: lkgGrade.id, status_id: activeId,
      }).select("id").single();

      if (!pr || !sr) {
        await supabaseAdmin.auth.admin.deleteUser(pa.data.user.id);
        await supabaseAdmin.auth.admin.deleteUser(sa.data.user.id);
        throw new Error("Profile insert failed for " + fam.parent.name);
      }

      await supabaseAdmin.from("parent_student_links").insert({
        parent_id: pr.id, student_id: sr.id, is_primary: true
      });

      // Create lesson progress
      if (chapters && chapters.length > 0) {
        const { data: ch1Lessons } = await supabaseAdmin.from("lessons").select("id").eq("chapter_id", chapters[0].id).is("deleted_at", null);
        if (ch1Lessons && ch1Lessons.length > 0) {
          const lessonsToComplete = Math.min(fam.child.completed, ch1Lessons.length);
          const batch: Array<Record<string, unknown>> = [];
          ch1Lessons.forEach((l: { id: string }, i: number) => {
            if (i < lessonsToComplete) {
              batch.push({ student_id: sr.id, lesson_id: l.id, status: "completed", completion_percentage: 100, time_spent_seconds: 300, completed_at: new Date().toISOString(), last_accessed_at: new Date().toISOString() });
            } else if (i === lessonsToComplete) {
              batch.push({ student_id: sr.id, lesson_id: l.id, status: "in_progress", completion_percentage: 60, time_spent_seconds: 120, last_accessed_at: new Date().toISOString() });
            } else {
              batch.push({ student_id: sr.id, lesson_id: l.id, status: "not_started", completion_percentage: 0, last_accessed_at: new Date().toISOString() });
            }
          });
          await supabaseAdmin.from("lesson_progress").insert(batch);
        }
      }

      const overallPct = ch1TotalLessons > 0 ? Math.round((fam.child.completed / ch1TotalLessons) * 100) : 0;
      await supabaseAdmin.from("students").update({
        total_lessons_completed: fam.child.completed,
        total_stars_earned: fam.child.stars,
        total_quizzes_passed: Math.min(fam.child.completed, 3),
        total_quizzes_attempted: Math.min(fam.child.completed + 2, 5),
        current_streak_days: fam.child.streak,
        overall_progress: overallPct,
        total_badges_earned: Math.min(fam.child.completed, 3),
      }).eq("id", sr.id);

      results.push({
        parent: { email: fam.parent.email, password: fam.parent.password, name: fam.parent.name },
        child: { name: fam.child.name, email: childEmail, password: "Student123" },
      });
    }

    return json({ ok: true, families: results }, 201);

  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Seed failed" }, 500);
  }
}

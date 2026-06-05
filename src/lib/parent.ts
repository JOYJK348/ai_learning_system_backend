import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "./auth-helpers";
import { getSupabaseAdmin } from "./supabase-server";

async function requireParent(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["parent"])) return null;
  return user;
}

async function getParentRecord(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, parentId: string) {
  const { data, error } = await supabaseAdmin
    .from("parents")
    .select(
      "id,email,name,phone,profile_photo_url,school_id,plan_type_id,plan_status_id,plan_started_at,plan_expires_at,status_id"
    )
    .eq("id", parentId)
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

export async function getParentMe(req: NextRequest) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const parent = await getParentRecord(supabaseAdmin, user.profileId);
    if (!parent) return json({ error: "Parent not found" }, 404);

    const [planTypeRes, planStatusRes, schoolRes] = await Promise.all([
      supabaseAdmin.from("lookup_plan_types").select("code,name").eq("id", parent.plan_type_id).maybeSingle(),
      supabaseAdmin.from("lookup_plan_status").select("code,name").eq("id", parent.plan_status_id).maybeSingle(),
      parent.school_id
        ? supabaseAdmin.from("schools").select("id,name,code,city,state").eq("id", parent.school_id).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ]);

    return json({
      user,
      parent: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        phone: parent.phone,
        profile_photo_url: parent.profile_photo_url,
        school: schoolRes.data || null,
        plan_type: planTypeRes.data?.code || null,
        plan_status: planStatusRes.data?.code || null,
        plan_started_at: parent.plan_started_at,
        plan_expires_at: parent.plan_expires_at
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load parent profile" }, 500);
  }
}

export async function listParentChildren(req: NextRequest) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: links, error: linksError } = await supabaseAdmin
      .from("parent_student_links")
      .select("student_id,is_primary")
      .eq("parent_id", user.profileId)
      .is("deleted_at", null);

    if (linksError) return json({ error: linksError.message }, 500);
    const studentIds = (links || []).map((link) => link.student_id).filter(Boolean) as string[];
    if (studentIds.length === 0) return json({ children: [] });

    const [{ data: students, error: studentsError }, { data: schoolStudents, error: schoolStudentsError }] =
      await Promise.all([
        supabaseAdmin
          .from("students")
          .select(
            "id,full_name,grade_id,overall_progress,total_lessons_completed,total_quizzes_passed,total_badges_earned,total_stars_earned,current_streak_days"
          )
          .in("id", studentIds)
          .is("deleted_at", null),
        supabaseAdmin
          .from("school_students")
          .select("student_id,school_id,roll_number,section")
          .in("student_id", studentIds)
          .is("deleted_at", null)
      ]);

    if (studentsError) return json({ error: studentsError.message }, 500);
    if (schoolStudentsError) return json({ error: schoolStudentsError.message }, 500);

    const gradeIds = Array.from(new Set((students || []).map((student) => student.grade_id).filter(Boolean) as string[]));
    const schoolIds = Array.from(new Set((schoolStudents || []).map((row) => row.school_id).filter(Boolean) as string[]));

    const [{ data: grades }, { data: schools }] = await Promise.all([
      gradeIds.length > 0
        ? supabaseAdmin.from("grades").select("id,name").in("id", gradeIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null }),
      schoolIds.length > 0
        ? supabaseAdmin.from("schools").select("id,name").in("id", schoolIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null })
    ]);

    const gradeMap = mapById(grades as Array<{ id: string; name: string }>);
    const schoolMap = mapById(schools as Array<{ id: string; name: string }>);
    const schoolStudentMap = (schoolStudents || []).reduce<Record<string, { school_id: string; roll_number: string | null; section: string | null }>>((acc, row) => {
      if (row?.student_id) acc[row.student_id] = row;
      return acc;
    }, {});

    const children = (links || []).map((link) => {
      const student = (students || []).find((s) => s.id === link.student_id);
      const schoolInfo = student ? schoolStudentMap[student.id] : undefined;
      return {
        id: student?.id,
        name: student?.full_name,
        grade: student?.grade_id ? gradeMap[student.grade_id]?.name || null : null,
        school: schoolInfo?.school_id ? schoolMap[schoolInfo.school_id]?.name || null : null,
        overall_progress: student?.overall_progress ?? 0,
        lessons_completed: student?.total_lessons_completed ?? 0,
        quizzes_passed: student?.total_quizzes_passed ?? 0,
        total_stars: student?.total_stars_earned ?? 0,
        badges_earned: student?.total_badges_earned ?? 0,
        current_streak: student?.current_streak_days ?? 0,
        roll_number: schoolInfo?.roll_number || null,
        section: schoolInfo?.section || null,
        is_primary: link.is_primary
      };
    });

    return json({ children });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load children" }, 500);
  }
}

async function loadStudentForParent(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, parentId: string, studentId: string) {
  const { data: link, error: linkError } = await supabaseAdmin
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", parentId)
    .eq("student_id", studentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (linkError) throw linkError;
  if (!link) return null;

  const { data: student, error: studentError } = await supabaseAdmin
    .from("students")
    .select(
      "id,full_name,grade_id,overall_progress,total_time_spent_seconds,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_badges_earned,total_stars_earned,current_streak_days,last_activity_at"
    )
    .eq("id", studentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (studentError) throw studentError;
  return student;
}

async function loadStudentSchool(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("school_students")
    .select("school_id,roll_number,section")
    .eq("student_id", studentId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getParentChildProgress(req: NextRequest, studentId: string) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await loadStudentForParent(supabaseAdmin, user.profileId, studentId);
    if (!student) return json({ error: "Child not found" }, 404);

    const [gradeRes, schoolLink, progressRes] = await Promise.all([
      student.grade_id
        ? supabaseAdmin.from("grades").select("id,name").eq("id", student.grade_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      loadStudentSchool(supabaseAdmin, studentId),
      supabaseAdmin
        .from("lesson_progress")
        .select("status,completion_percentage,completed_at")
        .eq("student_id", studentId)
        .is("deleted_at", null)
    ]);

    if (gradeRes.error) return json({ error: gradeRes.error.message }, 500);
    if (progressRes.error) return json({ error: progressRes.error.message }, 500);

    const progressRows = progressRes.data || [];
    const totalLessons = progressRows.length;
    const completedLessons = progressRows.filter((row) => row.status === "completed").length;
    const inProgressLessons = progressRows.filter((row) => row.status === "in_progress").length;
    const notStartedLessons = progressRows.filter((row) => row.status === "not_started").length;
    const averageCompletion = totalLessons > 0 ? Math.round(progressRows.reduce((sum, row) => sum + (row.completion_percentage || 0), 0) / totalLessons) : 0;
    const lastCompletedAt = progressRows
      .filter((row) => row.completed_at)
      .sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)))[0]?.completed_at || null;

    const school = schoolLink?.school_id
      ? await supabaseAdmin.from("schools").select("id,name").eq("id", schoolLink.school_id).maybeSingle()
      : { data: null, error: null };

    if (school?.error) return json({ error: school.error.message }, 500);

    return json({
      student: {
        id: student.id,
        name: student.full_name,
        grade: gradeRes.data?.name || null,
        school: school?.data?.name || null,
        overall_progress: student.overall_progress,
        total_time_spent_seconds: student.total_time_spent_seconds,
        lessons_completed: student.total_lessons_completed,
        quizzes_attempted: student.total_quizzes_attempted,
        quizzes_passed: student.total_quizzes_passed,
        badges_earned: student.total_badges_earned,
        total_stars: student.total_stars_earned,
        current_streak_days: student.current_streak_days,
        last_activity_at: student.last_activity_at
      },
      lesson_progress: {
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        in_progress_lessons: inProgressLessons,
        not_started_lessons: notStartedLessons,
        average_completion: averageCompletion,
        last_completed_at: lastCompletedAt
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load child progress" }, 500);
  }
}

export async function getParentChildQuizzes(req: NextRequest, studentId: string) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await loadStudentForParent(supabaseAdmin, user.profileId, studentId);
    if (!student) return json({ error: "Child not found" }, 404);

    const { data, error } = await supabaseAdmin
      .from("quiz_attempts")
      .select(
        "id,quiz_id,lesson_id,attempt_number,score,max_score,percentage,passed,time_taken_seconds,completed_at,created_at"
      )
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return json({ error: error.message }, 500);

    return json({ quizzes: data || [] });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load quiz attempts" }, 500);
  }
}

export async function getParentChildBadges(req: NextRequest, studentId: string) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await loadStudentForParent(supabaseAdmin, user.profileId, studentId);
    if (!student) return json({ error: "Child not found" }, 404);

    const { data: badgeLinks, error: badgeLinksError } = await supabaseAdmin
      .from("student_badges")
      .select("badge_id,earned_at")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("earned_at", { ascending: false });

    if (badgeLinksError) return json({ error: badgeLinksError.message }, 500);
    const badgeIds = (badgeLinks || []).map((row) => row.badge_id).filter(Boolean) as string[];
    if (badgeIds.length === 0) return json({ badges: [] });

    const { data: badgeData, error: badgeDataError } = await supabaseAdmin
      .from("badges")
      .select("id,name,description,image_url")
      .in("id", badgeIds)
      .is("deleted_at", null);

    if (badgeDataError) return json({ error: badgeDataError.message }, 500);

    const badgeMap = mapById(badgeData as Array<{ id: string; name: string; description: string; image_url: string }>);
    const badges = (badgeLinks || []).map((link) => ({
      badge_id: link.badge_id,
      earned_at: link.earned_at,
      name: badgeMap[link.badge_id]?.name || null,
      description: badgeMap[link.badge_id]?.description || null,
      image_url: badgeMap[link.badge_id]?.image_url || null
    }));

    return json({ badges });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load badges" }, 500);
  }
}

export async function getParentChildTerms(req: NextRequest, studentId: string) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const student = await loadStudentForParent(supabaseAdmin, user.profileId, studentId);
    if (!student) return json({ error: "Child not found" }, 404);

    const { data: terms, error: termsError } = await supabaseAdmin
      .from("term_unlocks")
      .select("id,term_type_id,grade_id,board_id,unlocked_at,completed_at,completion_percentage,status_id")
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (termsError) return json({ error: termsError.message }, 500);

    const termTypeIds = Array.from(new Set((terms || []).map((row) => row.term_type_id).filter(Boolean) as number[]));
    const gradeIds = Array.from(new Set((terms || []).map((row) => row.grade_id).filter(Boolean) as string[]));
    const boardIds = Array.from(new Set((terms || []).map((row) => row.board_id).filter(Boolean) as string[]));

    const [{ data: termTypes }, { data: grades }, { data: boards }] = await Promise.all([
      termTypeIds.length > 0
        ? supabaseAdmin.from("lookup_term_types").select("id,code,name").in("id", termTypeIds)
        : Promise.resolve({ data: [] as Array<{ id: number; code: string; name: string }>, error: null }),
      gradeIds.length > 0
        ? supabaseAdmin.from("grades").select("id,name").in("id", gradeIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null }),
      boardIds.length > 0
        ? supabaseAdmin.from("boards").select("id,name").in("id", boardIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null })
    ]);

    const termTypeMap = (termTypes || []).reduce<Record<number, { code: string; name: string }>>((acc, type) => {
      if (type?.id) acc[type.id] = { code: type.code, name: type.name };
      return acc;
    }, {});
    const gradeMap = mapById(grades as Array<{ id: string; name: string }>);
    const boardMap = mapById(boards as Array<{ id: string; name: string }>);

    const termRecords = (terms || []).map((term) => ({
      id: term.id,
      term_type: termTypeMap[term.term_type_id] || null,
      grade: term.grade_id ? gradeMap[term.grade_id]?.name || null : null,
      board: term.board_id ? boardMap[term.board_id]?.name || null : null,
      unlocked_at: term.unlocked_at,
      completed_at: term.completed_at,
      completion_percentage: term.completion_percentage,
      status_id: term.status_id
    }));

    return json({ terms: termRecords });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load term unlocks" }, 500);
  }
}

export async function listParentPayments(req: NextRequest) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select(
        "id,amount,currency,plan_name_snapshot,plan_price_snapshot,payment_method_id,payment_status_id,gateway_name,paid_at,created_at,notes"
      )
      .eq("parent_id", user.profileId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (paymentsError) return json({ error: paymentsError.message }, 500);

    const methodIds = Array.from(new Set((payments || []).map((payment) => payment.payment_method_id).filter(Boolean) as number[]));
    const statusIds = Array.from(new Set((payments || []).map((payment) => payment.payment_status_id).filter(Boolean) as number[]));

    const [{ data: methods }, { data: statuses }] = await Promise.all([
      methodIds.length > 0
        ? supabaseAdmin.from("lookup_payment_methods").select("id,code,name").in("id", methodIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as Array<{ id: number; code: string; name: string }>, error: null }),
      statusIds.length > 0
        ? supabaseAdmin.from("lookup_payment_status").select("id,code,name").in("id", statusIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as Array<{ id: number; code: string; name: string }>, error: null })
    ]);

    const methodMap = (methods || []).reduce<Record<number, { code: string; name: string }>>((acc, item) => {
      if (item?.id) acc[item.id] = { code: item.code, name: item.name };
      return acc;
    }, {});
    const statusMap = (statuses || []).reduce<Record<number, { code: string; name: string }>>((acc, item) => {
      if (item?.id) acc[item.id] = { code: item.code, name: item.name };
      return acc;
    }, {});

    return json({
      payments: (payments || []).map((payment) => ({
        ...payment,
        payment_method: payment.payment_method_id ? methodMap[payment.payment_method_id] || null : null,
        payment_status: payment.payment_status_id ? statusMap[payment.payment_status_id] || null : null
      }))
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load payments" }, 500);
  }
}

export async function createParentPayment(req: NextRequest) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (!amount || amount < 0) return json({ error: "Valid amount is required" }, 400);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const parent = await getParentRecord(supabaseAdmin, user.profileId);
    if (!parent) return json({ error: "Parent not found" }, 404);

    let paymentMethodId = body.payment_method_id;
    if (!paymentMethodId && body.payment_method_code) {
      const { data: method, error: methodError } = await supabaseAdmin
        .from("lookup_payment_methods")
        .select("id")
        .eq("code", body.payment_method_code)
        .maybeSingle();
      if (methodError) return json({ error: methodError.message }, 500);
      paymentMethodId = method?.id;
    }

    if (!paymentMethodId) return json({ error: "payment_method_id or payment_method_code is required" }, 400);

    const statusCode = String(body.payment_status_code || "pending");
    const { data: status, error: statusError } = await supabaseAdmin
      .from("lookup_payment_status")
      .select("id")
      .eq("code", statusCode)
      .maybeSingle();
    if (statusError) return json({ error: statusError.message }, 500);
    if (!status) return json({ error: "Invalid payment_status_code" }, 400);

    const planType = parent.plan_type_id
      ? await supabaseAdmin.from("lookup_plan_types").select("code").eq("id", parent.plan_type_id).maybeSingle()
      : { data: null };
    const planNameSnapshot = planType.data?.code || null;

    const { data, error } = await supabaseAdmin.from("payments").insert([
      {
        parent_id: parent.id,
        school_id: parent.school_id,
        plan_type_id: parent.plan_type_id,
        plan_name_snapshot: planNameSnapshot,
        plan_price_snapshot: body.plan_price_snapshot ?? null,
        amount,
        currency: String(body.currency || "INR"),
        payment_method_id: paymentMethodId,
        payment_status_id: status.id,
        gateway_name: String(body.gateway_name || "manual"),
        gateway_order_id: body.gateway_order_id || null,
        gateway_payment_id: body.gateway_payment_id || null,
        gateway_signature: body.gateway_signature || null,
        gateway_response: body.gateway_response ?? {},
        notes: body.notes || null,
        paid_at: body.paid_at || null
      }
    ]);

    if (error) return json({ error: error.message }, 400);
    return json({ data: data?.[0] || null }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to create payment" }, 500);
  }
}

export async function getParentDashboard(req: NextRequest) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const parent = await getParentRecord(supabaseAdmin, user.profileId);
    if (!parent) return json({ error: "Parent not found" }, 404);

    const [planTypeRes, planStatusRes, childrenRes, paymentsRes] = await Promise.all([
      supabaseAdmin.from("lookup_plan_types").select("code,name").eq("id", parent.plan_type_id).maybeSingle(),
      supabaseAdmin.from("lookup_plan_status").select("code,name").eq("id", parent.plan_status_id).maybeSingle(),
      supabaseAdmin
        .from("parent_student_links")
        .select("student_id,is_primary")
        .eq("parent_id", user.profileId)
        .is("deleted_at", null),
      supabaseAdmin
        .from("payments")
        .select("id,amount,paid_at,expires_at")
        .eq("parent_id", user.profileId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
    ]);

    const childrenLinks = childrenRes.data || [];
    const studentIds = childrenLinks.map((link) => link.student_id).filter(Boolean) as string[];

    let childrenData: Array<{
      id: string;
      full_name: string;
      grade_id: string;
      overall_progress: number;
      total_lessons_completed: number;
      total_quizzes_attempted: number;
      total_quizzes_passed: number;
      total_stars_earned: number;
      total_badges_earned: number;
      current_streak_days: number;
      last_activity_at: string;
    }> = [];
    let schoolStudentsMap: Record<string, { school_id: string; roll_number: string | null; section: string | null }> = {};
    let gradeMap: Record<string, { id: string; name: string }> = {};

    if (studentIds.length > 0) {
      const [{ data: students }, { data: schoolStudents }, { data: grades }] = await Promise.all([
        supabaseAdmin
          .from("students")
          .select(
            "id,full_name,grade_id,overall_progress,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,total_badges_earned,current_streak_days,last_activity_at"
          )
          .in("id", studentIds)
          .is("deleted_at", null),
        supabaseAdmin
          .from("school_students")
          .select("student_id,school_id,roll_number,section")
          .in("student_id", studentIds)
          .is("deleted_at", null),
        supabaseAdmin.from("grades").select("id,name").in("id", (studentIds.length > 0 ? ["a", "b"] : [])).is("deleted_at", null)
      ]);

      childrenData = students || [];
      schoolStudentsMap = (schoolStudents || []).reduce<Record<string, { school_id: string; roll_number: string | null; section: string | null }>>((acc, row) => {
        if (row?.student_id) acc[row.student_id] = row;
        return acc;
      }, {});

      if (childrenData.length > 0) {
        const gradeIds = Array.from(new Set(childrenData.map((s) => s.grade_id).filter(Boolean) as string[]));
        const { data: gradeRows } = await supabaseAdmin
          .from("grades")
          .select("id,name")
          .in("id", gradeIds)
          .is("deleted_at", null);

        gradeMap = (gradeRows || []).reduce<Record<string, { id: string; name: string }>>((acc, grade) => {
          if (grade?.id) acc[grade.id] = grade;
          return acc;
        }, {});
      }
    }

    const schoolIds = Array.from(new Set(Object.values(schoolStudentsMap).map((ss) => ss.school_id).filter(Boolean) as string[]));
    const { data: schoolData } = await supabaseAdmin
      .from("schools")
      .select("id,name")
      .in("id", schoolIds)
      .is("deleted_at", null);

    const schoolMap = (schoolData || []).reduce<Record<string, { id: string; name: string }>>((acc, school) => {
      if (school?.id) acc[school.id] = school;
      return acc;
    }, {});

    const children = childrenLinks.map((link) => {
      const student = childrenData.find((s) => s.id === link.student_id);
      const schoolInfo = student ? schoolStudentsMap[student.id] : undefined;
      return {
        id: student?.id,
        name: student?.full_name,
        grade: student?.grade_id ? gradeMap[student.grade_id]?.name || null : null,
        school: schoolInfo?.school_id ? schoolMap[schoolInfo.school_id]?.name || null : null,
        overall_progress: student?.overall_progress ?? 0,
        lessons_completed: student?.total_lessons_completed ?? 0,
        quizzes_attempted: student?.total_quizzes_attempted ?? 0,
        quizzes_passed: student?.total_quizzes_passed ?? 0,
        total_stars: student?.total_stars_earned ?? 0,
        total_badges: student?.total_badges_earned ?? 0,
        current_streak: student?.current_streak_days ?? 0,
        last_activity: student?.last_activity_at || null
      };
    });

    const payments = paymentsRes.data || [];
    const totalPayments = payments.length;
    const paidPayments = payments.filter((p) => p.paid_at).length;
    const nextPaymentDue = payments.find((p) => p.expires_at && new Date(p.expires_at) > new Date())?.expires_at || null;

    return json({
      parent: {
        name: parent.name,
        email: parent.email,
        plan_type: planTypeRes.data?.code || null,
        plan_status: planStatusRes.data?.code || null,
        plan_expires_at: parent.plan_expires_at
      },
      children,
      quick_stats: {
        total_children: children.length,
        active_plans: paidPayments,
        total_payments: totalPayments,
        next_payment_due: nextPaymentDue
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load dashboard" }, 500);
  }
}


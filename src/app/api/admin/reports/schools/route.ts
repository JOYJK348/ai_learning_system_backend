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

    // Revenue per school from payments table (school_id exists on payments in final.sql)
    const { data: schoolRevenue, error: revenueError } = await supabase
      .from("payments")
      .select("school_id, amount")
      .eq("payment_status_id", 2) // success
      .not("school_id", "is", null)
      .is("deleted_at", null);

    if (revenueError) return json({ error: revenueError.message }, 500);

    // Get all schools
    const { data: schoolsData, error: schoolsError } = await supabase
      .from("schools")
      .select("id, name")
      .is("deleted_at", null);

    if (schoolsError) return json({ error: schoolsError.message }, 500);

    const schoolNameMap: Record<string, string> = {};
    (schoolsData || []).forEach((s: any) => {
      schoolNameMap[s.id] = s.name;
    });

    // Build revenue map
    const schoolMap: Record<
      string,
      { name: string; revenue: number; students: number }
    > = {};

    (schoolRevenue || []).forEach((p: any) => {
      const id = p.school_id;
      if (!schoolMap[id]) {
        schoolMap[id] = { name: schoolNameMap[id] || "Unknown", revenue: 0, students: 0 };
      }
      schoolMap[id].revenue += Number(p.amount || 0);
    });

    // Also include schools with no payments
    (schoolsData || []).forEach((s: any) => {
      if (!schoolMap[s.id]) {
        schoolMap[s.id] = { name: s.name, revenue: 0, students: 0 };
      }
    });

    // Student counts via school_students join table (students don't have school_id directly)
    const { data: allSchoolStudents, error: studentError } = await supabase
      .from("school_students")
      .select("school_id")
      .is("deleted_at", null);

    if (studentError) return json({ error: studentError.message }, 500);

    const studentCountMap: Record<string, number> = {};
    (allSchoolStudents || []).forEach((s: any) => {
      if (s.school_id) {
        studentCountMap[s.school_id] = (studentCountMap[s.school_id] || 0) + 1;
      }
    });

    Object.entries(studentCountMap).forEach(([schoolId, count]) => {
      if (schoolMap[schoolId]) schoolMap[schoolId].students = count;
    });

    // Completion rates: lesson_progress joined through student → school_students
    const { data: progressData } = await supabase
      .from("lesson_progress")
      .select("student_id, status")
      .not("status", "is", null)
      .is("deleted_at", null);

    // Map student → school
    const studentToSchool: Record<string, string> = {};
    (allSchoolStudents || []).forEach((ss: any) => {
      // We need student_id from school_students
    });

    const { data: schoolStudentFull } = await supabase
      .from("school_students")
      .select("school_id, student_id")
      .is("deleted_at", null);

    (schoolStudentFull || []).forEach((ss: any) => {
      studentToSchool[ss.student_id] = ss.school_id;
    });

    const completionMap: Record<
      string,
      { completed: number; total: number }
    > = {};
    (progressData || []).forEach((p: any) => {
      const schoolId = studentToSchool[p.student_id];
      if (schoolId && schoolMap[schoolId]) {
        if (!completionMap[schoolId])
          completionMap[schoolId] = { completed: 0, total: 0 };
        completionMap[schoolId].total += 1;
        if (p.status === "completed") completionMap[schoolId].completed += 1;
      }
    });

    const schools = Object.entries(schoolMap).map(([id, data]) => {
      const completion = completionMap[id];
      const completionRate =
        completion && completion.total > 0
          ? Math.round((completion.completed / completion.total) * 100)
          : 0;

      return {
        id,
        name: data.name,
        revenue: data.revenue,
        students: data.students,
        revenue_per_student:
          data.students > 0 ? Math.round(data.revenue / data.students) : 0,
        completion_rate: completionRate,
        score: Math.round(
          data.revenue / 1000 + data.students * 2 + completionRate
        ),
      };
    });

    schools.sort((a, b) => b.score - a.score);

    return json({
      data: {
        total_schools: schools.length,
        total_revenue: schools.reduce((sum, s) => sum + s.revenue, 0),
        total_students: schools.reduce((sum, s) => sum + s.students, 0),
        top_schools: schools.slice(0, 10),
        all_schools: schools,
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
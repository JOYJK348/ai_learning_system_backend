import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

interface BulkStudentRow {
  full_name: string;
  date_of_birth?: string;
  grade_name: string;
  section?: string;
  roll_number?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const schoolId = params.id;
    const body = await req.json();
    const rows: BulkStudentRow[] = body.students;

    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ error: "No student data provided" }, 400);
    }
    if (rows.length > 500) {
      return json({ error: "Maximum 500 students per bulk upload" }, 400);
    }

    // Validate school exists and get limits
    const { data: school, error: schoolErr } = await supabase
      .from("schools")
      .select("max_students")
      .eq("id", schoolId)
      .single();

    if (schoolErr || !school) return json({ error: "School not found" }, 404);

    const { count: currentCount } = await supabase
      .from("school_students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null);

    const available = (school.max_students || 100) - (currentCount || 0);
    if (rows.length > available) {
      return json({ error: `Only ${available} student slots remaining. You are trying to add ${rows.length}.` }, 400);
    }

    // Fetch all grades for this school to map grade_name → grade_id
    const { data: grades } = await supabase
      .from("grades")
      .select("id, name")
      .is("deleted_at", null);

    const gradeMap = new Map<string, string>();
    (grades || []).forEach((g: { id: string; name: string }) => {
      gradeMap.set(g.name.trim().toLowerCase(), g.id);
    });

    // Fetch existing roll numbers for uniqueness check
    const { data: existingRolls } = await supabase
      .from("school_students")
      .select("roll_number")
      .eq("school_id", schoolId)
      .is("deleted_at", null);

    const usedRolls = new Set((existingRolls || []).map((r: any) => r.roll_number).filter(Boolean));

    // Get active status
    const { data: activeStatus } = await supabase
      .from("lookup_entity_status")
      .select("id")
      .eq("code", "active")
      .maybeSingle();

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed with header

      if (!row.full_name?.trim()) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: full_name is required`);
        continue;
      }

      const gradeName = row.grade_name?.trim().toLowerCase();
      const gradeId = gradeMap.get(gradeName);
      if (!gradeId) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Grade "${row.grade_name}" not found`);
        continue;
      }

      // Determine roll number
      let finalRoll = row.roll_number?.trim();
      if (finalRoll) {
        if (usedRolls.has(finalRoll)) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: Roll number "${finalRoll}" already exists`);
          continue;
        }
      } else {
        finalRoll = `R${(currentCount || 0) + results.success + 1}`;
        // Make sure auto-generated is unique
        while (usedRolls.has(finalRoll)) {
          finalRoll = `R${parseInt(finalRoll.slice(1)) + 1}`;
        }
      }
      usedRolls.add(finalRoll);

      // Insert student
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          full_name: row.full_name.trim(),
          grade_id: gradeId,
          date_of_birth: row.date_of_birth?.trim() || null,
          status_id: activeStatus?.id,
        })
        .select("id")
        .single();

      if (studentError || !student) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Failed to create student — ${studentError?.message}`);
        continue;
      }

      // Link to school
      const { error: linkError } = await supabase.from("school_students").insert({
        school_id: schoolId,
        student_id: student.id,
        roll_number: finalRoll,
        section: row.section?.trim() || null,
        status_id: activeStatus?.id,
      });

      if (linkError) {
        await supabase.from("students").delete().eq("id", student.id);
        results.failed++;
        results.errors.push(`Row ${rowNum}: Failed to link student — ${linkError.message}`);
        continue;
      }

      results.success++;
    }

    return json({
      message: `Bulk upload complete: ${results.success} added, ${results.failed} failed`,
      data: results,
    }, results.success > 0 ? 201 : 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Bulk upload failed" }, 500);
  }
}

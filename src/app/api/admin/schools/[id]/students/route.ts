import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    
    // Fetch school students and join with the students table for name/email
    const { data, error } = await supabase
      .from('school_students')
      .select(`
        id, 
        roll_number, 
        section, 
        admission_date, 
        status:lookup_entity_status(code, name),
        student:students(
          id, 
          full_name, 
          grade_id,
          auth_user_id,
          grade:grades(id, name)
        )
      `)
      .eq('school_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return json({ error: error.message }, 500);

    const mappedData = (data || []).map((item: any) => ({
      id: item.id,
      student_id: item.student?.id,
      full_name: item.student?.full_name || 'Unknown',
      email: 'N/A', // Cross-schema auth join is restricted via PostgREST
      roll_number: item.roll_number || 'N/A',
      section: item.section || 'N/A',
      grade: item.student?.grade?.name || 'N/A',
      admission_date: item.admission_date ? new Date(item.admission_date).toISOString().split('T')[0] : 'N/A',
      status: item.status?.name || 'Active'
    }));

    return json({ data: mappedData });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error fetching students' }, 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    
    const { full_name, date_of_birth, grade_id, section, roll_number, parent_id } = body;
    const schoolId = params.id;

    if (!full_name || !grade_id) {
      return json({ error: "Full name and grade are required" }, 400);
    }

    // Validation 1: Check student limit
    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .select('max_students')
      .eq('id', schoolId)
      .single();
      
    if (schoolErr || !school) return json({ error: "School not found" }, 404);

    const { count: currentStudents } = await supabase
      .from('school_students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .is('deleted_at', null);

    if (currentStudents !== null && currentStudents >= (school.max_students || 100)) {
      return json({ error: `Student limit reached for this school (Max: ${school.max_students})` }, 400);
    }

    // Validation 2: Check grade validity
    const { data: grade, error: gradeErr } = await supabase
      .from('grades')
      .select('id')
      .eq('id', grade_id)
      .is('deleted_at', null)
      .single();
      
    if (gradeErr || !grade) return json({ error: "Invalid grade selected" }, 400);

    // Validation 3: Check roll number uniqueness within school
    let finalRollNumber = roll_number;
    if (roll_number) {
      const { data: existingRoll } = await supabase
        .from('school_students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('roll_number', roll_number)
        .is('deleted_at', null)
        .maybeSingle();
        
      if (existingRoll) return json({ error: "Roll number already exists in this school" }, 400);
    } else {
      // Auto-generate if not provided
      finalRollNumber = `R${(currentStudents || 0) + 1}`;
    }

    // Validation 4: Check parent exists if provided
    if (parent_id) {
      const { data: parentCheck, error: parentErr } = await supabase
        .from('parents')
        .select('id')
        .eq('id', parent_id)
        .is('deleted_at', null)
        .single();
        
      if (parentErr || !parentCheck) return json({ error: "Invalid parent selected" }, 400);
    }

    // Get active status id
    const { data: activeStatus } = await supabase
      .from("lookup_entity_status")
      .select("id")
      .eq("code", "active")
      .maybeSingle();

    // 1. Create student record
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        full_name,
        grade_id,
        date_of_birth: date_of_birth || null,
        status_id: activeStatus?.id
      })
      .select("id")
      .single();

    if (studentError || !student) {
      return json({ error: studentError?.message || "Failed to create student" }, 400);
    }

    // 2. Link to school
    const { error: linkError } = await supabase.from("school_students").insert({
      school_id: schoolId,
      student_id: student.id,
      roll_number: finalRollNumber,
      section: section || null,
      status_id: activeStatus?.id,
      created_by: user!.role === "school_admin" ? user!.profileId : null,
    });
    
    if (linkError) {
      // rollback student
      await supabase.from("students").delete().eq("id", student.id);
      return json({ error: "Failed to link student to school" }, 400);
    }

    // 3. Link to parent if provided
    if (parent_id) {
      await supabase.from("parent_student_links").insert({
        parent_id,
        student_id: student.id,
        is_primary: true,
      });
    }

    return json({ message: "Student added successfully", data: { id: student.id } }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to add student" }, 500);
  }
}

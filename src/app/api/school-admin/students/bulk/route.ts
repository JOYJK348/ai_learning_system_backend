import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { sendWelcomeEmail, sendChildLinkedEmail } from "@/lib/email";

interface BulkStudentRow {
  full_name: string;
  date_of_birth?: string;
  grade_name: string;
  section?: string;
  roll_number?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
}

// Utility delay function for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getParentPassword(phone: string | null): string {
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.length >= 6) {
    return cleanPhone.slice(-6);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getStudentPassword(phone: string | null): string {
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.length >= 6) {
    return cleanPhone.slice(0, 6);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const schoolId = user.schoolId;
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

    // Get active status and plan status IDs
    const { data: activeStatus } = await supabase.from("lookup_entity_status").select("id").eq("code", "active").maybeSingle();
    const { data: approvedApproval } = await supabase.from("lookup_approval_status").select("id").eq("code", "approved").maybeSingle();
    const { data: freePlan } = await supabase.from("lookup_plan_types").select("id").eq("code", "free").maybeSingle();
    const { data: activePlan } = await supabase.from("lookup_plan_status").select("id").eq("code", "active").maybeSingle();

    const results = {
      success: 0,
      linked_to_existing: 0,
      failed: 0,
      errors: [] as string[],
      credentials: [] as Array<{
        student_name: string;
        student_email: string;
        student_password: string;
        parent_email?: string;
        parent_status: 'created' | 'linked' | 'none';
      }>
    };

    // Tracking unique parents processed in this batch to avoid sending duplicate registration mails
    const processedParents = new Set<string>();

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
        while (usedRolls.has(finalRoll)) {
          finalRoll = `R${parseInt(finalRoll.slice(1)) + 1}`;
        }
      }
      usedRolls.add(finalRoll);

      // Generate student auth details
      const cleanChildFirstName = row.full_name.trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const childPass = getStudentPassword(row.parent_phone || null);
      const randSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const childEmail = `${cleanChildFirstName}.${randSuffix}@zhi.app`;

      // 1. Create child auth
      const { data: childAuth, error: caErr } = await supabase.auth.admin.createUser({
        email: childEmail,
        password: childPass,
        email_confirm: true,
        user_metadata: { role: "student", name: row.full_name },
      });

      if (caErr || !childAuth?.user) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Failed to create student auth — ${caErr?.message}`);
        continue;
      }

      // 2. Insert student profile
      const { data: studentRec, error: spErr } = await supabase.from("students").insert({
        auth_user_id: childAuth.user.id,
        full_name: row.full_name.trim(),
        grade_id: gradeId,
        date_of_birth: row.date_of_birth?.trim() || null,
        status_id: activeStatus?.id,
      }).select("id").single();

      if (spErr || !studentRec) {
        await supabase.auth.admin.deleteUser(childAuth.user.id);
        results.failed++;
        results.errors.push(`Row ${rowNum}: Failed to create student profile — ${spErr?.message}`);
        continue;
      }

      // 3. Link student to school
      const { error: linkError } = await supabase.from("school_students").insert({
        school_id: schoolId,
        student_id: studentRec.id,
        roll_number: finalRoll,
        section: row.section?.trim() || null,
        status_id: activeStatus?.id,
      });

      if (linkError) {
        await supabase.from("students").delete().eq("id", studentRec.id);
        await supabase.auth.admin.deleteUser(childAuth.user.id);
        results.failed++;
        results.errors.push(`Row ${rowNum}: Failed to link student to school — ${linkError.message}`);
        continue;
      }

      // 4. Handle Parent Account Creation / Linking
      let parentStatus: 'created' | 'linked' | 'none' = 'none';
      const cleanParentEmail = row.parent_email?.trim().toLowerCase();

      if (cleanParentEmail) {
        // A. Check if parent profile exists
        const { data: existingParent } = await supabase
          .from("parents")
          .select("id, name, phone")
          .eq("email", cleanParentEmail)
          .maybeSingle();

        if (existingParent) {
          // B. Already exists — just link child to existing parent
          const { error: lnkParentErr } = await supabase.from("parent_student_links").insert({
            parent_id: existingParent.id,
            student_id: studentRec.id,
            is_primary: true,
          });

          if (!lnkParentErr) {
            parentStatus = 'linked';
            results.linked_to_existing++;

            // Dispatch welcome email sequentially (linked notification)
            if (!processedParents.has(cleanParentEmail)) {
              processedParents.add(cleanParentEmail);
              await delay(150); // rate limiting gap
              await sendChildLinkedEmail({
                parentEmail: cleanParentEmail,
                parentName: existingParent.name || row.parent_name || "Parent",
                childName: row.full_name,
                childEmail: childEmail,
                childPass: childPass
              });
            }
          } else {
            console.error("Failed linking to existing parent:", lnkParentErr.message);
          }
        } else {
          // C. Create new parent account
          const parentPass = getParentPassword(row.parent_phone || null);
          const sanitizedParentPhone = row.parent_phone ? String(row.parent_phone).replace(/[^0-9]/g, "") : null;

          let parentAuthId = "";
          const { data: parentAuth, error: paErr } = await supabase.auth.admin.createUser({
            email: cleanParentEmail,
            password: parentPass,
            email_confirm: true,
            user_metadata: { role: "parent", name: row.parent_name || "Parent" },
          });

          if (paErr) {
            // Find existing auth user in Supabase
            const { data: usersData } = await supabase.auth.admin.listUsers();
            const existingAuthUser = usersData?.users.find(u => u.email?.toLowerCase() === cleanParentEmail);
            if (existingAuthUser) {
              parentAuthId = existingAuthUser.id;
            } else {
              console.error("Parent Auth creation failed:", paErr.message);
            }
          } else if (parentAuth?.user) {
            parentAuthId = parentAuth.user.id;
          }

          if (parentAuthId) {
            const { data: parentRec, error: ppErr } = await supabase.from("parents").insert({
              auth_user_id: parentAuthId,
              email: cleanParentEmail,
              phone: sanitizedParentPhone,
              name: row.parent_name || "Parent",
              registration_type: "school",
              school_id: schoolId,
              plan_type_id: freePlan?.id || 1,
              plan_status_id: activePlan?.id || 1,
              approval_status_id: approvedApproval?.id || 2,
              status_id: activeStatus?.id || 1,
            }).select("id").single();

            if (!ppErr && parentRec) {
              await supabase.from("parent_student_links").insert({
                parent_id: parentRec.id,
                student_id: studentRec.id,
                is_primary: true,
              });

              parentStatus = 'created';
              results.success++;

              // Dispatch welcome email sequentially
              if (!processedParents.has(cleanParentEmail)) {
                processedParents.add(cleanParentEmail);
                await delay(150); // rate limiting gap
                await sendWelcomeEmail({
                  parentEmail: cleanParentEmail,
                  parentName: row.parent_name || "Parent",
                  parentPass: parentPass,
                  childName: row.full_name,
                  childEmail: childEmail,
                  childPass: childPass
                });
              }
            } else {
              console.error("Failed creating parent record:", ppErr?.message);
              // clean up parent auth on failure if created fresh
              if (!paErr && parentAuth?.user) {
                await supabase.auth.admin.deleteUser(parentAuth.user.id);
              }
            }
          }
        }
      }

      // If parent details weren't supplied or account creation failed, student is still active in system
      if (parentStatus === 'none') {
        results.success++;
      }

      results.credentials.push({
        student_name: row.full_name,
        student_email: childEmail,
        student_password: childPass,
        parent_email: cleanParentEmail || undefined,
        parent_status: parentStatus
      });
    }

    return json({
      message: `Bulk upload complete: ${results.success} added, ${results.linked_to_existing} linked, ${results.failed} failed`,
      data: {
        success: results.success,
        linked_to_existing: results.linked_to_existing,
        failed: results.failed,
        errors: results.errors,
        credentials: results.credentials
      },
    }, 201);

  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Bulk upload failed" }, 500);
  }
}

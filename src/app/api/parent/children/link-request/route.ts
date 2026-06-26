import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function requireParent(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["parent"])) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("child_link_requests")
      .select(`
        id, child_name, child_grade_id, child_gender, child_dob, status, rejection_reason, created_at,
        grades!child_grade_id(name)
      `)
      .eq("parent_id", user.profileId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return json({ error: error.message }, 500);

    const formatted = (data || []).map((r: any) => ({
      id: r.id,
      name: r.child_name,
      grade_id: r.child_grade_id,
      grade_name: r.grades?.name || null,
      gender: r.child_gender,
      dob: r.child_dob,
      status: r.status,
      rejection_reason: r.rejection_reason,
      created_at: r.created_at
    }));

    return json({ data: formatted });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to load link requests" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireParent(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const gradeId = String(body.grade_id || "").trim() || null;
    const gender = String(body.gender || "").trim() || null;
    const dob = body.dob || null;

    if (!name) {
      return json({ error: "Child name is required" }, 400);
    }
    if (!gender || !["boy", "girl"].includes(gender)) {
      return json({ error: "Gender must be 'boy' or 'girl'" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // ── Grade age_range validation ──────────────────────────
    if (gradeId && dob) {
      const { data: gradeData } = await supabase
        .from("grades")
        .select("name, age_range")
        .eq("id", gradeId)
        .maybeSingle();

      if (gradeData?.age_range) {
        const match = gradeData.age_range.match(/(\d+)-(\d+)/);
        if (match) {
          const minAge = parseInt(match[1]);
          const maxAge = parseInt(match[2]);
          const birth = new Date(dob);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

          if (age < minAge || age > maxAge) {
            return json({
              error: `${gradeData.name} requires age ${minAge}–${maxAge} years. Child is ${age} years old based on date of birth.`
            }, 400);
          }
        }
      }
    }
    // ────────────────────────────────────────────────────────

    const { data, error } = await supabase
      .from("child_link_requests")
      .insert({
        parent_id: user.profileId,
        child_name: name,
        child_grade_id: gradeId,
        child_gender: gender,
        child_dob: dob,
        status: "pending"
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    return json({ data, message: "Link request submitted successfully" }, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to submit link request" }, 500);
  }
}

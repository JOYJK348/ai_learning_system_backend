import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json();
    const { action, studentIds, data } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return json({ error: "No students selected" }, 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (action === "award_stars") {
      const starsToAdd = parseInt(data?.stars || "5", 10);
      
      // Update each student (RPC would be better, but doing it in loop for simplicity since it's admin)
      for (const id of studentIds) {
        // fetch current stars
        const { data: student } = await supabaseAdmin.from("students").select("total_stars_earned").eq("id", id).single();
        if (student) {
          await supabaseAdmin.from("students").update({ 
            total_stars_earned: (student.total_stars_earned || 0) + starsToAdd 
          }).eq("id", id);
        }
      }
      return json({ ok: true, message: `Awarded ${starsToAdd} stars to ${studentIds.length} students` });
    }

    if (action === "award_badge") {
      const badgeId = data?.badgeId;
      if (!badgeId) return json({ error: "Badge ID required" }, 400);
      
      const inserts = studentIds.map(id => ({
        student_id: id,
        badge_id: badgeId
      }));

      const { error } = await supabaseAdmin.from("student_badges").insert(inserts);
      if (error) throw error;
      
      // Increment total badges
      for (const id of studentIds) {
        const { data: student } = await supabaseAdmin.from("students").select("total_badges_earned").eq("id", id).single();
        if (student) {
          await supabaseAdmin.from("students").update({ 
            total_badges_earned: (student.total_badges_earned || 0) + 1 
          }).eq("id", id);
        }
      }

      return json({ ok: true, message: `Badge awarded to ${studentIds.length} students` });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Bulk action failed" }, 500);
  }
}

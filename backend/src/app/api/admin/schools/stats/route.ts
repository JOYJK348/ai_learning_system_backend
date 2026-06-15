import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    
    // Fetch schools
    const { data: schools } = await supabase
      .from('schools')
      .select('id, plan_expires_at, plan_type:lookup_plan_types(code), status:lookup_entity_status(code)')
      .is('deleted_at', null);

    const safeSchools: any[] = schools || [];
    
    // Fetch student count
    const { count: totalStudents } = await supabase
      .from('school_students')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
      
    // Fetch admins count
    const { count: totalAdmins } = await supabase
      .from('school_admins')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    const stats = {
      total_schools: safeSchools.length,
      active_schools: safeSchools.filter(s => s.status?.code === 'active').length,
      inactive_schools: safeSchools.filter(s => s.status?.code === 'inactive').length,
      trial_schools: safeSchools.filter(s => s.plan_type?.code === 'trial').length,
      paid_schools: safeSchools.filter(s => s.plan_type?.code === 'paid').length,
      total_revenue: 0,
      revenue_this_month: 0,
      total_students: totalStudents || 0,
      total_admins: totalAdmins || 0,
      expiring_soon: 0,
      trial_expiring: 0,
    };

    const now = new Date().getTime();
    
    safeSchools.forEach(s => {
      if (s.plan_expires_at) {
        const diffDays = Math.ceil((new Date(s.plan_expires_at).getTime() - now) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          stats.expiring_soon++;
          if (s.plan_type?.code === 'trial') {
            stats.trial_expiring++;
          }
        }
      }
    });

    return json({ data: stats });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error fetching stats' }, 500);
  }
}

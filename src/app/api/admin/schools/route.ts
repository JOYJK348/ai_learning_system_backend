import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();

    // Fetch schools — use only base columns so it works before & after patch
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select(`
        id, name, address, city, state, pincode, phone, email, logo_url,
        max_students, plan_started_at, plan_expires_at, created_at, updated_at,
        plan_type:lookup_plan_types(code, name),
        status:lookup_entity_status(code, name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (schoolError) return json({ error: schoolError.message }, 500);

    // Fetch school admins to attach to schools
    const { data: admins } = await supabase
      .from('school_admins')
      .select('school_id, name, email, phone')
      .is('deleted_at', null);

    // Fetch student counts
    const { data: students } = await supabase
      .from('school_students')
      .select('school_id')
      .is('deleted_at', null);

    const studentCounts = (students || []).reduce((acc: any, s: any) => {
      acc[s.school_id] = (acc[s.school_id] || 0) + 1;
      return acc;
    }, {});

    const mapped = (schools || []).map((s: any) => {
      const admin = admins?.find(a => a.school_id === s.id);
      
      let days_until_expiry = 0;
      if (s.plan_expires_at) {
        const diff = new Date(s.plan_expires_at).getTime() - new Date().getTime();
        days_until_expiry = Math.ceil(diff / (1000 * 3600 * 24));
      }

      let status = s.status?.code || 'inactive';
      if (days_until_expiry < 0 && s.plan_type?.code === 'trial') {
        status = 'trial_expired';
      }

      return {
        id: s.id,
        name: s.name,
        address: s.address || '',
        city: s.city || '',
        state: s.state || '',
        pincode: s.pincode || '',
        phone: s.phone || '',
        email: s.email || '',
        website: s.website || '',
        logo_url: s.logo_url || '',
        plan_type: s.plan_type?.code || 'free',
        plan_name: s.plan_type?.name || 'Free',
        plan_price: s.plan_price || 0,
        setup_fee: s.setup_fee || 0,
        discount_percent: s.discount_percent || 0,
        trial_days: s.trial_days || 14,
        status,
        admin_name: admin?.name || '',
        admin_email: admin?.email || '',
        admin_phone: admin?.phone || '',
        student_count: studentCounts[s.id] || 0,
        student_limit: s.max_students || 100,
        revenue_this_month: s.revenue_this_month || 0,
        revenue_total: s.revenue_total || 0,
        plan_start_date: s.plan_started_at ? new Date(s.plan_started_at).toISOString().split('T')[0] : null,
        plan_end_date: s.plan_expires_at ? new Date(s.plan_expires_at).toISOString().split('T')[0] : null,
        days_until_expiry,
        features: s.features || { videos: true, quizzes: true, activities: true, reports: true, ai_tutor: false, bulk_import: false },
        created_at: s.created_at,
        updated_at: s.updated_at
      };
    });

    return json({ data: mapped });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error fetching schools' }, 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();

    // Find lookup IDs
    const { data: planTypes } = await supabase.from('lookup_plan_types').select('id, code');
    const { data: statusTypes } = await supabase.from('lookup_entity_status').select('id, code');
    const { data: roleTypes } = await supabase.from('lookup_user_roles').select('id, code');

    const planTypeId = planTypes?.find(p => p.code === body.plan_type)?.id || planTypes?.[0]?.id;
    const activeStatusId = statusTypes?.find(s => s.code === 'active')?.id;
    const adminRoleId = roleTypes?.find(r => r.code === 'school_admin')?.id;

    // Calculate expiry date
    const startedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number(body.trial_days) || 30));

    // Generate unique school code
    const code = body.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase()
      + Math.random().toString(36).substring(2, 6).toUpperCase();

    // Core insert — only base schema columns guaranteed to exist
    const coreInsert: Record<string, unknown> = {
      name: body.name,
      code,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      pincode: body.pincode || null,
      phone: body.phone || null,
      email: body.email || null,
      plan_type_id: planTypeId,
      max_students: Number(body.student_limit) || 100,
      plan_started_at: startedAt.toISOString(),
      plan_expires_at: expiresAt.toISOString(),
      status_id: activeStatusId
    };

    const { data: school, error: insertError } = await supabase
      .from('schools')
      .insert(coreInsert)
      .select('id')
      .single();

    if (insertError) return json({ error: insertError.message }, 400);

    // Extended columns (from schools_patch.sql) — update separately so missing columns don't block creation
    const extendedUpdate: Record<string, unknown> = {};
    if (body.website) extendedUpdate.website = body.website;
    if (body.plan_price !== undefined) extendedUpdate.plan_price = Number(body.plan_price) || 0;
    if (body.setup_fee !== undefined) extendedUpdate.setup_fee = Number(body.setup_fee) || 0;
    if (body.discount_percent !== undefined) extendedUpdate.discount_percent = Number(body.discount_percent) || 0;
    if (body.trial_days !== undefined) extendedUpdate.trial_days = Number(body.trial_days) || 14;
    if (body.features) extendedUpdate.features = body.features;

    if (Object.keys(extendedUpdate).length > 0) {
      // Silently ignore errors — columns may not exist if patch not run yet
      await supabase.from('schools').update(extendedUpdate).eq('id', school.id);
    }

    // If admin details provided, create school admin auth user
    if (body.admin_name && body.admin_email) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: body.admin_email,
        password: crypto.randomBytes(8).toString('hex') + 'A1!',
        email_confirm: true,
        user_metadata: { role: 'school_admin', name: body.admin_name }
      });

      if (!authError && authUser?.user) {
        await supabase.from('school_admins').insert({
          school_id: school.id,
          auth_user_id: authUser.user.id,
          name: body.admin_name,
          email: body.admin_email,
          phone: body.admin_phone || null,
          role_id: adminRoleId,
          status_id: activeStatusId
        });
      }
    }

    return json({ data: school, message: 'School created successfully' }, 201);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error creating school' }, 500);
  }
}

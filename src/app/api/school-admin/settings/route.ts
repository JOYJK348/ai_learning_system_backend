import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function PUT(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.address !== undefined) updates.address = body.address;
    if (body.city !== undefined) updates.city = body.city;
    if (body.state !== undefined) updates.state = body.state;
    if (body.pincode !== undefined) updates.pincode = body.pincode;
    if (body.website !== undefined) updates.website = body.website;
    if (body.principal_name !== undefined) updates.principal_name = body.principal_name;
    if (body.principal_phone !== undefined) updates.principal_phone = body.principal_phone;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

    const { data, error } = await supabase
      .from("schools")
      .update(updates)
      .eq("id", user.schoolId)
      .is("deleted_at", null)
      .select("id,name,code,logo_url,city,state,email,phone,pincode,website,principal_name,principal_phone")
      .maybeSingle();

    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "School not found" }, 404);

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to update settings" }, 500);
  }
}

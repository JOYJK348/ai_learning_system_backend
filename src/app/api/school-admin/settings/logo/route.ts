import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    if (!file) return json({ error: "No file uploaded" }, 400);

    const ext = file.name.split(".").pop() || "png";
    const filename = `school-${user.schoolId}-logo.${ext}`;

    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from("school-logos")
      .upload(filename, file, { upsert: true });

    if (uploadError) return json({ error: uploadError.message }, 500);

    const { data: urlData } = supabase.storage.from("school-logos").getPublicUrl(filename);
    const logoUrl = urlData?.publicUrl || "";

    const { error: updateError } = await supabase
      .from("schools")
      .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
      .eq("id", user.schoolId);

    if (updateError) return json({ error: updateError.message }, 500);

    return json({ data: { logo_url: logoUrl } });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Upload failed" }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("schools")
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq("id", user.schoolId);

    if (error) return json({ error: error.message }, 500);
    return json({ data: { logo_url: null } });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to remove logo" }, 500);
  }
}

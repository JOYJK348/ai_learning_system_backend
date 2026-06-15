import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "./auth-helpers";
import { getSupabaseAdmin } from "./supabase-server";

const selectActivity = `
  id,lesson_id,name,activity_type_id,config,status_id,sort_order,created_at,updated_at,
  lesson:lessons(id,title,chapter_id),
  type:lookup_activity_types(id,code,name)
`;

async function activeStatusId() {
  const { data, error } = await getSupabaseAdmin().from("lookup_entity_status").select("id").eq("code", "active").maybeSingle();
  if (error || !data) throw new Error(error?.message || "Active status not found");
  return data.id as number;
}

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  return requireRole(user, ["super_admin"]);
}

export async function listActivityTypes() {
  const { data, error } = await getSupabaseAdmin()
    .from("lookup_activity_types")
    .select("id,code,name,description,config_schema")
    .eq("is_active", true)
    .order("id", { ascending: true });
  if (error) return json({ error: error.message }, 500);
  return json({ data });
}

export async function listAdminActivities(req: NextRequest) {
  if (!(await requireAdmin(req))) return json({ error: "Forbidden" }, 403);
  const url = new URL(req.url);
  let query = getSupabaseAdmin()
    .from("activities")
    .select(selectActivity)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const lessonId = url.searchParams.get("lesson_id");
  const typeId = url.searchParams.get("activity_type_id");
  if (lessonId) query = query.eq("lesson_id", lessonId);
  if (typeId) query = query.eq("activity_type_id", Number(typeId));

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ data });
}

export async function createAdminActivity(req: NextRequest) {
  if (!(await requireAdmin(req))) return json({ error: "Forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.lesson_id || !body.activity_type_id) return json({ error: "Missing required fields" }, 400);

  const { data, error } = await getSupabaseAdmin()
    .from("activities")
    .insert({
      lesson_id: body.lesson_id,
      name: body.name,
      activity_type_id: Number(body.activity_type_id),
      config: body.config ?? {},
      status_id: body.status_id ?? (await activeStatusId()),
      sort_order: Number(body.sort_order) || 0
    })
    .select(selectActivity)
    .single();

  if (error) return json({ error: error.message }, 400);
  return json({ data }, 201);
}

export async function updateAdminActivity(id: string, req: NextRequest) {
  if (!(await requireAdmin(req))) return json({ error: "Forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  ["lesson_id", "name", "activity_type_id", "config", "status_id", "sort_order"].forEach((key) => {
    if (body[key] !== undefined) payload[key] = key.endsWith("_id") || key === "sort_order" ? Number(body[key]) || body[key] : body[key];
  });

  const { data, error } = await getSupabaseAdmin()
    .from("activities")
    .update(payload)
    .eq("id", id)
    .is("deleted_at", null)
    .select(selectActivity)
    .maybeSingle();
  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ data });
}

export async function deleteAdminActivity(id: string, req: NextRequest) {
  if (!(await requireAdmin(req))) return json({ error: "Forbidden" }, 403);
  const { data, error } = await getSupabaseAdmin()
    .from("activities")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ ok: true });
}

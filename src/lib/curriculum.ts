import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "./auth-helpers";
import { getSupabaseAdmin } from "./supabase-server";

type ResourceName = "boards" | "grades" | "subjects" | "chapters" | "lessons";

type ResourceConfig = {
  table: ResourceName;
  select: string;
  parentFilter?: string;
  writable: string[];
  required: string[];
};

export const curriculumResources: Record<ResourceName, ResourceConfig> = {
  boards: {
    table: "boards",
    select: "id,name,code,description,status_id,sort_order,created_at,updated_at",
    writable: ["name", "code", "description", "status_id", "sort_order"],
    required: ["name", "code"]
  },
  grades: {
    table: "grades",
    select: "id,board_id,name,code,age_range,status_id,sort_order,created_at,updated_at",
    parentFilter: "board_id",
    writable: ["board_id", "name", "code", "age_range", "status_id", "sort_order"],
    required: ["board_id", "name"]
  },
  subjects: {
    table: "subjects",
    select: "id,grade_id,name,code,status_id,sort_order,created_at,updated_at",
    parentFilter: "grade_id",
    writable: ["grade_id", "name", "code", "status_id", "sort_order"],
    required: ["grade_id", "name"]
  },
  chapters: {
    table: "chapters",
    select: "id,subject_id,name,status_id,sort_order,created_at,updated_at",
    parentFilter: "subject_id",
    writable: ["subject_id", "name", "status_id", "sort_order"],
    required: ["subject_id", "name"]
  },
  lessons: {
    table: "lessons",
    select: "id,chapter_id,title,description,youtube_video_id,thumbnail_url,duration_seconds,status_id,sort_order,created_at,updated_at",
    parentFilter: "chapter_id",
    writable: [
      "chapter_id",
      "title",
      "description",
      "youtube_video_id",
      "thumbnail_url",
      "duration_seconds",
      "status_id",
      "sort_order"
    ],
    required: ["chapter_id", "title"]
  }
};

function cleanPayload(body: Record<string, unknown>, resource: ResourceConfig) {
  const payload: Record<string, unknown> = {};
  resource.writable.forEach((key) => {
    if (body[key] !== undefined) payload[key] = body[key];
  });
  return payload;
}

async function getActiveStatusId() {
  const { data, error } = await getSupabaseAdmin()
    .from("lookup_entity_status")
    .select("id")
    .eq("code", "active")
    .maybeSingle();

  if (error || !data) throw new Error(error?.message || "active status not found");
  return data.id as number;
}

export async function listPublicResource(resourceName: ResourceName, req: NextRequest) {
  const resource = curriculumResources[resourceName];
  const url = new URL(req.url);
  const activeStatusId = await getActiveStatusId();
  let query = getSupabaseAdmin()
    .from(resource.table)
    .select(resource.select)
    .eq("status_id", activeStatusId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (resource.parentFilter) {
    const parentId = url.searchParams.get(resource.parentFilter);
    if (parentId) query = query.eq(resource.parentFilter, parentId);
  }

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ data });
}

export async function getPublicResourceById(resourceName: ResourceName, id: string) {
  const resource = curriculumResources[resourceName];
  const activeStatusId = await getActiveStatusId();
  const { data, error } = await getSupabaseAdmin()
    .from(resource.table)
    .select(resource.select)
    .eq("id", id)
    .eq("status_id", activeStatusId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ data });
}

export async function listAdminResource(resourceName: ResourceName, req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  const resource = curriculumResources[resourceName];
  const url = new URL(req.url);
  const includeDeleted = url.searchParams.get("include_deleted") === "true";
  let query = getSupabaseAdmin()
    .from(resource.table)
    .select(resource.select)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!includeDeleted) query = query.is("deleted_at", null);
  if (resource.parentFilter) {
    const parentId = url.searchParams.get(resource.parentFilter);
    if (parentId) query = query.eq(resource.parentFilter, parentId);
  }

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ data });
}

export async function createAdminResource(resourceName: ResourceName, req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  const resource = curriculumResources[resourceName];
  const body = await req.json().catch(() => ({}));
  const payload = cleanPayload(body, resource);
  const missing = resource.required.filter((key) => payload[key] === undefined || payload[key] === "");
  if (missing.length) return json({ error: `Missing required fields: ${missing.join(", ")}` }, 400);

  if (payload.status_id === undefined) payload.status_id = await getActiveStatusId();

  const { data, error } = await getSupabaseAdmin()
    .from(resource.table)
    .insert(payload)
    .select(resource.select)
    .single();

  if (error) return json({ error: error.message }, 400);
  return json({ data }, 201);
}

export async function updateAdminResource(resourceName: ResourceName, id: string, req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  const resource = curriculumResources[resourceName];
  const body = await req.json().catch(() => ({}));
  const payload = cleanPayload(body, resource);
  if (Object.keys(payload).length === 0) return json({ error: "No valid fields to update" }, 400);

  const { data, error } = await getSupabaseAdmin()
    .from(resource.table)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select(resource.select)
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ data });
}

export async function deleteAdminResource(resourceName: ResourceName, id: string, req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  const resource = curriculumResources[resourceName];
  const { data, error } = await getSupabaseAdmin()
    .from(resource.table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!data) return json({ error: "Not found" }, 404);
  return json({ ok: true });
}

import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

const DEFAULT_SETTINGS = {
  pass_mark_percentage: 60,
  retry_allowed: true,
  max_retries: 3,
  default_time_limit_seconds: 30,
  randomize_questions: true,
  show_explanation: true,
  show_correct_answer: true,
  points_per_question: 10,
  bonus_points_perfect: 5,
  negative_marking: false,
  negative_mark_value: 0,
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);
  return json({ data: DEFAULT_SETTINGS });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  // In a real implementation we'd persist settings. For now return submitted values.
  return json({ data: { ...DEFAULT_SETTINGS, ...body } });
}

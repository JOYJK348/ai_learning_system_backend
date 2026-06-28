import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { json } from "@/lib/auth-helpers";
import {
  sendSchoolExpiryReminderEmail,
  sendParentExpiryReminderEmail,
} from "@/lib/email";

/**
 * GET /api/cron/expiry-reminders
 *
 * Should be called daily via a cron job (e.g. Vercel Cron, GitHub Actions,
 * or an external scheduler). Checks all active school and parent plans,
 * and sends reminder emails at 7-day and 3-day intervals before expiry.
 *
 * Protect this route via a secret CRON_SECRET header so it cannot be
 * triggered by anyone other than your cron service.
 */
export async function GET(req: NextRequest) {
  // ── Auth: verify cron secret ──────────────────────────────────────────────
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const results: { type: string; name: string; email: string; daysLeft: number; sent: boolean }[] = [];

  // ── 1. School plan expiry reminders ──────────────────────────────────────
  try {
    const { data: schools, error: schoolErr } = await supabase
      .from("schools")
      .select(`
        id, name, email,
        plan_started_at,
        school_admins!school_id(name, email)
      `)
      .is("deleted_at", null)
      .not("plan_started_at", "is", null);

    if (!schoolErr && schools) {
      for (const school of schools as any[]) {
        // Assume school plans run for 365 days from plan_started_at
        // Adjust this to use a real expiry column if one exists
        const started = new Date(school.plan_started_at);
        const expiry = new Date(started);
        expiry.setFullYear(expiry.getFullYear() + 1);

        const diffMs = expiry.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
          const admin = Array.isArray(school.school_admins)
            ? school.school_admins[0]
            : school.school_admins;

          if (!admin?.email) continue;

          // Count enrolled students
          const { count: studentCount } = await supabase
            .from("school_students")
            .select("id", { count: "exact", head: true })
            .eq("school_id", school.id)
            .is("deleted_at", null);

          const sent = await sendSchoolExpiryReminderEmail({
            adminEmail: admin.email,
            adminName: admin.name || school.name,
            schoolName: school.name,
            planName: "School Plan",
            expiryDate: expiry.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            studentCount: studentCount || 0,
            daysLeft,
          });

          results.push({ type: "school", name: school.name, email: admin.email, daysLeft, sent });
        }
      }
    }
  } catch (err) {
    console.error("[expiry-reminders] school query error:", err);
  }

  // ── 2. Individual parent plan expiry reminders ────────────────────────────
  try {
    const { data: parents, error: parentErr } = await supabase
      .from("parents")
      .select("id, name, email, plan_started_at, plan_name")
      .is("deleted_at", null)
      .not("plan_started_at", "is", null);

    if (!parentErr && parents) {
      for (const parent of parents as any[]) {
        if (!parent.email) continue;

        // Assume parent plans run for 30 days from plan_started_at
        // Adjust to use the actual expiry column if it exists
        const started = new Date(parent.plan_started_at);
        const expiry = new Date(started);
        expiry.setDate(expiry.getDate() + 30);

        const diffMs = expiry.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
          const sent = await sendParentExpiryReminderEmail({
            parentEmail: parent.email,
            parentName: parent.name || "Parent",
            planName: parent.plan_name || "Premium Plan",
            expiryDate: expiry.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
            daysLeft,
          });

          results.push({ type: "parent", name: parent.name, email: parent.email, daysLeft, sent });
        }
      }
    }
  } catch (err) {
    console.error("[expiry-reminders] parent query error:", err);
  }

  const totalSent = results.filter((r) => r.sent).length;
  console.log(`[expiry-reminders] Processed ${results.length} reminders, sent ${totalSent}.`);

  return json({
    data: {
      processed: results.length,
      sent: totalSent,
      details: results,
    },
  });
}

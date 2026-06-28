import * as fs from "fs";

if (fs.existsSync(".env")) {
  fs.readFileSync(".env", "utf8").split("\n").forEach(l => {
    const p = l.split("=");
    if (p.length >= 2) process.env[p[0].trim()] = p.slice(1).join("=").trim();
  });
}

import { getSupabaseAdmin } from "../src/lib/supabase-server";

async function run() {
  const supabase = getSupabaseAdmin();
  const { data: schools } = await supabase.from("school_registrations").select("*").order("created_at", { ascending: false }).limit(3);
  if (schools) {
    console.log("SCHOOL REGISTRATIONS:", schools.map(s => ({ id: s.id, name: s.school_name, status: s.status, email: s.admin_email })));
  }
  const { data: parents } = await supabase.from("parent_registrations").select("*").order("created_at", { ascending: false }).limit(3);
  if (parents) {
    console.log("PARENT REGISTRATIONS:", parents.map(p => ({ id: p.id, name: p.parent_name, status: p.status, email: p.parent_email })));
  }
}
run();

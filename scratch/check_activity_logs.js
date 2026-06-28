const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

if (fs.existsSync(".env")) {
  fs.readFileSync(".env", "utf8").split("\n").forEach(l => {
    const p = l.split("=");
    if (p.length >= 2) process.env[p[0].trim()] = p.slice(1).join("=").trim();
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: logs, error } = await supabase.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Activity Logs:", logs);
  }
}
run();

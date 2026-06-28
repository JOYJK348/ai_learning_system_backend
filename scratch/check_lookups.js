const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Inspecting schools table...');
  const schoolRes = await supabase.from("schools").select("*").limit(1);
  if (schoolRes.data && schoolRes.data.length > 0) {
    console.log('School schema columns:', Object.keys(schoolRes.data[0]));
    console.log('Sample school:', schoolRes.data[0]);
  } else {
    console.log('No school records found or error:', schoolRes.error);
  }
}

run();

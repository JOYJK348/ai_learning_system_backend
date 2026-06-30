const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Let's query all activities for the last two chapters in UKG Tamil:
  // "கதைகள்" (lesson: "சிங்கமும் எலியும்" id: "046e67ed-777f-4ff7-8cea-f7485d81a3aa")
  // "பாடல்கள் / Rhymes" (lesson: "தமிழ் மழலையர் பாடல்கள்" id: "fbd59a6e-7166-4bfb-840b-1365247285e5")
  
  const { data: actStories, error: err1 } = await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', '046e67ed-777f-4ff7-8cea-f7485d81a3aa');

  const { data: actRhymes, error: err2 } = await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', 'fbd59a6e-7166-4bfb-840b-1365247285e5');

  console.log('Stories Activities:', actStories);
  console.log('Rhymes Activities:', actRhymes);
}

run();

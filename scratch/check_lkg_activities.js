const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: actEgg, error: err1 } = await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', 'fabb9158-961f-44c4-abe8-f7487e54d50f');

  const { data: actChicks, error: err2 } = await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', '93477d6b-86bb-4c2c-b630-877ac4194f7d');

  console.log('Egg Activities:', actEgg);
  console.log('Chicks Activities:', actChicks);
}

run();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: actEggEn, error: err1 } = await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', 'f5784c15-accc-4beb-b095-3a5eadc1a048');

  const { data: actChicksEn, error: err2 } = await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', 'd674f770-826e-4c82-b959-1b50d0bd3253');

  console.log('En Egg Activities:', actEggEn);
  console.log('En Chicks Activities:', actChicksEn);
}

run();

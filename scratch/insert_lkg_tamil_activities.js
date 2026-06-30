const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function run() {
  console.log('Inserting default activities for LKG Tamil stories...');

  // Lesson 1: ஒரு நாள் ஒரு முட்டை
  const { data: existing1 } = await supabase
    .from('activities')
    .select('id')
    .eq('lesson_id', 'fabb9158-961f-44c4-abe8-f7487e54d50f')
    .maybeSingle();

  if (!existing1) {
    const { error: err1 } = await supabase
      .from('activities')
      .insert({
        id: uuidv4(),
        lesson_id: 'fabb9158-961f-44c4-abe8-f7487e54d50f',
        name: 'ஒரு நாள் ஒரு முட்டை Activity',
        activity_type_id: 1,
        config: {},
        sort_order: 1
      });
    if (err1) console.error('Error inserting activity 1:', err1);
    else console.log('Successfully inserted activity for: ஒரு நாள் ஒரு முட்டை');
  } else {
    console.log('Activity for "ஒரு நாள் ஒரு முட்டை" already exists.');
  }

  // Lesson 2: இரண்டு குஞ்சுகள்
  const { data: existing2 } = await supabase
    .from('activities')
    .select('id')
    .eq('lesson_id', '93477d6b-86bb-4c2c-b630-877ac4194f7d')
    .maybeSingle();

  if (!existing2) {
    const { error: err2 } = await supabase
      .from('activities')
      .insert({
        id: uuidv4(),
        lesson_id: '93477d6b-86bb-4c2c-b630-877ac4194f7d',
        name: 'இரண்டு குஞ்சுகள் Activity',
        activity_type_id: 1,
        config: {},
        sort_order: 1
      });
    if (err2) console.error('Error inserting activity 2:', err2);
    else console.log('Successfully inserted activity for: இரண்டு குஞ்சுகள்');
  } else {
    console.log('Activity for "இரண்டு குஞ்சுகள்" already exists.');
  }

  // Also check English counterparts:
  // "Two Little Chicks" (id: d674f770-826e-4c82-b959-1b50d0bd3253)
  // "One Day One Egg" (id: f5784c15-accc-4beb-b095-3a5eadc1a048)
  const lessonsEn = [
    { id: 'd674f770-826e-4c82-b959-1b50d0bd3253', name: 'Two Little Chicks' },
    { id: 'f5784c15-accc-4beb-b095-3a5eadc1a048', name: 'One Day One Egg' }
  ];

  for (const les of lessonsEn) {
    const { data: ext } = await supabase
      .from('activities')
      .select('id')
      .eq('lesson_id', les.id)
      .maybeSingle();

    if (!ext) {
      const { error: err } = await supabase
        .from('activities')
        .insert({
          id: uuidv4(),
          lesson_id: les.id,
          name: `${les.name} Activity`,
          activity_type_id: 1,
          config: {},
          sort_order: 1
        });
      if (err) console.error(`Error inserting activity for ${les.name}:`, err);
      else console.log(`Successfully inserted activity for: ${les.name}`);
    } else {
      console.log(`Activity for "${les.name}" already exists.`);
    }
  }

}

run().catch(console.error);

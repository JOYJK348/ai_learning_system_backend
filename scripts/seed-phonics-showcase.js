const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  const { data: status } = await s.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  const { data: vType } = await s.from('lookup_activity_types').select('id').eq('code', 'video').maybeSingle();
  if (!status || !vType) return;

  const { data: ch } = await s.from('chapters').select('id').eq('name', 'Chapter 3: Small Letters & Phonics').is('deleted_at', null).maybeSingle();
  if (!ch) { console.log('Chapter not found'); return; }

  const lessons = [
    { title: 'Phonics: at, am, an', family: 'at' },
    { title: 'Phonics: it, in, ig', family: 'ig' },
    { title: 'Phonics: op, ot, og', family: 'og' },
    { title: 'Phonics: un, ut, ub', family: 'un' },
  ];

  const now = new Date().toISOString();

  for (const l of lessons) {
    const { data: lesson } = await s.from('lessons').select('id').eq('chapter_id', ch.id).eq('title', l.title).is('deleted_at', null).maybeSingle();
    if (!lesson) { console.log('Lesson not found:', l.title); continue; }

    // Delete old activities
    await s.from('activities').update({ deleted_at: now }).eq('lesson_id', lesson.id).is('deleted_at', null);

    // Insert showcase
    await s.from('activities').insert({
      lesson_id: lesson.id, name: `Phonics: ${l.family}`,
      activity_type_id: vType.id,
      config: { family: l.family },
      sort_order: 1, status_id: status.id
    });
    console.log(`✓ ${l.title}`);
  }

  console.log('\nPhonics showcase activities seeded!');
}

main().catch(e => console.error(e));

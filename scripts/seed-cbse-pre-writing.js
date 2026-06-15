const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const STROKES = [
  { title: 'Standing Line', path: 'standing', color: '#6366F1' },
  { title: 'Sleeping Line', path: 'sleeping', color: '#22C55E' },
  { title: 'Left Slanting Line', path: 'left-slanting', color: '#F59E0B' },
  { title: 'Right Slanting Line', path: 'right-slanting', color: '#F97316' },
  { title: 'Left Curve', path: 'left-curve', color: '#8B5CF6' },
  { title: 'Right Curve', path: 'right-curve', color: '#EC4899' },
  { title: 'Up Curve', path: 'up-curve', color: '#06B6D4' },
  { title: 'Down Curve', path: 'down-curve', color: '#10B981' },
];

async function clearLessons(chapterId) {
  const { data: old } = await supabase.from('lessons').select('id').eq('chapter_id', chapterId).is('deleted_at', null);
  for (const l of old || []) {
    await supabase.from('activities').update({ deleted_at: new Date().toISOString() }).eq('lesson_id', l.id);
    await supabase.from('lesson_progress').update({ deleted_at: new Date().toISOString() }).eq('lesson_id', l.id);
    await supabase.from('lessons').update({ deleted_at: new Date().toISOString() }).eq('id', l.id);
  }
}

async function main() {
  console.log('=== Seeding CBSE Pre-Writing ===\n');

  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  const { data: traceType } = await supabase.from('lookup_activity_types').select('id').eq('code', 'trace').maybeSingle();
  if (!activeStatus || !traceType) throw new Error('Missing lookups');

  // ── Pre-Writing Foundation chapter ──
  const { data: pwChapter } = await supabase.from('chapters').select('id').eq('name', 'Pre-Writing Foundation').is('deleted_at', null).maybeSingle();
  if (!pwChapter) throw new Error('Pre-Writing Foundation chapter not found');
  console.log('Clearing Pre-Writing Foundation...');
  await clearLessons(pwChapter.id);

  let sort = 1;
  for (const s of STROKES) {
    const { data: lesson } = await supabase.from('lessons').insert({
      chapter_id: pwChapter.id, title: s.title,
      description: `Practice tracing the ${s.title.toLowerCase()}!`,
      sort_order: sort++, status_id: activeStatus.id
    }).select('id').maybeSingle();
    // Add a dummy activity so the lesson is not empty (frontend intercepts by title anyway)
    await supabase.from('activities').insert({
      lesson_id: lesson.id, name: `Trace: ${s.title}`,
      activity_type_id: traceType.id,
      config: { path: s.path, color: s.color, thickness: 6, tolerance: 20 },
      sort_order: 1, status_id: activeStatus.id
    });
    console.log(`   ${s.title}`);
  }

  // Exam lesson
  const { data: exam } = await supabase.from('lessons').insert({
    chapter_id: pwChapter.id, title: 'Pre-Writing Exam',
    description: 'Trace each line type to complete the exam!',
    sort_order: sort++, status_id: activeStatus.id
  }).select('id').maybeSingle();
  for (let i = 0; i < STROKES.length; i++) {
    const s = STROKES[i];
    await supabase.from('activities').insert({
      lesson_id: exam.id, name: `${s.title} Exam`,
      activity_type_id: traceType.id,
      config: { path: s.path, color: s.color, thickness: 6, tolerance: 25 },
      sort_order: i + 1, status_id: activeStatus.id
    });
  }
  console.log(`   Pre-Writing Exam (${STROKES.length} traces)`);

  console.log('\n=== CBSE Pre-Writing seeded successfully! ===');
  console.log('   Pre-Writing Foundation: 8 strokes + Exam\n');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

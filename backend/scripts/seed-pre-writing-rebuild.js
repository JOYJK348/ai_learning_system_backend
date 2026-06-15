const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Rebuilding Pre-Writing Foundation (guide + trace) ===\n');

  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  const { data: traceType } = await supabase.from('lookup_activity_types').select('id').eq('code', 'trace').maybeSingle();
  if (!activeStatus || !traceType) throw new Error('Missing required lookup IDs');

  const { data: chapter } = await supabase.from('chapters').select('id').eq('name', 'Pre-Writing Foundation').is('deleted_at', null).maybeSingle();
  if (!chapter) throw new Error('Pre-Writing Foundation chapter not found');

  // Clear old lessons
  const { data: oldLessons } = await supabase.from('lessons').select('id, title').eq('chapter_id', chapter.id).is('deleted_at', null);
  console.log(`   Clearing ${oldLessons?.length || 0} old lessons...`);
  for (const l of oldLessons || []) {
    await supabase.from('activities').update({ deleted_at: new Date().toISOString() }).eq('lesson_id', l.id);
    await supabase.from('lesson_progress').update({ deleted_at: new Date().toISOString() }).eq('lesson_id', l.id);
    await supabase.from('lessons').update({ deleted_at: new Date().toISOString() }).eq('id', l.id);
  }
  console.log('   Old lessons cleared');

  const lines = [
    { title: 'Standing Line', path: 'standing', color: '#6366F1' },
    { title: 'Sleeping Line', path: 'sleeping', color: '#22C55E' },
    { title: 'Slanting Line', path: 'slanting', color: '#F59E0B' },
    { title: 'Curved Line', path: 'curved', color: '#EC4899' },
    { title: 'Zig Zag Line', path: 'zigzag', color: '#EF4444' },
  ];

  for (let si = 0; si < lines.length; si++) {
    const l = lines[si];
    const { data: lesson } = await supabase.from('lessons').insert({
      chapter_id: chapter.id, title: l.title,
      description: `Follow the guide then trace a ${l.path} line!`,
      sort_order: si + 1, status_id: activeStatus.id
    }).select('id').maybeSingle();

    // Activity 1: Guide trace (fun warm-up with high tolerance)
    await supabase.from('activities').insert({
      lesson_id: lesson.id, name: `Guide: ${l.title}`,
      activity_type_id: traceType.id,
      config: { path: l.path, color: l.color, thickness: 8, tolerance: 15, mode: 'guide' },
      sort_order: 1, status_id: activeStatus.id
    });

    // Activity 2: Real trace (stricter)
    await supabase.from('activities').insert({
      lesson_id: lesson.id, name: `Trace: ${l.title}`,
      activity_type_id: traceType.id,
      config: { path: l.path, color: l.color, thickness: 6, tolerance: 15 },
      sort_order: 2, status_id: activeStatus.id
    });

    console.log(`   ${l.path}: Guide → Trace`);
  }

  // Exam lesson
  const { data: examLesson } = await supabase.from('lessons').insert({
    chapter_id: chapter.id, title: 'Pre-Writing Exam',
    description: 'Trace each line type to complete the exam!',
    sort_order: 6, status_id: activeStatus.id
  }).select('id').maybeSingle();
  const examTraces = [
    { name: 'Standing Line Exam', path: 'standing', color: '#6366F1' },
    { name: 'Sleeping Line Exam', path: 'sleeping', color: '#22C55E' },
    { name: 'Slanting Line Exam', path: 'slanting', color: '#F59E0B' },
    { name: 'Curved Line Exam', path: 'curved', color: '#EC4899' },
    { name: 'Zig Zag Exam', path: 'zigzag', color: '#EF4444' },
  ];
  for (let ei = 0; ei < examTraces.length; ei++) {
    const t = examTraces[ei];
    await supabase.from('activities').insert({
      lesson_id: examLesson.id, name: t.name,
      activity_type_id: traceType.id,
      config: { path: t.path, color: t.color, thickness: 6, tolerance: 15 },
      sort_order: ei + 1, status_id: activeStatus.id
    });
  }
  console.log(`   exam: 5 traces`);

  console.log(`\n=== Pre-Writing Foundation rebuilt! ===`);
  console.log('   Lessons 1-5: Guide trace (fun warm-up) → Real trace (practice)');
  console.log('   Lesson 6: Exam with 5 trace activities\n');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

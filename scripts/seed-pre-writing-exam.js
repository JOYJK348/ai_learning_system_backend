const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Seeding Pre-Writing Foundation Exam ===\n');

  // 1. Get status IDs
  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  if (!activeStatus) throw new Error('active status not found');

  // 2. Get Pre-Writing Foundation chapter
  const { data: chapter } = await supabase.from('chapters').select('id').eq('name', 'Pre-Writing Foundation').is('deleted_at', null).maybeSingle();
  if (!chapter) throw new Error('Pre-Writing Foundation chapter not found');
  console.log(`   Found chapter: Pre-Writing Foundation (${chapter.id})`);

  // 3. Get existing lessons count for sort_order
  const { data: existingLessons } = await supabase.from('lessons').select('id, sort_order').eq('chapter_id', chapter.id).is('deleted_at', null).order('sort_order');
  const nextSortOrder = (existingLessons?.length || 0) + 1;
  console.log(`   Existing lessons: ${existingLessons?.length || 0}, next sort_order: ${nextSortOrder}`);

  // 4. Ensure trace activity type exists
  const { data: traceType } = await supabase.from('lookup_activity_types').select('id').eq('code', 'trace').maybeSingle();
  if (!traceType) throw new Error('trace activity type not found - run seed-pattern-readiness.js first');

  // 5. Create exam lesson
  const { data: examLesson } = await supabase.from('lessons').insert({
    chapter_id: chapter.id, title: 'Pre-Writing Exam',
    description: 'Trace each line type to complete the exam!',
    sort_order: nextSortOrder, status_id: activeStatus.id
  }).select('id').maybeSingle();
  console.log(`   Created lesson: Pre-Writing Exam (${examLesson.id})`);

  // 6. Create trace activities for each line type
  const traces = [
    { name: 'Standing Line Exam', path: 'standing', color: '#6366F1', emoji: '📏' },
    { name: 'Sleeping Line Exam', path: 'sleeping', color: '#22C55E', emoji: '🛏️' },
    { name: 'Slanting Line Exam', path: 'slanting', color: '#F59E0B', emoji: '📐' },
    { name: 'Curved Line Exam', path: 'curved', color: '#EC4899', emoji: '🌈' },
    { name: 'Zig Zag Exam', path: 'zigzag', color: '#EF4444', emoji: '⚡' },
  ];

  for (let i = 0; i < traces.length; i++) {
    const t = traces[i];
    await supabase.from('activities').insert({
      lesson_id: examLesson.id, name: t.name, activity_type_id: traceType.id,
      config: { path: t.path, color: t.color, thickness: 6, tolerance: 25 },
      sort_order: i + 1, status_id: activeStatus.id
    });
    console.log(`   ${t.emoji} ${t.name}`);
  }

  console.log(`\n=== Pre-Writing Exam created with ${traces.length} trace activities! ===`);
  console.log('   Students must complete all 5 traces to pass the exam.');
  console.log('   After completing all Pre-Writing Foundation lessons (including exam),');
  console.log('   the next chapter (Pattern Readiness) will unlock automatically.\n');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

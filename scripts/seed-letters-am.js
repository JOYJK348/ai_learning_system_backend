const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Seeding Chapter 1: Letters A-M (guide + trace) ===\n');

  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  const { data: traceType } = await supabase.from('lookup_activity_types').select('id').eq('code', 'trace').maybeSingle();
  if (!activeStatus || !traceType) throw new Error('Missing required lookup IDs');

  const { data: chapter } = await supabase.from('chapters').select('id').eq('name', 'Chapter 1: Letters A-M').is('deleted_at', null).maybeSingle();
  if (!chapter) throw new Error('Chapter not found');

  // Clear old lessons
  const { data: oldLessons } = await supabase.from('lessons').select('id').eq('chapter_id', chapter.id).is('deleted_at', null);
  console.log(`   Clearing ${oldLessons?.length || 0} old lessons...`);
  for (const l of oldLessons || []) {
    await supabase.from('activities').update({ deleted_at: new Date().toISOString() }).eq('lesson_id', l.id);
    await supabase.from('lesson_progress').update({ deleted_at: new Date().toISOString() }).eq('lesson_id', l.id);
    await supabase.from('lessons').update({ deleted_at: new Date().toISOString() }).eq('id', l.id);
  }
  console.log('   Old lessons cleared');

  const letters = [
    { letter: 'A', emoji: '🍎', word: 'Apple', color: '#EF4444' },
    { letter: 'B', emoji: '🏀', word: 'Ball', color: '#F97316' },
    { letter: 'C', emoji: '🐱', word: 'Cat', color: '#EAB308' },
    { letter: 'D', emoji: '🐕', word: 'Dog', color: '#22C55E' },
    { letter: 'E', emoji: '🐘', word: 'Elephant', color: '#14B8A6' },
    { letter: 'F', emoji: '🐟', word: 'Fish', color: '#06B6D4' },
    { letter: 'G', emoji: '🍇', word: 'Grapes', color: '#8B5CF6' },
    { letter: 'H', emoji: '🎩', word: 'Hat', color: '#EC4899' },
    { letter: 'I', emoji: '🍦', word: 'Ice cream', color: '#F43F5E' },
    { letter: 'J', emoji: '🏺', word: 'Jug', color: '#6366F1' },
    { letter: 'K', emoji: '🪁', word: 'Kite', color: '#A855F7' },
    { letter: 'L', emoji: '🦁', word: 'Lion', color: '#0EA5E9' },
    { letter: 'M', emoji: '🥭', word: 'Mango', color: '#84CC16' },
  ];

  for (let i = 0; i < letters.length; i++) {
    const { letter, emoji, word, color } = letters[i];
    const pathKey = `letter-${letter.toLowerCase()}`;
    const lessonTitle = `Letter ${letter} - ${word}`;

    const { data: lesson } = await supabase.from('lessons').insert({
      chapter_id: chapter.id, title: lessonTitle,
      description: `Learn to trace the letter ${letter} with ${emoji} ${word}!`,
      sort_order: i + 1, status_id: activeStatus.id
    }).select('id').maybeSingle();

    // Activity 1: Guide trace (introduce letter with emoji)
    await supabase.from('activities').insert({
      lesson_id: lesson.id, name: `Guide: Letter ${letter}`,
      activity_type_id: traceType.id,
      config: { path: pathKey, color, thickness: 8, tolerance: 15, mode: 'guide' },
      sort_order: 1, status_id: activeStatus.id
    });

    // Activity 2: Trace practice (no guide)
    await supabase.from('activities').insert({
      lesson_id: lesson.id, name: `Trace: Letter ${letter}`,
      activity_type_id: traceType.id,
      config: { path: pathKey, color, thickness: 6, tolerance: 15 },
      sort_order: 2, status_id: activeStatus.id
    });

    console.log(`   ${letter}: ${emoji} Guide → Trace`);
  }

  console.log(`\n=== Chapter 1: Letters A-M seeded! ===`);
  console.log(`   13 lessons × 2 activities = 26 total activities`);
  console.log(`   Each letter: Guide trace (emoji+START/END) → Trace practice\n`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

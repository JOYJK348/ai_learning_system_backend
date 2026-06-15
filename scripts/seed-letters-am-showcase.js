const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Seeding Chapter 1: Letters A-M (showcase) ===\n');

  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  const { data: videoType } = await supabase.from('lookup_activity_types').select('id').eq('code', 'video').maybeSingle();
  if (!activeStatus || !videoType) throw new Error('Missing required lookup IDs');

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
    { letter: 'A', word: 'Apple', emoji: '🍎', color: '#EF4444' },
    { letter: 'B', word: 'Ball', emoji: '🏀', color: '#F97316' },
    { letter: 'C', word: 'Cat', emoji: '🐱', color: '#EAB308' },
    { letter: 'D', word: 'Dog', emoji: '🐕', color: '#22C55E' },
    { letter: 'E', word: 'Elephant', emoji: '🐘', color: '#14B8A6' },
    { letter: 'F', word: 'Fish', emoji: '🐟', color: '#06B6D4' },
    { letter: 'G', word: 'Grapes', emoji: '🍇', color: '#8B5CF6' },
    { letter: 'H', word: 'Hat', emoji: '🎩', color: '#EC4899' },
    { letter: 'I', word: 'Ice cream', emoji: '🍦', color: '#F43F5E' },
    { letter: 'J', word: 'Jug', emoji: '🏺', color: '#6366F1' },
    { letter: 'K', word: 'Kite', emoji: '🪁', color: '#A855F7' },
    { letter: 'L', word: 'Lion', emoji: '🦁', color: '#0EA5E9' },
    { letter: 'M', word: 'Mango', emoji: '🥭', color: '#84CC16' },
  ];

  for (let i = 0; i < letters.length; i++) {
    const { letter, word, emoji, color } = letters[i];
    const lessonTitle = `Letter ${letter} - ${word}`;

    const { data: lesson } = await supabase.from('lessons').insert({
      chapter_id: chapter.id, title: lessonTitle,
      description: `Learn the letter ${letter} with ${emoji} ${word}!`,
      sort_order: i + 1, status_id: activeStatus.id
    }).select('id').maybeSingle();

    // One showcase activity per letter
    await supabase.from('activities').insert({
      lesson_id: lesson.id, name: `Showcase: Letter ${letter}`,
      activity_type_id: videoType.id,
      config: { letter, word, emoji, color },
      sort_order: 1, status_id: activeStatus.id
    });

    console.log(`   ${letter}: ${emoji} ${word}`);
  }

  console.log(`\n=== Chapter 1: Letters A-M seeded! ===`);
  console.log(`   13 lessons × 1 showcase activity = 13 total`);
  console.log(`   Each letter: Beautiful card with letter + emoji + word\n`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

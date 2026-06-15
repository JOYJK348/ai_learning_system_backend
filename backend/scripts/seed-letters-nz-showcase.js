const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Seeding Chapter 2: Letters N-Z (showcase) ===\n');

  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  const { data: videoType } = await supabase.from('lookup_activity_types').select('id').eq('code', 'video').maybeSingle();
  if (!activeStatus || !videoType) throw new Error('Missing required lookup IDs');

  const { data: chapter } = await supabase.from('chapters').select('id').eq('name', 'Chapter 2: Letters N-Z').is('deleted_at', null).maybeSingle();
  if (!chapter) throw new Error('Chapter 2: Letters N-Z not found');

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
    { letter: 'N', word: 'Nest', emoji: '🪹', color: '#F97316' },
    { letter: 'O', word: 'Orange', emoji: '🍊', color: '#34D399' },
    { letter: 'P', word: 'Parrot', emoji: '🦜', color: '#E879F9' },
    { letter: 'Q', word: 'Queen', emoji: '👑', color: '#FBBF24' },
    { letter: 'R', word: 'Rabbit', emoji: '🐰', color: '#F472B6' },
    { letter: 'S', word: 'Sun', emoji: '☀️', color: '#FDE047' },
    { letter: 'T', word: 'Tiger', emoji: '🐯', color: '#FB923C' },
    { letter: 'U', word: 'Umbrella', emoji: '☂️', color: '#60A5FA' },
    { letter: 'V', word: 'Van', emoji: '🚐', color: '#A78BFA' },
    { letter: 'W', word: 'Watch', emoji: '⌚', color: '#E879F9' },
    { letter: 'X', word: 'Xylophone', emoji: '🎹', color: '#2DD4BF' },
    { letter: 'Y', word: 'Yak', emoji: '🦬', color: '#F97316' },
    { letter: 'Z', word: 'Zebra', emoji: '🦓', color: '#818CF8' },
  ];

  for (let i = 0; i < letters.length; i++) {
    const { letter, word, emoji, color } = letters[i];
    const lessonTitle = `Letter ${letter} - ${word}`;

    const { data: lesson } = await supabase.from('lessons').insert({
      chapter_id: chapter.id, title: lessonTitle,
      description: `Learn the letter ${letter} with ${emoji} ${word}!`,
      sort_order: i + 1, status_id: activeStatus.id
    }).select('id').maybeSingle();

    await supabase.from('activities').insert({
      lesson_id: lesson.id, name: `Showcase: Letter ${letter}`,
      activity_type_id: videoType.id,
      config: { letter, word, emoji, color },
      sort_order: 1, status_id: activeStatus.id
    });

    console.log(`   ${letter}: ${emoji} ${word}`);
  }

  // Add Simple Words lesson
  const { data: swLesson } = await supabase.from('lessons').insert({
    chapter_id: chapter.id, title: 'Simple Words: Cat, Dog, Sun, Moon',
    description: 'Picture-word matching with simple CVC words. Word building activities.',
    sort_order: 14, status_id: activeStatus.id
  }).select('id').maybeSingle();

  await supabase.from('activities').insert({
    lesson_id: swLesson.id, name: 'Word Match Quiz',
    activity_type_id: videoType.id,
    config: { letter: 'W', word: 'Words', emoji: '📖', color: '#6366F1' },
    sort_order: 1, status_id: activeStatus.id
  });
  console.log('   📖 Simple Words: Cat, Dog, Sun, Moon');

  console.log(`\n=== Chapter 2: Letters N-Z seeded! ===`);
  console.log(`   14 lessons × 1 showcase activity = 14 total`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

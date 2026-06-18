const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Seeding மெய் எழுத்துக்கள் - வரிசை 2 (Showcase) ===\n');

  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  if (!activeStatus) throw new Error('Missing active status');

  const lessons = [
    {
      id: '19beb3bc-d5e5-4501-990d-3eec7d919551',
      title: 'ய் ர் ல் வ்',
      activities: [
        { name: 'Showcase: ய்', set: 'set-1', letter: 'ய்', word: 'யானை', emoji: '🐘', color: '#8B5CF6' },
        { name: 'Showcase: ர்', set: 'set-1', letter: 'ர்', word: 'ராக்கெட்', emoji: '🚀', color: '#F43F5E' },
        { name: 'Showcase: ல்', set: 'set-1', letter: 'ல்', word: 'லட்டு', emoji: '🍡', color: '#F59E0B' },
        { name: 'Showcase: வ்', set: 'set-1', letter: 'வ்', word: 'வானவில்', emoji: '🌈', color: '#EC4899' },
      ]
    },
    {
      id: '9c71763f-5931-4f52-9966-bb683b4e7236',
      title: 'ழ் ள் ற் ன்',
      activities: [
        { name: 'Showcase: ழ்', set: 'set-2', letter: 'ழ்', word: 'மழை', emoji: '🌧️', color: '#60A5FA' },
        { name: 'Showcase: ள்', set: 'set-2', letter: 'ள்', word: 'விளக்கு', emoji: '💡', color: '#22C55E' },
        { name: 'Showcase: ற்', set: 'set-2', letter: 'ற்', word: 'பறவை', emoji: '🕊️', color: '#0EA5E9' },
        { name: 'Showcase: ன்', set: 'set-2', letter: 'ன்', word: 'கண்', emoji: '👁️', color: '#F97316' },
      ]
    }
  ];

  for (const lesson of lessons) {
    console.log(`\n📖 ${lesson.title}`);

    // Get existing activities to find max sort_order
    const { data: existing } = await supabase
      .from('activities')
      .select('id, sort_order, name')
      .eq('lesson_id', lesson.id)
      .is('deleted_at', null)
      .order('sort_order');

    let nextSort = existing?.length
      ? Math.max(...existing.map(a => a.sort_order || 0)) + 1
      : 1;

    // Remove old showcase activities if re-running
    const { data: oldShowcases } = await supabase
      .from('activities')
      .select('id')
      .eq('lesson_id', lesson.id)
      .ilike('name', 'Showcase:%')
      .is('deleted_at', null);

    if (oldShowcases?.length) {
      console.log(`   Cleaning ${oldShowcases.length} old showcase activities...`);
      for (const act of oldShowcases) {
        await supabase.from('activities').update({ deleted_at: new Date().toISOString() }).eq('id', act.id);
      }
    }

    for (const act of lesson.activities) {
      const { error } = await supabase.from('activities').insert({
        lesson_id: lesson.id,
        name: act.name,
        activity_type_id: 5, // video type (same as LetterShowcase)
        config: { letter: act.letter, word: act.word, emoji: act.emoji, color: act.color, set: act.set, family: 'mei' },
        sort_order: nextSort++,
        status_id: activeStatus.id,
      });

      if (error) {
        console.error(`   ❌ Error inserting ${act.name}:`, error.message);
      } else {
        console.log(`   ✅ ${act.letter} ${act.emoji} ${act.word}`);
      }
    }
  }

  console.log(`\n=== மெய் எழுத்துக்கள் - வரிசை 2 seeded! ===`);
  console.log(`   2 lessons × 4 showcase activities = 8 total`);
  console.log(`   Each consonant: Showcase card with letter + emoji + word\n`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

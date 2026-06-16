const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const EXTRA_CHAPTERS = {
  'Colors': [
    { title: 'Red, Blue, Yellow, Green', desc: 'Learn to identify red, blue, yellow and green colors' },
    { title: 'Orange, Purple, Pink, Brown', desc: 'Learn orange, purple, pink and brown colors' },
    { title: 'White, Black & Color Review', desc: 'Learn white, black, gray and review all colors' },
  ],
  'Shapes': [
    { title: 'Circle, Square, Triangle', desc: 'Learn to identify circles, squares and triangles' },
    { title: 'Rectangle, Star, Diamond, Heart, Oval', desc: 'Learn more shapes like rectangle, star, diamond, heart, oval' },
  ],
  'Fruits & Vegetables': [
    { title: 'Fruits - Apple, Banana, Mango, Orange, Grapes', desc: 'Learn names of common fruits' },
    { title: 'Vegetables - Carrot, Tomato, Potato, Onion, Cabbage', desc: 'Learn names of common vegetables' },
  ],
  'Animals': [
    { title: 'Domestic Animals', desc: 'Learn about animals that live with us - cow, dog, cat, hen, horse' },
    { title: 'Wild Animals', desc: 'Learn about wild animals - lion, tiger, elephant, giraffe, monkey' },
  ],
  'Body Parts': [
    { title: 'Head, Eyes, Nose, Ears, Mouth', desc: 'Learn about the parts on your face' },
    { title: 'Hands, Legs, Knees, Toes', desc: 'Learn about your body from head to toe' },
  ],
  'My Family & Myself': [
    { title: 'Myself - My Name, Age', desc: 'Learn to introduce yourself - name, age, and feelings' },
    { title: 'My Family - Mommy, Daddy, Siblings, Grandparents', desc: 'Learn about your family members' },
  ],
};

async function seed() {
  console.log('=== Seeding LKG English Extra Chapters ===\n');

  // Get CBSE board, LKG grade, English subject
  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').single();
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').single();
  const { data: subject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'english').single();
  if (!subject) throw new Error('LKG English subject not found');

  const { data: status } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').single();
  const activeStatusId = status?.id;

  // Get next sort_order
  const { data: maxCh } = await supabase
    .from('chapters')
    .select('sort_order')
    .eq('subject_id', subject.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();
  let nextOrder = (maxCh?.sort_order || 0) + 1;

  let totalChapters = 0;
  let totalLessons = 0;

  for (const [chapterName, lessons] of Object.entries(EXTRA_CHAPTERS)) {
    // Skip if already exists
    const { data: existing } = await supabase
      .from('chapters')
      .select('id')
      .eq('subject_id', subject.id)
      .eq('name', chapterName)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      console.log(`  ⚠️ Chapter already exists: ${chapterName}`);
      continue;
    }

    const { data: newCh, error: chErr } = await supabase
      .from('chapters')
      .insert({ subject_id: subject.id, name: chapterName, sort_order: nextOrder, status_id: activeStatusId })
      .select('id')
      .single();

    if (chErr) {
      console.error(`  ❌ Failed to create chapter ${chapterName}: ${chErr.message}`);
      continue;
    }

    console.log(`  ✅ Created chapter ${nextOrder}: ${chapterName}`);
    totalChapters++;
    nextOrder++;

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const { error: lErr } = await supabase
        .from('lessons')
        .insert({
          chapter_id: newCh.id,
          title: lesson.title,
          description: lesson.desc,
          sort_order: i + 1,
          status_id: activeStatusId,
        });

      if (lErr) {
        console.error(`    ❌ Failed to create lesson ${lesson.title}: ${lErr.message}`);
      } else {
        console.log(`    📖 Created lesson: ${lesson.title}`);
        totalLessons++;
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Chapters created: ${totalChapters}`);
  console.log(`  Lessons created: ${totalLessons}`);
  console.log(`\n⚠️  Note: This script only creates chapters and lessons.`);
  console.log(`   Activities and quizzes require the full SQL seed.`);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const grade1Id = '807cf7be-c596-4fd6-8b6e-ee991ca661a8';
const englishSubjectId = 'bd0b4df6-6f2e-478f-ad4e-c5edd23447ca';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 6 Missions structure
const missions = [
  {
    name: 'Mission 1: Word Forest',
    lessonTitle: 'Word Hunt Challenge',
    sortOrder: 1
  },
  {
    name: 'Mission 2: Grammar Garden',
    lessonTitle: 'Garden Repair Challenge',
    sortOrder: 2
  },
  {
    name: 'Mission 3: Sentence Train',
    lessonTitle: 'Word Arranger Challenge',
    sortOrder: 3
  },
  {
    name: 'Mission 4: Story Cave',
    lessonTitle: 'Story Quest Challenge',
    sortOrder: 4
  },
  {
    name: 'Mission 5: Detective Zone',
    lessonTitle: 'Word Detective Challenge',
    sortOrder: 5
  },
  {
    name: 'Mission 6: Writing Lab',
    lessonTitle: 'Writing Zone Challenge',
    sortOrder: 6
  }
];

async function run() {
  console.log('Clearing old chapters for Grade 1 English (to keep it clean)...');
  // Delete existing chapters & lessons under English Subject to prevent duplicates and make it cleanly match the 6 missions
  const { data: oldChapters } = await supabase.from('chapters').select('id').eq('subject_id', englishSubjectId);
  if (oldChapters && oldChapters.length > 0) {
    const oldChapterIds = oldChapters.map(c => c.id);
    await supabase.from('lessons').delete().in('chapter_id', oldChapterIds);
    await supabase.from('chapters').delete().in('id', oldChapterIds);
  }

  console.log('Seeding 6 Missions for Grade 1 English...');
  const mapping = {};

  for (const m of missions) {
    const chapterId = uuidv4();
    const lessonId = uuidv4();
    const quizId = uuidv4();

    // 1. Insert Chapter
    const { error: chErr } = await supabase.from('chapters').insert({
      id: chapterId,
      subject_id: englishSubjectId,
      name: m.name,
      sort_order: m.sortOrder,
      status_id: 1
    });
    if (chErr) {
      console.error(`Error inserting chapter ${m.name}:`, chErr);
      continue;
    }

    // 2. Insert Lesson
    const { error: lesErr } = await supabase.from('lessons').insert({
      id: lessonId,
      chapter_id: chapterId,
      title: m.lessonTitle,
      description: `Interactive challenge for ${m.name}`,
      sort_order: 1,
      status_id: 1
    });
    if (lesErr) {
      console.error(`Error inserting lesson for ${m.name}:`, lesErr);
      continue;
    }

    // 3. Insert Quiz
    const { error: qErr } = await supabase.from('quizzes').insert({
      id: quizId,
      lesson_id: lessonId,
      title: `${m.name} Quiz`,
      description: `Challenge level for ${m.name}`,
      time_limit_seconds: 600,
      difficulty_id: 1,
      sort_order: 1,
      status_id: 1
    });
    if (qErr) {
      console.error(`Error inserting quiz for ${m.name}:`, qErr);
      continue;
    }

    // Record mapping
    mapping[m.sortOrder] = {
      lessonId,
      quizId
    };

    console.log(`Seeded ${m.name}: Lesson ID: ${lessonId}, Quiz ID: ${quizId}`);
  }

  console.log('\n--- GRADE 1 ENGLISH MAPPINGS FOR page.tsx ---');
  console.log('GRADE1_MAPPINGS = {');
  console.log('  english: {');
  Object.entries(mapping).forEach(([levelNum, ids]) => {
    console.log(`    ${levelNum}: '${ids.lessonId}',`);
  });
  console.log('  }');
  console.log('};');

  console.log('\n--- LESSON TO QUIZ ID MAPPING FOR page.tsx ---');
  Object.entries(mapping).forEach(([levelNum, ids]) => {
    console.log(`'${ids.lessonId}': '${ids.quizId}',`);
  });
}

run().catch(console.error);

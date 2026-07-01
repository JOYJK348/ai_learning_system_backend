const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

const MATH_SUBJECT_ID = '32c0c603-9074-4947-8b50-69550cdb86ef'; // Grade 1 Mathematics

const CURRICULUM = [
  {
    chapter: 'Chapter 1: Numbers Beyond 100 🔢',
    lessons: [
      'Numbers 101–200',
      'Numbers 201–500',
      'Numbers 501–999 (intro)',
      'Place Value (Ones, Tens, Hundreds)',
      'Expanded Form'
    ]
  },
  {
    chapter: 'Chapter 2: Number Comparison & Ordering 🏆',
    lessons: [
      'Ascending Order',
      'Descending Order',
      'Compare 2 digit numbers',
      'Compare 3 digit numbers',
      'Number Sequence'
    ]
  },
  {
    chapter: 'Chapter 3: Addition Master ➕',
    lessons: [
      'Addition without carry',
      'Addition with carry',
      'Add 2 digit numbers',
      'Add 3 digit numbers (basic)',
      'Horizontal & Vertical addition',
      'Addition word problems'
    ]
  },
  {
    chapter: 'Chapter 4: Subtraction Hero ➖',
    lessons: [
      'Subtraction without borrowing',
      'Subtraction with borrowing intro',
      '2 digit subtraction',
      'Missing number subtraction',
      'Checking subtraction',
      'Story problems'
    ]
  },
  {
    chapter: 'Chapter 5: Multiplication Introduction ✖️',
    lessons: [
      'Equal groups concept',
      'Repeated addition',
      'Skip counting as multiplication',
      'Tables 2,5,10'
    ]
  },
  {
    chapter: 'Chapter 6: Shapes & Geometry 🟦',
    lessons: [
      '3D Shapes intro',
      'Faces & edges',
      'Lines and curves',
      'Symmetry',
      'Patterns'
    ]
  },
  {
    chapter: 'Chapter 7: Measurement Pro 📏',
    lessons: [
      'Length measurement using units',
      'Compare lengths',
      'Weight measurement',
      'Capacity',
      'Temperature intro'
    ]
  },
  {
    chapter: 'Chapter 8: Time & Money Expert ⏰💰',
    lessons: [
      'Reading clock hours',
      'Half past time',
      'Calendar',
      'Money addition',
      'Money subtraction'
    ]
  },
  {
    chapter: 'Chapter 9: Data & Logic 🧠',
    lessons: [
      'Sorting information',
      'Picture graphs',
      'Simple tables',
      'Logical patterns'
    ]
  }
];

async function main() {
  console.log('Cleaning up existing chapters and lessons for Grade 1 Mathematics...');

  // Get existing chapters
  const { data: existingChapters } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', MATH_SUBJECT_ID);

  const chapterIds = (existingChapters || []).map(c => c.id);

  if (chapterIds.length > 0) {
    console.log(`Found ${chapterIds.length} existing chapters. Deleting activities/lessons...`);
    
    // Get existing lessons
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('id')
      .in('chapter_id', chapterIds);
      
    const lessonIds = (existingLessons || []).map(l => l.id);

    if (lessonIds.length > 0) {
      // Delete activities for lessons
      const { error: actDelError } = await supabase
        .from('activities')
        .delete()
        .in('lesson_id', lessonIds);
      if (actDelError) console.error('Error deleting activities:', actDelError);

      // Delete progress records or attempts if any
      const { error: progDelError } = await supabase
        .from('student_activities')
        .delete()
        .in('lesson_id', lessonIds);
      if (progDelError) console.error('Error deleting student progress:', progDelError);

      // Delete lessons
      const { error: lesDelError } = await supabase
        .from('lessons')
        .delete()
        .in('id', lessonIds);
      if (lesDelError) console.error('Error deleting lessons:', lesDelError);
    }

    // Delete chapters
    const { error: chapDelError } = await supabase
      .from('chapters')
      .delete()
      .in('id', chapterIds);
    if (chapDelError) console.error('Error deleting chapters:', chapDelError);
  }

  console.log('\nSeeding new chapters and lessons...');
  const lessonToIdMap = {};

  for (let cIdx = 0; cIdx < CURRICULUM.length; cIdx++) {
    const chData = CURRICULUM[cIdx];
    console.log(`Inserting Chapter: ${chData.chapter}`);

    const { data: chapter, error: chError } = await supabase
      .from('chapters')
      .insert({
        subject_id: MATH_SUBJECT_ID,
        name: chData.chapter,
        sort_order: cIdx + 1
      })
      .select()
      .single();

    if (chError) {
      console.error(`Error inserting chapter ${chData.chapter}:`, chError);
      continue;
    }

    for (let lIdx = 0; lIdx < chData.lessons.length; lIdx++) {
      const lessonTitle = chData.lessons[lIdx];
      
      const { data: lesson, error: lesError } = await supabase
        .from('lessons')
        .insert({
          chapter_id: chapter.id,
          title: lessonTitle,
          sort_order: lIdx + 1
        })
        .select()
        .single();

      if (lesError) {
        console.error(`Error inserting lesson ${lessonTitle}:`, lesError);
        continue;
      }

      console.log(`  - Seeded Lesson: ${lessonTitle} (${lesson.id})`);
      lessonToIdMap[lessonTitle] = lesson.id;

      // Seed Activity for each lesson
      const { error: actError } = await supabase
        .from('activities')
        .insert({
          lesson_id: lesson.id,
          name: `${lessonTitle} Game Challenge`,
          activity_type_id: 85, // Grade 1 Math Challenge
          config: {},
          sort_order: 1
        });

      if (actError) {
        console.error(`Error inserting activity for ${lessonTitle}:`, actError);
      }
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('Mapping of lesson titles to database UUIDs:');
  console.log(JSON.stringify(lessonToIdMap, null, 2));
}

main().catch(console.error);

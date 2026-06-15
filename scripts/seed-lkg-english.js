const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const CURRICULUM = {
  'Term 1: Letters A-M': [
    { title: 'Letter A - Apple', desc: 'Recognition and sound of letter A. Tracing, picture cards, and songs.' },
    { title: 'Letter B - Ball', desc: 'Recognition and sound of letter B. Tracing, matching, and songs.' },
    { title: 'Letter C - Cat', desc: 'Recognition and sound of letter C. Tracing, picture cards, and oral practice.' },
    { title: 'Letter D - Dog', desc: 'Recognition and sound of letter D. Tracing, matching, and songs.' },
    { title: 'Letter E - Elephant', desc: 'Recognition and sound of letter E. Tracing, picture cards, and oral practice.' },
    { title: 'Letter F - Fish', desc: 'Recognition and sound of letter F. Tracing, matching, and songs.' },
    { title: 'Letter G - Grapes', desc: 'Recognition and sound of letter G. Tracing, picture cards, and oral practice.' },
    { title: 'Letter H - Hat', desc: 'Recognition and sound of letter H. Tracing, matching, and songs.' },
    { title: 'Letter I - Ice cream', desc: 'Recognition and sound of letter I. Tracing, picture cards, and oral practice.' },
    { title: 'Letter J - Jug', desc: 'Recognition and sound of letter J. Tracing, matching, and songs.' },
    { title: 'Letter K - Kite', desc: 'Recognition and sound of letter K. Tracing, picture cards, and oral practice.' },
    { title: 'Letter L - Lion', desc: 'Recognition and sound of letter L. Tracing, matching, and songs.' },
    { title: 'Letter M - Mango', desc: 'Recognition and sound of letter M. Tracing, picture cards, and oral practice.' },
  ],
  'Term 2: Letters N-Z': [
    { title: 'Letter N - Nest', desc: 'Recognition and sound of letter N. Tracing, word building, and songs.' },
    { title: 'Letter O - Orange', desc: 'Recognition and sound of letter O. Tracing, picture-word match, and oral practice.' },
    { title: 'Letter P - Parrot', desc: 'Recognition and sound of letter P. Tracing, matching, and songs.' },
    { title: 'Letter Q - Queen', desc: 'Recognition and sound of letter Q. Tracing, picture cards, and oral practice.' },
    { title: 'Letter R - Rabbit', desc: 'Recognition and sound of letter R. Tracing, word building, and songs.' },
    { title: 'Letter S - Sun', desc: 'Recognition and sound of letter S. Tracing, picture-word match, and oral practice.' },
    { title: 'Letter T - Tiger', desc: 'Recognition and sound of letter T. Tracing, matching, and songs.' },
    { title: 'Letter U - Umbrella', desc: 'Recognition and sound of letter U. Tracing, picture cards, and oral practice.' },
    { title: 'Letter V - Van', desc: 'Recognition and sound of letter V. Tracing, word building, and songs.' },
    { title: 'Letter W - Watch', desc: 'Recognition and sound of letter W. Tracing, picture-word match, and oral practice.' },
    { title: 'Letter X - Xylophone', desc: 'Recognition and sound of letter X. Tracing, matching, and songs.' },
    { title: 'Letter Y - Yak', desc: 'Recognition and sound of letter Y. Tracing, picture cards, and oral practice.' },
    { title: 'Letter Z - Zebra', desc: 'Recognition and sound of letter Z. Tracing, word building, and songs.' },
    { title: 'Simple Words: Cat, Dog, Sun, Moon', desc: 'Picture-word matching with simple CVC words. Word building activities.' },
  ],
  'Term 3: Small Letters & Phonics': [
    { title: 'Small Letters a-m', desc: 'Tracing and writing small letters a to m. Practice notebook activities.' },
    { title: 'Small Letters n-z', desc: 'Tracing and writing small letters n to z. Practice notebook activities.' },
    { title: 'Phonics: at, am, an', desc: 'Blending sounds with 2-letter word families. Tap-select activities.' },
    { title: 'Phonics: it, in, ig', desc: 'Blending sounds with 2-letter word families. Drag-drop matching.' },
    { title: 'Phonics: op, ot, og', desc: 'Blending sounds with 2-letter word families. Tracing and oral practice.' },
    { title: 'Phonics: un, ut, ub', desc: 'Blending sounds with 2-letter word families. Word building games.' },
    { title: 'My Name Writing', desc: 'Practice writing own name. Tracing notebook activity.' },
    { title: 'CVC Words: cat, bat, hat', desc: 'Reading and writing simple CVC words. Picture-word match.' },
    { title: 'CVC Words: dog, log, fog', desc: 'Reading and writing simple CVC words. Tracing and oral practice.' },
    { title: 'CVC Words: sun, run, fun', desc: 'Reading and writing simple CVC words. Drag-drop activities.' },
  ],
  'Rhymes & Songs': [
    { title: 'Twinkle Twinkle Little Star', desc: 'Action songs and recitation. Star-themed craft activity.' },
    { title: 'Johnny Johnny Yes Papa', desc: 'Action songs and role play. Sugar-themed craft activity.' },
    { title: 'Rain Rain Go Away', desc: 'Seasonal connection with actions. Umbrella craft activity.' },
    { title: 'Baa Baa Black Sheep', desc: 'Action songs and wool craft activity. Counting wool bags.' },
    { title: 'Humpty Dumpty', desc: 'Action and coordination exercises. Egg-themed craft.' },
    { title: 'Jack and Jill', desc: 'Action and coordination. Water bucket balance activity.' },
  ],
  'Story Time': [
    { title: 'The Lion and the Mouse', desc: 'Picture talk and moral discussion. Kindness craft activity.' },
    { title: 'The Thirsty Crow', desc: 'Picture talk and sequencing. Water drop counting activity.' },
    { title: 'The Hare and the Tortoise', desc: 'Sequencing and role play. Slow-and-steady craft.' },
    { title: 'The Ugly Duckling', desc: 'Sequencing and role play. Swan transformation craft.' },
    { title: 'The Gingerbread Man', desc: 'Prediction and ending change. Cookie craft activity.' },
    { title: 'Little Red Riding Hood', desc: 'Prediction and ending change. Basket craft activity.' },
  ],
};

async function seed() {
  console.log('=== Seeding LKG English Curriculum ===\n');

  // 1. Get CBSE board
  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').single();
  if (!board) throw new Error('CBSE board not found');

  // 2. Get LKG grade
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').single();
  if (!grade) throw new Error('LKG grade not found');

  // 3. Get English subject
  const { data: subject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'english').single();
  if (!subject) throw new Error('English subject not found for LKG');

  console.log(`  Board: ${board.id}`);
  console.log(`  Grade: ${grade.id}`);
  console.log(`  Subject: ${subject.id}\n`);

  // 4. Get active status
  const { data: status } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').single();
  const activeStatusId = status?.id;

  let totalChapters = 0;
  let totalLessons = 0;

  for (const [chapterName, lessons] of Object.entries(CURRICULUM)) {
    // Create or get chapter
    const { data: existingCh } = await supabase
      .from('chapters')
      .select('id')
      .eq('subject_id', subject.id)
      .eq('name', chapterName)
      .is('deleted_at', null)
      .single();

    let chapterId;
    if (existingCh) {
      chapterId = existingCh.id;
      console.log(`  Chapter exists: ${chapterName}`);
    } else {
      const { data: newCh, error: chError } = await supabase
        .from('chapters')
        .insert({ subject_id: subject.id, name: chapterName, sort_order: totalChapters + 1, status_id: activeStatusId })
        .select('id')
        .single();
      if (chError) {
        console.error(`  Failed to create chapter ${chapterName}:`, chError.message);
        continue;
      }
      chapterId = newCh.id;
      console.log(`  Created chapter: ${chapterName}`);
      totalChapters++;
    }

    // Create lessons
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const { data: existingLesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('chapter_id', chapterId)
        .eq('title', lesson.title)
        .is('deleted_at', null)
        .single();

      if (existingLesson) {
        console.log(`    Lesson exists: ${lesson.title}`);
      } else {
        const { error: lError } = await supabase
          .from('lessons')
          .insert({
            chapter_id: chapterId,
            title: lesson.title,
            description: lesson.desc,
            sort_order: i + 1,
            status_id: activeStatusId,
          });
        if (lError) {
          console.error(`    Failed to create lesson ${lesson.title}:`, lError.message);
        } else {
          console.log(`    Created lesson: ${lesson.title}`);
          totalLessons++;
        }
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Chapters created: ${totalChapters}`);
  console.log(`  Lessons created: ${totalLessons}`);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

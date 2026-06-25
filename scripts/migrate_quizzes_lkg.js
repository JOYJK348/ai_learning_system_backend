const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

// Mapping configuration
// We map the deleted lesson title (with its parent chapter name to be safe) to the active lesson ID
const mapping = {
  // Pre-Writing
  'Pre-Writing Foundation -> Standing Line': '703ffacc-b3ed-4d09-9545-62acb0bbb2f0', // Standing Line
  'Pre-Writing Foundation -> Sleeping Line': '9835ad06-b88b-4aaa-8758-83d454490e2d', // Sleeping Line
  'Pre-Writing Foundation -> Slanting Line': '6cea1a29-b401-4624-9285-1f584285bf80', // Left Slanting Line (we map to Left)
  'Pre-Writing Foundation -> Curved Line': 'b582bffa-5fa4-4051-b7c8-7eb26fef9ca2', // Left Curve
  'Pre-Writing Foundation -> Zig-Zag Line': '7df3f844-9372-43d3-9443-417d06c4f7f8', // Right Slanting Line (or similar)

  // Letters A-M Alphabet Introduction & Object Association
  'Alphabet Introduction (A–M) -> Letter A': 'cc407f01-0b1c-484b-9612-f6967469727f', // Letter A - Apple
  'Object Association -> A → Apple': 'cc407f01-0b1c-484b-9612-f6967469727f',
  
  'Alphabet Introduction (A–M) -> Letter B': 'c899b44c-a673-473e-98c6-59dabfe9a121', // Letter B - Ball
  'Object Association -> B → Ball': 'c899b44c-a673-473e-98c6-59dabfe9a121',

  'Alphabet Introduction (A–M) -> Letter C': '3f678a33-c942-41fd-a32c-d1f99041763e', // Letter C - Cat
  'Object Association -> C → Cat': '3f678a33-c942-41fd-a32c-d1f99041763e',

  'Alphabet Introduction (A–M) -> Letter D': '1cda62b8-68dc-4c14-8c46-b9c8cd215893', // Letter D - Dog
  'Object Association -> D → Dog': '1cda62b8-68dc-4c14-8c46-b9c8cd215893',

  'Alphabet Introduction (A–M) -> Letter E': 'd4469fe0-002c-4354-9b6d-e7cff6ac7b20', // Letter E - Elephant
  'Object Association -> E → Elephant': 'd4469fe0-002c-4354-9b6d-e7cff6ac7b20',

  'Alphabet Introduction (A–M) -> Letter F': 'e6dc2a13-74fb-4f05-8972-95c1895765d1', // Letter F - Fish
  'Object Association -> F → Fish': 'e6dc2a13-74fb-4f05-8972-95c1895765d1',

  'Alphabet Introduction (A–M) -> Letter G': 'ae312b70-827f-4113-89ac-d9f1bd89a26d', // Letter G - Grapes
  'Object Association -> G → Grapes': 'ae312b70-827f-4113-89ac-d9f1bd89a26d',

  'Alphabet Introduction (A–M) -> Letter H': 'd67eee5d-e12c-490a-819e-fb013e871115', // Letter H - Hat
  'Object Association -> H → Hen': 'd67eee5d-e12c-490a-819e-fb013e871115',

  'Alphabet Introduction (A–M) -> Letter I': '6d96643f-0d2a-48b3-bf32-6d8403466bfe', // Letter I - Ice cream
  'Object Association -> I → Ice Cream': '6d96643f-0d2a-48b3-bf32-6d8403466bfe',

  'Alphabet Introduction (A–M) -> Letter J': '71ff241d-71c1-44fa-886b-d38e6c929be1', // Letter J - Jug
  'Object Association -> J → Jug': '71ff241d-71c1-44fa-886b-d38e6c929be1',

  'Alphabet Introduction (A–M) -> Letter K': 'adafda0d-8658-4c02-82d4-8cf290fd52f8', // Letter K - Kite
  'Object Association -> K → Kite': 'adafda0d-8658-4c02-82d4-8cf290fd52f8',

  'Alphabet Introduction (A–M) -> Letter L': '541a07fd-9302-4c26-9753-d79583ff43dd', // Letter L - Lion
  'Object Association -> L → Lion': '541a07fd-9302-4c26-9753-d79583ff43dd',

  'Alphabet Introduction (A–M) -> Letter M': 'b90f5a71-dcef-4a2b-925a-3e6d33be6364', // Letter M - Mango
  'Object Association -> M → Mango': 'b90f5a71-dcef-4a2b-925a-3e6d33be6364',

  // Checkpoints
  'Letter Checkpoint -> Find the Letter': 'fba5b58b-a115-4c45-ad62-34c3589575eb', // Pick the Card

  // Chapter 3: Small Letters & Phonics
  'Letter Sounds — Phonics -> Sound A': '4f6a5519-49b2-4910-bb47-46c3db1da14e', // Small Letters a-m
  'Letter Sounds — Phonics -> Sound B': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound C': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound D': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound E': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound F': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound G': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound H': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound I': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound J': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound K': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound L': '4f6a5519-49b2-4910-bb47-46c3db1da14e',
  'Letter Sounds — Phonics -> Sound M': '4f6a5519-49b2-4910-bb47-46c3db1da14e',

  // Vocabulary
  'Vocabulary Building -> My Family': '60569fa2-ef55-4902-80a0-e98c9d7c95ed', // My Name Writing (or similar)
  'Vocabulary Building -> My School': '60569fa2-ef55-4902-80a0-e98c9d7c95ed',

  // Stories
  'Rhymes -> Alphabet Song': 'e337914e-bd6d-4c08-adba-34e48b8469fa', // Twinkle Twinkle
  'Rhymes -> Twinkle Twinkle': 'e337914e-bd6d-4c08-adba-34e48b8469fa',
  'Rhymes -> Johnny Johnny': '714e2f62-c7b7-4c6e-9ff0-09c38ca9e8d5', // Johnny Johnny Yes Papa

  'Listening & Speaking -> My Name': '60569fa2-ef55-4902-80a0-e98c9d7c95ed',
  'Listening & Speaking -> Greetings': '60569fa2-ef55-4902-80a0-e98c9d7c95ed',
  
  'Final Assessment -> Final Mastery Test': '389a705c-d602-4f1e-bae6-7fdb736f3e53', // Pre-Writing Exam (or other checkpoint)
};

async function main() {
  console.log('Fetching all deleted LKG English lessons with questions...');
  
  // Find all deleted lessons with quizzes and questions
  const { data: questions, error: qErr } = await supabase
    .from('quiz_questions')
    .select(`
      id,
      question_text,
      quiz_id,
      quiz:quizzes(
        id,
        title,
        lesson:lessons(
          id,
          title,
          deleted_at,
          chapter:chapters(
            id,
            name,
            deleted_at,
            subject:subjects(name)
          )
        )
      )
    `)
    .is('deleted_at', null);

  if (qErr) {
    console.error(qErr);
    return;
  }

  // Filter for deleted questions we want to migrate
  const toMigrate = [];
  questions.forEach(q => {
    const quiz = q.quiz;
    if (!quiz) return;
    const lesson = quiz.lesson;
    if (!lesson) return;
    
    // Check if the lesson is deleted
    if (lesson.deleted_at || (lesson.chapter && lesson.chapter.deleted_at)) {
      const key = `${lesson.chapter?.name} -> ${lesson.title}`;
      const activeLessonId = mapping[key];
      if (activeLessonId) {
        toMigrate.push({
          questionId: q.id,
          questionText: q.question_text,
          oldQuizId: quiz.id,
          activeLessonId,
          key
        });
      }
    }
  });

  console.log(`Found ${toMigrate.length} questions to migrate.`);

  // Create quizzes for active lessons if they do not exist
  const uniqueActiveLessonIds = [...new Set(toMigrate.map(x => x.activeLessonId))];
  console.log(`Ensuring quizzes exist for ${uniqueActiveLessonIds.length} active lessons...`);

  const activeQuizMap = {}; // lessonId -> quizId
  for (const alId of uniqueActiveLessonIds) {
    // Check if active quiz exists
    const { data: quiz, error: quizFindErr } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('lesson_id', alId)
      .is('deleted_at', null)
      .maybeSingle();

    if (quizFindErr) {
      console.error(`Error finding quiz for lesson ${alId}:`, quizFindErr);
      continue;
    }

    if (quiz) {
      activeQuizMap[alId] = quiz.id;
    } else {
      // Fetch active lesson title
      const { data: activeLesson } = await supabase
        .from('lessons')
        .select('title')
        .eq('id', alId)
        .single();

      const title = `${activeLesson?.title || 'Lesson'} Quiz`;
      console.log(`Creating quiz "${title}" for lesson ID ${alId}...`);

      const { data: newQuiz, error: insertErr } = await supabase
        .from('quizzes')
        .insert({
          lesson_id: alId,
          title,
          status_id: 1
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error(`Error creating quiz for lesson ${alId}:`, insertErr.message);
      } else {
        activeQuizMap[alId] = newQuiz.id;
      }
    }
  }

  // Migrate questions
  console.log('\nMigrating questions to active quizzes...');
  let migratedCount = 0;
  for (const item of toMigrate) {
    const activeQuizId = activeQuizMap[item.activeLessonId];
    if (!activeQuizId) {
      console.log(`Skipping migration for "${item.questionText}" (no active quiz found)`);
      continue;
    }

    // Update quiz_id on quiz_questions
    const { error: updateErr } = await supabase
      .from('quiz_questions')
      .update({ quiz_id: activeQuizId })
      .eq('id', item.questionId);

    if (updateErr) {
      console.error(`Failed to migrate question "${item.questionText}":`, updateErr.message);
    } else {
      migratedCount++;
    }
  }

  console.log(`\nMigration completed. Successfully remapped ${migratedCount} questions!`);
}

main().catch(console.error);

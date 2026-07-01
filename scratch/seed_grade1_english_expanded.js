const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const englishSubjectId = 'bd0b4df6-6f2e-478f-ad4e-c5edd23447ca';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 9 Chapters and their lessons
const curriculum = [
  {
    name: 'Chapter 1: Alphabet & Phonics World 🌈',
    sortOrder: 1,
    lessons: [
      'Alphabet Revision A-Z',
      'Capital & Small Letters',
      'Letter Sounds A-M',
      'Letter Sounds N-Z',
      'Beginning Sounds',
      'Match Letter & Sound'
    ]
  },
  {
    name: 'Chapter 2: Vowels Adventure 🔤',
    sortOrder: 2,
    lessons: [
      'Short Vowel a',
      'Short Vowel e',
      'Short Vowel i',
      'Short Vowel o',
      'Short Vowel u'
    ]
  },
  {
    name: 'Chapter 3: Word Builder Forest 🌲',
    sortOrder: 3,
    lessons: [
      'CVC words - at family',
      'CVC words - an family',
      'CVC words - in family',
      'CVC words - ot family',
      'CVC words - ug family',
      'Build new words'
    ]
  },
  {
    name: 'Chapter 4: Sight Word Street 🏙️',
    sortOrder: 4,
    lessons: [
      'I, am, is, are',
      'the, a, an',
      'this, that',
      'here, there',
      'my, your'
    ]
  },
  {
    name: 'Chapter 5: Naming Words World 👤',
    sortOrder: 5,
    lessons: [
      'People names',
      'Animal names',
      'Things around us',
      'Places',
      'One & Many'
    ]
  },
  {
    name: 'Chapter 6: Grammar Garden 🌱',
    sortOrder: 6,
    lessons: [
      'Nouns',
      'Pronouns',
      'Action words',
      'Describing words',
      'Opposites',
      'Position words'
    ]
  },
  {
    name: 'Chapter 7: Sentence Train 🚂',
    sortOrder: 7,
    lessons: [
      'Two word sentences',
      'Three word sentences',
      'Make simple sentences',
      'Question sentences',
      'Arrange sentence'
    ]
  },
  {
    name: 'Chapter 8: Reading Cave 📖',
    sortOrder: 8,
    lessons: [
      'Picture reading',
      'Small passages',
      'Answer finding',
      'Story sequence',
      'Story understanding'
    ]
  },
  {
    name: 'Chapter 9: Writing Zone ✏️',
    sortOrder: 9,
    lessons: [
      'Letter writing',
      'Word writing',
      'Copy sentence',
      'Complete sentence',
      'Create sentence'
    ]
  }
];

async function run() {
  console.log('Inserting custom activity type 85 into lookup_activity_types...');
  const { error: lookupErr } = await supabase.from('lookup_activity_types').upsert({
    id: 85,
    code: 'grade1_english_game',
    name: 'Grade 1 English Game',
    description: 'Custom Grade 1 interactive activities',
    config_schema: {},
    is_active: true
  });
  if (lookupErr) {
    console.error('Error inserting lookup activity type:', lookupErr);
  }

  console.log('Clearing old chapters, lessons, and quizzes for Grade 1 English...');
  const { data: oldChapters } = await supabase.from('chapters').select('id').eq('subject_id', englishSubjectId);
  if (oldChapters && oldChapters.length > 0) {
    const oldChapterIds = oldChapters.map(c => c.id);
    
    // Fetch lesson IDs to delete activities and quizzes
    const { data: oldLessons } = await supabase.from('lessons').select('id').in('chapter_id', oldChapterIds);
    if (oldLessons && oldLessons.length > 0) {
      const oldLessonIds = oldLessons.map(l => l.id);
      await supabase.from('activities').delete().in('lesson_id', oldLessonIds);
      await supabase.from('quizzes').delete().in('lesson_id', oldLessonIds);
    }
    
    await supabase.from('lessons').delete().in('chapter_id', oldChapterIds);
    await supabase.from('chapters').delete().in('id', oldChapterIds);
  }

  console.log('Seeding 9 Chapters & 48 Lessons...');
  const mapping = [];

  for (const ch of curriculum) {
    const chapterId = uuidv4();

    // 1. Insert Chapter
    const { error: chErr } = await supabase.from('chapters').insert({
      id: chapterId,
      subject_id: englishSubjectId,
      name: ch.name,
      sort_order: ch.sortOrder,
      status_id: 1
    });
    if (chErr) {
      console.error(`Error inserting chapter ${ch.name}:`, chErr);
      continue;
    }

    // 2. Insert Lessons, Quizzes & Activities
    for (let i = 0; i < ch.lessons.length; i++) {
      const lessonTitle = ch.lessons[i];
      const lessonId = uuidv4();
      const quizId = uuidv4();
      const activityId = uuidv4();

      // Insert Lesson
      const { error: lesErr } = await supabase.from('lessons').insert({
        id: lessonId,
        chapter_id: chapterId,
        title: lessonTitle,
        description: `Interactive learning module for ${lessonTitle}`,
        sort_order: i + 1,
        status_id: 1
      });
      if (lesErr) {
        console.error(`Error inserting lesson ${lessonTitle}:`, lesErr);
        continue;
      }

      // Insert Quiz
      const { error: qErr } = await supabase.from('quizzes').insert({
        id: quizId,
        lesson_id: lessonId,
        title: `${lessonTitle} Quiz`,
        description: `Challenge level for ${lessonTitle}`,
        time_limit_seconds: 600,
        difficulty_id: 1,
        sort_order: 1,
        status_id: 1
      });
      if (qErr) {
        console.error(`Error inserting quiz for ${lessonTitle}:`, qErr);
        continue;
      }

      // Insert Practice Activity
      const { error: actErr } = await supabase.from('activities').insert({
        id: activityId,
        lesson_id: lessonId,
        name: `${lessonTitle} Activity`,
        activity_type_id: 85, // Custom Grade 1 English Quiz Player
        config: {},
        sort_order: 1,
        status_id: 1
      });
      if (actErr) {
        console.error(`Error inserting activity for ${lessonTitle}:`, actErr);
        continue;
      }

      mapping.push({
        chapterName: ch.name,
        lessonTitle,
        lessonId,
        quizId
      });
    }
    console.log(`Seeded Chapter: ${ch.name}`);
  }

  console.log('\n--- EXPANDED MAPPINGS FOR grade1QuizData.ts ---');
  console.log(JSON.stringify(mapping, null, 2));
}

run().catch(console.error);

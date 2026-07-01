const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const hindiSubjectId = 'd2ef6924-26fc-42bb-ad13-fac775eb6925';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const curriculum = [
  {
    name: 'Chapter 1: वर्णमाला Revision 🇮🇳',
    sortOrder: 1,
    lessons: [
      'स्वर Revision',
      'व्यंजन Revision',
      'वर्ण पहचान',
      'वर्ण क्रम'
    ]
  },
  {
    name: 'Chapter 2: मात्राएँ ✏️',
    sortOrder: 2,
    lessons: [
      'आ की मात्रा',
      'इ की मात्रा',
      'ई की मात्रा',
      'उ की मात्रा',
      'ऊ की मात्रा',
      'ए, ऐ, ओ, औ की मात्राएँ'
    ]
  },
  {
    name: 'Chapter 3: शब्द निर्माण 🧱',
    sortOrder: 3,
    lessons: [
      'दो अक्षर वाले शब्द',
      'तीन अक्षर वाले शब्द',
      'चार अक्षर वाले शब्द',
      'समान शब्द',
      'शब्द पहचान',
      'शब्द निर्माण'
    ]
  },
  {
    name: 'Chapter 4: शब्द भंडार 🍎',
    sortOrder: 4,
    lessons: [
      'परिवार के शब्द',
      'शरीर के अंग',
      'पशु-पक्षी',
      'फल-सब्जियाँ',
      'रंग और वस्तुएँ'
    ]
  },
  {
    name: 'Chapter 5: व्याकरण 🏫',
    sortOrder: 5,
    lessons: [
      'संज्ञा',
      'क्रिया',
      'एकवचन और बहुवचन',
      'लिंग',
      'शब्द भेद परिचय'
    ]
  },
  {
    name: 'Chapter 6: वाक्य रचना 🚂',
    sortOrder: 6,
    lessons: [
      'सरल वाक्य',
      'शब्दों से वाक्य बनाना',
      'वाक्य क्रम',
      'प्रश्न और उत्तर',
      'छोटा अनुच्छेद'
    ]
  },
  {
    name: 'Chapter 7: पठन कौशल 📖',
    sortOrder: 7,
    lessons: [
      'शब्द पढ़ना',
      'वाक्य पढ़ना',
      'छोटी कहानियाँ',
      'कविता पठन',
      'समझ आधारित प्रश्न'
    ]
  },
  {
    name: 'Chapter 8: लेखन कौशल ✍️',
    sortOrder: 8,
    lessons: [
      'अक्षर लेखन',
      'शब्द लेखन',
      'खाली स्थान भरना',
      'वाक्य लेखन',
      'चित्र आधारित लेखन'
    ]
  },
  {
    name: 'Chapter 9: पुनरावृत्ति और भाषा खेल 🎯',
    sortOrder: 9,
    lessons: [
      'अक्षर अभ्यास',
      'शब्द अभ्यास',
      'वाक्य अभ्यास',
      'कहानी अभ्यास'
    ]
  }
];

async function run() {
  console.log('Clearing old chapters, lessons, and quizzes for Grade 1 Hindi...');
  const { data: oldChapters } = await supabase.from('chapters').select('id').eq('subject_id', hindiSubjectId);
  if (oldChapters && oldChapters.length > 0) {
    const oldChapterIds = oldChapters.map(c => c.id);
    
    const { data: oldLessons } = await supabase.from('lessons').select('id').in('chapter_id', oldChapterIds);
    if (oldLessons && oldLessons.length > 0) {
      const oldLessonIds = oldLessons.map(l => l.id);
      await supabase.from('activities').delete().in('lesson_id', oldLessonIds);
      await supabase.from('quizzes').delete().in('lesson_id', oldLessonIds);
    }
    
    await supabase.from('lessons').delete().in('chapter_id', oldChapterIds);
    await supabase.from('chapters').delete().in('id', oldChapterIds);
  }

  console.log('Seeding 9 Chapters & 46 Lessons for Grade 1 Hindi...');
  const mapping = [];
  let totalLessonsSeeded = 0;

  for (const ch of curriculum) {
    const chapterId = uuidv4();

    // 1. Insert Chapter
    const { error: chErr } = await supabase.from('chapters').insert({
      id: chapterId,
      subject_id: hindiSubjectId,
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
      totalLessonsSeeded++;

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

      // Insert Practice Activity (Grade 1 custom player: activity_type_id 85)
      const { error: actErr } = await supabase.from('activities').insert({
        id: activityId,
        lesson_id: lessonId,
        name: `${lessonTitle} Activity`,
        activity_type_id: 85,
        config: {},
        sort_order: 1,
        status_id: 1
      });
      if (actErr) {
        console.error(`Error inserting activity for ${lessonTitle}:`, actErr);
        continue;
      }

      mapping.push({
        levelNum: totalLessonsSeeded,
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

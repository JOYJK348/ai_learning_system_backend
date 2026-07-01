const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const GRADE_1_NAME = 'Grade 1';
const TAMIL_SUBJECT_CODE = 'tamil';

const TAMIL_CURRICULUM = [
  {
    chapter: 'Chapter 1: எழுத்து உலகம் 🌈',
    lessons: [
      'உயிர் எழுத்து மீள்பார்வை',
      'மெய் எழுத்து மீள்பார்வை',
      'உயிர்மெய் எழுத்துக்கள் அறிமுகம்',
      'உயிர்மெய் சேர்க்கை பயிற்சி',
      'எழுத்து வரிசை அமைத்தல்'
    ]
  },
  {
    chapter: 'Chapter 2: உயிர்மெய் பயணம் 🔤',
    lessons: [
      'க வரிசை',
      'ச வரிசை',
      'த வரிசை',
      'ப வரிசை',
      'ம வரிசை',
      'முழு உயிர்மெய் பயிற்சி'
    ]
  },
  {
    chapter: 'Chapter 3: சொல் கட்டிடம் 🧱',
    lessons: [
      '2 எழுத்து சொற்கள்',
      '3 எழுத்து சொற்கள்',
      'எளிய சொற்கள் வாசித்தல்',
      'படம் பார்த்து சொல் கண்டுபிடித்தல்',
      'சொல் பிரித்தல்',
      'சொல் சேர்த்தல்'
    ]
  },
  {
    chapter: 'Chapter 4: வாசிப்பு உலகம் 📖',
    lessons: [
      'சிறு வாக்கியம் வாசித்தல்',
      'சொல் - படம் இணைத்தல்',
      'கேள்வி பதில்',
      'சிறு கதை புரிதல்',
      'நிகழ்வு வரிசை அமைத்தல்'
    ]
  },
  {
    chapter: 'Chapter 5: இலக்கண தோட்டம் 🌱',
    lessons: [
      'பெயர்ச்சொல் அறிமுகம்',
      'செயல் சொல்',
      'ஒருமை / பன்மை',
      'எதிர்ச்சொற்கள்',
      'சொல் வகைப்படுத்தல்'
    ]
  },
  {
    chapter: 'Chapter 6: எழுதும் பயிற்சி ✏️',
    lessons: [
      'எழுத்து எழுதுதல்',
      'சொல் எழுதுதல்',
      'விடுபட்ட எழுத்து நிரப்புதல்',
      'வாக்கியம் எழுதுதல்',
      'படம் பார்த்து எழுதுதல்'
    ]
  },
  {
    chapter: 'Chapter 7: சொற்களஞ்சியம் 🌍',
    lessons: [
      'உடல் உறுப்புகள்',
      'விலங்குகள்',
      'பறவைகள்',
      'உணவுகள்',
      'சுற்றுப்புற பொருட்கள்'
    ]
  },
  {
    chapter: 'Chapter 8: பாடல் & கதை 🎵',
    lessons: [
      'தமிழ் பாடல்கள்',
      'எளிய கவிதைகள்',
      'சிறு கதைகள்',
      'கதை கருத்து புரிதல்'
    ]
  },
  {
    chapter: 'Chapter 9: மொழி விளையாட்டு 🧠',
    lessons: [
      'சொல் புதிர்',
      'எழுத்து கண்டுபிடி',
      'வாக்கியம் அமைத்தல்',
      'Revision Challenge'
    ]
  }
];

async function main() {
  console.log('Fetching Grade 1 Grade ID and Tamil Subject ID...');
  
  // 1. Get Grade 1 id
  const { data: grades, error: gError } = await supabase.from('grades').select('id, name, code');
  if (gError) throw gError;
  const grade1 = grades.find(g => g.name === GRADE_1_NAME || g.code === 'grade1' || g.code === '1');
  if (!grade1) {
    console.error('Grade 1 not found in grades table.');
    return;
  }
  console.log(`Grade 1 ID: ${grade1.id}`);

  // 2. Get Tamil Subject id for Grade 1
  const { data: subjects, error: sError } = await supabase.from('subjects').select('id, name, code, grade_id');
  if (sError) throw sError;
  const tamilSubject = subjects.find(s => s.grade_id === grade1.id && s.code === TAMIL_SUBJECT_CODE);
  if (!tamilSubject) {
    console.error('Tamil Subject not found for Grade 1.');
    return;
  }
  const subjectId = tamilSubject.id;
  console.log(`Grade 1 Tamil Subject ID: ${subjectId}`);

  // 3. Clear existing chapters/lessons
  console.log('Cleaning up existing chapters and lessons...');
  const { data: existingChapters } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', subjectId);

  const chapterIds = (existingChapters || []).map(c => c.id);

  if (chapterIds.length > 0) {
    console.log(`Deleting records for ${chapterIds.length} existing chapters...`);
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('id')
      .in('chapter_id', chapterIds);
      
    const lessonIds = (existingLessons || []).map(l => l.id);

    if (lessonIds.length > 0) {
      await supabase.from('activities').delete().in('lesson_id', lessonIds);
      await supabase.from('student_activities').delete().in('lesson_id', lessonIds);
      await supabase.from('lesson_progress').delete().in('lesson_id', lessonIds);
      await supabase.from('quiz_attempts').delete().in('lesson_id', lessonIds);
      await supabase.from('lessons').delete().in('id', lessonIds);
    }
    await supabase.from('chapters').delete().in('id', chapterIds);
  }

  // 4. Seed Curriculum
  console.log('\nSeeding Grade 1 Tamil Curriculum...');
  const lessonToIdMap = {};

  for (let cIdx = 0; cIdx < TAMIL_CURRICULUM.length; cIdx++) {
    const chData = TAMIL_CURRICULUM[cIdx];
    console.log(`Inserting Chapter: ${chData.chapter}`);

    const { data: chapter, error: chError } = await supabase
      .from('chapters')
      .insert({
        subject_id: subjectId,
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

      // Seed Activity challenge for each lesson
      const { error: actError } = await supabase
        .from('activities')
        .insert({
          lesson_id: lesson.id,
          name: `${lessonTitle} Game Challenge`,
          activity_type_id: 85, // Grade 1 Custom Activity template
          config: {},
          sort_order: 1
        });

      if (actError) {
        console.error(`Error inserting activity for ${lessonTitle}:`, actError);
      }
    }
  }

  console.log('\nSeeding completed successfully!');
  console.log('Mapping of lesson titles to database UUIDs:');
  console.log(JSON.stringify(lessonToIdMap, null, 2));
}

main().catch(console.error);

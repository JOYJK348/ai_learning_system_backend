const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const subjectId = '12421f15-8c9f-41bf-8c99-38f501b27456'; // UKG Tamil

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const curriculum = [
  {
    chapterName: 'உயிர் எழுத்துக்கள் Revision',
    lessons: [
      { title: 'அ - ஔ அறிமுகம்' },
      { title: 'எழுத்து வரிசைமுறை' }
    ]
  },
  {
    chapterName: 'மெய் எழுத்துக்கள்',
    lessons: [
      { title: 'க் முதல் ன் வரை' },
      { title: 'ஒலி கேட்டுத் தேர்வு' }
    ]
  },
  {
    chapterName: 'உயிர்மெய் எழுத்துக்கள்',
    lessons: [
      { title: 'க முதல் ன வரிசை' },
      { title: 'கா முதல் னா வரிசை' }
    ]
  },
  {
    chapterName: 'எழுத்து சேர்த்தல்',
    lessons: [
      { title: 'ம + ர + ம் = மரம்' },
      { title: 'க + ல் = கல்' }
    ]
  },
  {
    chapterName: 'ஈரெழுத்துச் சொற்கள்',
    lessons: [
      { title: 'ஈரெழுத்து சொற்கள் அறிமுகம்' }
    ]
  },
  {
    chapterName: 'மூவெழுத்துச் சொற்கள்',
    lessons: [
      { title: 'மூவெழுத்து சொற்கள் அறிமுகம்' }
    ]
  },
  {
    chapterName: 'விடுபட்ட எழுத்து',
    lessons: [
      { title: 'கோடிட்ட இடங்களை நிரப்பு' }
    ]
  },
  {
    chapterName: 'படம் பார்த்து சொல்',
    lessons: [
      { title: 'படங்கள் மற்றும் பெயர்கள்' }
    ]
  },
  {
    chapterName: 'முதல் எழுத்து கண்டுபிடி',
    lessons: [
      { title: 'முதல் எழுத்தை கண்டுபிடி' }
    ]
  },
  {
    chapterName: 'ஒலி & எழுத்து',
    lessons: [
      { title: 'ஒலி வடிவங்களை அறிதல்' }
    ]
  },
  {
    chapterName: 'வார்த்தை வாசிப்பு',
    lessons: [
      { title: 'சொற்களை வாசித்தல்' }
    ]
  },
  {
    chapterName: 'சிறு வாக்கியம்',
    lessons: [
      { title: 'எளிய வாக்கியங்கள்' }
    ]
  },
  {
    chapterName: 'கதைகள்',
    lessons: [
      { title: 'சிங்கமும் எலியும்' }
    ]
  },
  {
    chapterName: 'பாடல்கள் / Rhymes',
    lessons: [
      { title: 'தமிழ் மழலையர் பாடல்கள்' }
    ]
  }
];

async function run() {
  console.log('Inserting chapters and lessons for UKG Tamil...');

  let chSort = 1;
  for (const ch of curriculum) {
    const chapterId = uuidv4();
    console.log(`Inserting Chapter ${chSort}: ${ch.chapterName}`);
    
    // Insert chapter
    const { error: chErr } = await supabase
      .from('chapters')
      .insert({
        id: chapterId,
        subject_id: subjectId,
        name: ch.chapterName,
        sort_order: chSort++
      });
    if (chErr) {
      console.error('Error inserting chapter:', chErr);
      continue;
    }

    let lesSort = 1;
    for (const les of ch.lessons) {
      const lessonId = uuidv4();
      console.log(`  Inserting Lesson ${lesSort}: ${les.title}`);

      // Insert lesson
      const { error: lesErr } = await supabase
        .from('lessons')
        .insert({
          id: lessonId,
          chapter_id: chapterId,
          title: les.title,
          description: `Learn about ${les.title} in Tamil`,
          duration_seconds: 300,
          sort_order: lesSort++
        });
      if (lesErr) {
        console.error('Error inserting lesson:', lesErr);
        continue;
      }

      // Insert 1 activity per lesson so it loads correctly
      const activityId = uuidv4();
      const { error: actErr } = await supabase
        .from('activities')
        .insert({
          id: activityId,
          lesson_id: lessonId,
          name: `${les.title} Activity`,
          activity_type_id: 1, // Trace or default
          config: {},
          sort_order: 1
        });
      if (actErr) {
        console.error('Error inserting activity:', actErr);
      }
    }
  }

  // Also auto-unlock Chapter 1 lessons for all students so it shows up unlocked!
  console.log('Auto-unlocking Chapter 1 for all students...');
  const { data: students } = await supabase.from('students').select('id');
  
  // Find all lessons for Chapter 1
  const ch1Query = await supabase.from('chapters').select('id').eq('subject_id', subjectId).eq('sort_order', 1).single();
  const ch1Id = ch1Query.data?.id;

  if (ch1Id) {
    const { data: ch1Lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('chapter_id', ch1Id);

    if (ch1Lessons && students) {
      for (const s of students) {
        for (const l of ch1Lessons) {
          // Check first
          const { data: existing } = await supabase
            .from('lesson_progress')
            .select('id')
            .eq('student_id', s.id)
            .eq('lesson_id', l.id)
            .maybeSingle();
          if (!existing) {
            await supabase
              .from('lesson_progress')
              .insert({
                student_id: s.id,
                lesson_id: l.id,
                status: 'not_started',
                completion_percentage: 0,
                last_accessed_at: new Date().toISOString()
              });
          }
        }
      }
    }
  }

  console.log('Successfully inserted all Chapters, Lessons and Activities for UKG Tamil!');
}

run().catch(console.error);

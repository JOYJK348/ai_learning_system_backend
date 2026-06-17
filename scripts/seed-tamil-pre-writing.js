const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Seeding Tamil Pre-Writing Foundation (Guide + Trace) ===\n');

  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  const { data: traceType } = await supabase.from('lookup_activity_types').select('id').eq('code', 'trace').maybeSingle();
  if (!activeStatus || !traceType) throw new Error('Missing required lookup IDs');

  // Get Tamil subject through board → grade → subject hierarchy
  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').maybeSingle();
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').maybeSingle();
  const { data: tamilSubject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'tamil').maybeSingle();
  if (!tamilSubject) throw new Error('Tamil subject not found');

  // Get or create Pre-Writing Foundation chapter for Tamil
  let chapter;
  
  // First try to find existing chapter
  const { data: existingChapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', tamilSubject.id)
    .eq('name', 'முன் எழுத்து பயிற்சிகள் - Guide & Trace')
    .is('deleted_at', null)
    .maybeSingle();

  if (existingChapter) {
    chapter = existingChapter;
  } else {
    // Create new chapter
    const { data: maxOrder } = await supabase
      .from('chapters')
      .select('sort_order')
      .eq('subject_id', tamilSubject.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrder?.sort_order || 0) + 1;
    const { data: newChapter } = await supabase
      .from('chapters')
      .insert({
        subject_id: tamilSubject.id,
        name: 'முன் எழுத்து பயிற்சிகள் - Guide & Trace',
        sort_order: nextOrder,
        status_id: activeStatus.id
      })
      .select('id')
      .maybeSingle();
    chapter = newChapter;
  }

  console.log(`   Chapter ID: ${chapter.id}`);

  // Tamil line types with Tamil names
  const lines = [
    { title: 'நேர்வரை கோடு', path: 'standing', color: '#6366F1', desc: 'நேர்வரை கோடுகளை வரைய பழகுதல்' },
    { title: 'கிடைக்கோடு', path: 'sleeping', color: '#22C55E', desc: 'கிடைக்கோடுகளை வரைய பழகுதல்' },
    { title: 'சாய்வு கோடு', path: 'slanting', color: '#F59E0B', desc: 'சாய்வு கோடுகளை வரைய பழகுதல்' },
    { title: 'வளைவு கோடு', path: 'curved', color: '#EC4899', desc: 'வளைவு கோடுகளை வரைய பழகுதல்' },
    { title: 'உயர்-தாழ் கோடு', path: 'zigzag', color: '#EF4444', desc: 'உயர்-தாழ் கோடுகளை வரைய பழகுதல்' },
  ];

  for (let si = 0; si < lines.length; si++) {
    const l = lines[si];
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        chapter_id: chapter.id,
        title: l.title,
        description: l.desc,
        sort_order: si + 1,
        status_id: activeStatus.id
      })
      .select('id')
      .maybeSingle();

    if (lessonError) {
      console.error('Lesson insert error:', lessonError);
      throw new Error('Lesson insert failed');
    }

    // Activity 1: Guide trace (fun warm-up with high tolerance)
    await supabase.from('activities').insert({
      lesson_id: lesson.id,
      name: `வழிகாட்டி: ${l.title}`,
      activity_type_id: traceType.id,
      config: { path: l.path, color: l.color, thickness: 8, tolerance: 15, mode: 'guide' },
      sort_order: 1,
      status_id: activeStatus.id
    });

    // Activity 2: Real trace (stricter)
    await supabase.from('activities').insert({
      lesson_id: lesson.id,
      name: `வரைய பயிற்சி: ${l.title}`,
      activity_type_id: traceType.id,
      config: { path: l.path, color: l.color, thickness: 6, tolerance: 15 },
      sort_order: 2,
      status_id: activeStatus.id
    });

    console.log(`   ✓ ${l.title}: வழிகாட்டி → வரைய பயிற்சி`);
  }

  // Exam lesson
  const { data: examLesson } = await supabase
    .from('lessons')
    .insert({
      chapter_id: chapter.id,
      title: 'முன் எழுத்து தேர்வு',
      description: 'ஒவ்வொரு கோட்டையும் வரைந்து தேர்வை முடிக்கவும்!',
      sort_order: 6,
      status_id: activeStatus.id
    })
    .select('id')
    .maybeSingle();

  const examTraces = [
    { name: 'நேர்வரை தேர்வு', path: 'standing', color: '#6366F1' },
    { name: 'கிடைக்கோடு தேர்வு', path: 'sleeping', color: '#22C55E' },
    { name: 'சாய்வு தேர்வு', path: 'slanting', color: '#F59E0B' },
    { name: 'வளைவு தேர்வு', path: 'curved', color: '#EC4899' },
    { name: 'உயர்-தாழ் தேர்வு', path: 'zigzag', color: '#EF4444' },
  ];

  for (let ei = 0; ei < examTraces.length; ei++) {
    const t = examTraces[ei];
    await supabase.from('activities').insert({
      lesson_id: examLesson.id,
      name: t.name,
      activity_type_id: traceType.id,
      config: { path: t.path, color: t.color, thickness: 6, tolerance: 15 },
      sort_order: ei + 1,
      status_id: activeStatus.id
    });
  }

  console.log(`   ✓ முன் எழுத்து தேர்வு: 5 வரைய பயிற்சிகள்`);

  console.log(`\n=== Tamil Pre-Writing Foundation Seeded! ===`);
  console.log('   பாடம் 1-5: வழிகாட்டி வரைய பயிற்சி → உண்மையான வரைய பயிற்சி');
  console.log('   பாடம் 6: 5 வரைய பயிற்சிகளுடன் தேர்வு\n');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});

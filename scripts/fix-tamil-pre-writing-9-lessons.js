const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Replacing Tamil Pre-Writing with 9 Lessons ===\n');

  const { data: activeStatus } = await supabase.from('lookup_entity_status').select('id').eq('code', 'active').maybeSingle();
  const { data: traceType } = await supabase.from('lookup_activity_types').select('id').eq('code', 'tracing').maybeSingle();
  
  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').maybeSingle();
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').maybeSingle();
  const { data: tamilSubject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'tamil').maybeSingle();

  // Find the exact chapter "முன் எழுத்து பயிற்சிகள்"
  const { data: chapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', tamilSubject.id)
    .eq('name', 'முன் எழுத்து பயிற்சிகள்')
    .is('deleted_at', null)
    .maybeSingle();

  if (!chapter) throw new Error('Chapter not found');

  console.log(`Deleting existing lessons for chapter ${chapter.id}...`);
  // Delete existing lessons and activities for this chapter
  const { data: oldLessons } = await supabase.from('lessons').select('id').eq('chapter_id', chapter.id);
  if (oldLessons && oldLessons.length > 0) {
    for (const oldLesson of oldLessons) {
      await supabase.from('activities').delete().eq('lesson_id', oldLesson.id);
    }
    await supabase.from('lessons').delete().eq('chapter_id', chapter.id);
  }

  const lines = [
    { title: 'நேர்கோடு', path: 'standing', color: '#6366F1', desc: 'நேர்கோட்டை வரையப் பழகுங்கள்!' },
    { title: 'படுக்கைகோடு', path: 'sleeping', color: '#22C55E', desc: 'படுக்கைகோட்டை வரையப் பழகுங்கள்!' },
    { title: 'இடது சாய்வுகோடு', path: 'left-slanting', color: '#06B6D4', desc: 'இடது சாய்வுகோட்டை வரையப் பழகுங்கள்!' },
    { title: 'வலது சாய்வுகோடு', path: 'right-slanting', color: '#F59E0B', desc: 'வலது சாய்வுகோட்டை வரையப் பழகுங்கள்!' },
    { title: 'இடது வளைவு', path: 'left-curve', color: '#EC4899', desc: 'இடது வளைவை வரையப் பழகுங்கள்!' },
    { title: 'வலது வளைவு', path: 'right-curve', color: '#8B5CF6', desc: 'வலது வளைவை வரையப் பழகுங்கள்!' },
    { title: 'மேல் வளைவு', path: 'up-curve', color: '#EF4444', desc: 'மேல் வளைவை வரையப் பழகுங்கள்!' },
    { title: 'கீழ் வளைவு', path: 'down-curve', color: '#10B981', desc: 'கீழ் வளைவை வரையப் பழகுங்கள்!' },
  ];

  for (let si = 0; si < lines.length; si++) {
    const l = lines[si];
    const { data: lesson, error: err } = await supabase
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

    if (err) throw err;

    await supabase.from('activities').insert({
      lesson_id: lesson.id,
      name: `${l.title} Tracing`,
      activity_type_id: traceType.id,
      config: { shapes: [l.path], color: l.color, thickness: 4 },
      sort_order: 1,
      status_id: activeStatus.id
    });
    console.log(`✓ Inserted: ${l.title}`);
  }

  // 9th lesson: Exam
  const { data: examLesson, error: examErr } = await supabase
    .from('lessons')
    .insert({
      chapter_id: chapter.id,
      title: 'முன்-எழுத்து தேர்வு',
      description: 'அனைத்து வரிகளையும் வரைந்து தேர்வை முடிக்கவும்!',
      sort_order: 9,
      status_id: activeStatus.id
    })
    .select('id')
    .maybeSingle();

  if (examErr) throw examErr;

  const examTraces = [
    { path: 'standing', color: '#6366F1' },
    { path: 'sleeping', color: '#22C55E' },
    { path: 'left-slanting', color: '#06B6D4' },
    { path: 'right-slanting', color: '#F59E0B' },
    { path: 'left-curve', color: '#EC4899' },
    { path: 'right-curve', color: '#8B5CF6' },
  ];

  for (let ei = 0; ei < examTraces.length; ei++) {
    const t = examTraces[ei];
    await supabase.from('activities').insert({
      lesson_id: examLesson.id,
      name: `Exam Trace ${ei + 1}`,
      activity_type_id: traceType.id,
      config: { shapes: [t.path], color: t.color, thickness: 4 },
      sort_order: ei + 1,
      status_id: activeStatus.id
    });
  }

  console.log(`✓ Inserted: முன்-எழுத்து தேர்வு`);
  console.log('\n=== Done replacing with 9 lessons! ===');
}

main().catch(console.error);

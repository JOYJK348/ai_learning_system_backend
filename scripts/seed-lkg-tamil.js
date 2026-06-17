const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

// LKG Tamil curriculum
// Using simple English identifiers to avoid Tamil char issues in JS parser
const CHAPTER_DATA = [
  {
    name: 'Pre-Writing Strokes',
    lessons: [
      { title: 'Ner vara lines', desc: 'Standing & Sleeping lines practice', activities: [{ name: 'Line Trace', type: 'tracing', config: { shapes: ['standing', 'sleeping'], color: '#6366F1', thickness: 4 } }] },
      { title: 'Slanting & Curve lines', desc: 'Slanting & Curved lines practice', activities: [{ name: 'Slant Trace', type: 'tracing', config: { shapes: ['left-slanting', 'right-slanting', 'left-curve', 'right-curve'], color: '#22C55E', thickness: 4 } }] },
    ],
  },
  {
    name: 'Uyir Ezhuthukkal A-Uu',
    lessons: [
      {
        title: 'Aa Aa Ii Eee Uu Uuu', desc: 'Learn Tamil vowels Aa-Auu',
        activities: [
          { name: 'Trace Vowels 1', type: 'tracing', config: { letters: ['A', 'AA', 'E', 'EE', 'U', 'UU'], color: '#FF6B35', thickness: 3 } },
          { name: 'Find Letter 1', type: 'tap_select', config: { prompt: 'Tap letter Aa', options: [{ id: 'A', label: 'Aa' }, { id: 'AA', label: 'Aa2' }, { id: 'E', label: 'E' }, { id: 'U', label: 'U' }], correct_id: 'A' } },
        ],
        quizzes: [{
          title: 'Vowels 1 Quiz', questions: [
            { text: 'Which is the first Tamil letter?', options: [{ text: 'Aa', correct: true }, { text: 'Aa2', correct: false }, { text: 'E', correct: false }] },
          ],
        }],
      },
    ],
  },
  {
    name: 'Uyir Ezhuthukkal E-Au',
    lessons: [
      {
        title: 'Eh Eh Ai Oh Oh Ow', desc: 'Learn Tamil vowels Eh-Ow',
        activities: [
          { name: 'Trace Vowels 2', type: 'tracing', config: { letters: ['EH', 'EEH', 'AI', 'OH', 'OOH', 'OW'], color: '#22C55E', thickness: 3 } },
          { name: 'Find Letter 2', type: 'tap_select', config: { prompt: 'Tap letter Eh', options: [{ id: 'EH', label: 'Eh' }, { id: 'EEH', label: 'Eeh' }, { id: 'AI', label: 'Ai' }, { id: 'OH', label: 'Oh' }], correct_id: 'EH' } },
        ],
      },
    ],
  },
  {
    name: 'Mei Ezhuthukkal - Part 1',
    lessons: [
      { title: 'Ka Nga Cha Nya', desc: 'Learn consonants starting with Ka', activities: [{ name: 'Conso Match 1', type: 'match', config: { pairs: [{ letter: 'Ka', sound: 'Ka' }, { letter: 'Nga', sound: 'Nga' }, { letter: 'Cha', sound: 'Cha' }, { letter: 'Nya', sound: 'Nya' }] } }] },
      { title: 'Ta Na Tha Na', desc: 'Learn consonants Ta - Na', activities: [{ name: 'Conso Find 1', type: 'tap_select', config: { prompt: 'Tap letter Ta', options: [{ id: 'Ta', label: 'Ta' }, { id: 'Na', label: 'Na' }, { id: 'Tha', label: 'Tha' }, { id: 'N2', label: 'Na2' }], correct_id: 'Ta' } }] },
      { title: 'Pa Ma', desc: 'Learn consonants Pa & Ma', activities: [{ name: 'Conso Match 2', type: 'match', config: { pairs: [{ letter: 'Pa', word: 'Bird' }, { letter: 'Ma', word: 'Tree' }] } }] },
    ],
  },
  {
    name: 'Mei Ezhuthukkal - Part 2',
    lessons: [
      { title: 'Ya Ra La Va', desc: 'Learn consonants Ya - Va', activities: [{ name: 'Conso Match 3', type: 'match', config: { pairs: [{ letter: 'Ya', word: 'Elephant' }, { letter: 'Ra', word: 'Rose' }, { letter: 'La', word: 'Lakshmi' }, { letter: 'Va', word: 'Beetle' }] } }] },
      { title: 'Zha La Ra Na', desc: 'Learn remaining consonants', activities: [{ name: 'Conso Find 2', type: 'tap_select', config: { prompt: 'Tap letter Zha', options: [{ id: 'Zha', label: 'Zha' }, { id: 'La2', label: 'La2' }, { id: 'Ra2', label: 'Ra2' }, { id: 'Na3', label: 'Na3' }], correct_id: 'Zha' } }] },
    ],
  },
  {
    name: 'Simple Words',
    lessons: [
      { title: 'Amma Appa Adu Oor', desc: 'Simple Tamil words', activities: [{ name: 'Word Match', type: 'match', config: { pairs: [{ word: 'Amma', emoji: 'Mama' }, { word: 'Appa', emoji: 'Papa' }, { word: 'Aadu', emoji: 'Goat' }, { word: 'Oor', emoji: 'Town' }] } }] },
      { title: 'Eli Kadigaram', desc: 'More easy words', activities: [{ name: 'Word Find', type: 'tap_select', config: { prompt: 'Find Eli (Mouse)', options: [{ id: 'Eli', label: 'Mouse' }, { id: 'Eni', label: 'Ladder' }, { id: 'Ottagam', label: 'Camel' }, { id: 'Odu', label: 'Tile' }], correct_id: 'Eli' } }] },
    ],
  },
  {
    name: 'Paadalgal & Kathaigal',
    lessons: [
      { title: 'One Day One Egg', desc: 'Popular Tamil rhyme' },
      { title: 'Two Little Chicks', desc: 'Tamil kids rhyme about chicks' },
    ],
  },
];

const ACTIVITY_TYPE_MAP = { tracing: 1, drag_drop: 2, match: 3, tap_select: 4, video: 5 };

async function seed() {
  console.log('=== Seeding LKG Tamil Curriculum ===\n');

  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').single();
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').single();
  const { data: subject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'tamil').single();
  if (!subject) { console.log('Creating Tamil subject...'); }

  const { data: statuses } = await supabase.from('lookup_entity_status').select('id, code');
  const activeId = statuses.find(s => s.code === 'active').id;
  const { data: activityTypes } = await supabase.from('lookup_activity_types').select('id, code');
  const { data: questionTypes } = await supabase.from('lookup_question_types').select('id, code');
  const { data: difficulties } = await supabase.from('lookup_difficulty_levels').select('id, code');
  const mcqId = questionTypes?.find(t => t.code === 'mcq_single')?.id;
  const easyId = difficulties?.find(d => d.code === 'easy')?.id;
  const getTypeId = (code) => activityTypes?.find(t => t.code === code)?.id;

  const { data: maxCh } = await supabase.from('chapters').select('sort_order').eq('subject_id', subject.id).is('deleted_at', null).order('sort_order', { ascending: false }).limit(1).maybeSingle();
  let sortOrder = (maxCh?.sort_order || 0) + 1;

  let total = { ch: 0, ls: 0, acts: 0, quizzes: 0, questions: 0 };

  for (const chData of CHAPTER_DATA) {
    const { data: existing } = await supabase.from('chapters').select('id').eq('subject_id', subject.id).eq('name', chData.name).is('deleted_at', null).maybeSingle();
    if (existing) { console.log(`  Already exists: ${chData.name}`); continue; }

    const { data: chapter, error: chErr } = await supabase.from('chapters').insert({
      subject_id: subject.id, name: chData.name, sort_order: sortOrder, status_id: activeId,
    }).select('id').single();

    if (chErr) { console.error(`  Failed: ${chData.name}: ${chErr.message}`); continue; }
    console.log(`  Created: ${sortOrder}. ${chData.name}`);
    total.ch++; sortOrder++;

    for (let li = 0; li < chData.lessons.length; li++) {
      const ls = chData.lessons[li];
      const { data: lesson, error: lErr } = await supabase.from('lessons').insert({
        chapter_id: chapter.id, title: ls.title, description: ls.desc,
        youtube_video_id: 'Z0PzUJ1x1Mw', thumbnail_url: 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg',
        duration_seconds: 120, sort_order: li + 1, status_id: activeId,
      }).select('id').single();

      if (lErr) { console.error(`  Lesson failed: ${lErr.message}`); continue; }
      console.log(`  -> ${ls.title}`);
      total.ls++;

      for (let ai = 0; ai < (ls.activities || []).length; ai++) {
        const act = ls.activities[ai];
        const typeId = getTypeId(act.type);
        if (!typeId) continue;
        await supabase.from('activities').insert({
          lesson_id: lesson.id, name: act.name, activity_type_id: typeId,
          config: act.config, sort_order: ai + 1, status_id: activeId,
        });
        total.acts++;
      }

      for (const quiz of (ls.quizzes || [])) {
        const { data: qz } = await supabase.from('quizzes').insert({
          lesson_id: lesson.id, title: quiz.title, description: quiz.title,
          time_limit_seconds: 60, difficulty_id: easyId, sort_order: 1, status_id: activeId,
        }).select('id').single();
        total.quizzes++;
        for (let qi = 0; qi < quiz.questions.length; qi++) {
          const q = quiz.questions[qi];
          const { data: qq } = await supabase.from('quiz_questions').insert({
            quiz_id: qz.id, question_text: q.text, question_type_id: mcqId,
            points: 10, sort_order: qi + 1, status_id: activeId,
          }).select('id').single();
          total.questions++;
          for (let oi = 0; oi < q.options.length; oi++) {
            await supabase.from('quiz_options').insert({
              question_id: qq.id, option_text: q.options[oi].text,
              is_correct: q.options[oi].correct, sort_order: oi + 1,
            });
          }
        }
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Chapters: ${total.ch}, Lessons: ${total.ls}, Activities: ${total.acts}, Quizzes: ${total.quizzes}, Questions: ${total.questions}`);
}

seed().catch(e => { console.error(e); process.exit(1); });

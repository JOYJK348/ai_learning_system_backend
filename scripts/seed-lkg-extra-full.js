const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const CHAPTER_DATA = {
  'Colors': {
    sort_order: 10,
    lessons: [
      {
        title: 'Red, Blue, Yellow, Green',
        desc: 'Learn to identify red, blue, yellow and green colors',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Color Match', type: 'match', config: { pairs: [{ color: 'Red', item: 'Apple' }, { color: 'Blue', item: 'Sky' }, { color: 'Yellow', item: 'Sun' }, { color: 'Green', item: 'Grass' }] } },
          { name: 'Tap the Color', type: 'tap_select', config: { prompt: 'Tap the color Red', options: [{ id: 'red', label: '🔴 Red' }, { id: 'blue', label: '🔵 Blue' }, { id: 'yellow', label: '🟡 Yellow' }, { id: 'green', label: '🟢 Green' }], correct_id: 'red' } },
        ],
        quizzes: [
          { title: 'Colors 1 Quiz', questions: [
            { text: 'What color is the sky?', options: [{ text: 'Red', correct: false }, { text: 'Blue', correct: true }, { text: 'Green', correct: false }] },
            { text: 'What color is the sun?', options: [{ text: 'Blue', correct: false }, { text: 'Green', correct: false }, { text: 'Yellow', correct: true }] },
            { text: 'An apple is ___?', options: [{ text: 'Red', correct: true }, { text: 'Blue', correct: false }, { text: 'Yellow', correct: false }] },
          ]},
        ],
      },
      {
        title: 'Orange, Purple, Pink, Brown',
        desc: 'Learn orange, purple, pink and brown colors',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Color Hunt', type: 'tap_select', config: { prompt: 'Tap the color Orange', options: [{ id: 'orange', label: '🟠 Orange' }, { id: 'purple', label: '🟣 Purple' }, { id: 'pink', label: '🩷 Pink' }, { id: 'brown', label: '🟤 Brown' }], correct_id: 'orange' } },
        ],
        quizzes: [
          { title: 'Colors 2 Quiz', questions: [
            { text: 'A carrot is ___?', options: [{ text: 'Pink', correct: false }, { text: 'Purple', correct: false }, { text: 'Orange', correct: true }] },
            { text: 'A frog is ___?', options: [{ text: 'Brown', correct: false }, { text: 'Green', correct: true }, { text: 'Orange', correct: false }] },
          ]},
        ],
      },
      {
        title: 'White, Black & Color Review',
        desc: 'Learn white, black, gray and review all colors',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Color Sorting', type: 'drag_drop', config: { pairs: [{ color: '🟡', label: 'Yellow' }, { color: '🔴', label: 'Red' }, { color: '🔵', label: 'Blue' }, { color: '🟢', label: 'Green' }, { color: '🟠', label: 'Orange' }] } },
        ],
        quizzes: [
          { title: 'All Colors Quiz', questions: [
            { text: 'A polar bear is ___?', options: [{ text: 'Brown', correct: false }, { text: 'White', correct: true }, { text: 'Gray', correct: false }] },
            { text: 'Night sky is ___?', options: [{ text: 'White', correct: false }, { text: 'Blue', correct: false }, { text: 'Black', correct: true }] },
          ]},
        ],
      },
    ],
  },
  'Shapes': {
    sort_order: 11,
    lessons: [
      {
        title: 'Circle, Square, Triangle',
        desc: 'Learn to identify circles, squares and triangles',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Shape Match', type: 'match', config: { pairs: [{ shape: 'Circle', emoji: '⭕' }, { shape: 'Square', emoji: '⬜' }, { shape: 'Triangle', emoji: '🔺' }] } },
          { name: 'Find the Shape', type: 'tap_select', config: { prompt: 'Tap the Circle', options: [{ id: 'circle', label: '⭕ Circle' }, { id: 'square', label: '⬜ Square' }, { id: 'triangle', label: '🔺 Triangle' }], correct_id: 'circle' } },
        ],
        quizzes: [
          { title: 'Shapes 1 Quiz', questions: [
            { text: 'A ball is which shape?', options: [{ text: 'Square', correct: false }, { text: 'Circle', correct: true }, { text: 'Triangle', correct: false }] },
            { text: 'How many sides does a triangle have?', options: [{ text: '2', correct: false }, { text: '3', correct: true }, { text: '4', correct: false }] },
            { text: 'A clock is shaped like a ___?', options: [{ text: 'Square', correct: false }, { text: 'Triangle', correct: false }, { text: 'Circle', correct: true }] },
          ]},
        ],
      },
      {
        title: 'Rectangle, Star, Diamond, Heart, Oval',
        desc: 'Learn more shapes: rectangle, star, diamond, heart, oval',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Shape Hunt', type: 'tap_select', config: { prompt: 'Tap the Star', options: [{ id: 'star', label: '⭐ Star' }, { id: 'diamond', label: '💎 Diamond' }, { id: 'heart', label: '❤️ Heart' }, { id: 'oval', label: '🥚 Oval' }], correct_id: 'star' } },
        ],
        quizzes: [
          { title: 'Shapes 2 Quiz', questions: [
            { text: 'A door is shaped like a ___?', options: [{ text: 'Circle', correct: false }, { text: 'Rectangle', correct: true }, { text: 'Triangle', correct: false }] },
            { text: 'Which shape is in the sky at night?', options: [{ text: 'Heart', correct: false }, { text: 'Diamond', correct: false }, { text: 'Star', correct: true }] },
          ]},
        ],
      },
    ],
  },
  'Fruits & Vegetables': {
    sort_order: 12,
    lessons: [
      {
        title: 'Fruits - Apple, Banana, Mango, Orange, Grapes',
        desc: 'Learn names of common fruits',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Fruit Match', type: 'match', config: { pairs: [{ fruit: 'Apple', emoji: '🍎' }, { fruit: 'Banana', emoji: '🍌' }, { fruit: 'Mango', emoji: '🥭' }, { fruit: 'Orange', emoji: '🍊' }, { fruit: 'Grapes', emoji: '🍇' }] } },
          { name: 'Find the Fruit', type: 'tap_select', config: { prompt: 'Tap the Banana', options: [{ id: 'apple', label: '🍎 Apple' }, { id: 'banana', label: '🍌 Banana' }, { id: 'orange', label: '🍊 Orange' }, { id: 'grapes', label: '🍇 Grapes' }], correct_id: 'banana' } },
        ],
        quizzes: [
          { title: 'Fruits Quiz', questions: [
            { text: 'Which fruit is red and round?', options: [{ text: 'Banana', correct: false }, { text: 'Apple', correct: true }, { text: 'Grapes', correct: false }] },
            { text: 'Which fruit is yellow and long?', options: [{ text: 'Banana', correct: true }, { text: 'Orange', correct: false }, { text: 'Mango', correct: false }] },
          ]},
        ],
      },
      {
        title: 'Vegetables - Carrot, Tomato, Potato, Onion, Cabbage',
        desc: 'Learn names of common vegetables',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Vegetable Match', type: 'match', config: { pairs: [{ veg: 'Carrot', emoji: '🥕' }, { veg: 'Tomato', emoji: '🍅' }, { veg: 'Potato', emoji: '🥔' }, { veg: 'Onion', emoji: '🧅' }, { veg: 'Cabbage', emoji: '🥬' }] } },
        ],
        quizzes: [
          { title: 'Vegetables Quiz', questions: [
            { text: 'Which vegetable is orange and long?', options: [{ text: 'Tomato', correct: false }, { text: 'Carrot', correct: true }, { text: 'Potato', correct: false }] },
            { text: 'Which vegetable is red and round?', options: [{ text: 'Onion', correct: false }, { text: 'Cabbage', correct: false }, { text: 'Tomato', correct: true }] },
            { text: 'French fries are made from ___?', options: [{ text: 'Carrot', correct: false }, { text: 'Potato', correct: true }, { text: 'Onion', correct: false }] },
          ]},
        ],
      },
    ],
  },
  'Animals': {
    sort_order: 13,
    lessons: [
      {
        title: 'Domestic Animals',
        desc: 'Learn about animals that live with us - cow, dog, cat, hen, horse',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Animal Sounds', type: 'match', config: { pairs: [{ animal: 'Cow', sound: 'Moo 🐄' }, { animal: 'Dog', sound: 'Woof 🐕' }, { animal: 'Cat', sound: 'Meow 🐱' }, { animal: 'Hen', sound: 'Cluck 🐔' }, { animal: 'Horse', sound: 'Neigh 🐴' }] } },
          { name: 'Find the Animal', type: 'tap_select', config: { prompt: 'Tap the Cat', options: [{ id: 'cow', label: '🐄 Cow' }, { id: 'dog', label: '🐕 Dog' }, { id: 'cat', label: '🐱 Cat' }, { id: 'hen', label: '🐔 Hen' }], correct_id: 'cat' } },
        ],
        quizzes: [
          { title: 'Domestic Animals Quiz', questions: [
            { text: 'Which animal says Moo?', options: [{ text: 'Dog', correct: false }, { text: 'Cow', correct: true }, { text: 'Cat', correct: false }] },
            { text: 'Which animal gives us milk?', options: [{ text: 'Hen', correct: false }, { text: 'Dog', correct: false }, { text: 'Cow', correct: true }] },
            { text: 'A puppy is a baby ___?', options: [{ text: 'Cat', correct: false }, { text: 'Dog', correct: true }, { text: 'Horse', correct: false }] },
          ]},
        ],
      },
      {
        title: 'Wild Animals',
        desc: 'Learn about wild animals - lion, tiger, elephant, giraffe, monkey',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Wild Animal Match', type: 'match', config: { pairs: [{ animal: 'Lion', desc: '👑 King of jungle' }, { animal: 'Elephant', desc: '🐘 Big and strong' }, { animal: 'Giraffe', desc: '🦒 Tall neck' }, { animal: 'Monkey', desc: '🐒 Jumps on trees' }] } },
          { name: 'Guess the Wild Animal', type: 'tap_select', config: { prompt: 'Which animal is the king of the jungle?', options: [{ id: 'lion', label: '🦁 Lion' }, { id: 'tiger', label: '🐯 Tiger' }, { id: 'bear', label: '🐻 Bear' }, { id: 'zebra', label: '🦓 Zebra' }], correct_id: 'lion' } },
        ],
        quizzes: [
          { title: 'Wild Animals Quiz', questions: [
            { text: 'Which animal has a long trunk?', options: [{ text: 'Lion', correct: false }, { text: 'Elephant', correct: true }, { text: 'Monkey', correct: false }] },
            { text: 'Which animal has black and white stripes?', options: [{ text: 'Giraffe', correct: false }, { text: 'Tiger', correct: false }, { text: 'Zebra', correct: true }] },
            { text: 'Which animal has the longest neck?', options: [{ text: 'Giraffe', correct: true }, { text: 'Elephant', correct: false }, { text: 'Bear', correct: false }] },
          ]},
        ],
      },
    ],
  },
  'Body Parts': {
    sort_order: 14,
    lessons: [
      {
        title: 'Head, Eyes, Nose, Ears, Mouth',
        desc: 'Learn about the parts on your face',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Body Parts Match', type: 'match', config: { pairs: [{ part: 'Eyes', action: '👀 See' }, { part: 'Nose', action: '👃 Smell' }, { part: 'Ears', action: '👂 Hear' }, { part: 'Mouth', action: '👄 Speak & Eat' }, { part: 'Head', action: '🧠 Think' }] } },
          { name: 'Tap the Body Part', type: 'tap_select', config: { prompt: 'What do you use to see?', options: [{ id: 'eyes', label: '👀 Eyes' }, { id: 'ears', label: '👂 Ears' }, { id: 'nose', label: '👃 Nose' }, { id: 'mouth', label: '👄 Mouth' }], correct_id: 'eyes' } },
        ],
        quizzes: [
          { title: 'Face Parts Quiz', questions: [
            { text: 'Which part do you use to smell a flower?', options: [{ text: 'Eyes', correct: false }, { text: 'Nose', correct: true }, { text: 'Ears', correct: false }] },
            { text: 'Which part do you use to hear music?', options: [{ text: 'Ears', correct: true }, { text: 'Eyes', correct: false }, { text: 'Mouth', correct: false }] },
            { text: 'Which part do you use to eat food?', options: [{ text: 'Nose', correct: false }, { text: 'Ears', correct: false }, { text: 'Mouth', correct: true }] },
          ]},
        ],
      },
      {
        title: 'Hands, Legs, Knees, Toes',
        desc: 'Learn about your body from head to toe',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Body Movement Match', type: 'match', config: { pairs: [{ part: 'Hands', action: '✋ Hold & Wave' }, { part: 'Legs', action: '🦵 Walk & Run' }, { part: 'Knees', action: '🦵 Bend' }, { part: 'Toes', action: '🦶 Wiggle' }] } },
          { name: 'Head Shoulders Song Tap', type: 'tap_select', config: { prompt: 'Touch your ___!', options: [{ id: 'head', label: '🧠 Head' }, { id: 'shoulders', label: '💪 Shoulders' }, { id: 'knees', label: '🦵 Knees' }, { id: 'toes', label: '🦶 Toes' }], correct_id: 'head' } },
        ],
        quizzes: [
          { title: 'Body Parts Quiz', questions: [
            { text: 'What do you use to clap?', options: [{ text: 'Feet', correct: false }, { text: 'Hands', correct: true }, { text: 'Knees', correct: false }] },
            { text: 'What do you use to run?', options: [{ text: 'Hands', correct: false }, { text: 'Legs', correct: true }, { text: 'Eyes', correct: false }] },
            { text: 'How many hands do you have?', options: [{ text: 'One', correct: false }, { text: 'Two', correct: true }, { text: 'Four', correct: false }] },
          ]},
        ],
      },
    ],
  },
  'My Family & Myself': {
    sort_order: 15,
    lessons: [
      {
        title: 'Myself - My Name, Age',
        desc: 'Learn to introduce yourself - name, age, and feelings',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'All About Me', type: 'tap_select', config: { prompt: 'What is your name?', options: [{ id: 'name', label: 'My name is ___' }, { id: 'age', label: 'I am ___ years old' }, { id: 'feel', label: 'I am happy! 😊' }], correct_id: 'name' } },
          { name: 'Feelings Match', type: 'match', config: { pairs: [{ feeling: 'Happy', emoji: '😊' }, { feeling: 'Sad', emoji: '😢' }, { feeling: 'Angry', emoji: '😡' }, { feeling: 'Sleepy', emoji: '😴' }] } },
        ],
        quizzes: [
          { title: 'Myself Quiz', questions: [
            { text: 'When you smile, you are ___?', options: [{ text: 'Sad', correct: false }, { text: 'Happy', correct: true }, { text: 'Angry', correct: false }] },
            { text: 'A boy is called ___?', options: [{ text: 'She', correct: false }, { text: 'He', correct: true }, { text: 'It', correct: false }] },
            { text: 'A girl is called ___?', options: [{ text: 'She', correct: true }, { text: 'He', correct: false }, { text: 'It', correct: false }] },
          ]},
        ],
      },
      {
        title: 'My Family - Mommy, Daddy, Siblings, Grandparents',
        desc: 'Learn about your family members',
        youtube_id: 'Z0PzUJ1x1Mw',
        activities: [
          { name: 'Family Match', type: 'match', config: { pairs: [{ member: 'Mommy', emoji: '👩' }, { member: 'Daddy', emoji: '👨' }, { member: 'Brother', emoji: '👦' }, { member: 'Sister', emoji: '👧' }, { member: 'Grandpa', emoji: '👴' }, { member: 'Grandma', emoji: '👵' }] } },
          { name: 'Who is this?', type: 'tap_select', config: { prompt: 'Who cooks food for you at home?', options: [{ id: 'mommy', label: '👩 Mommy' }, { id: 'daddy', label: '👨 Daddy' }, { id: 'grandma', label: '👵 Grandma' }, { id: 'brother', label: '👦 Brother' }], correct_id: 'mommy' } },
        ],
        quizzes: [
          { title: 'My Family Quiz', questions: [
            { text: 'Your mother\'s mother is your ___?', options: [{ text: 'Grandma', correct: true }, { text: 'Mommy', correct: false }, { text: 'Sister', correct: false }] },
            { text: 'Your parents\' son is your ___?', options: [{ text: 'Sister', correct: false }, { text: 'Brother', correct: true }, { text: 'Daddy', correct: false }] },
            { text: 'How many parents do you have?', options: [{ text: 'One', correct: false }, { text: 'Two', correct: true }, { text: 'Three', correct: false }] },
          ]},
        ],
      },
    ],
  },
};

async function seedFull() {
  console.log('=== Seeding LKG English Extra Chapters (Full with Activities + Quizzes) ===\n');

  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').single();
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').single();
  const { data: subject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'english').single();
  if (!subject) throw new Error('LKG English subject not found');

  const { data: statuses } = await supabase.from('lookup_entity_status').select('id, code');
  const activeId = statuses.find(s => s.code === 'active').id;

  const { data: activityTypes } = await supabase.from('lookup_activity_types').select('id, code');
  const { data: questionTypes } = await supabase.from('lookup_question_types').select('id, code');
  const { data: difficulties } = await supabase.from('lookup_difficulty_levels').select('id, code');
  const mcqId = questionTypes.find(t => t.code === 'mcq_single').id;
  const easyId = difficulties.find(d => d.code === 'easy').id;

  const getTypeId = (code) => activityTypes.find(t => t.code === code).id;

  let totalCh = 0, totalLessons = 0, totalActivities = 0, totalQuizzes = 0, totalQuestions = 0;

  for (const [chName, chData] of Object.entries(CHAPTER_DATA)) {
    const { data: chapter } = await supabase
      .from('chapters')
      .select('id')
      .eq('subject_id', subject.id)
      .eq('name', chName)
      .is('deleted_at', null)
      .single();

    if (!chapter) {
      console.log(`  ❌ Chapter not found: ${chName} — run seed-lkg-extra-chapters.js first`);
      continue;
    }

    console.log(`\n  📂 Chapter: ${chName}`);
    totalCh++;

    for (const lesson of chData.lessons) {
      const { data: existingLesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('chapter_id', chapter.id)
        .eq('title', lesson.title)
        .is('deleted_at', null)
        .maybeSingle();

      let lessonId;
      if (existingLesson) {
        lessonId = existingLesson.id;
      } else {
        const { data: newLesson, error: lErr } = await supabase
          .from('lessons')
          .insert({
            chapter_id: chapter.id,
            title: lesson.title,
            description: lesson.desc,
            youtube_video_id: lesson.youtube_id,
            thumbnail_url: `https://img.youtube.com/vi/${lesson.youtube_id}/hqdefault.jpg`,
            duration_seconds: 120,
            sort_order: chData.lessons.indexOf(lesson) + 1,
            status_id: activeId,
          })
          .select('id')
          .single();

        if (lErr) { console.error(`    ❌ Lesson error: ${lErr.message}`); continue; }
        lessonId = newLesson.id;
      }

      console.log(`    📖 ${lesson.title}`);
      totalLessons++;

      // Activities
      for (let ai = 0; ai < lesson.activities.length; ai++) {
        const act = lesson.activities[ai];
        const typeId = getTypeId(act.type);
        await supabase.from('activities').insert({
          lesson_id: lessonId,
          name: act.name,
          activity_type_id: typeId,
          config: act.config,
          sort_order: ai + 1,
          status_id: activeId,
        });
        totalActivities++;
      }

      // Quizzes
      for (const quiz of (lesson.quizzes || [])) {
        const { data: newQuiz, error: qErr } = await supabase
          .from('quizzes')
          .insert({
            lesson_id: lessonId,
            title: quiz.title,
            description: quiz.title,
            time_limit_seconds: 60,
            difficulty_id: easyId,
            sort_order: 1,
            status_id: activeId,
          })
          .select('id')
          .single();

        if (qErr) { console.error(`      ❌ Quiz error: ${qErr.message}`); continue; }
        totalQuizzes++;

        for (let qi = 0; qi < quiz.questions.length; qi++) {
          const q = quiz.questions[qi];
          const { data: newQ, error: qqErr } = await supabase
            .from('quiz_questions')
            .insert({
              quiz_id: newQuiz.id,
              question_text: q.text,
              question_type_id: mcqId,
              points: 10,
              sort_order: qi + 1,
              status_id: activeId,
            })
            .select('id')
            .single();

          if (qqErr) { console.error(`        ❌ Question error: ${qqErr.message}`); continue; }
          totalQuestions++;

          for (let oi = 0; oi < q.options.length; oi++) {
            const opt = q.options[oi];
            await supabase.from('quiz_options').insert({
              question_id: newQ.id,
              option_text: opt.text,
              is_correct: opt.correct,
              sort_order: oi + 1,
            });
          }
        }
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Chapters: ${totalCh}`);
  console.log(`  Lessons: ${totalLessons}`);
  console.log(`  Activities: ${totalActivities}`);
  console.log(`  Quizzes: ${totalQuizzes}`);
  console.log(`  Questions: ${totalQuestions}`);
}

seedFull().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

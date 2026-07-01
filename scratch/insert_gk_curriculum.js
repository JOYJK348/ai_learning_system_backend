const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

const gkGrade1SubjectId = '41d7c420-118c-46ef-ae2f-bea4e87cca7f';

const curriculum = [
  {
    name: 'Chapter 1: My Amazing World 🌍',
    lessons: [
      'Myself & My Surroundings',
      'My Country India 🇮🇳',
      'States & Capitals (basic intro)',
      'National Symbols',
      'Important Places in India'
    ]
  },
  {
    name: 'Chapter 2: Animal Kingdom 🐾',
    lessons: [
      'Wild Animals',
      'Domestic Animals',
      'Sea Animals',
      'Baby Animals',
      'Animal Homes'
    ]
  },
  {
    name: 'Chapter 3: Bird & Insect World 🐦',
    lessons: [
      'Common Birds',
      'Bird Features',
      'Flying & Non Flying Birds',
      'Insects Around Us',
      'Useful Insects'
    ]
  },
  {
    name: 'Chapter 4: Plant World 🌱',
    lessons: [
      'Parts of Plant',
      'Types of Plants',
      'Trees & Flowers',
      'Fruits & Vegetables',
      'Uses of Plants'
    ]
  },
  {
    name: 'Chapter 5: Science Around Us 🔬',
    lessons: [
      'Five Senses',
      'Living & Non Living Things',
      'Day & Night',
      'Weather Basics',
      'Water & Air'
    ]
  },
  {
    name: 'Chapter 6: People & Community 👥',
    lessons: [
      'Community Helpers',
      'Doctor, Teacher, Police',
      'Places Around Us',
      'Good Habits',
      'Safety Rules'
    ]
  },
  {
    name: 'Chapter 7: Transport & Communication 🚗',
    lessons: [
      'Land Transport',
      'Water Transport',
      'Air Transport',
      'Communication Tools',
      'Road Safety'
    ]
  },
  {
    name: 'Chapter 8: Fun Knowledge Zone 🧠',
    lessons: [
      'Colours & Shapes Around Us',
      'Festivals',
      'Food Around World',
      'Sports Basics',
      'Space Intro (Sun, Moon, Stars)'
    ]
  }
];

async function main() {
  console.log('Inserting chapters and lessons for Grade 1 GK (without is_unlocked)...');
  
  for (let cIdx = 0; cIdx < curriculum.length; cIdx++) {
    const ch = curriculum[cIdx];
    console.log(`Inserting Chapter: ${ch.name}...`);
    
    const { data: chapterData, error: chErr } = await supabase
      .from('chapters')
      .insert({
        subject_id: gkGrade1SubjectId,
        name: ch.name,
        sort_order: cIdx + 1
      })
      .select('id')
      .single();

    if (chErr) throw chErr;
    const chapterId = chapterData.id;

    for (let lIdx = 0; lIdx < ch.lessons.length; lIdx++) {
      const title = ch.lessons[lIdx];
      
      const { data: lessonData, error: lErr } = await supabase
        .from('lessons')
        .insert({
          chapter_id: chapterId,
          title,
          sort_order: lIdx + 1
        })
        .select('id, title');
      
      if (lErr) throw lErr;
      console.log(`  - Inserted Lesson: ${title} (${lessonData[0].id})`);
    }
  }
  console.log('All chapters and lessons successfully inserted!');
}

main().catch(console.error);

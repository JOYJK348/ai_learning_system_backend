const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

const evsGrade1SubjectId = 'af6d4525-1390-489f-9d50-9cfd8b0ed59f';

const curriculum = [
  {
    name: 'Chapter 1: Myself & My Body 🧒',
    lessons: [
      'My Body Parts Revision',
      'Sense Organs & Their Uses',
      'Healthy Food Habits',
      'Cleanliness & Personal Hygiene',
      'Exercise & Good Habits'
    ]
  },
  {
    name: 'Chapter 2: My Family & Relationships 👨‍👩‍👧',
    lessons: [
      'Types of Families',
      'Family Members & Roles',
      'Helping at Home',
      'Respect & Sharing',
      'My Daily Routine'
    ]
  },
  {
    name: 'Chapter 3: Food & Nutrition 🍎',
    lessons: [
      'Types of Food',
      'Healthy & Unhealthy Food',
      'Fruits & Vegetables',
      'Food Sources',
      'Balanced Meal Basics'
    ]
  },
  {
    name: 'Chapter 4: Plants Around Us 🌱',
    lessons: [
      'Parts of Plant',
      'What Plants Need',
      'Types of Plants',
      'Uses of Plants',
      'Saving Plants'
    ]
  },
  {
    name: 'Chapter 5: Animal World 🐾',
    lessons: [
      'Domestic Animals',
      'Wild Animals',
      'Animal Homes',
      'Animal Food Habits',
      'Caring for Animals'
    ]
  },
  {
    name: 'Chapter 6: Our Environment 🌍',
    lessons: [
      'Living & Non Living Things',
      'Air Around Us',
      'Water Around Us',
      'Weather Changes',
      'Save Environment'
    ]
  },
  {
    name: 'Chapter 7: My Neighbourhood 🏡',
    lessons: [
      'Places Around Us',
      'Community Helpers',
      'School & Rules',
      'Public Places',
      'Safety Around Us'
    ]
  },
  {
    name: 'Chapter 8: Transport & Communication 🚗',
    lessons: [
      'Land Transport',
      'Water Transport',
      'Air Transport',
      'Road Safety Rules',
      'Communication Methods'
    ]
  },
  {
    name: 'Chapter 9: Festivals & World Around Us 🎉',
    lessons: [
      'National Festivals',
      'Different Cultures',
      'Seasons',
      'Earth & Sky Basics',
      'Caring for Nature'
    ]
  }
];

async function main() {
  console.log('Querying existing Grade 1 EVS chapters to clean duplicates...');
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('subject_id', evsGrade1SubjectId)
    .is('deleted_at', null);

  if (chapters && chapters.length > 0) {
    const chIds = chapters.map(c => c.id);
    console.log('Deleting existing EVS lessons...');
    await supabase.from('lessons').delete().in('chapter_id', chIds);
    console.log('Deleting existing EVS chapters...');
    await supabase.from('chapters').delete().in('id', chIds);
  }

  console.log('Inserting chapters and lessons for Grade 1 EVS...');
  
  for (let cIdx = 0; cIdx < curriculum.length; cIdx++) {
    const ch = curriculum[cIdx];
    console.log(`Inserting Chapter: ${ch.name}...`);
    
    const { data: chapterData, error: chErr } = await supabase
      .from('chapters')
      .insert({
        subject_id: evsGrade1SubjectId,
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
  console.log('All EVS chapters and lessons successfully inserted!');
}

main().catch(console.error);

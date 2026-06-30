const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const subjectId = '05989731-b502-40f8-bbfb-b81055399d68'; // UKG General Knowledge

const CURRICULUM = [
  {
    chapter: 'Myself & My World',
    lessons: [
      { title: 'My Details', desc: 'Identify your name, age, birthday, and school name.' },
      { title: 'My Likes & Hobbies', desc: 'Explore favorite games, toys, and activities.' },
      { title: 'Good Habits', desc: 'Learn core habits like cleanliness, sharing, and helping others.' }
    ]
  },
  {
    chapter: 'Animal Kingdom',
    lessons: [
      { title: 'Animal Groups', desc: 'Learn groups: pet, wild, and farm animals.' },
      { title: 'Animal Homes', desc: 'Identify homes like nest, den, kennel, and stable.' },
      { title: 'Animal Babies', desc: 'Match animal parents to their babies.' },
      { title: 'Animal Sounds', desc: 'Match animals to their sounds: roar, bark, etc.' }
    ]
  },
  {
    chapter: 'Birds & Insects',
    lessons: [
      { title: 'Birds Around Us', desc: 'Identify common birds: sparrow, crow, parrot, peacock.' },
      { title: 'Bird Features', desc: 'Learn key avian traits: wings, beak, and feathers.' },
      { title: 'Insects', desc: 'Learn about crawling insects: butterfly, bee, ant.' }
    ]
  },
  {
    chapter: 'Nature World',
    lessons: [
      { title: 'Living & Non-Living', desc: 'Differentiate things that live and grow from objects.' },
      { title: 'Plants Around Us', desc: 'Identify trees, flowers, and fruits.' },
      { title: 'Natural Resources', desc: 'Explore nature resources: water, air, and sunlight.' }
    ]
  },
  {
    chapter: 'Earth & Environment',
    lessons: [
      { title: 'Our Earth', desc: 'Learn resource categories: land and water.' },
      { title: 'Save Environment', desc: 'Discover saving water, keeping clean, and pollution (clean/dirty).' }
    ]
  },
  {
    chapter: 'Transport & Communication',
    lessons: [
      { title: 'Transport Types', desc: 'Explore travel ways: land, water, and air.' },
      { title: 'Vehicles & Uses', desc: 'Learn vehicle roles: ambulance, fire truck, bus.' },
      { title: 'Communication', desc: 'Discover message tools: phone, letter, computer.' }
    ]
  },
  {
    chapter: 'Community Helpers',
    lessons: [
      { title: 'Helpers Around Us', desc: 'Recognize helpers: doctor, teacher, police officer, farmer.' },
      { title: 'Tools & Helpers', desc: 'Match helper tools (e.g. stethoscope to doctor).' }
    ]
  },
  {
    chapter: 'India Awareness',
    lessons: [
      { title: 'National Symbols', desc: 'Learn national flag, animal, bird, and flower.' },
      { title: 'Important Places', desc: 'Explore important settings: school, hospital, park.' },
      { title: 'Festivals', desc: 'Discover festivals: Diwali, Pongal, Christmas, Eid.' }
    ]
  },
  {
    chapter: 'Thinking GK',
    lessons: [
      { title: 'Odd One Out', desc: 'Find the item that does not belong in the group.' },
      { title: 'Find Missing', desc: 'Complete sequence gaps and spot missing parts.' },
      { title: 'Same / Different', desc: 'Compare objects and find matches or anomalies.' },
      { title: 'Memory Challenge', desc: 'Match pairs and check recall.' }
    ]
  },
  {
    chapter: 'Colors, Shapes & Patterns',
    lessons: [
      { title: 'Color Identification', desc: 'Identify basic colors and match them.' },
      { title: 'Shape Around Us', desc: 'Locate shapes in ordinary objects.' },
      { title: 'Pattern Finding', desc: 'Identify patterns in simple sequences.' }
    ]
  }
];

async function seed() {
  console.log('Cleaning existing chapters/lessons for UKG GK...');
  const { data: oldChaps } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', subjectId);

  if (oldChaps && oldChaps.length > 0) {
    const ids = oldChaps.map(c => c.id);
    const { error: delErr } = await supabase
      .from('chapters')
      .delete()
      .in('id', ids);

    if (delErr) {
      console.error('Error clearing old chapters:', delErr.message);
      return;
    }
    console.log(`Cleared ${ids.length} old chapters and cascade deleted their lessons/activities.`);
  }

  console.log('Seeding UKG GK curriculum...');

  for (let chIdx = 0; chIdx < CURRICULUM.length; chIdx++) {
    const item = CURRICULUM[chIdx];
    const chapterId = uuidv4();

    console.log(`Inserting Chapter [${chIdx + 1}/${CURRICULUM.length}]: ${item.chapter}`);
    const { error: chErr } = await supabase
      .from('chapters')
      .insert({
        id: chapterId,
        subject_id: subjectId,
        name: item.chapter,
        sort_order: chIdx + 1
      });

    if (chErr) {
      console.error('Error inserting chapter:', chErr.message);
      continue;
    }

    for (let lesIdx = 0; lesIdx < item.lessons.length; lesIdx++) {
      const les = item.lessons[lesIdx];
      const lessonId = uuidv4();

      console.log(`  -> Inserting Lesson: ${les.title}`);
      const { error: lesErr } = await supabase
        .from('lessons')
        .insert({
          id: lessonId,
          chapter_id: chapterId,
          title: les.title,
          description: les.desc,
          sort_order: lesIdx + 1
        });

      if (lesErr) {
        console.error('Error inserting lesson:', lesErr.message);
        continue;
      }

      // Insert 1 activity per lesson to enable start/launch
      const activityId = uuidv4();
      const { error: actErr } = await supabase
        .from('activities')
        .insert({
          id: activityId,
          lesson_id: lessonId,
          name: `${les.title} Activity`,
          activity_type_id: 1, // Default activity type to override
          config: {},
          sort_order: 1
        });

      if (actErr) {
        console.error('Error inserting activity:', actErr.message);
      }
    }
  }

  console.log('🎉 Successfully seeded UKG GK curriculum with activities!');
}

seed().catch(console.error);

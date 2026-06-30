const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const subjectId = '79755520-f506-4f3d-9791-d2b5af4d1a6b'; // UKG Environmental Studies

const CURRICULUM = [
  {
    chapter: 'Myself – Advanced',
    lessons: [
      { title: 'My Personal Details', desc: 'Learn to write and recognize your details like name, age, and school name.' },
      { title: 'Body Parts & Functions', desc: 'Identify organs and how they function: eyes to see, ears to hear.' },
      { title: 'My Healthy Routine', desc: 'Learn daily self-care habits for a healthy body.' }
    ]
  },
  {
    chapter: 'Sense Organs',
    lessons: [
      { title: 'The Five Senses', desc: 'Explore the 5 senses and match sense organs to their objects.' }
    ]
  },
  {
    chapter: 'Food & Nutrition',
    lessons: [
      { title: 'Food Groups & Nutrition', desc: 'Explore food groups: fruits, vegetables, grains and healthy habits.' },
      { title: 'Healthy Eating & Sources', desc: 'Understand where our food comes from: plants and animals.' }
    ]
  },
  {
    chapter: 'Plants',
    lessons: [
      { title: 'Parts of a Plant', desc: 'Learn basic plant anatomy: root, stem, leaf, flower, fruit.' },
      { title: 'What Plants Need to Grow', desc: 'Discover how plants use water, air, and sunlight to grow.' }
    ]
  },
  {
    chapter: 'Animals',
    lessons: [
      { title: 'Domestic & Wild Animals', desc: 'Differentiate between wild animals and domestic animals.' },
      { title: 'Herbivores & Carnivores', desc: 'Introduction to what animals eat: plant-eaters vs meat-eaters.' },
      { title: 'Animals & Their Babies', desc: 'Match animal parents to their offspring.' }
    ]
  },
  {
    chapter: 'Birds & Insects',
    lessons: [
      { title: 'Wings, Beaks & Feathers', desc: 'Discover features of birds: wings, beaks, and feathers.' },
      { title: 'Insects & Their Features', desc: 'Learn about insects, their 6 legs, and basic traits.' }
    ]
  },
  {
    chapter: 'Environment',
    lessons: [
      { title: 'Living & Non-Living Things', desc: 'Learn the core differences between living organisms and non-living objects.' }
    ]
  },
  {
    chapter: 'Weather & Seasons',
    lessons: [
      { title: 'Types of Weather', desc: 'Identify weather types: sunny, rainy, windy, cloudy.' },
      { title: 'Changes of Seasons', desc: 'Explore the season cycle and appropriate clothing.' }
    ]
  },
  {
    chapter: 'Community & Places',
    lessons: [
      { title: 'Important Community Places', desc: 'Learn about places: hospital, bank, post office, fire station.' },
      { title: 'Our Helpful Helpers', desc: 'Understand roles of community helpers and what happens there.' }
    ]
  },
  {
    chapter: 'Safety Rules',
    lessons: [
      { title: 'Traffic Signals & Road Safety', desc: 'Learn traffic light colors, road crossing, and sidewalk rules.' },
      { title: 'Safety Rules & Emergencies', desc: 'Understand indoor/outdoor safety rules and emergency numbers.' }
    ]
  },
  {
    chapter: 'Daily Life Activities',
    lessons: [
      { title: 'Morning Routine Order', desc: 'Wake up, brush, eat, and school: arrange routine steps in order.' },
      { title: 'Time Ordering & Routine', desc: 'Order daily events and understand day-time transitions.' }
    ]
  },
  {
    chapter: 'Our Earth',
    lessons: [
      { title: 'Land, Water & Air', desc: 'Learn about our planet resources: land, water bodies, and atmosphere.' },
      { title: 'Protecting Our Nature', desc: 'Discover simple actions to save water, reduce waste, and protect trees.' }
    ]
  }
];

async function seed() {
  console.log('Cleaning existing chapters/lessons for UKG EVS...');
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

  console.log('Seeding UKG EVS curriculum...');

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

  console.log('🎉 Successfully seeded UKG EVS level up curriculum with activities!');
}

seed().catch(console.error);

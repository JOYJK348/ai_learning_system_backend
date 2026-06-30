const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
  });
} catch (e) {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SUBJECT_ID = '7a0e45b8-95a5-4ece-99bd-1a6b2ba8fb9a'; // UKG Mathematics

const CURRICULUM = [
  {
    chapter_name: 'Chapter 1: Number Readiness & Counting',
    lessons: [
      { title: 'Number Recognition 1 to 50', description: 'Practice recognizing numbers up to 50.' },
      { title: 'Number Recognition 51 to 100', description: 'Practice recognizing numbers up to 100.' },
      { title: 'Counting Objects (1-20)', description: 'Count objects and find the correct total.' },
      { title: 'Count and Write', description: 'Count the items and match them to their numbers.' },
      { title: 'Number Names (1-20)', description: 'Learn spelling of numbers from 1 to 20.' },
      { title: 'Missing Numbers (1-100)', description: 'Fill in the blanks on number grids.' },
      { title: 'Before, After and Between', description: 'Identify numbers that come before, after, or in between.' },
    ]
  },
  {
    chapter_name: 'Chapter 2: Addition Basics',
    lessons: [
      { title: 'Addition Using Objects', description: 'Combine objects together and count the sum.' },
      { title: 'Single Digit Addition', description: 'Solve simple additions like 2 + 3 = 5.' },
      { title: 'Number Bonds', description: 'Find pairs of numbers that add up to 10.' },
    ]
  },
  {
    chapter_name: 'Chapter 3: Subtraction Basics',
    lessons: [
      { title: 'Taking Away Concept', description: 'Understand the concept of taking items away.' },
      { title: 'Subtraction Using Objects', description: 'Remove objects from a group and count the remaining.' },
      { title: 'Simple Subtraction', description: 'Practice simple single-digit subtraction.' },
    ]
  },
  {
    chapter_name: 'Chapter 4: Comparing Numbers',
    lessons: [
      { title: 'More and Less Groups', description: 'Compare groups of items to find which is more or less.' },
      { title: 'Greater Than, Smaller Than', description: 'Compare numbers using comparison concepts.' },
      { title: 'Equal Groups', description: 'Identify groups with the same number of items.' },
    ]
  },
  {
    chapter_name: 'Chapter 5: Measurement',
    lessons: [
      { title: 'Long and Short', description: 'Compare lengths of different items.' },
      { title: 'Thick and Thin', description: 'Understand thickness comparisons.' },
      { title: 'Heavy & Light, Full & Empty', description: 'Learn about weight and volume concepts.' },
    ]
  },
  {
    chapter_name: 'Chapter 6: Shapes (Advanced)',
    lessons: [
      { title: 'Flat Shapes: Rectangle & Oval', description: 'Learn about rectangles and ovals.' },
      { title: 'Special Shapes: Star & Diamond', description: 'Identify stars and diamonds.' },
      { title: 'Shape Puzzles & Drawing', description: 'Draw and assemble various shapes.' },
    ]
  },
  {
    chapter_name: 'Chapter 7: Position & Direction',
    lessons: [
      { title: 'Inside / Outside & Up / Down', description: 'Learn standard directions and positions.' },
      { title: 'Above / Below & Left / Right', description: 'Practice recognizing position relative to objects.' },
      { title: 'Front / Behind & Near / Far', description: 'Identify spatial relationships.' },
    ]
  },
  {
    chapter_name: 'Chapter 8: Patterns',
    lessons: [
      { title: 'AB and ABC Patterns', description: 'Recognize and extend simple patterns.' },
      { title: 'Shape and Object Patterns', description: 'Complete shape-based sequences.' },
    ]
  },
  {
    chapter_name: 'Chapter 9: Sorting & Classification',
    lessons: [
      { title: 'Sorting by Color and Shape', description: 'Group similar objects by their look.' },
      { title: 'Sorting by Size and Quantity', description: 'Group objects by dimensions.' },
    ]
  },
  {
    chapter_name: 'Chapter 10: Time & Calendar Basics',
    lessons: [
      { title: 'Day / Night & Days of Week', description: 'Learn standard calendar terms.' },
      { title: 'Months & Today / Tomorrow', description: 'Understand standard timelines.' },
      { title: 'Clock Recognition (O\'clock)', description: 'Learn to read simple time on a clock.' },
    ]
  },
  {
    chapter_name: 'Chapter 11: Money Basics',
    lessons: [
      { title: 'Identify Coins and Notes', description: 'Recognize standard currency.' },
      { title: 'Matching Money Values', description: 'Match items to their currency values.' },
    ]
  },
  {
    chapter_name: 'Chapter 12: Data Handling',
    lessons: [
      { title: 'Introduction to Picture Graphs', description: 'Represent data using simple pictures.' },
      { title: 'Reading and Comparing Graphs', description: 'Answer questions based on simple charts.' },
    ]
  }
];

async function seed() {
  console.log('Seeding UKG Mathematics...');

  // 1. Delete existing chapters (cascade deletes lessons, progress, activity, activity_attempts)
  const { data: existingChapters } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', SUBJECT_ID);

  if (existingChapters && existingChapters.length > 0) {
    const chIds = existingChapters.map(c => c.id);
    // find lessons
    const { data: existingLessons } = await supabase.from('lessons').select('id').in('chapter_id', chIds);
    const lesIds = existingLessons?.map(l => l.id) ?? [];
    if (lesIds.length > 0) {
      const { data: existingActivities } = await supabase.from('activities').select('id').in('lesson_id', lesIds);
      const actIds = existingActivities?.map(a => a.id) ?? [];
      if (actIds.length > 0) {
        await supabase.from('activity_attempts').delete().in('activity_id', actIds);
        await supabase.from('activities').delete().in('id', actIds);
      }
      await supabase.from('lesson_progress').delete().in('lesson_id', lesIds);
      await supabase.from('lessons').delete().in('id', lesIds);
    }
    await supabase.from('chapters').delete().in('id', chIds);
    console.log('Cleared existing chapters and related tables.');
  }

  // 2. Insert chapters, lessons, and activities
  for (let cIdx = 0; cIdx < CURRICULUM.length; cIdx++) {
    const chapData = CURRICULUM[cIdx];
    
    // Insert chapter
    const { data: chapter, error: chapErr } = await supabase
      .from('chapters')
      .insert({
        subject_id: SUBJECT_ID,
        name: chapData.chapter_name,
        sort_order: cIdx + 1
      })
      .select()
      .single();

    if (chapErr) {
      console.error(`Error inserting chapter ${chapData.chapter_name}:`, chapErr);
      continue;
    }
    console.log(`Inserted chapter: ${chapter.name}`);

    for (let lIdx = 0; lIdx < chapData.lessons.length; lIdx++) {
      const lesData = chapData.lessons[lIdx];
      
      // Insert lesson
      const { data: lesson, error: lesErr } = await supabase
        .from('lessons')
        .insert({
          chapter_id: chapter.id,
          title: lesData.title,
          description: lesData.description,
          sort_order: lIdx + 1
        })
        .select()
        .single();

      if (lesErr) {
        console.error(`Error inserting lesson ${lesData.title}:`, lesErr);
        continue;
      }

      // Insert mock activity for each lesson so UI has something to reference in DB
      const { error: actErr } = await supabase
        .from('activities')
        .insert({
          lesson_id: lesson.id,
          name: `${lesData.title} Activity`,
          activity_type_id: 8, // Quiz type in DB
          config: {},
          sort_order: 1
        });

      if (actErr) {
        console.error(`Error inserting activity for lesson ${lesson.title}:`, actErr);
      }
    }
  }

  console.log('Seeding completed successfully!');
}

seed().catch(console.error);

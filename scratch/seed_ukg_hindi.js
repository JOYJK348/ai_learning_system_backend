const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const subjectId = '6a0b068c-8e05-4373-aa9b-246494ce8c15'; // UKG Hindi

const CURRICULUM = [
  {
    chapter: 'स्वर (Vowels) Revision',
    lessons: [
      { title: 'स्वर पहचान', desc: 'Revision of Hindi vowels from अ to अः.' },
      { title: 'स्वर लिखना', desc: 'Practice tracing and writing Hindi vowels.' },
      { title: 'स्वर + Picture', desc: 'Match vowels to their picture words like अ से अनार, आ से आम.' }
    ]
  },
  {
    chapter: 'व्यंजन (Consonants)',
    lessons: [
      { title: 'क - ज्ञ basic recognition', desc: 'Recognize Hindi consonants from क to ज्ञ.' },
      { title: 'व्यंजन लिखना', desc: 'Trace and write consonants from क to ज्ञ.' },
      { title: 'अक्षर पहचान', desc: 'Consonant identification game like find क.' }
    ]
  },
  {
    chapter: 'अक्षर जोड़ना (Letter Joining)',
    lessons: [
      { title: 'Two letter words', desc: 'Join two letters to read simple words like घर, जल, फल.' },
      { title: 'अक्षर मिलाओ', desc: 'Connect letters like क + म = कम.' }
    ]
  },
  {
    chapter: 'शब्द निर्माण (Word Formation)',
    lessons: [
      { title: 'Missing letter', desc: 'Fill in the missing letter to complete words (e.g. क _ ल).' },
      { title: 'Arrange letters', desc: 'Unscramble letters to make meaningful words (e.g. ल क -> कल).' },
      { title: 'Complete the word', desc: 'Identify the object and write or complete the word.' }
    ]
  },
  {
    chapter: 'मात्रा Introduction (Basic)',
    lessons: [
      { title: 'ा मात्रा', desc: 'Learn the "aa" maatras like क + ा = का.' },
      { title: 'ि / ी मात्रा', desc: 'Learn the short and long "i" and "ee" maatras.' },
      { title: 'ु / ू मात्रा', desc: 'Learn the short and long "u" and "oo" maatras.' }
    ]
  },
  {
    chapter: 'Reading Practice',
    lessons: [
      { title: 'Simple words reading', desc: 'Practice reading words like कमल, मछली, गमला.' },
      { title: 'Word + Picture', desc: 'Read a word and match it with the correct picture.' }
    ]
  },
  {
    chapter: 'Simple Sentences',
    lessons: [
      { title: 'यह फल है।', desc: 'Read and understand basic sentences like यह फल है.' },
      { title: 'राम खेलता है।', desc: 'Read and understand simple action sentences.' },
      { title: 'मेरा घर।', desc: 'Simple description sentences reading.' }
    ]
  },
  {
    chapter: 'Picture Vocabulary',
    lessons: [
      { title: 'Animals & Fruits', desc: 'Hindi names for common animals and fruits.' },
      { title: 'Colors & Body parts', desc: 'Hindi names for colors and human body parts.' },
      { title: 'Objects', desc: 'Identify household objects in Hindi (e.g. हाथी for elephant).' }
    ]
  },
  {
    chapter: 'Rhymes & Stories',
    lessons: [
      { title: 'Hindi poems', desc: 'Listen to and interact with Hindi children poems.' },
      { title: 'Small moral stories', desc: 'Listen to short stories and answer simple questions.' },
      { title: 'Listening questions', desc: 'Listen carefully and select the correct option.' }
    ]
  },
  {
    chapter: 'Hindi Fun Activities',
    lessons: [
      { title: 'Find the letter', desc: 'Fun interactive letter finder game.' },
      { title: 'Match word & picture', desc: 'Connect words to their pictures.' },
      { title: 'Odd one out', desc: 'Find the odd Hindi letter or word in the group.' },
      { title: 'Memory game', desc: 'Memory card match challenge.' },
      { title: 'Trace challenge', desc: 'Letter tracing accuracy test.' }
    ]
  }
];

async function seed() {
  console.log('Cleaning existing chapters/lessons for UKG Hindi...');
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

  console.log('Seeding UKG Hindi curriculum...');

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

  console.log('🎉 Successfully seeded UKG Hindi curriculum with activities!');
}

seed().catch(console.error);

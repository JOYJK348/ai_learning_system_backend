const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read environment file
const envPath = path.join(__dirname, '../.env.development');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Grade 1 English subject ID (confirmed from seed script)
const englishSubjectId = 'bd0b4df6-6f2e-478f-ad4e-c5edd23447ca';

async function run() {
  console.log('Fetching Grade 1 English chapters...');

  // Lessons are linked via chapter_id -> chapters.subject_id
  const { data: chapters, error: chErr } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('subject_id', englishSubjectId);

  if (chErr || !chapters) {
    console.error('Error fetching chapters:', chErr);
    return;
  }

  const chapterIds = chapters.map(c => c.id);
  console.log(`Found ${chapters.length} chapters`);

  // Fetch ALL lessons in these chapters
  const { data: lessons, error: lesErr } = await supabase
    .from('lessons')
    .select('id, title, sort_order, chapter_id')
    .in('chapter_id', chapterIds)
    .order('sort_order', { ascending: true });

  if (lesErr || !lessons) {
    console.error('Error fetching lessons:', lesErr);
    return;
  }

  const targetTitles = ['Beginning Sounds', 'Match Letter & Sound'];
  const toDelete = lessons.filter(l => targetTitles.includes(l.title));

  console.log('Lessons to delete:', toDelete.map(l => `${l.title} (${l.id})`));

  if (toDelete.length === 0) {
    console.log('No matching lessons found! Available lesson titles:');
    lessons.forEach(l => console.log(`  - "${l.title}"`));
    return;
  }

  for (const lesson of toDelete) {
    // 1. Delete activities
    const { error: aErr } = await supabase.from('activities').delete().eq('lesson_id', lesson.id);
    if (aErr) console.error(`  Error deleting activities for "${lesson.title}":`, aErr);
    else console.log(`  Deleted activities for "${lesson.title}"`);

    // 2. Delete quizzes
    const { error: qErr } = await supabase.from('quizzes').delete().eq('lesson_id', lesson.id);
    if (qErr) console.error(`  Error deleting quizzes for "${lesson.title}":`, qErr);
    else console.log(`  Deleted quizzes for "${lesson.title}"`);

    // 3. Delete the lesson itself
    const { error: lErr } = await supabase.from('lessons').delete().eq('id', lesson.id);
    if (lErr) console.error(`  Error deleting lesson "${lesson.title}":`, lErr);
    else console.log(`  Deleted lesson: "${lesson.title}"`);
  }

  // Re-sort remaining lessons in Chapter 1 (sort_order 1,2,3,4 after removal of 5 & 6)
  const deletedIds = toDelete.map(l => l.id);
  const remaining = lessons.filter(l => !deletedIds.includes(l.id));

  // Group by chapter, re-sort each chapter's lessons
  const byChapter = {};
  for (const l of remaining) {
    if (!byChapter[l.chapter_id]) byChapter[l.chapter_id] = [];
    byChapter[l.chapter_id].push(l);
  }

  console.log('\nRe-sorting lesson sort_orders...');
  for (const [chapId, chapLessons] of Object.entries(byChapter)) {
    // Already ordered by sort_order from the query
    for (let i = 0; i < chapLessons.length; i++) {
      await supabase.from('lessons').update({ sort_order: i + 1 }).eq('id', chapLessons[i].id);
    }
  }

  console.log('\n✅ Done! "Beginning Sounds" and "Match Letter & Sound" removed from DB.');
}

run().catch(console.error);

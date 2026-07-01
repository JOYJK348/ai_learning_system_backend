const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const hindiSubjectId = 'd2ef6924-26fc-42bb-ad13-fac775eb6925';

async function main() {
  const { data: chapters, error: chErr } = await supabase
    .from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', hindiSubjectId)
    .order('sort_order', { ascending: true });

  if (chErr) {
    console.error('Error fetching chapters:', chErr);
    return;
  }

  const mapping = [];
  let totalLessons = 0;

  for (const ch of chapters) {
    const { data: lessons, error: lesErr } = await supabase
      .from('lessons')
      .select('id, title, sort_order')
      .eq('chapter_id', ch.id)
      .order('sort_order', { ascending: true });

    if (lesErr) {
      console.error(`Error fetching lessons for chapter ${ch.name}:`, lesErr);
      continue;
    }

    for (const l of lessons) {
      totalLessons++;
      mapping.push({
        levelNum: totalLessons,
        chapterName: ch.name,
        lessonTitle: l.title,
        lessonId: l.id
      });
    }
  }

  const outFile = path.join(__dirname, 'hindi_lesson_mapping.json');
  fs.writeFileSync(outFile, JSON.stringify(mapping, null, 2));
  console.log(`Successfully mapped ${totalLessons} lessons to ${outFile}`);
}

main().catch(console.error);

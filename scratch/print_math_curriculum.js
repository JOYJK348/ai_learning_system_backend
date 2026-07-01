const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // Find Grade 1 Mathematics subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, grade_id, grades(name)')
    .ilike('name', '%math%')
    .is('deleted_at', null);

  console.log('Maths Subjects found:');
  for (const sub of subject || []) {
    console.log(`Subject ID: ${sub.id}, Name: ${sub.name}, Grade: ${sub.grades?.name}`);
  }

  if (subject && subject.length > 0) {
    const mathGrade1 = subject.find(s => s.grades?.name === 'Grade 1');
    if (mathGrade1) {
      console.log(`\nFetching chapters and lessons for Grade 1 Mathematics (${mathGrade1.id})...`);
      
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, name, sort_order')
        .eq('subject_id', mathGrade1.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      for (const ch of chapters || []) {
        console.log(`\nChapter: ${ch.name} (ID: ${ch.id})`);
        
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, sort_order')
          .eq('chapter_id', ch.id)
          .is('deleted_at', null)
          .order('sort_order', { ascending: true });

        for (const les of lessons || []) {
          console.log(`  - Lesson: ${les.title} (ID: ${les.id}, Sort: ${les.sort_order})`);
        }
      }
    }
  }
}

main().catch(console.error);

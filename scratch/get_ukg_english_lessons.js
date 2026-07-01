const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Find UKG Grade ID
  const { data: grades } = await supabase.from('grades').select('id, name');
  const ukgGrade = grades.find(g => g.name.toUpperCase() === 'UKG');
  
  if (!ukgGrade) {
    console.log('UKG Grade not found');
    return;
  }
  
  // Find English Subject for UKG
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('grade_id', ukgGrade.id)
    .eq('name', 'English');
    
  if (!subjects || subjects.length === 0) {
    console.log('UKG English Subject not found');
    return;
  }
  
  const ukgEngSubjectId = subjects[0].id;
  
  // Fetch chapters and lessons count
  const { data: chapters, error } = await supabase
    .from('chapters')
    .select(`
      id,
      name,
      lessons (
        id,
        title
      )
    `)
    .eq('subject_id', ukgEngSubjectId);
    
  if (error) {
    console.error(error);
    return;
  }
  
  let totalLessons = 0;
  chapters.forEach(ch => {
    totalLessons += ch.lessons.length;
  });
  
  console.log(`UKG English: ${chapters.length} Chapters, ${totalLessons} Lessons.`);
  console.log('Chapters Detail:', chapters.map(c => ({ name: c.name, lessonsCount: c.lessons.length })));
}

run();

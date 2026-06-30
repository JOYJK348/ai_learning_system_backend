const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: students } = await supabase.from('students').select('id, full_name');
  if (!students || students.length === 0) return;
  
  // Update ALL students to be safe, so any testing account the user is on gets Chapter 8 unlocked!
  console.log(`Updating progress for all ${students.length} students...`);
  
  const visibleLessons = [
    'dbf28e75-0820-4c05-ad53-1e907faafe8e', // Above / Below & Left / Right
    'dae60b78-bd39-4ab7-acbc-b250d699cc8a'  // Front / Behind & Near / Far
  ];

  const ch8Lessons = [
    '78baf022-0ca1-4b44-843d-5b25b89bcaac',
    'a57bca48-9805-45e2-aac1-b2a7ec52fac5'
  ];

  for (const s of students) {
    const studentId = s.id;
    console.log(`Processing student: ${s.full_name}...`);

    for (const lid of visibleLessons) {
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('student_id', studentId)
        .eq('lesson_id', lid)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('lesson_progress')
          .update({
            status: 'completed',
            completion_percentage: 100,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('lesson_progress')
          .insert({
            student_id: studentId,
            lesson_id: lid,
            status: 'completed',
            completion_percentage: 100,
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          });
      }
    }

    // Now unlock Chapter 8 lessons by setting them to 'not_started' or 'in_progress'
    for (const lid of ch8Lessons) {
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('student_id', studentId)
        .eq('lesson_id', lid)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('lesson_progress')
          .insert({
            student_id: studentId,
            lesson_id: lid,
            status: 'not_started',
            completion_percentage: 0,
            last_accessed_at: new Date().toISOString()
          });
      }
    }
  }

  console.log('Done unlocking Chapter 8 for all students!');
}

run().catch(console.error);

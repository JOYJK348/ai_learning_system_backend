const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Linking parent LKG Parentt to Kuttyma UKG...');

  // Update existing link or insert a new one
  const parentId = '557efb95-93da-4199-ba0c-4ec3d2dba25a';
  const oldStudentId = '5385637c-2e24-4a0e-aae7-2016148f3c7b';
  const newStudentId = '87209b5e-8925-4e80-b408-7005d0f40a4c';

  // Let's update the link
  const { data: updateRes, error: err1 } = await supabase
    .from('parent_student_links')
    .update({ student_id: newStudentId })
    .eq('parent_id', parentId)
    .eq('student_id', oldStudentId);

  if (err1) {
    console.error('Error updating link:', err1);
  } else {
    console.log('Successfully updated link to Kuttyma UKG!');
  }

  // Also let's rename the student's name in `students` table to "kuttyma" if they prefer,
  // currently it is "Kuttyma UKG". Let's change it to "kuttyma" so it displays cleanly as "kuttyma"!
  const { error: err2 } = await supabase
    .from('students')
    .update({ full_name: 'kuttyma' })
    .eq('id', newStudentId);

  if (err2) {
    console.error('Error renaming student:', err2);
  } else {
    console.log('Successfully renamed student Kuttyma UKG to "kuttyma"');
  }
}

run();

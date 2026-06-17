const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const EMAIL = process.env.ALLACCESS_EMAIL || 'allaccess@zhi.com';
const PASSWORD = process.env.ALLACCESS_PASSWORD || 'AllAccess123';
const NAME = process.env.ALLACCESS_NAME || 'Super Star';

async function ensureProgress(studentId, lessonId) {
  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .is('deleted_at', null)
    .maybeSingle();

  const payload = {
    student_id: studentId,
    lesson_id: lessonId,
    status: 'completed',
    completion_percentage: 100,
    time_spent_seconds: 300,
    video_watched_seconds: 180,
    activity_completed: true,
    quiz_completed: true,
    quiz_score: 10,
    quiz_max_score: 10,
    completed_at: new Date().toISOString(),
    last_accessed_at: new Date().toISOString()
  };

  if (existing) {
    const { error } = await supabase
      .from('lesson_progress')
      .update(payload)
      .eq('id', existing.id);
    return error;
  } else {
    const { error } = await supabase
      .from('lesson_progress')
      .insert(payload);
    return error;
  }
}

async function main() {
  console.log('=== Creating all-access student account ===');

  if (!process.env.ALLACCESS_EMAIL) console.log('Using default seed email; set ALLACCESS_EMAIL to target your account');

  const { data: activeStatus } = await supabase
    .from('lookup_entity_status')
    .select('id')
    .eq('code', 'active')
    .maybeSingle();
  if (!activeStatus) throw new Error('active status not found');

  const { data: lkgGrade } = await supabase
    .from('grades')
    .select('id')
    .eq('code', 'lkg')
    .maybeSingle();
  if (!lkgGrade) throw new Error('LKG grade not found');

  // Check if student already exists
  const { data: existingUser } = await supabase
    .from('students')
    .select('id, auth_user_id, full_name')
    .eq('email', EMAIL)
    .maybeSingle();

  let studentId, authUserId;

  if (existingUser) {
    console.log('  Student already exists:', existingUser.full_name);
    studentId = existingUser.id;
    authUserId = existingUser.auth_user_id;
  } else {
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'student', name: NAME }
    });
    if (authErr) throw new Error('Auth create failed: ' + authErr.message);
    authUserId = authUser.user.id;
    console.log('  Auth user created:', authUserId);

    const { data: student, error: stuErr } = await supabase
      .from('students')
      .insert({
        auth_user_id: authUserId,
        full_name: NAME,
        email: EMAIL,
        grade_id: lkgGrade.id,
        status_id: activeStatus.id
      })
      .select('id')
      .maybeSingle();
    if (stuErr) {
      await supabase.auth.admin.deleteUser(authUserId);
      throw new Error('Student insert failed: ' + stuErr.message);
    }
    studentId = student.id;
    console.log('  Student record created:', studentId);
  }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('grade_id', lkgGrade.id)
    .is('deleted_at', null)
    .order('sort_order');

  let totalLessons = 0;
  for (const subject of subjects) {
    if (subject.name === 'Test') continue;

    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', subject.id)
      .is('deleted_at', null)
      .order('sort_order');

    if (!chapters || chapters.length === 0) {
      console.log(`  ${subject.name}: no chapters`);
      continue;
    }

    for (const chapter of chapters) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('chapter_id', chapter.id)
        .is('deleted_at', null)
        .order('sort_order');

      if (!lessons || lessons.length === 0) continue;

      for (const lesson of lessons) {
        const err = await ensureProgress(studentId, lesson.id);
        if (err) console.error(`    Error: ${lesson.title} - ${err.message}`);
        totalLessons++;
      }
      console.log(`  ${subject.name} / ${chapter.name}: ${lessons.length} lessons done`);
    }
  }

  await supabase
    .from('students')
    .update({
      overall_progress: 100,
      total_lessons_completed: totalLessons,
      total_stars_earned: 500,
      total_badges_earned: 10,
      current_streak_days: 30,
      total_time_spent_seconds: totalLessons * 300
    })
    .eq('id', studentId);

  console.log(`\n=== DONE ===`);
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Name:     ${NAME}`);
  console.log(`  Lessons completed: ${totalLessons}`);
  console.log(`  Login at: http://localhost:3000/en/login`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});

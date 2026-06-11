const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const SCHOOL_ID = 'ce48d390-1c15-4e02-8e0a-a6f4f7f95fb2';

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// All timestamps are relative to DB NOW() to avoid clock skew
let _dbNow = 0;
function randomDate() {
  const now = _dbNow || Date.now();
  const rand = Math.random();
  let hoursBack;
  if (rand < 0.5) hoursBack = Math.random() * 24;
  else if (rand < 0.8) hoursBack = 24 + Math.random() * (7 * 24 - 24);
  else hoursBack = Math.random() * (25 * 24);
  const d = new Date(now - hoursBack * 3600 * 1000);
  d.setMinutes(randomInt(0, 59), randomInt(0, 59));
  return d.toISOString();
}

async function seed() {
  console.log('=== Seeding JK activity data ===\n');

  // Sync with DB clock by inserting a probe record
  const { data: grd } = await supabase.from('grades').select('id').limit(1).single();
  const probeName = '_ts_p_' + Date.now();
  const { data: probe } = await supabase.from('students').insert({ full_name: probeName, grade_id: grd?.id }).select('created_at').single();
  if (probe?.created_at) _dbNow = new Date(probe.created_at).getTime();
  else _dbNow = Date.now();
  await supabase.from('students').delete().eq('full_name', probeName);

  // Add 60min buffer so all timestamps are solidly in the past regardless of clock skew
  _dbNow -= 60 * 60 * 1000;
  console.log('  DB reference time:', new Date(_dbNow).toISOString());

  // Get all JK school students with their grade
  const { data: schoolStudents } = await supabase
    .from('school_students')
    .select('student_id')
    .eq('school_id', SCHOOL_ID)
    .is('deleted_at', null);
  const studentIds = schoolStudents?.map(s => s.student_id) || [];
  console.log(`Found ${studentIds.length} students`);

  // Get students with their grades
  const { data: students } = await supabase
    .from('students')
    .select('id,full_name,grade_id')
    .in('id', studentIds);
  console.log(`Students with data: ${students?.length}`);

  // Get all grades
  const { data: grades } = await supabase.from('grades').select('id,name');
  const gradeNameMap = {};
  for (const g of grades || []) gradeNameMap[g.id] = g.name;

  // Get all lessons grouped by grade (via subjects -> chapters)
  const { data: allSubjects } = await supabase.from('subjects').select('id,grade_id');
  const allSubjectIds = [...new Set((allSubjects || []).map(s => s.id))];

  const { data: allChapters } = await supabase
    .from('chapters')
    .select('id,subject_id')
    .in('subject_id', allSubjectIds);
  const chapterIds = allChapters?.map(c => c.id) || [];

  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id,title,chapter_id')
    .in('chapter_id', chapterIds);

  const chapterSubjectMap = {};
  for (const ch of allChapters || []) chapterSubjectMap[ch.id] = ch.subject_id;
  const subjectGradeMap = {};
  for (const sub of allSubjects || []) subjectGradeMap[sub.id] = sub.grade_id;

  const gradeLessons = {};
  for (const lesson of allLessons || []) {
    const chId = lesson.chapter_id;
    const subId = chapterSubjectMap[chId];
    const gId = subjectGradeMap[subId];
    if (!gradeLessons[gId]) gradeLessons[gId] = [];
    gradeLessons[gId].push(lesson);
  }

  for (const [gId, lessons] of Object.entries(gradeLessons)) {
    console.log(`  ${gradeNameMap[gId] || gId}: ${lessons.length} lessons`);
  }

  // Get all quizzes
  const { data: allQuizzes } = await supabase
    .from('quizzes')
    .select('id,lesson_id');

  // For each student, create lesson_progress + quiz_attempts
  let totalLP = 0, totalQA = 0;
  for (const student of students || []) {
    const gId = student.grade_id;
    const availableLessons = gradeLessons[gId] || [];
    if (availableLessons.length === 0) continue;

    const numLessons = randomInt(5, Math.min(availableLessons.length, 10));
    const shuffled = [...availableLessons].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numLessons);
    let lessonsCompleted = 0, quizzesAttempted = 0, quizzesPassed = 0;

    for (const lesson of selected) {
      const completed = Math.random() > 0.2;
      const completedAt = completed ? randomDate() : null;
      const percentage = completed ? 100 : randomInt(20, 80);
      const lastAccessed = completedAt || randomDate();

      await supabase.from('lesson_progress').insert({
        student_id: student.id, lesson_id: lesson.id,
        status: completed ? 'completed' : 'in_progress',
        completion_percentage: percentage,
        time_spent_seconds: randomInt(120, 1800),
        video_watched_seconds: randomInt(60, 900),
        activity_completed: completed || Math.random() > 0.5,
        quiz_completed: completed,
        completed_at: completedAt,
        last_accessed_at: lastAccessed,
      }).maybeSingle();
      totalLP++;

      if (completed) {
        lessonsCompleted++;
        if (Math.random() > 0.3) {
          const quiz = allQuizzes?.find(q => q.lesson_id === lesson.id);
          if (quiz) {
            const passed = Math.random() > 0.2;
            const score = passed ? randomInt(7, 10) : randomInt(2, 6);
            await supabase.from('quiz_attempts').insert({
              student_id: student.id, quiz_id: quiz.id, lesson_id: lesson.id,
              attempt_number: 1, score, max_score: 10,
              percentage: Math.round((score / 10) * 100), passed,
              time_taken_seconds: randomInt(60, 600), completed_at: completedAt,
            }).maybeSingle();
            totalQA++;
            quizzesAttempted++;
            if (passed) quizzesPassed++;
          }
        }
      }
    }

    await supabase.from('students').update({
      total_lessons_completed: lessonsCompleted,
      total_quizzes_attempted: quizzesAttempted,
      total_quizzes_passed: quizzesPassed,
      total_stars_earned: randomInt(15, 250),
      total_badges_earned: randomInt(1, 6),
      current_streak_days: randomInt(0, 15),
      overall_progress: Math.min(Math.round((lessonsCompleted / availableLessons.length) * 100), 100),
      last_activity_at: randomDate(),
    }).eq('id', student.id);
  }

  console.log(`\nTotal: ${totalLP} lesson progress, ${totalQA} quiz attempts`);
  console.log('=== Done! ===');
}

seed().catch(console.error);

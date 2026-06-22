const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const SCHOOL_ID = 'ce48d390-1c15-4e02-8e0a-a6f4f7f95fb2';
const ADMIN_ID = 'dfb64056-4a20-4405-8434-d5b6c449e2de';
const BOARD_ID = '32fd3879-3d7c-4b0d-88bb-9fb65d043a12'; // CBSE

const SUBJECT_NAMES = ['English', 'Mathematics', 'Science', 'Hindi', 'Tamil'];

const GRADE_CONFIG = {
  'UKG': {
    chapters: [
      { name: 'Alphabets & Phonics', subj: 'English', lessons: ['Letter Sounds A-M', 'Letter Sounds N-Z', 'Vowels & Consonants', 'Blending Sounds'] },
      { name: 'Numbers 1-100', subj: 'Mathematics', lessons: ['Counting 1-50', 'Counting 51-100', 'Number Names', 'Skip Counting'] },
      { name: 'Basic Shapes', subj: 'Mathematics', lessons: ['Identifying Shapes', 'Drawing Shapes', 'Shapes in Real Life'] },
    ]
  },
  'Grade 1': {
    chapters: [
      { name: 'Grammar Basics', subj: 'English', lessons: ['Nouns', 'Verbs', 'Adjectives', 'Sentence Formation'] },
      { name: 'Addition & Subtraction', subj: 'Mathematics', lessons: ['Addition up to 20', 'Subtraction up to 20', 'Word Problems'] },
      { name: 'Our Environment', subj: 'Science', lessons: ['Plants Around Us', 'Animals Around Us', 'Weather & Seasons'] },
    ]
  },
  'Grade 2': {
    chapters: [
      { name: 'Reading Comprehension', subj: 'English', lessons: ['Story Reading', 'Main Idea', 'Making Predictions', 'Character Analysis'] },
      { name: 'Multiplication', subj: 'Mathematics', lessons: ['Tables 1-5', 'Tables 6-10', 'Multiplication Problems'] },
      { name: 'Science Explorers', subj: 'Science', lessons: ['Living vs Non-Living', 'Plant Life Cycle', 'Animal Habitats', 'Food Chains'] },
    ]
  }
};

const STUDENT_NAMES = [
  'Aarav Sharma', 'Ananya Patel', 'Arjun Singh', 'Diya Gupta', 'Ishaan Kumar',
  'Kavya Reddy', 'Neha Joshi', 'Pranav Nair', 'Riya Menon', 'Rohan Verma',
  'Sanya Kapoor', 'Tanvi Desai', 'Varun Mehta', 'Yash Agarwal', 'Zara Khan',
];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59));
  return d.toISOString();
}

async function getOrCreate(table, match, insertData) {
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .match(match)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from(table)
    .insert(insertData)
    .select('id')
    .single();
  if (error) {
    // If unique violation, fetch existing
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from(table)
        .select('id')
        .match(match)
        .single();
      return retry.id;
    }
    throw new Error(`Insert ${table} failed: ${error.message}`);
  }
  return data.id;
}

async function seed() {
  console.log('=== Seeding JK School data ===\n');

  // 1. Get/create grades
  const { data: existingGrades } = await supabase.from('grades').select('id,name');
  const gradeMap = {};
  for (const g of existingGrades || []) gradeMap[g.name] = g.id;

  for (const name of Object.keys(GRADE_CONFIG)) {
    if (!gradeMap[name]) {
      const { data } = await supabase.from('grades').insert({ name, board_id: BOARD_ID }).select('id').single();
      gradeMap[name] = data.id;
      console.log(`  Created grade: ${name}`);
    }
  }
  console.log('  Grades ready\n');

  // 2. Create subjects, chapters, lessons
  const allLessons = {}; // gradeName -> [{ id, title, chapter_name, subject_name }]

  for (const [gradeName, gradeData] of Object.entries(GRADE_CONFIG)) {
    const gradeId = gradeMap[gradeName];
    allLessons[gradeName] = [];
    const subjectIds = {};

    for (const subjName of SUBJECT_NAMES) {
      subjectIds[subjName] = await getOrCreate('subjects', { grade_id: gradeId, name: subjName }, { name: subjName, grade_id: gradeId, sort_order: SUBJECT_NAMES.indexOf(subjName) });
    }

    for (const ch of gradeData.chapters) {
      const chapterId = await getOrCreate('chapters', { name: ch.name, subject_id: subjectIds[ch.subj] }, { name: ch.name, subject_id: subjectIds[ch.subj], sort_order: gradeData.chapters.indexOf(ch) });

      for (const lessonName of ch.lessons) {
        const lessonId = await getOrCreate('lessons', { title: lessonName, chapter_id: chapterId }, { title: lessonName, chapter_id: chapterId, sort_order: ch.lessons.indexOf(lessonName) });
        allLessons[gradeName].push({ id: lessonId, title: lessonName, chapter_name: ch.name, subject_name: ch.subj });
      }
    }
    console.log(`  ${gradeName}: ${allLessons[gradeName].length} lessons across ${Object.keys(subjectIds).length} subjects`);
  }

  // 3. Create quizzes for each lesson
  const allQuizzes = [];
  for (const [gradeName, lessons] of Object.entries(allLessons)) {
    for (const lesson of lessons) {
      const quizId = await getOrCreate('quizzes', { lesson_id: lesson.id, title: `${lesson.title} - Quiz` }, { lesson_id: lesson.id, title: `${lesson.title} - Quiz`, time_limit_seconds: 600, sort_order: 1 });
      allQuizzes.push({ id: quizId, lesson_id: lesson.id, lesson_title: lesson.title });
    }
  }
  console.log(`  Quizzes: ${allQuizzes.length} created\n`);

  // 4. Create students
  const gradeNames = Object.keys(GRADE_CONFIG);
  const createdStudentIds = [];

  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const name = STUDENT_NAMES[i];
    const gradeName = gradeNames[i % gradeNames.length];

    const studentId = await getOrCreate('students', { full_name: name, grade_id: gradeMap[gradeName] }, {
      full_name: name, grade_id: gradeMap[gradeName], overall_progress: 0,
      total_lessons_completed: 0, total_quizzes_attempted: 0, total_quizzes_passed: 0,
      total_stars_earned: 0, total_badges_earned: 0, current_streak_days: 0, login_access: true,
    });

    createdStudentIds.push(studentId);

    const rollNum = `23-${String(i + 1).padStart(3, '0')}`;
    await getOrCreate('school_students', { school_id: SCHOOL_ID, student_id: studentId }, {
      school_id: SCHOOL_ID, student_id: studentId, roll_number: rollNum,
      section: gradeName === 'UKG' ? 'A' : i % 2 === 0 ? 'A' : 'B',
      created_by: ADMIN_ID,
    });

    console.log(`  Student: ${name} (${gradeName}) #${rollNum}`);
  }

  // 5. Create lesson_progress and quiz_attempts
  const studentNamesByGrade = {};
  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const gn = gradeNames[i % gradeNames.length];
    if (!studentNamesByGrade[gn]) studentNamesByGrade[gn] = [];
    studentNamesByGrade[gn].push(STUDENT_NAMES[i]);
  }

  for (let i = 0; i < createdStudentIds.length; i++) {
    const studentId = createdStudentIds[i];
    const gradeName = gradeNames[i % gradeNames.length];
    const gradeLessons = allLessons[gradeName];
    const numLessons = randomInt(6, gradeLessons.length);

    const shuffled = [...gradeLessons].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numLessons);
    let lessonsCompleted = 0;
    let quizzesAttempted = 0;
    let quizzesPassed = 0;

    for (const lesson of selected) {
      const completed = Math.random() > 0.15;
      const completedAt = completed ? randomDate(30) : null;
      const percentage = completed ? 100 : randomInt(25, 80);
      const lastAccessed = completedAt || randomDate(15);

      const { error: lpErr } = await supabase
        .from('lesson_progress')
        .insert({
          student_id: studentId, lesson_id: lesson.id,
          status: completed ? 'completed' : 'in_progress',
          completion_percentage: percentage,
          time_spent_seconds: randomInt(120, 1800),
          video_watched_seconds: randomInt(60, 900),
          activity_completed: completed || Math.random() > 0.5,
          quiz_completed: completed,
          completed_at: completedAt,
          last_accessed_at: lastAccessed,
        });

      if (lpErr) console.log(`    LP error (${STUDENT_NAMES[i]}): ${lpErr.message}`);

      if (completed) {
        lessonsCompleted++;

        // Quiz attempt for ~70% of completed lessons
        if (Math.random() > 0.3) {
          const quiz = allQuizzes.find(q => q.lesson_id === lesson.id);
          if (quiz) {
            const passed = Math.random() > 0.2;
            const score = passed ? randomInt(3, 5) : randomInt(1, 2);
            const maxScore = 5;

            const { error: qaErr } = await supabase.from('quiz_attempts').insert({
              student_id: studentId, quiz_id: quiz.id, lesson_id: lesson.id,
              attempt_number: 1, score, max_score: maxScore,
              percentage: Math.round((score / maxScore) * 100), passed,
              time_taken_seconds: randomInt(60, 600), completed_at: completedAt,
            }).maybeSingle();

            if (qaErr) console.log(`    QA error (${STUDENT_NAMES[i]}): ${qaErr.message}`);
            quizzesAttempted++;
            if (passed) quizzesPassed++;
          }
        }
      }
    }

    // Update student aggregates
    await supabase
      .from('students')
      .update({
        total_lessons_completed: lessonsCompleted,
        total_quizzes_attempted: quizzesAttempted,
        total_quizzes_passed: quizzesPassed,
        total_stars_earned: randomInt(15, 250),
        total_badges_earned: randomInt(1, 6),
        current_streak_days: randomInt(0, 15),
        overall_progress: Math.min(Math.round((lessonsCompleted / gradeLessons.length) * 100), 100),
        last_activity_at: randomDate(2),
      })
      .eq('id', studentId);

    console.log(`  Activity: ${STUDENT_NAMES[i]} (${lessonsCompleted}/${gradeLessons.length} lessons, ${quizzesAttempted} quizzes, ${quizzesPassed} passed)`);
  }

  console.log('\n=== Seeding complete! ===');
}

seed().catch(console.error);

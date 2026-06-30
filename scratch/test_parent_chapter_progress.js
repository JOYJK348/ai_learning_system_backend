const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const studentId = '5385637c-2e24-4a0e-aae7-2016148f3c7b'; // kuttyma

async function run() {
  const { data: student } = await supabase
    .from('students')
    .select('id,grade_id')
    .eq('id', studentId)
    .single();

  console.log('Student grade_id:', student.grade_id);

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id,name")
    .eq("grade_id", student.grade_id)
    .is("deleted_at", null);

  console.log('Subjects:', subjects.map(s => s.name));

  const subjectIds = subjects.map((s) => s.id);
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id,subject_id,name,sort_order")
    .in("subject_id", subjectIds)
    .is("deleted_at", null);

  console.log('Total chapters fetched:', chapters.length);

  const chapterIds = chapters.map((c) => c.id);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,chapter_id,title")
    .in("chapter_id", chapterIds)
    .is("deleted_at", null);

  console.log('Total lessons fetched:', lessons.length);

  const lessonIds = lessons.map((l) => l.id);
  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id,status,completion_percentage")
    .eq("student_id", studentId)
    .in("lesson_id", lessonIds)
    .is("deleted_at", null);

  console.log('Progress rows found matching lessons:', progressRows);

  const progressMap = {};
  progressRows.forEach((p) => { progressMap[p.lesson_id] = p; });

  const lessonCountPerChapter = {};
  const completedLessonCountPerChapter = {};
  lessons.forEach((l) => {
    lessonCountPerChapter[l.chapter_id] = (lessonCountPerChapter[l.chapter_id] || 0) + 1;
    const p = progressMap[l.id];
    if (p && p.status === "completed") {
      completedLessonCountPerChapter[l.chapter_id] = (completedLessonCountPerChapter[l.chapter_id] || 0) + 1;
    }
  });

  const subjectMath = subjects.find(s => s.name === 'Mathematics');
  if (subjectMath) {
    const mathChapters = chapters.filter(c => c.subject_id === subjectMath.id);
    const mathChapterData = mathChapters.map(c => {
      return {
        name: c.name,
        total: lessonCountPerChapter[c.id] || 0,
        completed: completedLessonCountPerChapter[c.id] || 0
      };
    });
    console.log('Math Chapters Progress details:', mathChapterData);
  }
}

run();

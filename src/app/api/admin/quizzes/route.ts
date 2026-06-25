import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('quiz_questions')
      .select(`
        id,
        question_text,
        explanation,
        points,
        status_id,
        created_at,
        updated_at,
        quiz:quizzes(
          id,
          lesson_id,
          title,
          lesson:lessons(
            id,
            title,
            chapter:chapters(
              id,
              name,
              subject:subjects(
                id,
                name,
                grade:grades(
                  id,
                  name
                )
              )
            )
          )
        ),
        quiz_options(id,option_text,is_correct,sort_order)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return json({ error: error.message }, 500);

    const mapped = (data || []).map((q: any) => {
      const opts = (q.quiz_options || []).sort((a: any,b: any) => (a.sort_order||0)-(b.sort_order||0));
      return {
        id: q.id,
        question_text: q.question_text,
        option_a: opts[0]?.option_text || '',
        option_b: opts[1]?.option_text || '',
        option_c: opts[2]?.option_text || '',
        option_d: opts[3]?.option_text || '',
        correct_answer: (opts.find((o:any)=>o.is_correct) ? (['A','B','C','D'][opts.indexOf(opts.find((o:any)=>o.is_correct))]||'A') : 'A'),
        lesson_id: q.quiz?.lesson_id || null,
        lesson_title: q.quiz?.lesson?.title || q.quiz?.title || null,
        grade_name: q.quiz?.lesson?.chapter?.subject?.grade?.name || null,
        subject_name: q.quiz?.lesson?.chapter?.subject?.name || null,
        chapter_id: q.quiz?.lesson?.chapter?.id || null,
        status_id: q.status_id,
        difficulty: 'easy',
        time_limit_seconds: null,
        points: q.points,
        explanation: q.explanation,
        created_at: q.created_at,
      };
    });

    return json({ data: mapped });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unable to list questions' }, 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const lessonId = body.lesson_id;
  if (!lessonId) return json({ error: 'lesson_id is required' }, 400);

  try {
    const supabase = getSupabaseAdmin();
    // find or create a parent quiz for the lesson
    let { data: quizzes } = await supabase.from('quizzes').select('id').eq('lesson_id', lessonId).is('deleted_at', null).limit(1);
    let quizId = quizzes?.[0]?.id;
    if (!quizId) {
      const { data: newQuiz, error: qErr } = await supabase.from('quizzes').insert({ lesson_id: lessonId, title: 'Auto quiz', status_id: 1 }).select().single();
      if (qErr) return json({ error: qErr.message }, 400);
      quizId = newQuiz.id;
    }

    const { data: question, error: qErr } = await supabase.from('quiz_questions').insert({
      quiz_id: quizId,
      question_text: body.question_text,
      explanation: body.explanation ?? null,
      points: body.points ?? 10,
      status_id: body.status_id ?? 1
    }).select().single();
    if (qErr) return json({ error: qErr.message }, 400);

    const options = [body.option_a, body.option_b, body.option_c, body.option_d].map((text, idx) => ({
      question_id: question.id,
      option_text: text ?? '',
      is_correct: (body.correct_answer || 'A') === ['A','B','C','D'][idx],
      sort_order: idx
    }));

    const { error: optsErr } = await supabase.from('quiz_options').insert(options);
    if (optsErr) return json({ error: optsErr.message }, 400);

    // return flattened question
    const { data: qFull } = await supabase.from('quiz_questions').select('id,question_text,explanation,points,status_id,created_at,quiz:quizzes(id,lesson_id,title),quiz_options(id,option_text,is_correct,sort_order)').eq('id', question.id).maybeSingle();

    const opts = (qFull as any).quiz_options || [];
    const mapped = {
      id: (qFull as any).id,
      question_text: (qFull as any).question_text,
      option_a: opts[0]?.option_text || '',
      option_b: opts[1]?.option_text || '',
      option_c: opts[2]?.option_text || '',
      option_d: opts[3]?.option_text || '',
      correct_answer: (opts.find((o:any)=>o.is_correct) ? (['A','B','C','D'][opts.indexOf(opts.find((o:any)=>o.is_correct))]||'A') : 'A'),
      lesson_id: (qFull as any).quiz?.lesson_id || null,
      status_id: (qFull as any).status_id,
      points: (qFull as any).points,
      explanation: (qFull as any).explanation,
      created_at: (qFull as any).created_at
    };

    return json({ data: mapped }, 201);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unable to create question' }, 500);
  }
}

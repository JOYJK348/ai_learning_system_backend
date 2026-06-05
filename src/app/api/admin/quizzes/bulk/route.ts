import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

type BulkQuestion = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A'|'B'|'C'|'D';
  lesson_id: string;
  points?: number;
  explanation?: string | null;
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const questions: BulkQuestion[] = body.questions;
  if (!Array.isArray(questions) || questions.length === 0) return json({ error: 'questions array required' }, 400);

  try {
    const supabase = getSupabaseAdmin();
    const results: any[] = [];

    for (const q of questions) {
      if (!q.lesson_id || !q.question_text) return json({ error: 'Each question needs lesson_id and question_text' }, 400);

      // ensure a parent quiz exists for lesson
      let { data: quizzes } = await supabase.from('quizzes').select('id').eq('lesson_id', q.lesson_id).is('deleted_at', null).limit(1);
      let quizId = quizzes?.[0]?.id;
      if (!quizId) {
        const { data: newQuiz, error: qErr } = await supabase.from('quizzes').insert({ lesson_id: q.lesson_id, title: 'Auto quiz', status_id: 1 }).select().single();
        if (qErr) return json({ error: qErr.message }, 400);
        quizId = newQuiz.id;
      }

      const { data: questionRow, error: qErr } = await supabase.from('quiz_questions').insert({
        quiz_id: quizId,
        question_text: q.question_text,
        explanation: q.explanation ?? null,
        points: q.points ?? 10,
        status_id: 1
      }).select().single();
      if (qErr) return json({ error: qErr.message }, 400);

      const options = [q.option_a, q.option_b, q.option_c, q.option_d].map((text, idx) => ({
        question_id: questionRow.id,
        option_text: text ?? '',
        is_correct: q.correct_answer === ['A','B','C','D'][idx],
        sort_order: idx
      }));

      const { error: optsErr } = await supabase.from('quiz_options').insert(options);
      if (optsErr) return json({ error: optsErr.message }, 400);

      results.push({ question_id: questionRow.id });
    }

    return json({ data: results }, 201);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Bulk upload failed' }, 500);
  }
}

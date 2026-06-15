import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);
  const body = await req.json().catch(() => ({}));

  try {
    const supabase = getSupabaseAdmin();
    // Update question fields
    const qPayload: any = {};
    ['question_text','status_id','points','explanation'].forEach((k) => {
      if (body[k] !== undefined) qPayload[k] = body[k];
    });

    if (Object.keys(qPayload).length > 0) {
      const { data: qData, error: qErr } = await supabase.from('quiz_questions').update({ ...qPayload, updated_at: new Date().toISOString() }).eq('id', params.id).is('deleted_at', null).select().maybeSingle();
      if (qErr) return json({ error: qErr.message }, 400);
      if (!qData) return json({ error: 'Not found' }, 404);
    }

    // Replace options if provided
    if (body.option_a !== undefined || body.option_b !== undefined || body.option_c !== undefined || body.option_d !== undefined) {
      // delete existing options
      const { error: delErr } = await supabase.from('quiz_options').delete().eq('question_id', params.id);
      if (delErr) return json({ error: delErr.message }, 400);

      const options = [body.option_a, body.option_b, body.option_c, body.option_d].map((text, idx) => ({
        question_id: params.id,
        option_text: text ?? '',
        is_correct: (body.correct_answer || 'A') === ['A','B','C','D'][idx],
        sort_order: idx
      }));

      const { error: insErr } = await supabase.from('quiz_options').insert(options);
      if (insErr) return json({ error: insErr.message }, 400);
    }

    const { data: full } = await supabase.from('quiz_questions').select('id,question_text,explanation,points,status_id,created_at,quiz:quizzes(id,lesson_id,title),quiz_options(id,option_text,is_correct,sort_order)').eq('id', params.id).maybeSingle();

    if (!full) return json({ error: 'Not found' }, 404);

    const opts = (full as any).quiz_options || [];
    const mapped = {
      id: (full as any).id,
      question_text: (full as any).question_text,
      option_a: opts[0]?.option_text || '',
      option_b: opts[1]?.option_text || '',
      option_c: opts[2]?.option_text || '',
      option_d: opts[3]?.option_text || '',
      correct_answer: (opts.find((o:any)=>o.is_correct) ? (['A','B','C','D'][opts.indexOf(opts.find((o:any)=>o.is_correct))]||'A') : 'A'),
      lesson_id: (full as any).quiz?.lesson_id || null,
      status_id: (full as any).status_id,
      points: (full as any).points,
      explanation: (full as any).explanation,
      created_at: (full as any).created_at
    };

    return json({ data: mapped });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unable to update question' }, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('quiz_questions').update({ deleted_at: new Date().toISOString() }).eq('id', params.id).is('deleted_at', null).select('id').maybeSingle();
    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: 'Not found' }, 404);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unable to delete question' }, 500);
  }
}

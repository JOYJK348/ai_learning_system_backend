const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  const { data: b } = await s.from('boards').select('id').eq('code', 'cbse').single();
  const { data: g } = await s.from('grades').select('id').eq('board_id', b.id).eq('code', 'lkg').single();
  const { data: sub } = await s.from('subjects').select('id').eq('grade_id', g.id).eq('code', 'tamil').single();

  // Get all English-named chapters created by JS seed
  const englishNames = ['Pre-Writing Strokes', 'Uyir Ezhuthukkal A-Uu', 'Uyir Ezhuthukkal E-Au', 'Mei Ezhuthukkal - Part 1', 'Mei Ezhuthukkal - Part 2', 'Simple Words', 'Paadalgal & Kathaigal'];
  const tamilNames = ['முன் எழுத்து பயிற்சிகள்', 'உயிர் எழுத்துக்கள் அ-ஊ', 'உயிர் எழுத்துக்கள் எ-ஔ', 'மெய் எழுத்துக்கள் - வரிசை 1', 'மெய் எழுத்துக்கள் - வரிசை 2', 'எளிய சொற்கள்', 'பாடல்கள் & கதைகள்'];

  // Delete English-named chapters
  for (const name of englishNames) {
    const { data: ch } = await s.from('chapters').select('id').eq('subject_id', sub.id).eq('name', name).is('deleted_at', null).maybeSingle();
    if (ch) {
      await s.from('chapters').update({ deleted_at: new Date().toISOString() }).eq('id', ch.id);
      console.log('Deleted:', name);
    }
  }

  // Check if Tamil chapters already exist
  for (const name of tamilNames) {
    const { data: ch } = await s.from('chapters').select('id').eq('subject_id', sub.id).eq('name', name).is('deleted_at', null).maybeSingle();
    console.log(ch ? 'Already exists: ' + name : 'Need to create: ' + name);
  }
}
main().catch(e => console.error(e));

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const CHAPTERS_TO_DELETE = [
  'Alphabet Introduction (A–M)',
  'Letter Sounds — Phonics',
  'Object Association',
  'Vocabulary Building',
  'Listening & Speaking',
];

const CHAPTER_RENAMES = {
  'Term 1: Letters A-M': 'Chapter 1: Letters A-M',
  'Term 2: Letters N-Z': 'Chapter 2: Letters N-Z',
  'Term 3: Small Letters & Phonics': 'Chapter 3: Small Letters & Phonics',
  'Rhymes & Songs': 'Chapter 4: Rhymes & Songs',
  'Story Time': 'Chapter 5: Story Time',
  'English Term 1 Mastery Test': 'Final Assessment',
};

async function merge() {
  console.log('=== Merging LKG English Curriculum ===\n');

  // Get English subject ID
  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').single();
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').single();
  const { data: subject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'english').single();

  console.log(`Subject ID: ${subject.id}\n`);

  // 1. Soft-delete old duplicate chapters
  console.log('1. Soft-deleting old duplicates...');
  for (const name of CHAPTERS_TO_DELETE) {
    const { data: ch } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', subject.id)
      .eq('name', name)
      .is('deleted_at', null)
      .single();

    if (ch) {
      const { error } = await supabase
        .from('chapters')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', ch.id);
      console.log(`   ❌ Deleted: "${name}"`);
    } else {
      console.log(`   ⚠️ Not found: "${name}"`);
    }
  }

  // 2. Rename chapters to clean structure
  console.log('\n2. Renaming chapters...');
  for (const [oldName, newName] of Object.entries(CHAPTER_RENAMES)) {
    const { data: ch } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', subject.id)
      .eq('name', oldName)
      .is('deleted_at', null)
      .single();

    if (ch) {
      const { error } = await supabase
        .from('chapters')
        .update({ name: newName })
        .eq('id', ch.id);
      console.log(`   ✏️ "${oldName}" → "${newName}"`);
    } else {
      console.log(`   ⚠️ Not found: "${oldName}"`);
    }
  }

  // 3. Fix sort_order for clean sequence
  console.log('\n3. Reordering chapters...');
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', subject.id)
    .is('deleted_at', null)
    .order('sort_order');

  const desiredOrder = [
    'Pre-Writing Foundation',
    'Pattern Readiness',
    'Chapter 1: Letters A-M',
    'Chapter 2: Letters N-Z',
    'Chapter 3: Small Letters & Phonics',
    'Chapter 4: Rhymes & Songs',
    'Chapter 5: Story Time',
    'Rhymes',
    'Final Assessment',
  ];

  for (let i = 0; i < desiredOrder.length; i++) {
    const ch = chapters?.find(c => c.name === desiredOrder[i]);
    if (ch) {
      await supabase.from('chapters').update({ sort_order: i + 1 }).eq('id', ch.id);
      console.log(`   ${i + 1}. ${ch.name}`);
    }
  }

  // 4. Verify final structure
  console.log('\n=== Final Structure ===');
  const { data: finalChapters } = await supabase
    .from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', subject.id)
    .is('deleted_at', null)
    .order('sort_order');

  let totalLessons = 0;
  for (const ch of finalChapters || []) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('chapter_id', ch.id)
      .is('deleted_at', null);
    console.log(`${ch.sort_order}. ${ch.name} (${lessons?.length || 0} lessons)`);
    totalLessons += lessons?.length || 0;
  }
  console.log(`\nTotal: ${finalChapters?.length || 0} chapters, ${totalLessons} lessons`);
}

merge().catch(err => {
  console.error('Merge failed:', err);
  process.exit(1);
});

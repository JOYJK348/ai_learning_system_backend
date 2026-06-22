const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('id, score, max_score')
    .eq('max_score', 10);

  if (error) {
    console.error('Error fetching quiz attempts:', error);
    return;
  }

  console.log(`Found ${attempts.length} attempts with max_score = 10.`);

  for (const attempt of attempts) {
    const oldScore = attempt.score;
    // Scale score to /5. e.g. 10 -> 5, 9 -> 5 (or 4), 8 -> 4, 7 -> 4, 6 -> 3, 5 -> 3 (or 2), etc.
    // Let's map it nicely:
    // 10 -> 5
    // 9 -> 5
    // 8 -> 4
    // 7 -> 4
    // 6 -> 3
    // 5 -> 3
    // 4 -> 2
    // 3 -> 2
    // 2 -> 1
    // 1 -> 1
    // 0 -> 0
    let newScore = 0;
    if (oldScore >= 9) newScore = 5;
    else if (oldScore >= 7) newScore = 4;
    else if (oldScore >= 5) newScore = 3;
    else if (oldScore >= 3) newScore = 2;
    else if (oldScore >= 1) newScore = 1;
    
    console.log(`Updating attempt ${attempt.id}: ${oldScore}/10 -> ${newScore}/5`);
    const { error: updateErr } = await supabase
      .from('quiz_attempts')
      .update({
        score: newScore,
        max_score: 5,
        percentage: Math.round((newScore / 5) * 100),
        passed: newScore >= 3 // 60% of 5 is 3
      })
      .eq('id', attempt.id);

    if (updateErr) {
      console.error(`Failed to update ${attempt.id}:`, updateErr);
    }
  }

  console.log('Finished updating quiz attempts.');
}

main();

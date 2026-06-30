const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Fix lesson descriptions for UKG Tamil lessons
  const updates = [
    { title: 'ஒலி கேட்டுத் தேர்வு',       description: 'முதல் எழுத்தை கண்டுபிடி! | Phonics Quiz' },
    { title: 'க் முதல் ன் வரை',             description: 'மெய் எழுத்துக்களை தொட்டு கற்கலாம்! | Touch & Learn Consonants' },
    { title: 'எழுத்து வரிசைமுறை',           description: 'உயிர் எழுத்துக்களை வரிசையில் அடுக்கு! | Order the Vowels' },
    { title: 'அ - ஔ அறிமுகம்',              description: 'உயிர் எழுத்துக்களை படங்களோடு கற்கலாம்! | Learn Vowels with Pictures' },
  ];

  for (const u of updates) {
    const { data, error } = await supabase
      .from('lessons')
      .update({ description: u.description })
      .eq('title', u.title)
      .select('id, title, description');

    if (error) {
      console.error(`Error updating "${u.title}":`, error.message);
    } else {
      console.log(`✅ Updated "${u.title}" →`, data?.map(d => d.description));
    }
  }
}

run().catch(console.error);

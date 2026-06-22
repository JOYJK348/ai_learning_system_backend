const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

// Lesson IDs used in Quiz page mappings
const lessonIds = [
  // Tamil
  'f750d0ef-3fc2-44b5-89a5-0abfcc618479',
  'e9efc803-66fe-4574-a4e0-ef8ce18f104a',
  'c6035e74-6b37-409e-a0c0-c58bb4f64fee',
  '27869c1b-70c6-4019-965f-619c799eb0e0',
  '260d91dd-1d8b-4964-8311-3ff589c38e5a',
  '45b61435-fe57-4e0c-a893-68bc25d96d53',
  // English
  '389a705c-d602-4f1e-bae6-7fdb736f3e53',
  'b90f5a71-dcef-4a2b-925a-3e6d33be6364',
  'fba5b58b-a115-4c45-ad62-34c3589575eb',
  'c02f1643-7c13-450a-9004-d57ac6857ac3',
  '60569fa2-ef55-4902-80a0-e98c9d7c95ed',
  'c1381ec5-b99a-49e0-84e2-21aad7a10ab7',
  // Math
  '1bebe881-2bb2-4b9e-817f-67739b354c78',
  '44ddcd38-4a6b-4eca-b7ee-12d4ce9fe6f4',
  'e2fa68cf-10d2-4772-9814-aeb72f529bdf',
  '5f7d8cee-3073-4174-ab82-401fedb3fa44',
  '2ebb61ce-1133-4a74-b8d5-5265319ffd07',
  '252dd393-ece6-4561-863d-194e9b292f9b',
  // EVS
  '0d6b2ccc-01e0-4496-b30f-e6f7f5be3d21',
  'a22e6df2-ff59-418b-89b2-2c39d7d72901',
  '5cc91f99-b121-4baa-813d-61260abbdffa',
  '2b200e99-464a-45df-839b-ac3282fb07a1',
  '66df4a08-281d-4aa3-917a-722de6658a79',
  '092a2e60-8ab5-4833-b948-056641af9df7',
  // GK
  '03aebd95-bb93-4bc6-b798-bd6a633479e3',
  'ea05392e-4a72-493b-bad7-340a97f55a33',
  'a8ae08aa-2adb-454e-b591-d57edc838ee7',
  '88fcbba2-8e90-4e22-b5a2-1b78ace2b249',
  '45bcf53f-e78c-4844-a154-c4154cd2fbf5',
  'c41443c3-2451-443b-90cc-cd2aa6894c22',
  // Hindi
  'd5bafdc2-6180-46cf-b84a-883c2b0dad08',
  'f6fe8926-03ac-4a54-85ca-46359d2fcb88',
  'a698e1c8-50d0-43c0-9cb5-882718447740',
  '4fc361c1-d830-4ebe-b0e2-e4cfb7085c92',
  'd5ae93a6-0786-4d66-a59a-06c5eb0ca029',
  '5a169e75-fb5f-40d9-a1f2-eaa4f18435d3',
];

async function main() {
  const { data, error } = await sb
    .from('quizzes')
    .select('id,title,lesson_id')
    .in('lesson_id', lessonIds)
    .is('deleted_at', null);

  if (error) { console.error(error); process.exit(1); }
  
  // Build lesson -> quiz map
  const map = {};
  (data || []).forEach(q => { map[q.lesson_id] = q.id; });

  console.log('// LESSON -> QUIZ ID MAP for Quiz page:');
  console.log('const lessonToQuizId: Record<string, string> = {');
  lessonIds.forEach(lid => {
    const qid = map[lid];
    if (qid) console.log(`  '${lid}': '${qid}', // ${data.find(q => q.lesson_id === lid)?.title}`);
    else console.log(`  // '${lid}': NO QUIZ FOUND`);
  });
  console.log('};');
}

main().catch(console.error);

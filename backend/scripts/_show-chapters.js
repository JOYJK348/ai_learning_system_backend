const {createClient}=require('@supabase/supabase-js');
const s=createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');
(async()=>{
const {data:board}=await s.from('boards').select('id').eq('code','cbse').maybeSingle();
if(!board){console.log('Board not found');return}
const {data:grade}=await s.from('grades').select('id').eq('board_id',board.id).eq('code','lkg').maybeSingle();
if(!grade){console.log('Grade not found');return}
const {data:subj}=await s.from('subjects').select('id,name').eq('grade_id',grade.id).eq('code','english').maybeSingle();
if(!subj){console.log('Subject not found');return}
console.log('Subject ID:',subj.id,subj.name);
const {data:chs}=await s.from('chapters').select('id,name,sort_order').eq('subject_id',subj.id).is('deleted_at',null).order('sort_order');
for(const c of chs||[]){
const {data:ls}=await s.from('lessons').select('id,title').eq('chapter_id',c.id).is('deleted_at',null).order('sort_order');
console.log(c.sort_order+'. "'+c.name+'" ('+(ls?.length||0)+' lessons)');
if(ls?.length) ls.forEach(l=>console.log('   - '+l.title));
}
})()

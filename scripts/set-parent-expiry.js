const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const email = 'lkgallp@zhi.com';
  
  // 1. Find the parent
  const { data: parent, error: findError } = await supabase
    .from('parents')
    .select('id, name, email')
    .eq('email', email)
    .single();
    
  if (findError || !parent) {
    console.error('Could not find parent:', findError);
    return;
  }
  
  console.log(`Found parent: ${parent.name} (${parent.email}) with ID: ${parent.id}`);
  
  // Calculate new expiry date for 25 days from now
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 25);
  
  console.log(`Setting expiry date to: ${newExpiry.toISOString()}`);
  
  // 2. Update parents table
  const { error: updateParentError } = await supabase
    .from('parents')
    .update({
      plan_expires_at: newExpiry.toISOString()
    })
    .eq('id', parent.id);
    
  if (updateParentError) {
    console.error('Error updating parents table:', updateParentError);
  } else {
    console.log('Successfully updated parents table!');
  }
  
  // 3. Update parent_subscriptions table
  const { error: updateSubError } = await supabase
    .from('parent_subscriptions')
    .update({
      end_date: newExpiry.toISOString()
    })
    .eq('parent_id', parent.id)
    .in('status', ['active', 'trial']);
    
  if (updateSubError) {
    console.error('Error updating parent_subscriptions table:', updateSubError);
  } else {
    console.log('Successfully updated parent_subscriptions table!');
  }
}

main();

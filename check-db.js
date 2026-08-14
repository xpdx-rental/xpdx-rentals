/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('vans')
    .select('name, van_images(storage_path)');
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Vans:", JSON.stringify(data, null, 2));
  }
}

test();

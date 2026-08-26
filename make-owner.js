const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function run() {
  const email = "ybikash919@gmail.com";

  console.log("Checking user in auth...");
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error(listError);
    return;
  }
  
  const authUser = users.find(u => u.email === email);
  if (!authUser) {
    console.log("User not found!");
    return;
  }
  
  console.log("User ID:", authUser.id);
  console.log("Updating admin_roles to owner...");

  const { error } = await supabase.from("admin_roles").upsert({
    user_id: authUser.id,
    role: "owner",
    active: true,
  });

  if (error) {
    console.error("Failed to update role:", error);
  } else {
    console.log("Successfully updated role to owner for", email);
  }
}

run().catch(console.error);

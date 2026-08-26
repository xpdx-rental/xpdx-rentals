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
  const email = "testadmin@xpdx.com";
  const password = "password123!";

  console.log("Checking if user exists...");
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error(listError);
    return;
  }
  
  let userId;
  const authUser = users.find(u => u.email === email);
  if (authUser) {
    console.log("User exists, updating password...");
    const { error: updateErr } = await supabase.auth.admin.updateUserById(authUser.id, { password });
    if (updateErr) throw updateErr;
    userId = authUser.id;
  } else {
    console.log("Creating new user...");
    const { data: newAuth, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) throw createErr;
    userId = newAuth.user.id;
  }

  console.log("User ID:", userId);

  console.log("Upserting admin_roles...");
  const { error } = await supabase.from("admin_roles").upsert({
    user_id: userId,
    role: "admin",
    active: true,
    mfa_required: false,
  });

  if (error) {
    console.error("Failed to assign admin role:", error);
  } else {
    console.log("Successfully assigned admin role to", email);
  }
}

run().catch(console.error);

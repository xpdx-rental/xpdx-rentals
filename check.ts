import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function main() {
  const { error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  console.log("List Users Error:", usersError?.message || "Success");

  const { error: adminRolesError } = await supabase.from("admin_roles").select("*").limit(1);
  console.log("Admin Roles Error:", adminRolesError?.message || "Success");
}

main().catch(console.error);

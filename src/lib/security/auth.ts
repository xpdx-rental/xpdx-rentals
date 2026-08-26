import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAllowlistedAdminEmail } from "@/lib/security/admin-allowlist";

type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  factors?: unknown[];
};

export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createClient();

  // We use getUser() here (not getSession()) because getSession() only reads the
  // local cookie without validating against the Supabase server. This means an expired
  // or revoked token still appears valid, causing the server to think the user is
  // authenticated when they are not — leading to cryptic redirects to /admin-login.
  //
  // getUser() performs a real network call to validate the JWT. The proxy middleware
  // already refreshed the token and wrote the new cookies onto the request headers,
  // so this call will hit Supabase with the already-refreshed token — it won't cause
  // a second refresh or rate-limit issues.
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin-login");
  }

  return user;
}

export function userHasPlatformRole(
  user: SupabaseUser,
  roles = ["owner", "admin", "moderator"],
) {
  const platformRole = user.app_metadata?.platform_role;
  return typeof platformRole === "string" && roles.includes(platformRole);
}

async function userHasAdminRoleRecord(
  userId: string,
  roles?: string[],
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("active", true);

  if (roles && roles.length > 0) {
    query = query.in("role", roles);
  }

  const { data } = await query.maybeSingle();

  return !!data;
}

export const userHasAdminAccess = cache(async function userHasAdminAccess(user: SupabaseUser) {
  if (isAllowlistedAdminEmail(user.email)) return true;
  return userHasPlatformRole(user) || userHasAdminRoleRecord(user.id);
});

export const getUserAdminRole = cache(async function getUserAdminRole(user: SupabaseUser): Promise<string> {
  if (isAllowlistedAdminEmail(user.email)) return "super_admin";

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (data?.role) return data.role;
  
  if (user.app_metadata?.platform_role === "owner" || user.app_metadata?.platform_role === "admin") {
    return "super_admin";
  }

  return "viewer";
});

export async function requireAdmin() {
  const user = await requireUser();

  if (!(await userHasAdminAccess(user))) {
    redirect("/");
  }

  return user;
}

export async function requireAdminRole(allowedRoles: string[]) {
  const user = await requireUser();

  // Check if they have an active admin role record for these specific roles
  // or if they are an owner (who can do everything).
  // Note: Admin no longer has global bypass. They must be explicitly granted access via allowedRoles.
  const isGlobalAdmin = await userHasAdminRoleRecord(user.id, ["owner"]);
  if (isGlobalAdmin || isAllowlistedAdminEmail(user.email)) {
    return user;
  }

  const hasSpecificRole = await userHasAdminRoleRecord(user.id, allowedRoles);
  if (!hasSpecificRole && !userHasPlatformRole(user, allowedRoles)) {
    redirect("/");
  }

  return user;
}

export async function requireApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireApiAdmin() {
  const { user, response } = await requireApiUser();

  if (!user) {
    return { user: null, response };
  }

  if (!(await userHasAdminAccess(user))) {
    return {
      user: null,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }

  return { user, response: null };
}

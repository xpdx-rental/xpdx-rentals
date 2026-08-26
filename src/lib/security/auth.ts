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

  // Use getSession() here, NOT getUser().
  //
  // The proxy middleware (proxy.ts) already calls getUser() on every request,
  // which handles token refresh and writes the fresh token to both the response
  // cookies (browser) and the request headers (Server Components). By the time
  // this function runs, the session in the cookie is guaranteed to be fresh.
  //
  // Using getUser() here would make a SECOND live network call to Supabase,
  // which (a) doubles latency, and (b) can transiently return null on a slow
  // network — causing a false logout. It can also trigger its own refresh
  // attempt that races with the middleware's refresh, triggering Supabase's
  // refresh-token reuse detection and immediately revoking the session.
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("[auth] getSession error:", error.message);
    return null;
  }

  if (!data.session) {
    console.error("[auth] getSession: no session in cookie");
    return null;
  }

  return data.session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    console.error("[auth] requireUser: no user, redirecting to /admin-login");
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

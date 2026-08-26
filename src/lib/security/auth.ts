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

  // ── Use getSession(), NOT getUser() ─────────────────────────────────────────
  //
  // getUser() makes a live network call to Supabase Auth on every request to
  // cryptographically verify the JWT. This causes two problems:
  //   1. Race condition: middleware + layout tree both call it concurrently,
  //      racing to rotate the same single-use refresh token → logout.
  //   2. Rate limiting: repeated failed refreshes trigger Supabase 429 errors,
  //      which look like "not authenticated" → redirect to login.
  //
  // getSession() reads the JWT from the cookie locally — no network call, no
  // token rotation. This is safe here because every admin page independently
  // verifies the user via admin_roles DB lookup (service role key), which is
  // the real authorization gate. The JWT signature itself was issued by Supabase
  // and cannot be forged without their secret.
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return data.session.user;
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
  // Access is determined SOLELY by the admin_roles table — the panel's own
  // role management UI. The app_metadata.platform_role claim is ignored so
  // that adding/removing users in the panel is the single source of truth.
  return userHasAdminRoleRecord(user.id);
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

  // Allowlisted system-owner emails bypass per-role checks.
  if (isAllowlistedAdminEmail(user.email)) {
    return user;
  }

  // Global owners (role = "owner" in admin_roles) can access everything.
  const isGlobalOwner = await userHasAdminRoleRecord(user.id, ["owner"]);
  if (isGlobalOwner) {
    return user;
  }

  // Everyone else must have an explicit record for one of the allowed roles.
  const hasSpecificRole = await userHasAdminRoleRecord(user.id, allowedRoles);
  if (!hasSpecificRole) {
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
